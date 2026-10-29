/* Public product catalog and purchase guide. No order/payment storage. */
(() => {
  "use strict";
  // Set the verified public shop URL when sales are ready. Never use /account/products.
  const MINNE_SHOP_URL = "";
  const CREEMA_SHOP_URL = "";
  const COMPANY_SLUG = "tsuzuri-note";
  const SUPABASE_URL = "https://cshieomhxpuaclggicle.supabase.co";
  const KEY = "sb_publishable_6mt_8wZcBX9aKPR04NzNBQ_StAq2Qbe";
  const $ = id => document.getElementById(id);
  const page = document.body.dataset.shopPage;
  const params = new URLSearchParams(location.search);
  let company,items=[],activeCategory=null;
  const validSlug = slug => typeof slug==="string" && slug.length<=160 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
  function getSlug() {
    const match = location.pathname.match(/^\/c\/([^/]+)\/(?:products|order)\/?$/);
    const slug = match ? match[1] : params.get("company");
    return validSlug(slug) ? slug : "";
  }
  function status(message,retry=false) {
    $("shopLoadStatus").hidden=false;$("shopLoadStatus").textContent=message;
    $("shopRetry").hidden=!retry;$("shopPageContent").hidden=true;
  }
  function imageURL(value) {
    if(typeof value!=="string"||!value.trim())return null;
    try {const u=new URL(value,location.origin);return u.origin===location.origin||u.origin===SUPABASE_URL ? (['http:','https:'].includes(u.protocol)?u.href:null) : null;} catch{return null;}
  }
  function publicMinneURL(value) {
    if(!value)return null;
    try {
      const u=new URL(value);
      if(u.origin!=="https://minne.com"||u.username||u.password)return null;
      if(!/^\/@[A-Za-z0-9_-]+(?:\/(?:profile|reviews))?\/?$/.test(u.pathname)&&!/^\/items\/\d+\/?$/.test(u.pathname))return null;
      return u.href;
    } catch{return null;}
  }
  function publicCreemaURL(value) {
    if(!value)return null;
    try {
      const u=new URL(value);
      if(!["https://www.creema.jp","https://creema.jp"].includes(u.origin)||u.username||u.password)return null;
      if(!/^\/(?:c\/[A-Za-z0-9_-]+|creator\/[1-9]\d*(?:\/item\/onsale)?|item\/[1-9]\d*\/detail)\/?$/.test(u.pathname))return null;
      return u.href;
    } catch{return null;}
  }
  function element(tag,className,text) {const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n;}
  function price(item) {
    if(typeof item.price_text==="string"&&item.price_text.trim())return item.price_text.trim();
    const n=Number(item.price);
    return Number.isFinite(n)&&n>0 ? `¥${n.toLocaleString("ja-JP")}` : "価格は準備中です";
  }
  function category(item) {return typeof item.category==="string"&&item.category.trim()&&item.category.trim()!=="その他" ? item.category.trim() : "作品";}
  function card(item) {
    const article=element("article","product-card");article.id="product-"+String(item.id);
    const imageWrap=element("div","product-image");
    const url=imageURL(item.image_url);
    const fallback=()=>imageWrap.replaceChildren(element("span","image-placeholder","作品の写真を準備中です"));
    if(url){const image=element("img");image.src=url;image.alt=item.name||"作品";image.loading="lazy";image.decoding="async";image.addEventListener("error",fallback,{once:true});imageWrap.append(image);}else fallback();
    article.append(imageWrap,element("p","product-category",category(item)),element("h2","",item.name||"作品"));
    if(item.description)article.append(element("p","product-description",item.description));
    article.append(element("p","product-price",price(item)));
    if(item.is_sold_out)article.append(element("span","sold-out","現在販売をお休みしています"));
    const link=element("a","button secondary","ご購入の案内を見る →");
    link.href="/c/tsuzuri-note/order?product="+encodeURIComponent(String(item.id));article.append(link);
    return article;
  }
  function renderProducts() {
    const word=$("productSearch").value.trim().normalize("NFKC").toLocaleLowerCase("ja-JP");
    const shown=items.filter(item=>(activeCategory===null||category(item)===activeCategory)&&(!word||[item.name,item.description,item.category].join(" ").normalize("NFKC").toLocaleLowerCase("ja-JP").includes(word)));
    const fragment=document.createDocumentFragment();shown.forEach(item=>fragment.append(card(item)));$("productGrid").replaceChildren(fragment);
    $("productCount").textContent=shown.length+"件の作品";
    $("productEmpty").hidden=shown.length>0;
    $("productEmpty").textContent=items.length ? "条件に合う作品が見つかりませんでした。カテゴリや検索語を変えてみてください。" : "ただいま作品を準備中です。掲載までもう少しお待ちください。";
  }
  function initProducts() {
    const nav=$("productFilters");
    const categories=[null,...new Set(items.map(category))];
    categories.forEach(label=>{
      const button=element("button","",label===null?"すべて":label);button.type="button";button.setAttribute("aria-pressed",String(label===null));
      button.addEventListener("click",()=>{activeCategory=label;for(const n of nav.children)n.setAttribute("aria-pressed",String(n===button));renderProducts();});
      nav.append(button);
    });
    $("productSearch").addEventListener("input",renderProducts);renderProducts();
  }
  function initOrder() {
    const id=params.get("product");
    if(id!==null){
      const item=/^[1-9]\d{0,18}$/.test(id)?items.find(item=>String(item.id)===id):null;
      if(!item){status("この作品は現在ご案内できません。商品一覧から作品を選び直してください。");return false;}
      const selected=$("selectedProduct");selected.hidden=false;
      const url=imageURL(item.image_url);
      if(url){const image=element("img");image.src=url;image.alt=item.name||"作品";image.addEventListener("error",()=>image.remove(),{once:true});selected.append(image);}
      const details=element("div");details.append(element("p","eyebrow","SELECTED ITEM"),element("h2","",item.name||"作品"),element("p","",price(item)));
      if(item.is_sold_out)details.append(element("p","sold-out","現在販売をお休みしています"));
      selected.append(details);
    }
    const href=publicMinneURL(MINNE_SHOP_URL);
    const creemaHref=publicCreemaURL(CREEMA_SHOP_URL);
    for(const [linkId,pendingId,url] of [["minneShopLink","minnePending",href],["creemaShopLink","creemaPending",creemaHref]]) {
      if(url){$(linkId).href=url;$(linkId).hidden=false;$(pendingId).hidden=true;}
    }
    $("shopSelectionNote").hidden=id===null||(!href&&!creemaHref);
    return true;
  }
  async function init() {
    $("shopRetry").addEventListener("click",()=>location.reload());
    try {
      if(typeof supabase==="undefined")throw new Error("sdk-unavailable");
      const client=supabase.createClient(SUPABASE_URL,KEY),slug=getSlug();
      if(!await window.serviceAccess.check(client,{slug}))return;
      if(slug!==COMPANY_SLUG){status("ページが見つかりませんでした。案内されたURLをご確認ください。");return;}
      const result=await client.from("company_info").select("*").eq("slug",slug).single();
      if(result.error)throw result.error;
      company=result.data;
      if(!company||company.business_type!=="retail"){status("ページが見つかりませんでした。");return;}
      window.sasuliePalette.apply(company);
      document.title=(page==="products"?"商品一覧":"ご注文について")+" | "+company.name;
      document.querySelectorAll(".shop-logo,.shop-footer>a").forEach(n=>{n.textContent=company.name||COMPANY_SLUG;});
      const resultItems=await client.from("menu_items").select("id,name,description,category,image_url,price,price_text,is_sold_out,sort_order").eq("company_id",company.id).eq("is_visible",true).order("sort_order",{ascending:true}).order("created_at",{ascending:false});
      if(resultItems.error)throw resultItems.error;
      items=resultItems.data||[];
      if(page==="products")initProducts();else if(!initOrder())return;
      $("shopLoadStatus").hidden=true;$("shopPageContent").hidden=false;
      if(page==="products"&&location.hash){try{document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();}catch{}}
    } catch(error) {console.error("作品ページの読み込みに失敗しました",error);status("読み込めませんでした。通信状態を確認して、もう一度お試しください。",true);}
  }
  void init();
})();
