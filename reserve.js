(() => {
 'use strict';
 const $=id=>document.getElementById(id),client=supabase.createClient('https://cshieomhxpuaclggicle.supabase.co','sb_publishable_6mt_8wZcBX9aKPR04NzNBQ_StAq2Qbe');
 const match=location.pathname.match(/^\/c\/([a-z0-9]+(?:-[a-z0-9]+)*)\/reserve\/?$/),slug=match?match[1]:location.pathname.match(/^\/cedre\/reserve\/?$/)?'cedre-visual':new URLSearchParams(location.search).get('company');
 function newID(){if(typeof crypto.randomUUID==='function')return crypto.randomUUID();const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');return hex.slice(0,8)+'-'+hex.slice(8,12)+'-'+hex.slice(12,16)+'-'+hex.slice(16,20)+'-'+hex.slice(20);}
 let config=null,siteKey=null,widget=null,token='',busy=false,confirmed=null,requestId=newID(),completed=false;
 const n=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
 function status(text,error=false){$('rbStatus').textContent=text;$('rbStatus').classList.toggle('rb-error',error);}
 function dates(){const previous=$('rbDate').value;$('rbDate').replaceChildren(new Option('日付を選んでください',''));for(const day of config.days){const date=new Date(day.date+'T00:00:00Z');const label=day.date.replaceAll('-','/')+'（'+['日','月','火','水','木','金','土'][date.getUTCDay()]+'）';$('rbDate').add(new Option(label,day.date));}if(config.days.some(d=>d.date===previous))$('rbDate').value=previous;times();}
 function times(){const previous=$('rbTime').value;$('rbTime').replaceChildren(new Option('時間を選んでください',''));const day=config?.days.find(d=>d.date===$('rbDate').value);for(const time of day?.times||[])$('rbTime').add(new Option(time,time));if(day?.times.includes(previous))$('rbTime').value=previous;}
 function value(){return {slug,requestId,date:$('rbDate').value,time:$('rbTime').value,party:Number($('rbParty').value),name:$('rbName').value.trim(),email:$('rbEmail').value.trim(),note:$('rbNote').value.trim(),consent:$('rbConsent').checked,website:$('rbWebsite').value};}
 function lock(on){busy=on;$('rbSend').disabled=on||!token;$('rbEdit').disabled=on;$('rbFields').disabled=on;}
 function resetWidget(){token='';$('rbSend').disabled=true;if(widget!==null&&window.turnstile)window.turnstile.reset(widget);}
 async function loadWidget(){
  if(window.turnstile)return;
  await new Promise((resolve,reject)=>{const script=n('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;script.onload=resolve;script.onerror=reject;document.head.append(script);});
 }
 function showWidget(){
  if(widget!==null){resetWidget();return;}
  widget=window.turnstile.render($('rbWidget'),{sitekey:siteKey,action:'reservation_request',theme:'auto',size:'flexible',callback:value=>{token=value;$('rbSend').disabled=busy;},'expired-callback':()=>{token='';$('rbSend').disabled=true;status('送信前の確認が期限切れになりました。もう一度確認してください。',true);},'error-callback':()=>{token='';$('rbSend').disabled=true;status('送信前の確認を完了できませんでした。通信状態を確認してください。',true);}});
 }
 $('rbDate').addEventListener('change',times);
 $('rbForm').addEventListener('submit',async event=>{
  event.preventDefault();if(busy||completed||!config)return;
  if($('rbEmail').value.trim()!==$('rbEmailConfirm').value.trim()){status('メールアドレスと確認用の入力が一致しません。',true);$('rbEmailConfirm').focus();return;}
  const draft=value();if(!draft.name||!config.days.some(d=>d.date===draft.date&&d.times.includes(draft.time))){status('日時と入力内容を確認してください。',true);return;}
  if(confirmed&&JSON.stringify({...confirmed,requestId:''})!==JSON.stringify({...draft,requestId:''})){requestId=newID();draft.requestId=requestId;}confirmed=draft;
  $('rbSummary').replaceChildren();for(const [label,text] of [['希望日時',draft.date.replaceAll('-','/')+' '+draft.time],['人数',draft.party+'名'],['お名前',draft.name],['メールアドレス',draft.email],['ご連絡事項',draft.note||'なし']]){const row=n('div');row.append(n('dt',label),n('dd',text));$('rbSummary').append(row);}
  $('rbForm').hidden=true;$('rbConfirm').hidden=false;$('rbStep').textContent='ステップ2/3：確認';status('');$('rbConfirmTitle').focus();
  try{await loadWidget();showWidget();}catch{status('送信前の確認を読み込めませんでした。入力に戻り、もう一度お試しください。',true);}
 });
 $('rbEdit').addEventListener('click',()=>{if(busy)return;$('rbForm').hidden=false;$('rbConfirm').hidden=true;$('rbStep').textContent='ステップ1/3：入力';resetWidget();status('');$('rbDate').focus();});
 $('rbSend').addEventListener('click',async()=>{
  if(busy||!token||!confirmed||completed)return;lock(true);status('送信しています…');
  try{
   const res=await fetch('/api/reservations/request',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...confirmed,turnstileToken:token}),signal:AbortSignal.timeout(25000)});const data=await res.json();
   if(!res.ok||data.code!=='received'||data.reference!==requestId){
    if(data.code==='availability_changed'){const latest=await client.rpc('cms_public_booking_config',{p_slug:slug});if(!latest.error&&latest.data){config=latest.data;dates();}else if(!latest.error&&!latest.data){$('rbConfirm').hidden=true;$('rbForm').hidden=true;throw new Error('予約リクエストの受付が停止されました。お店へ直接お問い合わせください。');}throw new Error('受付状況が変わりました。入力に戻って日時を選び直してください。');}
    if(data.code==='rate_limited')throw new Error('短時間に送信が集中しています。10分以上あけてお試しください。');
    if(data.code==='verification_failed')throw new Error('送信前の確認をやり直してください。');
    throw new Error('送信を確認できませんでした。時間をあけて再送するか、お店へお問い合わせください。');
   }
   completed=true;$('rbConfirm').hidden=true;$('rbSuccess').hidden=false;$('rbStep').textContent='ステップ3/3：送信完了';$('rbReceipt').textContent=`${confirmed.date.replaceAll('-','/')} ${confirmed.time} ／ ${confirmed.party}名 ／ 受付番号：${requestId.slice(0,8)}`;status('');$('rbSuccessTitle').focus();
  }catch(error){status(error.name==='TimeoutError'?'通信が途切れたため受付を確認できませんでした。同じ内容で再送すると、重複を防いで受付状況を確認します。':/^[\u3040-\u30ff\u3400-\u9fff]/.test(error.message)?error.message:'送信を確認できませんでした。通信状態を確認して、同じ内容で再送してください。',true);resetWidget();}finally{lock(false);if(completed)$('rbSend').disabled=true;}
 });
 async function init(){
  if(typeof slug!=='string'||slug.length>160||!/^([a-z0-9]+-)*[a-z0-9]+$/.test(slug)){$('rbLoad').textContent='ページが見つかりません。お店のサイトから開き直してください。';return;}
  $('rbBrand').href=$('rbBack').href='/c/'+encodeURIComponent(slug);
  try{
   const [{data,error},infra]=await Promise.all([client.rpc('cms_public_booking_config',{p_slug:slug}),fetch('/api/reservations/config',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();})]);
   if(error)throw error;if(!data){$('rbLoad').textContent='現在、予約リクエストを受け付けていません。お店へ直接お問い合わせください。';return;}
   config=data;siteKey=infra.siteKey;$('rbBrand').textContent=data.company.name;document.title='予約リクエスト | '+data.company.name;
   document.body.dataset.design=data.company.site_design||'standard';document.body.dataset.theme=data.company.theme||'';window.sasuliePalette.apply(data.company);
   const contact=n('a',data.contact_email);contact.href='mailto:'+encodeURIComponent(data.contact_email).replace(/%40/gi,'@');$('rbContact').append(document.createTextNode('お問い合わせ：'),contact);
   $('rbLoad').hidden=true;$('rbContent').hidden=false;
   if(!infra.ready){$('rbForm').hidden=true;status('予約フォームは準備中です。上記のメールアドレスへお問い合わせください。');return;}
   $('rbParty').max=String(data.max_party);
   if(data.privacy_url){try{const u=new URL(data.privacy_url);if(u.protocol==='https:'&&!u.username&&!u.password){$('rbPrivacyLink').href=u.href;$('rbPrivacyLink').hidden=false;}}catch{}}
   dates();if(!data.days.length){$('rbForm').hidden=true;status('現在、選べる日時がありません。お店へ直接お問い合わせください。');}
  }catch{$('rbLoad').textContent='受付状況を読み込めませんでした。通信状態を確認して再読み込みしてください。';}
 }
 void init();
})();
