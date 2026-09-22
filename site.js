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

    div.innerHTML = `
      <h3>${news.title}</h3>

      ${
        news.image_url
          ? `<img src="${news.image_url}" alt="お知らせ画像" style="width:100%; border-radius:8px; margin-bottom:12px;">`
          : ""
      }

      <p>${news.content}</p>
    `;

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

  const groupedMenu = {};

data.forEach((item) => {
  const category = item.category || "その他";

  if (!groupedMenu[category]) {
    groupedMenu[category] = [];
  }

  groupedMenu[category].push(item);
});

  Object.entries(groupedMenu).forEach(([category, items]) => {
  const categorySection = document.createElement("section");
  categorySection.className = "menu-category";

  const categoryTitle = document.createElement("h3");
  categoryTitle.textContent = category;

  const categoryList = document.createElement("div");
  categoryList.className = "menu-category-list";

  items.forEach((item) => {
    const div = document.createElement("div");

    div.className = "menu-card";

    div.innerHTML = `
      <h3>${item.name}</h3>

      ${item.is_recommended ? '<p class="recommended-badge">⭐ おすすめ</p>' : ""}
      ${item.is_sold_out ? '<p class="sold-out-badge">売り切れ</p>' : ""}

      ${
        item.image_url
          ? `<img src="${item.image_url}" alt="${item.name}" style="width:100%; border-radius:12px;">`
          : ""
      }

      <p>${item.description ?? ""}</p>
      <p><strong>¥${Number(item.price).toLocaleString()}</strong></p>
    `;

    categoryList.appendChild(div);
  });

  categorySection.appendChild(categoryTitle);
  categorySection.appendChild(categoryList);

  menuList.appendChild(categorySection);
});
}

loadMenuItems();