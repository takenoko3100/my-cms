(() => {
  'use strict';
  const C=window.sasulieCalendar;let token=0,cleanup=()=>{};
  async function mount({company,client}){
    const ticket=++token;cleanup();document.getElementById('businessCalendar')?.remove();
    const {data,error}=await client.from('business_calendars').select('enabled,weekly_closed,date_overrides,version').eq('company_id',company.id).maybeSingle();
    if(ticket!==token||error||!data?.enabled)return; // Optional calendar: never guess a schedule after a failed read.
    const config=C.normalize(data),root=C.node('section','bc-calendar bc-public');root.id='businessCalendar';root.setAttribute('aria-labelledby','businessCalendarTitle');
    const title=C.node('h2','','営業カレンダー');title.id='businessCalendarTitle';
    const today=C.node('p','bc-today-note'),body=C.node('div'),detail=C.node('div','bc-exceptions');
    root.append(C.node('p','bc-eyebrow','BUSINESS CALENDAR'),title,today,body,C.node('p','bc-help','休：休業日 ／ 時短等：通常と異なる営業時間（下記参照）'),detail,C.node('p','bc-help','日本時間での営業予定です。通常の営業時間は店舗案内をご確認ください。'));
    const now=C.today();let [year,month]=now.split('-').map(Number);month--;
    function render(){
      const date=C.today(),value=C.day(config,date);today.textContent=`本日の予定（${Number(date.slice(5,7))}/${Number(date.slice(8))}）：${value.label}`;
      body.replaceChildren(C.navigation(year,month,step=>{const d=new Date(Date.UTC(year,month+step,1));year=d.getUTCFullYear();month=d.getUTCMonth();render();}),C.grid(config,year,month));
      detail.replaceChildren();
      const entries=Object.entries(config.date_overrides).filter(([date,value])=>date.startsWith(C.key(year,month,1).slice(0,7))&&value.status==='open').sort(([a],[b])=>a.localeCompare(b));
      for(const [date,value] of entries)detail.append(C.node('p','',`${Number(date.slice(5,7))}/${Number(date.slice(8))}：${value.hours||'臨時営業（通常の営業時間）'}`));
    }
    const parent=document.querySelector('main');if(!parent)return;
    const news=parent.querySelector('#news');if(news)news.before(root);else parent.append(root);render();
    const refresh=()=>{if(document.visibilityState!=='hidden')render();};const timer=setInterval(refresh,60000);document.addEventListener('visibilitychange',refresh);
    cleanup=()=>{clearInterval(timer);document.removeEventListener('visibilitychange',refresh);};
  }
  Object.defineProperty(window,'sasuliePublicCalendar',{value:Object.freeze({mount})});
})();
