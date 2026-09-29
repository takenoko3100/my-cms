const SUPABASE_URL = "https://cshieomhxpuaclggicle.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_6mt_8wZcBX9aKPR04NzNBQ_StAq2Qbe";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

async function loadCompanyInfo() {
  const { data, error } = await supabaseClient
    .from("company_info")
    .select("*")
    .limit(1)
    .single();

  if (error) {
    console.error(error);
    return;
  }

  document.getElementById("siteCompanyName").textContent = data.name ?? "";
  document.getElementById("siteNavCompanyName").textContent = data.name;
document.getElementById("siteAddress").textContent = data.address ?? "";

const map = document.getElementById("siteMap");

if (data.address) {
  map.src = `https://www.google.com/maps?q=${encodeURIComponent(data.address)}&output=embed`;
}

document.getElementById("siteDescription").textContent = data.description ?? ""; "";
document.getElementById("sitePhone").textContent = data.phone ?? "";
const phoneLink = document.getElementById("phoneLink");

if (data.phone) {
  phoneLink.href = `tel:${data.phone.replace(/-/g, "")}`;
}

const instagramLink = document.getElementById("instagramLink");

if (data.instagram_url) {
  instagramLink.href = data.instagram_url;
} else {
  instagramLink.style.display = "none";
}

  document.getElementById("siteHours").textContent = data.business_hours ?? "";
  document.getElementById("siteClosedDays").textContent = data.closed_days ?? "";
document.getElementById("footerCompanyName").textContent = data.name ?? "";
document.getElementById("footerCompanyNameCopy").textContent = data.name ?? "";
document.getElementById("footerAddress").textContent = data.address ?? "";

document.getElementById("footerHours").textContent = data.business_hours
  ? `営業時間：${data.business_hours}`
  : "";

document.getElementById("footerClosedDays").textContent = data.closed_days
  ? ` / 定休日：${data.closed_days}`
  : "";

  const footerInstagram = document.getElementById("footerInstagram");

if (data.instagram_url) {
  footerInstagram.href = data.instagram_url;
} else {
  footerInstagram.style.display = "none";
}

document.getElementById("footerYear").textContent =
  new Date().getFullYear();

  if (data.hero_image_url) {
  const hero = document.querySelector(".hero");

  hero.style.backgroundImage = `
    linear-gradient(
      rgba(42, 36, 31, 0.55),
      rgba(42, 36, 31, 0.55)
    ),
    url("${data.hero_image_url}")
  `;

  hero.style.backgroundSize = "cover";
  hero.style.backgroundPosition = "center";
}

}

async function loadNews() {
  const { data, error } = await supabaseClient
    .from("news")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  const newsList = document.getElementById("siteNewsList");

  newsList.innerHTML = "";

  data.forEach((news) => {
  const div = document.createElement("div");
  div.className = "news";

  const title = document.createElement("h3");
  title.textContent = news.title || "";
  div.appendChild(title);

  if (news.image_url) {
    const img = document.createElement("img");
    img.src = news.image_url;
    img.alt = "お知らせ画像";
    div.appendChild(img);
  }

  const content = document.createElement("p");
  content.textContent = news.content || "";
  div.appendChild(content);

  newsList.appendChild(div);
});
}

loadCompanyInfo();
loadNews();

async function loadMenuItems() {
  const { data, error } = await supabaseClient
  .from("menu_items")
  .select("*")
  .eq("is_visible", true)
  .order("sort_order", { ascending: true })
  .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  const menuList = document.getElementById("siteMenuList");
  menuList.innerHTML = "";

  data.forEach((item) => {
  const div = document.createElement("div");
  div.className = "menu-card";

  const head = document.createElement("div");
  head.className = "menu-card-head";

  const category = document.createElement("p");
  category.className = "menu-category-label";
  category.textContent = item.category || "その他";
  head.appendChild(category);

  const title = document.createElement("h3");
  title.textContent = item.name || "";
  head.appendChild(title);

  if (item.is_recommended) {
    const recommended = document.createElement("p");
    recommended.className = "recommended-badge";
    recommended.textContent = "⭐ おすすめ";
    head.appendChild(recommended);
  }

  if (item.is_sold_out) {
    const soldOut = document.createElement("p");
    soldOut.className = "sold-out-badge";
    soldOut.textContent = "売り切れ";
    head.appendChild(soldOut);
  }

  div.appendChild(head);

  if (item.image_url) {
    const img = document.createElement("img");
    img.src = item.image_url;
    img.alt = item.name || "";
    div.appendChild(img);
  }

  const description = document.createElement("p");
  description.textContent = item.description || "";
  div.appendChild(description);

  const priceWrap = document.createElement("p");
  const price = document.createElement("strong");
  price.textContent = `¥${Number(item.price).toLocaleString()}`;
  priceWrap.appendChild(price);
  div.appendChild(priceWrap);

  menuList.appendChild(div);
});
}

loadMenuItems();