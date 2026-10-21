/* Company-specific short URLs. Paths select a company; existing auth/RLS still decide access. */
(() => {
  "use strict";
  const allowed = new Set(["standard","natural","japanese","chic","elegant","pop","minimal","visual","clean","craft","bold"]);
  const valid = value => typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 160;
  const parts = location.pathname.split("/").filter(Boolean);
  let context = null;
  let slug, rest;
  if (parts[0] === "cedre") { slug = "cedre-visual"; rest = parts.slice(1); }
  else if (parts[0] === "c" && valid(parts[1])) { slug = parts[1]; rest = parts.slice(2); }
  if (slug && rest) {
    const kind = rest.length === 0 ? "public" : rest.length === 1 && ["edit","login"].includes(rest[0]) ? rest[0] : rest.length === 2 && rest[0] === "_design" && allowed.has(rest[1]) && rest[1] !== "standard" ? "public" : null;
    if (kind) context = Object.freeze({slug, kind, design:rest[0] === "_design" ? rest[1] : null});
  }
  function publicPath(value) {
    if (!valid(value)) throw new Error("Invalid company slug");
    return value === "cedre-visual" ? "/cedre" : "/c/" + encodeURIComponent(value);
  }
  const company = () => context?.slug || new URLSearchParams(location.search).get("company") || "";
  const absolute = value => new URL(value, location.origin).href;
  const api = Object.freeze({context, company, publicPath,
    publicURL:value => absolute(publicPath(value)),
    editorURL:value => absolute(publicPath(value)+"/edit"),
    loginURL:value => value ? absolute(publicPath(value)+"/login") : absolute("/login.html"),
    designURL:(value,design) => {
      if (!allowed.has(design) || design === "standard") throw new Error("Invalid design");
      const target = new URL(publicPath(value)+"/_design/"+design, location.origin);
      target.search = location.search;
      target.searchParams.delete("company"); target.searchParams.delete("design"); target.searchParams.delete("design-preview");
      target.hash = location.hash;
      return target.href;
    }
  });
  Object.defineProperty(window,"sasulieURLs",{value:api,writable:false,configurable:false});
  // Cloudflare may canonicalize old /index.html?company=... to /?company=...
  // Keep these existing editor links working while the root serves the brand page.
  if (location.pathname === "/" && valid(new URLSearchParams(location.search).get("company"))) {
    const target = new URL(api.editorURL(company()));
    for (const [key,value] of new URLSearchParams(location.search)) if (key !== "company") target.searchParams.append(key,value);
    target.hash=location.hash;
    location.replace(target.href);
    return;
  }
  // Keep the shared public URL in the address bar after loading the selected template.
  if (context?.design || (context && location.pathname.endsWith("/"))) {
    const clean = new URL(context.kind === "edit" ? publicPath(context.slug)+"/edit" : context.kind === "login" ? publicPath(context.slug)+"/login" : publicPath(context.slug),location.origin);
    clean.search=location.search; clean.hash=location.hash;
    clean.searchParams.delete("company"); clean.searchParams.delete("design");
    history.replaceState(history.state,"",clean);
  }
})();
