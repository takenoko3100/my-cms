(() => {
 'use strict';let active=null;
 const labels={pending:'未対応',confirmed:'確定',declined:'お断り',cancelled:'キャンセル'};
 const node=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
 function mount({company,client}){
  if(active&&String(active.id)===String(company.id))return;active?.root.remove();
  const root=node('section','rb rb-editor');root.id='reservationEditor';root.setAttribute('aria-labelledby','rbEditorTitle');const title=node('h2','','予約リクエスト');title.id='rbEditorTitle';const details=node('details'),summary=node('summary','','受付設定・予約一覧を開く');details.append(summary);root.append(node('p','rb-eyebrow','RESERVATIONS'),title,details);
  const parent=document.querySelector('main.editor-page');if(!parent)return;const anchor=document.querySelector('.editor-status');if(anchor)anchor.before(root);else parent.prepend(root);
  const state={id:company.id,root,ready:false,busy:false,version:0,rows:[],page:0};active=state;
  const panel=node('div','rb-panel'),form=node('form','rb-settings-form'),fieldset=node('fieldset'),enableLabel=node('label','rb-checkbox'),enabled=node('input');enabled.type='checkbox';enableLabel.append(enabled,document.createTextNode('公開サイトで予約リクエストを受け付ける'));
  const infrastructure=node('p','rb-muted','送信機能の設定状況を確認しています…');
  const fields=node('div','rb-fields');
  function field(label,type,value,options={}){const wrap=node('label','',label),input=node('input');input.type=type;input.value=value;for(const [k,v] of Object.entries(options))input[k]=v;wrap.append(input);fields.append(wrap);return input;}
  const open=field('通常の受付開始時刻','time','09:00',{required:true}),close=field('通常の受付終了時刻','time','18:00',{required:true});
  const intervalLabel=node('label','','希望時間の間隔'),interval=node('select');for(const value of [30,60])interval.add(new Option(value+'分',value));intervalLabel.append(interval);fields.append(intervalLabel);
  const notice=field('何時間前まで受け付けるか','number','24',{min:1,max:168,required:true}),advance=field('何日先まで受け付けるか','number','60',{min:7,max:90,required:true}),party=field('1件の人数上限','number','10',{min:1,max:30,required:true}),email=field('お店の連絡先メール（公開されます）','email',company.contact_email||'',{maxLength:254,required:true}),privacy=field('お店のプライバシーポリシーURL（任意）','url','',{maxLength:1000});
  const link=node('a','rb-button','予約ページを開く ↗');link.href='/c/'+encodeURIComponent(company.slug)+'/reserve';link.target='_blank';link.rel='noopener noreferrer';
  const actions=node('div','rb-actions'),save=node('button','rb-primary','受付設定を保存');save.type='submit';actions.append(save,link);const settingStatus=node('p','rb-status');settingStatus.setAttribute('role','status');
  fieldset.append(enableLabel,infrastructure,fields,node('p','rb-muted','先に営業カレンダーを保存してください。休業日は受付しません。日別の営業時間が「10:00〜15:00」のような時刻の範囲なら、その時間を使います。「午前のみ」など解釈できない日は日時の候補を出しません。'),node('p','rb-muted','時間の間隔は希望時刻の並び方です。席数・スタッフ・施術時間の管理や自動確定は行いません。受付状況は営業カレンダーと併せてご確認ください。'),actions);form.append(fieldset);panel.append(form,settingStatus);details.append(panel);
  const listPanel=node('div','rb-panel'),heading=node('h3','','届いた予約リクエスト'),info=node('p','rb-important','ステータス変更だけではメールは送信されません。「返信メールを開く」からお客さまへ連絡してください。新着通知の自動メールもありません。受付中はこの一覧を定期的に確認してください。');
  const filters=node('div','rb-filter'),filter=node('select'),filterLabel=node('label','','表示する状況');filter.setAttribute('aria-label','表示する予約状況');filter.add(new Option('すべて','all'));for(const [value,label] of Object.entries(labels))filter.add(new Option(label,value));filter.value='pending';const refresh=node('button','','一覧を更新');refresh.type='button';filters.append(filterLabel,filter,refresh);
  const list=node('div','rb-requests'),listStatus=node('p','rb-status');listStatus.setAttribute('role','status');const more=node('button','','さらに25件表示');more.type='button';more.hidden=true;
  listPanel.append(heading,info,filters,list,listStatus,more,node('p','rb-muted','予約情報はご利用店舗の担当者が確認します。対応を終えた情報は、必要な保管期間を決めて定期的に削除してください。削除すると復元できません。'));details.append(listPanel);
  let initialized=false;
  function configMessage(text,error=false){settingStatus.textContent=text;settingStatus.classList.toggle('rb-error',error);}
  function disable(on){state.busy=on;fieldset.disabled=on||!state.ready;}
  async function settings(){
   try{const {data,error}=await client.from('booking_settings').select('*').eq('company_id',company.id).maybeSingle();if(active!==state)return;if(error)throw error;
    if(data){enabled.checked=data.enabled;open.value=data.open_time;close.value=data.close_time;interval.value=String(data.interval_minutes);notice.value=data.notice_hours;advance.value=data.advance_days;party.value=data.max_party;email.value=data.contact_email;privacy.value=data.privacy_url;state.version=Number(data.version);}
    state.ready=true;disable(false);configMessage(data?'保存済みの受付設定です。':'初期状態は受付オフです。設定後に受付を開始できます。');
   }catch{state.ready=false;disable(false);configMessage('予約用SQLの初回設定後にページを再読み込みしてください。通信状態・ログインもご確認ください。',true);}
  }
  async function checkInfrastructure(){try{const r=await fetch('/api/reservations/config',{cache:'no-store'}),data=await r.json();if(active!==state)return;infrastructure.textContent=data.ready?'送信機能の非公開キーは設定済みです。公開前にテスト送信を確認してください。':'送信機能は準備中です。Cloudflareのキー設定が必要です。';}catch{infrastructure.textContent='送信機能は準備中です。Cloudflareへのファイル反映とキー設定を確認してください。';}}
  function replyURL(item){
   const when=item.requested_date.replaceAll('-','/')+' '+item.requested_time;
   let text=item.customer_name+' 様\n\n'+company.name+'です。\n';
   if(item.status==='confirmed')text+=`下記の内容でご予約を承りました。\n日時：${when}\n人数：${item.party_size}名\n`;
   else if(item.status==='declined')text+=`ご希望の日時でのご予約をお受けできず、申し訳ございません。\nご希望日時：${when}\n別の日時については、改めてご相談ください。\n`;
   else if(item.status==='cancelled')text+=`下記のご予約をキャンセルとして承りました。\n日時：${when}\n`;
   else text+=`予約リクエストを拝見しました。\nご希望日時：${when}\n人数：${item.party_size}名\n\n【ここにお客さまへのご案内を入力してください】\n`;
   text+='\n'+company.name;
   return 'mailto:'+encodeURIComponent(item.customer_email).replace(/%40/gi,'@')+'?subject='+encodeURIComponent('【'+company.name+'】ご予約について')+'&body='+encodeURIComponent(text);
  }
  function renderRows(){
   list.replaceChildren();for(const item of state.rows){
    const card=node('article','rb-card'),badge=node('span','rb-badge',labels[item.status]||item.status);badge.dataset.status=item.status;
    const h=node('h3','',item.requested_date.replaceAll('-','/')+' '+item.requested_time+' ／ '+item.party_size+'名');card.append(badge,h,node('p','',item.customer_name+' 様'),node('p','',item.customer_email),node('p','',item.customer_note||'ご連絡事項なし'),node('p','rb-muted','受付：'+new Date(item.created_at).toLocaleString('ja-JP',{timeZone:'Asia/Tokyo'})+' ／ 番号：'+item.id.slice(0,8)));
    const buttons=node('div','rb-actions');for(const [mode,label] of Object.entries(labels)){if(mode===item.status)continue;const b=node('button','',label+'にする');b.type='button';b.addEventListener('click',()=>manage(item,mode,false,card));buttons.append(b);}
    const reply=node('a','rb-button','返信メールを開く');reply.href=replyURL(item);buttons.append(reply);
    const remove=node('button','rb-danger','個人情報を削除');remove.type='button';remove.addEventListener('click',()=>manage(item,item.status,true,card));buttons.append(remove);card.append(buttons);list.append(card);
   }
  }
  let loading=false;
  async function loadRows(append=false){
   if(loading||active!==state)return;loading=true;refresh.disabled=more.disabled=filter.disabled=true;listStatus.textContent='読み込んでいます…';
   if(!append){state.rows=[];state.page=0;list.replaceChildren();more.hidden=true;}
   try{let query=client.from('booking_requests').select('id,company_id,requested_date,requested_time,party_size,customer_name,customer_email,customer_note,status,version,created_at,updated_at').eq('company_id',company.id);if(filter.value!=='all')query=query.eq('status',filter.value);
    const {data,error}=await query.order('created_at',{ascending:false}).order('id',{ascending:false}).range(state.page*25,state.page*25+24);if(active!==state)return;if(error)throw error;
    const seen=new Set(state.rows.map(r=>r.id));state.rows.push(...(data||[]).filter(r=>!seen.has(r.id)));state.page++;renderRows();more.hidden=(data||[]).length<25;listStatus.textContent=state.rows.length?state.rows.length+'件を表示しています。':'該当する予約リクエストはありません。';
   }catch{if(active===state){listStatus.textContent='予約一覧を読み込めませんでした。通信状態・ログイン・SQLの設定を確認してください。';listStatus.classList.add('rb-error');}}
   finally{loading=false;refresh.disabled=more.disabled=filter.disabled=false;}
  }
  async function manage(item,status,remove,card){
   if(remove&&!confirm(item.customer_name+'様の予約情報を完全に削除します。復元できません。削除しますか？'))return;
   const controls=card.querySelectorAll('button');controls.forEach(b=>b.disabled=true);listStatus.textContent=remove?'削除しています…':'保存しています…';
   try{if(!await window.serviceAccess.recheck())throw Error();const {data,error}=await client.rpc('cms_manage_booking_request',{p_id:item.id,p_status:status,p_expected_version:Number(item.version),p_delete:remove});if(error||(!remove&&data?.status!==status)||(remove&&data?.deleted!==true))throw new Error(error?.message||'not-confirmed');
    if(!remove&&filter.value!=='all')filter.value=status;
    await loadRows(false);listStatus.textContent=remove?'予約情報を削除しました。':'状況を保存しました。必要に応じて「返信メールを開く」からお客さまへ連絡してください。';
   }catch(error){listStatus.textContent=String(error.message).includes('booking_conflict')?'他の画面で変更されています。「一覧を更新」で最新の内容を確認してください。':'変更を確認できませんでした。「一覧を更新」して内容をご確認ください。';controls.forEach(b=>b.disabled=false);}
  }
  form.addEventListener('submit',async event=>{
   event.preventDefault();if(!state.ready||state.busy)return;disable(true);configMessage('保存しています…');
   try{if(privacy.value&&!privacy.value.startsWith('https://'))throw new Error('privacy');if(!await window.serviceAccess.recheck())throw Error();
    const {data,error}=await client.rpc('cms_save_booking_settings',{p_company_id:company.id,p_enabled:enabled.checked,p_open_time:open.value,p_close_time:close.value,p_interval_minutes:Number(interval.value),p_notice_hours:Number(notice.value),p_advance_days:Number(advance.value),p_max_party:Number(party.value),p_contact_email:email.value.trim(),p_privacy_url:privacy.value.trim(),p_expected_version:state.version});
    if(active!==state)return;if(error||!data||Number(data.version)!==state.version+1)throw new Error(error?.message||'not-confirmed');state.version=Number(data.version);configMessage('受付設定を保存しました。公開ページを再読み込みして確認できます。');
   }catch(error){const message=String(error.message);configMessage(message.includes('booking_conflict')?'他の画面で設定が変わりました。入力内容を控えてから再読み込みしてください。':message.includes('calendar_required')?'先に営業日カレンダーを一度保存してください。':message==='privacy'?'プライバシーポリシーURLはhttps://で始まるURLにしてください。':'保存できませんでした。営業時間・メール・入力範囲・ログインをご確認ください。',true);}finally{disable(false);}
  });
  filter.addEventListener('change',()=>void loadRows(false));refresh.addEventListener('click',()=>void loadRows(false));more.addEventListener('click',()=>void loadRows(true));
  details.addEventListener('toggle',()=>{if(details.open&&!initialized){initialized=true;disable(true);void settings();void loadRows(false);void checkInfrastructure();}});disable(true);
 }
 Object.defineProperty(window,'sasulieReservationEditor',{value:Object.freeze({mount})});
})();
