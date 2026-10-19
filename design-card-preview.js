(() => {
"use strict";
const allowed = ["standard","natural","japanese","chic","elegant","pop","minimal","visual","clean","craft","bold"];
const design = new URLSearchParams(window.location.search).get("design");
if (!allowed.includes(design)) return;
document.body.dataset.design = design;
const hero = document.querySelector(".hero");
const visual = document.getElementById("previewVisual");
const image = document.getElementById("previewImage");
let parentOrigin;
try { parentOrigin = new URL(document.referrer).origin; } catch { return; }
function hideImage(){ visual.hidden = true; hero.classList.remove("has-image"); image.removeAttribute("src"); }
image.addEventListener("error",hideImage);
window.addEventListener("message", event => {
  if (event.source !== window.parent || event.origin !== parentOrigin || !event.data ||
      event.data.type !== "sasulie-design-preview" || event.data.design !== design) return;
  const data = event.data;
  document.getElementById("previewName").textContent = typeof data.name === "string" ? data.name.slice(0,300) : "";
  document.getElementById("previewNavName").textContent = typeof data.name === "string" ? data.name.slice(0,300) : "";
  const address = document.getElementById("previewAddress");
  address.textContent = typeof data.address === "string" ? data.address.slice(0,500) : "";
  address.hidden = !address.textContent;
  document.getElementById("previewMenuLabel").textContent = data.businessType === "restaurant" ? "メニュー" : "サービス";
  let url;
  try { url = new URL(data.heroImage, document.baseURI); } catch { hideImage(); return; }
  if (!data.heroImage || !["https:","http:"].includes(url.protocol) ||
      (url.protocol === "http:" && url.origin !== location.origin)) { hideImage(); return; }
  if (image.src !== url.href) image.src = url.href;
  visual.hidden = false;
  hero.classList.add("has-image");
});
})();
