(() => {
  'use strict';
  const C=window.sasulieCalendar;let current=null;
  function mount({company,client}){
    if(current&&String(current.id)===String(company.id))return;
    current?.root.remove();
    const root=C.node('section','bc-calendar bc-editor');root.id='businessCalendarEditor';root.setAttribute('aria-labelledby','bcEditorTitle');
    const title=C.node('h2','','営業日カレンダー');title.id='bcEditorTitle';
    const disclosure=C.node('details'),summary=C.node('summary','','営業日・休業日を設定する');disclosure.append(summary);root.append(C.node('p','bc-eyebrow','BUSINESS CALENDAR'),title,disclosure);
    const parent=document.querySelector('main.editor-page');if(!parent)return;const anchor=document.querySelector('.editor-status');if(anchor)anchor.before(root);else parent.prepend(root);
    const state={id:company.id,root,ready:false,busy:false,draft:C.empty(),saved:C.empty()};current=state;
    const panel=C.node('div','bc-panel'),status=C.node('p','bc-status','読み込んでいます…');status.setAttribute('role','status');status.setAttribute('aria-live','polite');disclosure.append(panel,status);
    const enabledLabel=C.node('label','bc-check'),enabled=C.node('input');enabled.type='checkbox';enabledLabel.append(enabled,document.createTextNode('公開サイトにカレンダーを表示する'));
    const help=C.node('p','bc-help','日付を押すと「休業／営業」が切り替わります。変更は「カレンダーを保存」で公開されます。既存の定休日の文章は自動で引き継ぎません。店舗情報にも定休日を記載している場合は、内容を合わせてください。');
    const weeks=C.node('fieldset','bc-weekly');weeks.append(C.node('legend','','毎週の定休日'));
    const weekInputs=C.weekdays.map((w,i)=>{const label=C.node('label'),input=C.node('input');input.type='checkbox';input.value=i;input.addEventListener('change',()=>{state.draft.weekly_closed=weekInputs.filter(n=>n.checked).map(n=>Number(n.value));render();});label.append(input,document.createTextNode(w+'曜日'));weeks.append(label);return input;});
    const board=C.node('div'),detail=C.node('fieldset','bc-detail'),dateLabel=C.node('legend','','日付ごとの設定'),dateHelp=C.node('p','bc-help','日付を押すと詳しい設定ができます。');detail.append(dateLabel,dateHelp);
    const actions=C.node('div','bc-date-actions');
    const hoursLabel=C.node('label','bc-hours-label','この日だけの営業時間（任意）'),hours=C.node('input');hours.type='text';hours.maxLength=80;hours.placeholder='例：10:00〜15:00';hoursLabel.append(hours);
    const hoursSave=C.node('button','','営業時間を適用');hoursSave.type='button';
    const buttons=[];for(const [mode,label] of [['closed','休業にする'],['open','営業にする'],['regular','定休日の設定に戻す']]){const b=C.node('button','',label);b.type='button';b.addEventListener('click',()=>{if(!selected)return;if(mode==='regular')delete state.draft.date_overrides[selected];else state.draft.date_overrides[selected]={status:mode,hours:''};render();});buttons.push(b);actions.append(b);}
    detail.append(actions,hoursLabel);
    const overrides=C.node('details','bc-override-list'),overrideSummary=C.node('summary','','日付ごとの設定一覧'),overrideBody=C.node('div');overrides.append(overrideSummary,overrideBody);
    const footer=C.node('div','bc-actions'),save=C.node('button','bc-primary','カレンダーを保存'),reset=C.node('button','','変更を戻す'),reload=C.node('button','','保存済みの内容を再読込');for(const b of [save,reset,reload,hoursSave])b.type='button';footer.append(save,reset,reload);
    panel.append(enabledLabel,help,weeks,board,detail,overrides,footer);
    let [year,month]=C.today().split('-').map(Number);month--;let selected=null;
    const dirty=()=>JSON.stringify({...state.draft,version:0})!==JSON.stringify({...state.saved,version:0});
    function message(text,error=false){status.textContent=text;status.classList.toggle('bc-error',error);}
    function render(){
      if(current!==state)return;
      enabled.checked=state.draft.enabled;weekInputs.forEach((n,i)=>n.checked=state.draft.weekly_closed.includes(i));
      board.replaceChildren(C.navigation(year,month,step=>{const d=new Date(Date.UTC(year,month+step,1));year=d.getUTCFullYear();month=d.getUTCMonth();render();}),C.grid(state.draft,year,month,{editable:true,selected,onSelect:date=>{if(!state.ready||state.busy)return;selected=date;C.toggle(state.draft,date);render();board.querySelector('[data-date="'+date+'"]')?.focus({preventScroll:true});}}));
      detail.hidden=!selected;if(selected){const d=C.day(state.draft,selected);dateLabel.textContent=selected.replaceAll('-','/')+'：'+d.label;hours.value=state.draft.date_overrides[selected]?.hours||'';hours.disabled=d.closed||state.busy;hoursSave.disabled=d.closed||state.busy;}
      overrideBody.replaceChildren();for(const [date,value] of Object.entries(state.draft.date_overrides).sort(([a],[b])=>a.localeCompare(b))){const row=C.node('div','bc-override-row'),remove=C.node('button','','解除');remove.type='button';remove.setAttribute('aria-label',date+'の個別設定を解除');remove.addEventListener('click',()=>{delete state.draft.date_overrides[date];render();});row.append(C.node('span','',`${date.replaceAll('-','/')} ${value.status==='closed'?'休業':value.hours||'臨時営業'}`),remove);overrideBody.append(row);}
      overrideSummary.textContent=`日付ごとの設定一覧（${Object.keys(state.draft.date_overrides).length}件）`;
      panel.querySelectorAll('button,input').forEach(n=>n.disabled=!state.ready||state.busy||n.dataset.boundary==='true'); // Unlock only after a confirmed read.
      if(selected&&C.day(state.draft,selected).closed){hours.disabled=true;hoursSave.disabled=true;}
      save.disabled=!state.ready||state.busy||!dirty();reset.disabled=!state.ready||state.busy||!dirty();reload.disabled=state.busy;
      if(state.ready&&!state.busy)message(dirty()?'未保存の変更があります。保存すると公開サイトへ反映されます。':'保存済みの内容です。');
    }
    enabled.addEventListener('change',()=>{state.draft.enabled=enabled.checked;render();});
    hours.addEventListener('input',()=>{if(!selected||!state.ready||state.busy||C.day(state.draft,selected).closed)return;state.draft.date_overrides[selected]={status:'open',hours:hours.value.trim()};save.disabled=!dirty();reset.disabled=!dirty();message('未保存の変更があります。カレンダーを保存してください。');});
    reset.addEventListener('click',()=>{state.draft=structuredClone(state.saved);render();});
    async function load(){state.busy=true;render();message('読み込んでいます…');try{const {data,error}=await client.from('business_calendars').select('enabled,weekly_closed,date_overrides,version').eq('company_id',company.id).maybeSingle();if(current!==state)return;if(error)throw error;state.saved=C.normalize(data);state.draft=structuredClone(state.saved);state.ready=true;state.busy=false;render();}catch{state.busy=false;state.ready=false;render();message('読み込めませんでした。初回は営業カレンダー用SQLを実行してください。設定後は再読込できます。',true);}}
    reload.addEventListener('click',()=>{if(dirty()&&!confirm('未保存の変更を破棄して、保存済みの内容を読み込みますか？'))return;void load();});
    save.addEventListener('click',async()=>{
      if(!state.ready||state.busy||!dirty())return;
      if(Object.keys(state.draft.date_overrides).length>730){message('日付ごとの設定は730件までです。古い設定を一覧から解除してください。',true);return;}
      state.busy=true;render();message('保存しています…');
      try{
        if(!await window.serviceAccess.recheck())throw new Error('unavailable');
        const {data,error}=await client.rpc('cms_save_business_calendar',{p_company_id:company.id,p_enabled:state.draft.enabled,p_weekly_closed:state.draft.weekly_closed,p_date_overrides:state.draft.date_overrides,p_expected_version:state.saved.version});
        if(current!==state)return;if(error||!data||data.version!==state.saved.version+1)throw new Error(error?.message||'not-confirmed');
        state.saved=C.normalize(data);state.draft=structuredClone(state.saved);state.busy=false;render();message('保存しました。公開サイトを再読み込みすると反映されます。');
      }catch(error){if(current!==state)return;state.busy=false;render();message(String(error.message).includes('calendar_conflict')?'他の画面で変更されました。内容を控えてから「保存済みの内容を再読込」を押してください。':'保存を確認できませんでした。通信状態・ログイン・利用状況を確認してください。再読込する前に変更内容を控えてください。',true);}
    });
    render();void load();
    window.addEventListener('beforeunload',event=>{if(current===state&&dirty()){event.preventDefault();event.returnValue='';}});
  }
  Object.defineProperty(window,'sasulieCalendarEditor',{value:Object.freeze({mount})});
})();
