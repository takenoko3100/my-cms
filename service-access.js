/* Database-backed service availability. Never used as the authorization layer. */
(() => {
  "use strict";
  const root=document.documentElement;
  root.classList.add("service-access-pending");
  let finishReady;
  const ready=new Promise(resolve=>{finishReady=resolve;});
  let initialDone=false,blocked=false,inFlight=null,timer=null,client=null,options=null;
  const finish=value=>{if(!initialDone){initialDone=true;finishReady(value);}};
  const watchdog=window.setTimeout(()=>showUnavailable("error"),20000);

  function showUnavailable(reason) {
    if(blocked)return;
    blocked=true;finish(false);window.clearTimeout(watchdog);window.clearInterval(timer);
    root.classList.remove("service-access-pending","site-opening-active");
    root.classList.add("service-access-blocked");
    document.body.classList.remove("is-loading");document.body.setAttribute("aria-busy","false");
    for(const media of document.querySelectorAll("video,audio")){
      try{media.pause();media.removeAttribute("src");media.load();}catch{}
    }
    for(const dialog of document.querySelectorAll("dialog[open]")){try{dialog.close();}catch{}}
    root.style.overflow="";document.body.style.overflow="";
    const panel=document.createElement("main");panel.className="service-access-notice";
    const card=document.createElement("section");card.className="service-access-card";
    const brand=document.createElement("p");brand.className="service-access-brand";brand.textContent="sasulie";
    const title=document.createElement("h1");title.tabIndex=-1;
    const text=document.createElement("p");text.className="service-access-text";
    if(reason==="error"){
      title.textContent="ページを確認できませんでした";
      text.textContent="通信状態を確認して、もう一度読み込んでください。";
    }else if(options?.editor){
      title.textContent="このホームページは現在編集できません";
      text.textContent="ご利用状況については、運営者へお問い合わせください。";
    }else{
      title.textContent="このページは現在公開されていません";
      text.textContent="時間をおいて、もう一度ご確認ください。";
    }
    document.title=title.textContent+" | sasulie";
    const actions=document.createElement("div");actions.className="service-access-actions";
    const retry=document.createElement("button");retry.type="button";retry.textContent="再読み込み";retry.addEventListener("click",()=>location.reload());actions.appendChild(retry);
    if(options?.editor&&options?.operator){const back=document.createElement("a");back.href="/admin";back.textContent="顧客管理へ戻る";actions.appendChild(back);}
    card.append(brand,title,text,actions);panel.appendChild(card);
    // Keep hidden app nodes so an already-pending legacy save can finish its
    // error/finally handler without dereferencing removed controls.
    const quietBackground=()=>{
      for(const child of document.body.children)if(child!==panel)child.inert=true;
      for(const media of document.querySelectorAll("video,audio")){try{media.pause();if(media.hasAttribute("src")){media.removeAttribute("src");media.load();}}catch{}}
      for(const frame of document.querySelectorAll("iframe[src]"))frame.removeAttribute("src");
    };
    document.body.appendChild(panel);quietBackground();
    new MutationObserver(quietBackground).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["src"]});
    document.addEventListener("play",event=>{if(event.target?.pause)event.target.pause();},true);
    let robots=document.querySelector('meta[name="robots"]');
    if(!robots){robots=document.createElement("meta");robots.name="robots";document.head.appendChild(robots);}
    robots.content="noindex,nofollow";
    title.focus({preventScroll:true});
  }
  async function requestAvailability() {
    if(blocked)return false;
    if(inFlight)return inFlight;
    inFlight=(async()=>{
      let timeout;
      try{
        const query=options.slug
          ? client.rpc("cms_site_available",{p_slug:options.slug})
          : client.rpc("cms_service_company_open",{p_company_id:options.companyId});
        const response=await Promise.race([
          query,
          new Promise((_,reject)=>{timeout=window.setTimeout(()=>reject(new Error("service-check-timeout")),12000);})
        ]);
        if(blocked)return false;
        if(response.error || typeof response.data!=="boolean")throw response.error||new Error("invalid-service-response");
        if(!response.data){showUnavailable("closed");return false;}
        window.clearTimeout(watchdog);root.classList.remove("service-access-pending");finish(true);
        return true;
      }catch(error){
        console.error("利用状況を確認できませんでした",error);showUnavailable("error");return false;
      }finally{window.clearTimeout(timeout);inFlight=null;}
    })();
    return inFlight;
  }
  async function check(supabaseClient,context) {
    if(blocked)return false;
    client=supabaseClient;options=context;
    if(!context.slug&&!context.companyId){window.clearTimeout(watchdog);root.classList.remove("service-access-pending");finish(true);return true;}
    const allowed=await requestAvailability();
    if(allowed&&!timer){
      timer=window.setInterval(()=>{if(document.visibilityState!=="hidden")void requestAvailability();},30000);
      document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")void requestAvailability();});
      window.addEventListener("focus",()=>void requestAvailability());
      window.addEventListener("pageshow",event=>{if(event.persisted)void requestAvailability();});
    }
    return allowed;
  }
  Object.defineProperty(window,"serviceAccess",{value:Object.freeze({check,ready,recheck:()=>client?requestAvailability():Promise.resolve(false)})});
})();
