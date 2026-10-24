"use strict";
const cards = [...document.querySelectorAll(".design-card")];
document.querySelectorAll("[data-filter]").forEach(button => button.addEventListener("click", () => {
 document.querySelectorAll("[data-filter]").forEach(b => b.setAttribute("aria-pressed", String(b === button)));
 let count = 0;
 cards.forEach(card => {card.hidden = button.dataset.filter !== "すべて" && card.dataset.category !== button.dataset.filter; if (!card.hidden) count++;});
 document.getElementById("resultCount").textContent = count + " DESIGNS";
}));
const dialog = document.getElementById("previewDialog"), frame = document.getElementById("previewFrame");
document.querySelectorAll("[data-preview]").forEach(button => button.addEventListener("click", () => {
 const link = button.closest(".design-card").querySelector(".mini").getAttribute("href");
 if (typeof dialog.showModal !== "function") {window.location.href = link; return;}
 frame.src = link; frame.title = button.dataset.name + "のスマホ表示";
 document.getElementById("previewTitle").textContent = button.dataset.name;
 document.getElementById("previewOpen").href = link;
 dialog.showModal(); document.getElementById("closePreview").focus();
}));
document.getElementById("closePreview").addEventListener("click", () => dialog.close());
dialog.addEventListener("close", () => frame.removeAttribute("src"));

const liveMiniCards=[...document.querySelectorAll('.live-mini')];
function sizeLiveCards(){liveMiniCards.forEach(card=>{const frame=card.querySelector('iframe');frame.style.transform='scale('+card.clientWidth/1040+')';});}
if(typeof ResizeObserver!=='undefined'){const liveSizes=new ResizeObserver(sizeLiveCards);liveMiniCards.forEach(card=>liveSizes.observe(card));}else window.addEventListener('resize',sizeLiveCards);sizeLiveCards();
