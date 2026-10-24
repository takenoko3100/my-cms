/* Palette selection for the currently authorized company. RLS is still authoritative. */
(() => {
  'use strict';
  const P=window.sasuliePalette;
  let state=null,bound=false,request=0;
  const $=id=>document.getElementById(id);
  function controls(){
    $('sitePaletteChoices').disabled=!state?.ready || state.busy;
    $('saveSitePalette').disabled=!state?.ready || state.busy || state.draft===state.saved;
    $('resetSitePalette').disabled=!state?.ready || state.busy || state.draft===state.saved;
    $('sitePaletteSummary').textContent=P.PALETTES[state?.saved||'original'].name;
    document.querySelectorAll('input[name="sitePalette"]').forEach(input=>input.checked=input.value===state?.draft);
  }
  function setStatus(message,error=false){$('sitePaletteStatus').textContent=message;$('sitePaletteStatus').classList.toggle('is-error',error);}
  function preview(){
    if(!state || !$('sitePaletteDisclosure').open)return;
    const design=state.company.site_design || 'standard';
    const url=state.previewURL(design,state.company.slug);
    if(!url)return;
    const target=new URL(url,location.href);
    target.searchParams.set('palette-preview',state.draft);
    target.hash='palette-preview';
    const frame=$('sitePalettePreview');
    if(frame.getAttribute('src')!==target.href)frame.src=target.href;
    frame.title=P.PALETTES[state.draft].name+'の公開サイト表示イメージ';
    $('sitePalettePreviewLink').href=target.href;
    $('sitePalettePreviewCaption').textContent='表示イメージ：'+P.PALETTES[state.draft].name;
  }
  function choose(id){
    if(!state?.ready || state.busy || !P.isValid(id))return;
    state.draft=id;controls();preview();
    setStatus(id===state.saved?'現在公開中の配色です。':'まだ保存していません。見本を確認して保存してください。');
  }
  async function save(){
    if(!state?.ready || state.busy || state.draft===state.saved)return;
    const snapshot=state,id=state.draft,token=++request;
    state.busy=true;controls();setStatus('配色を保存しています…');
    try{
      const {data,error}=await snapshot.client.from('company_info').update({site_palette:id}).eq('id',snapshot.company.id).select('*').single();
      if(error || !data || String(data.id)!==String(snapshot.company.id) || data.site_palette!==id)throw new Error('Save not confirmed');
      if(token!==request || state!==snapshot)return;
      state.company=data;state.saved=id;state.draft=id;state.busy=false;
      snapshot.onSaved(data);controls();preview();setStatus('保存しました。公開サイトに反映されています。');
    }catch{
      if(token!==request || state!==snapshot)return;
      state.busy=false;controls();setStatus('保存できませんでした。通信状態やログインを確認して、もう一度試してください。',true);
    }
  }
  function bind(){
    if(bound)return;bound=true;
    const choices=$('sitePaletteChoices');
    for(const [id,palette] of Object.entries(P.PALETTES)){
      const label=document.createElement('label');label.className='palette-choice'+(id==='original'?' palette-choice-original':'');
      const input=document.createElement('input');input.type='radio';input.name='sitePalette';input.value=id;
      input.addEventListener('change',()=>choose(id));
      const swatches=document.createElement('span');swatches.className='palette-swatches';swatches.setAttribute('aria-hidden','true');
      for(const color of [palette.light[0],palette.light[2],palette.dark[0]]){
        const dot=document.createElement('i');dot.style.backgroundColor=color;swatches.appendChild(dot);
      }
      const name=document.createElement('span');name.className='palette-choice-name';name.textContent=palette.name;
      label.append(input,swatches,name);choices.appendChild(label);
    }
    $('sitePaletteDisclosure').addEventListener('toggle',()=>preview());
    $('saveSitePalette').addEventListener('click',save);
    $('resetSitePalette').addEventListener('click',()=>{if(state)choose(state.saved);});
  }
  function render({company,client,onSaved,previewURL}){
    if(!$('sitePaletteSection') || !company || !P)return;
    bind();const saved=P.selected(company);
    const changed=!state || String(state.company.id)!==String(company.id);
    if(changed){request++;state={company,client,onSaved,previewURL,saved,draft:saved,busy:false,ready:Object.hasOwn(company,'site_palette')};}
    else{
      const dirty=state.draft!==state.saved;
      Object.assign(state,{company,client,onSaved,previewURL,ready:Object.hasOwn(company,'site_palette')});
      state.saved=saved;if(!dirty && !state.busy)state.draft=saved;
    }
    $('sitePaletteSection').hidden=false;controls();preview();
    if(!state.ready)setStatus('配色の設定は準備中です。変更したい場合はsasulieへ連絡してください。');
    else if(!state.busy && state.draft===state.saved)setStatus('現在公開中の配色です。');
  }
  Object.defineProperty(window,'sasuliePaletteEditor',{value:Object.freeze({render})});
})();
