/* Shared, allowlisted site palettes. Layout/theme and customer content stay separate. */
(() => {
  'use strict';
  const PALETTES = Object.freeze({
    original:{name:'デザイン標準',light:['#f6f2e8','#35392c','#626d48','#7b816d','#d5dac8','#e9eddf'],dark:['#181c1b','#eee9df','#c7aa73','#b9c2b4','#46534b','#24312c']},
    forest:{name:'グリーン',light:['#f5f7f2','#24382b','#345f43','#566651','#cdd9cc','#e6ede2'],dark:['#14231b','#f1f5ec','#a7c79b','#bbcbb8','#3d5543','#213429']},
    sand:{name:'ベージュ',light:['#faf6ef','#443b32','#795b3b','#716456','#ddd2c2','#f0e8da'],dark:['#262017','#faf3e6','#d9bc8c','#cbbda8','#5c4e3b','#352c20']},
    navy:{name:'ネイビー',light:['#f4f7fb','#1e334b','#2f527c','#52657d','#cfd9e6','#e7edf5'],dark:['#142030','#f0f5fc','#a9c9e8','#b7c8dd','#3b526d','#203147']},
    rose:{name:'ローズ',light:['#fbf5f5','#483139','#8a4b60','#735864','#e4cfd6','#f3e5e9'],dark:['#291d23','#fbeff3','#e5b1c2','#d7b9c5','#61434f','#3b2933']},
    terracotta:{name:'テラコッタ',light:['#fbf5ee','#4c352b','#995334','#765b4c','#e6d2c4','#f4e5d7'],dark:['#2a201a','#fbf0e8','#e9b08c','#d5bfad','#624c3c','#3b2c22']},
    slate:{name:'グレー',light:['#f6f7f8','#30383d','#4a5d68','#5c666d','#d1d9de','#e9edf0'],dark:['#1d2328','#f2f5f7','#bbccd6','#bec9d1','#485660','#2c353d']}
  });
  for(const value of Object.values(PALETTES)) {Object.freeze(value.light);Object.freeze(value.dark);Object.freeze(value);}
  const isValid=id=>typeof id==='string' && Object.hasOwn(PALETTES,id);
  const selected=company=>isValid(company?.site_palette)?company.site_palette:'original';
  const isDark=(company,design)=>['chic','visual','bold'].includes(design||company?.site_design) || ((!design || design==='standard') && company?.theme==='visual-dark');
  function colors(id,dark=false){return PALETTES[isValid(id)?id:'original'][dark?'dark':'light'];}
  const keys=['--paper','--ink','--accent','--muted','--line','--surface'];
  function apply(company,{preview=true}={}){
    let id=selected(company);
    const draft=new URLSearchParams(location.search).get('palette-preview');
    if(preview && isValid(draft) && new URLSearchParams(location.search).has('design-preview'))id=draft;
    const body=document.body;
    body.classList.toggle("palette-preview-page",new URLSearchParams(location.search).has("design-preview") && isValid(draft));
    if(id==='original'){
      delete body.dataset.sitePalette;delete body.dataset.paletteMood;
      keys.concat(['--palette-button-ink']).forEach(key=>body.style.removeProperty(key));
      return id;
    }
    const design=body.dataset.design || (body.dataset.palettePage==='natural'?'natural':body.dataset.palettePage==='standard'?'standard':company?.site_design);
    const dark=isDark(company,design);
    body.dataset.sitePalette=id;body.dataset.paletteMood=dark?'dark':'light';
    colors(id,dark).forEach((value,index)=>body.style.setProperty(keys[index],value));
    body.style.setProperty('--palette-button-ink',dark?colors(id,dark)[0]:'#ffffff');
    return id;
  }
  Object.defineProperty(window,'sasuliePalette',{value:Object.freeze({PALETTES,isValid,selected,isDark,colors,apply})});
})();
