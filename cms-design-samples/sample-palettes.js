(() => {
 'use strict';
 if(new URLSearchParams(location.search).get('card-preview')==='1')document.body.classList.add('sample-card-preview');
 const P=window.sasuliePalette, choices=document.querySelector('.sample-color-choices');
 if(!P || !choices)return;
 const company={site_design:document.body.dataset.design,site_palette:'original'};
 for(const [id,palette] of Object.entries(P.PALETTES)){
  const label=document.createElement('label');const radio=document.createElement('input');radio.type='radio';radio.name='samplePalette';radio.value=id;radio.checked=id==='original';
  const swatch=document.createElement('span');swatch.className='sample-color-swatch';swatch.style.backgroundColor=P.colors(id)[2];swatch.setAttribute('aria-hidden','true');
  const text=document.createElement('span');text.textContent=palette.name;
  radio.addEventListener('change',()=>{if(!radio.checked)return;company.site_palette=id;P.apply(company,{preview:false});document.getElementById('sampleColorStatus').textContent=palette.name+'の見本です。実際のサイトには保存されません。';});
  label.append(radio,swatch,text);choices.append(label);
 }
 P.apply(company,{preview:false});
})();
