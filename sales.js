"use strict";
const titleInput=document.getElementById("demoTitle");
const bodyInput=document.getElementById("demoBody");
document.getElementById("demoApply").addEventListener("click",()=>{
 const title=titleInput.value.trim();
 if(!title){document.getElementById("demoStatus").textContent="タイトルを入れてみてください。";titleInput.focus();return;}
 document.getElementById("demoPreviewTitle").textContent=title;
 document.getElementById("demoPreviewBody").textContent=bodyInput.value.trim();
 document.getElementById("demoStatus").textContent="サンプルに反映しました。実際の公開・保存はされていません。";
});
