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
  document.getElementById("sitePhone").textContent = data.phone ?? "";
  document.getElementById("siteHours").textContent = data.business_hours ?? "";
  document.getElementById("siteClosedDays").textContent = data.closed_days ?? "";
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