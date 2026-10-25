/* Public presentation settings; database policies/triggers control who can change them. */
(() => {
  "use strict";
  const CONTACT_METHODS = Object.freeze({phone:"電話",email:"メール",both:"電話・メール"});
  const PRICE_MODES = Object.freeze({number:"数字で入力",text:"自由入力"});
  function settings(company) {
    const contactMethod = Object.hasOwn(CONTACT_METHODS,company?.contact_method) ? company.contact_method : "phone";
    return Object.freeze({contactMethod,phone:contactMethod !== "email",email:contactMethod !== "phone",
      priceMode:company?.price_input_mode === "text" ? "text" : "number",showClosedDays:company?.show_closed_days !== false});
  }
  const isEmail = value => typeof value === "string" && value.length <= 254 && /^[^\s@<>]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/i.test(value);
  // Stored labels remain the price of record until that item is explicitly saved again.
  const price = item => typeof item.price_text === "string" && item.price_text.trim()
    ? item.price_text.trim() : `¥${Number(item.price || 0).toLocaleString("ja-JP")}`;
  const emailURL = value => isEmail(value) ? "mailto:"+encodeURIComponent(value).replace(/%40/gi,"@") : null;
  function visible(element,show) { if(element) {element.hidden=!show;element.style.display=show?"":"none";} }
  function applyCedrePresentation(company) {
    if (company?.slug !== "cedre-visual") return;

    const title = document.getElementById("companySectionTitle");
    if (title) title.textContent = "お問い合わせ";
    const nav = document.getElementById("navCompanyLink");
    if (nav) {
      nav.textContent = "お問い合わせ";
      nav.setAttribute("href", "#company");
    }

    visible(document.getElementById("access"), false);
    visible(document.getElementById("contact"), false);
    // 非表示の地図は読み込まない。保存済みの住所は変更しない。
    document.getElementById("siteMap")?.removeAttribute("src");
    document.querySelectorAll('a[href="#access"]').forEach(link => visible(link, false));
    document.querySelectorAll('a[href="#contact"]').forEach(link => {
      link.setAttribute("href", "#company");
    });
  }
  function renderContact(company) {
    const options=settings(company),phone=(company.phone||"").trim(),email=(company.contact_email||"").trim();
    const href=emailURL(email),hasPhone=options.phone && /[0-9]/.test(phone),hasEmail=options.email && Boolean(href);
    const phoneValue=document.getElementById("sitePhone");
    visible(phoneValue?.closest("p"),hasPhone);
    const phoneLink=document.getElementById("phoneLink");
    visible(phoneLink,hasPhone);
    if(phoneLink) { if(hasPhone)phoneLink.href="tel:"+phone.replace(/[^0-9+]/g,"");else phoneLink.removeAttribute("href"); }
    const emailValue=document.getElementById("siteEmail");
    if(emailValue){
      emailValue.replaceChildren();
      if(hasEmail){const link=document.createElement("a");link.href=href;link.textContent=email;link.style.overflowWrap="anywhere";emailValue.appendChild(link);}
      visible(emailValue.closest("p"),hasEmail);
    }
    const emailLink=document.getElementById("emailLink");visible(emailLink,hasEmail);
    if(emailLink){if(hasEmail)emailLink.href=href;else emailLink.removeAttribute("href");}
    visible(document.getElementById("siteClosedDays")?.closest("p"),options.showClosedDays);
    const footer=document.getElementById("footerClosedDays");visible(footer,options.showClosedDays);
    if(footer && !options.showClosedDays)footer.textContent="";
    applyCedrePresentation(company);
  }
  Object.defineProperty(window,"companySettings",{value:Object.freeze({settings,price,isEmail,emailURL,renderContact,CONTACT_METHODS,PRICE_MODES})});
})();
