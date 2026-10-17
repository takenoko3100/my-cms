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
document.getElementById("consultForm").addEventListener("submit",event=>{
 event.preventDefault();
 const business=document.getElementById("business").value.trim()||"未定";
 const design=document.getElementById("designChoice").value;
 const wish=document.getElementById("wish").value.trim()||"これから相談したい";
 document.getElementById("memoText").value=["ホームページ制作の相談メモ","","事業・お店："+business,"希望デザイン："+design,"相談したいこと："+wish,"","確認中の料金案：初期50,000円＋月額1,500円（税込）","※これはメモです。送信・申し込みは完了していません。"].join("\n");
 document.getElementById("memoResult").hidden=false;
 document.getElementById("memoStatus").textContent="相談メモを作りました。このページからは送信されません。";
 document.getElementById("memoText").focus();
});
document.getElementById("copyMemo").addEventListener("click",async()=>{
 const memo=document.getElementById("memoText");
 try{
  if(!navigator.clipboard||!window.isSecureContext)throw new Error("manual");
  await navigator.clipboard.writeText(memo.value);
  document.getElementById("memoStatus").textContent="メモをコピーしました。送信・申し込みはされていません。";
 }catch{
  memo.focus();memo.select();
  document.getElementById("memoStatus").textContent="メモを選択しました。Macは⌘C、スマホは選択メニューの「コピー」でコピーしてください。";
 }
});
