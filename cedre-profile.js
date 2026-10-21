/* Presentation rules for CÈDRE. Database membership/RLS still controls every write. */
(() => {
  "use strict";
  const applies = company => company?.slug === "cedre-visual";
  const isEmail = value => typeof value === "string" && value.length <= 254 && /^[^\s@<>]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/i.test(value);
  const price = (item, company) => applies(company) && typeof item.price_text === "string" && item.price_text.trim()
    ? item.price_text.trim() : `¥${Number(item.price || 0).toLocaleString("ja-JP")}`;
  const emailURL = value => isEmail(value) ? "mailto:" + encodeURIComponent(value).replace(/%40/gi,"@") : null;
  function renderContact(company) {
    const custom = applies(company);
    const email = (company.contact_email || "").trim();
    const href = emailURL(email);
    const phone = document.getElementById("sitePhone");
    const closed = document.getElementById("siteClosedDays");
    if (closed?.closest("p")) closed.closest("p").hidden = custom;
    const footerClosed = document.getElementById("footerClosedDays");
    if (footerClosed) { footerClosed.hidden = custom; if (custom) footerClosed.textContent = ""; }
    if (custom) {
      const label = document.getElementById("phoneLabel");
      if (label) label.textContent = "メールアドレス：";
      if (phone) {
        phone.replaceChildren();
        phone.style.overflowWrap = "anywhere";
        if (href) {
          const link = document.createElement("a"); link.href = href; link.textContent = email;
          phone.appendChild(link);
        }
        if (phone.closest("p")) phone.closest("p").hidden = !href;
      }
      const button = document.getElementById("phoneLink");
      if (button) {
        button.textContent = "メールで問い合わせる";
        button.hidden = !href;
        button.style.display = href ? "" : "none";
        if (href) button.href = href; else button.removeAttribute("href");
      }
    }
  }
  Object.defineProperty(window, "cedreProfile", {value:Object.freeze({applies,isEmail,price,emailURL,renderContact})});
})();
