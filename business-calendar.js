/* Shared calendar rules. Local dates are interpreted in Asia/Tokyo. No booking data. */
(() => {
  'use strict';
  const weekdays=['日','月','火','水','木','金','土'];
  function validDate(value){if(typeof value!=='string'||!/^20\d{2}-\d{2}-\d{2}$/.test(value))return false;const d=new Date(value+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value;}
  const key=(year,month,day)=>`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  function today(now=new Date()){const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);const part=type=>parts.find(p=>p.type===type).value;return `${part('year')}-${part('month')}-${part('day')}`;}
  const empty=()=>({enabled:false,weekly_closed:[],date_overrides:{},version:0});
  function normalize(row){
    if(!row)return empty();
    const overrides={};
    for(const [date,value] of Object.entries(row.date_overrides||{}))if(validDate(date)&&value&&['open','closed'].includes(value.status))overrides[date]={status:value.status,hours:typeof value.hours==='string'?value.hours.slice(0,80):''};
    return {enabled:row.enabled===true,weekly_closed:[...new Set((row.weekly_closed||[]).filter(d=>Number.isInteger(d)&&d>=0&&d<=6))].sort(),date_overrides:overrides,version:Number(row.version)||0};
  }
  function day(config,date){
    if(!validDate(date))throw new Error('Invalid calendar date');
    const override=config.date_overrides[date];
    const closed=override?override.status==='closed':config.weekly_closed.includes(new Date(date+'T00:00:00Z').getUTCDay());
    return {closed,exception:!!override,hours:!closed&&override?override.hours:'',label:closed?'休業':override?.hours||'通常営業'};
  }
  function toggle(config,date){const current=day(config,date);const regularClosed=config.weekly_closed.includes(new Date(date+'T00:00:00Z').getUTCDay());const targetClosed=!current.closed;if(targetClosed===regularClosed)delete config.date_overrides[date];else config.date_overrides[date]={status:targetClosed?'closed':'open',hours:''};}
  function node(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
  function grid(config,year,month,{editable=false,onSelect,selected}={}){
    const root=node('div','bc-grid');root.setAttribute('role','group');root.setAttribute('aria-label',`${year}年${month+1}月の営業予定`);
    weekdays.forEach(w=>{const n=node('span','bc-weekday',w);n.setAttribute('aria-hidden','true');root.append(n);});
    const offset=new Date(Date.UTC(year,month,1)).getUTCDay();for(let i=0;i<offset;i++){const n=node('span','bc-blank');n.setAttribute('aria-hidden','true');root.append(n);}
    const count=new Date(Date.UTC(year,month+1,0)).getUTCDate(),now=today();
    for(let d=1;d<=count;d++){
      const date=key(year,month,d),value=day(config,date),n=node(editable?'button':'div','bc-day'+(value.closed?' bc-closed':'')+(value.exception?' bc-exception':'')+(date===now?' bc-today':''));
      n.dataset.date=date;n.append(node('span','bc-number',String(d)),node('span','bc-day-label',value.closed?'休':'営業'));
      if(value.hours)n.append(node('span','bc-hours-dot','時短等'));
      n.setAttribute('aria-label',`${month+1}月${d}日 ${value.label}${value.exception?'（個別設定）':''}`);
      if(date===now)n.setAttribute('aria-current','date');
      if(editable){n.type='button';n.setAttribute('aria-pressed',String(value.closed));if(date===selected)n.classList.add('bc-selected');n.addEventListener('click',()=>onSelect(date));}
      root.append(n);
    }
    return root;
  }
  function navigation(year,month,onMove){const bar=node('div','bc-month');for(const [step,label] of [[-1,'前の月'],[0,`${year}年${month+1}月`],[1,'次の月']]){const n=node(step?'button':'strong','',step?(step<0?'‹':'›'):label);if(step){n.type='button';n.setAttribute('aria-label',label);n.disabled=(year===2000&&month===0&&step<0)||(year===2099&&month===11&&step>0);n.dataset.boundary=String(n.disabled);n.addEventListener('click',()=>onMove(step));}bar.append(n);}return bar;}
  Object.defineProperty(window,'sasulieCalendar',{value:Object.freeze({weekdays,validDate,key,today,empty,normalize,day,toggle,node,grid,navigation})});
})();
