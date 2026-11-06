(() => {
 'use strict';let sequence=0;
 async function mount({company,client}){
  const ticket=++sequence;document.getElementById('reservationEntry')?.remove();
  const {data,error}=await client.rpc('cms_public_booking_config',{p_slug:company.slug});if(ticket!==sequence||error||!data)return;
  const n=window.sasulieCalendar.node,root=n('section','rb rb-public-entry');root.id='reservationEntry';root.setAttribute('aria-labelledby','reservationEntryTitle');const title=n('h2','','ご予約について');title.id='reservationEntryTitle';const a=n('a','rb-button rb-primary','予約リクエストを送る →');a.href='/c/'+encodeURIComponent(company.slug)+'/reserve';const actions=n('div','rb-actions');actions.append(a);root.append(title,n('p','','希望日時をお送りください。お店からの返信をもって予約確定となります。'),actions);
  const main=document.querySelector('main');if(!main)return;const next=main.querySelector('#news');if(next)next.before(root);else main.append(root);
 }
 Object.defineProperty(window,'sasuliePublicReservations',{value:Object.freeze({mount})});
})();
