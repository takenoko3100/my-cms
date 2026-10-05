const SUPABASE_URL =
  "https://cshieomhxpuaclggicle.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_6mt_8wZcBX9aKPR04NzNBQ_StAq2Qbe";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);


/* ========================================
   現在表示している会社
======================================== */

let currentCompany = null;
let currentCompanyId = null;


/* ========================================
   初期化
======================================== */

async function initSite() {
  const loaded = await loadCompanyInfo();

  if (!loaded) {
    return;
  }

  await Promise.all([
    loadMenuItems(),
    loadNews()
  ]);
}

initSite();


/* ========================================
   URLから会社slugを取得
======================================== */

function getCompanySlug() {
  const params =
    new URLSearchParams(window.location.search);

  return (
    params.get("company") ||
    "takenoko-restaurant"
  );
}


/* ========================================
   会社情報
======================================== */

async function loadCompanyInfo() {
  const slug = getCompanySlug();

  const { data, error } = await supabaseClient
    .from("company_info")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    console.error(
      "会社情報の読み込みに失敗しました",
      error
    );

    showCompanyNotFound();

    return false;
  }

  currentCompany = data;
  currentCompanyId = data.id;

  renderCompanyInfo(data);

  return true;
}


/* ========================================
   会社情報を画面に表示
======================================== */

function renderCompanyInfo(data) {
  setText(
    "siteCompanyName",
    data.name ?? ""
  );

  setText(
    "siteNavCompanyName",
    data.name ?? ""
  );

  setText(
    "siteAddress",
    data.address ?? ""
  );

  setText(
    "siteDescription",
    data.description ?? ""
  );

  setText(
    "sitePhone",
    data.phone ?? ""
  );

  setText(
    "siteHours",
    data.business_hours ?? ""
  );

  setText(
    "siteClosedDays",
    data.closed_days ?? ""
  );


  /* Google Map */

  const map =
    document.getElementById("siteMap");

  if (map && data.address) {
    map.src =
      `https://www.google.com/maps?q=${encodeURIComponent(
        data.address
      )}&output=embed`;
  }


  /* 電話リンク */

  const phoneLink =
    document.getElementById("phoneLink");

  if (phoneLink) {
    if (data.phone) {
      phoneLink.href =
        `tel:${data.phone.replace(
          /[^0-9+]/g,
          ""
        )}`;

      phoneLink.style.display = "";
    } else {
      phoneLink.style.display = "none";
    }
  }


  /* Instagram */

  const instagramLink =
    document.getElementById("instagramLink");

  if (instagramLink) {
    if (data.instagram_url) {
      instagramLink.href =
        data.instagram_url;

      instagramLink.style.display = "";
    } else {
      instagramLink.style.display = "none";
    }
  }


  /* フッター */

  setText(
    "footerCompanyName",
    data.name ?? ""
  );

  setText(
    "footerCompanyNameCopy",
    data.name ?? ""
  );

  setText(
    "footerAddress",
    data.address ?? ""
  );

  setText(
    "footerHours",
    data.business_hours
      ? `営業時間：${data.business_hours}`
      : ""
  );

  setText(
    "footerClosedDays",
    data.closed_days
      ? ` / 定休日：${data.closed_days}`
      : ""
  );

  setText(
    "footerYear",
    new Date().getFullYear()
  );


  const footerInstagram =
    document.getElementById(
      "footerInstagram"
    );

  if (footerInstagram) {
    if (data.instagram_url) {
      footerInstagram.href =
        data.instagram_url;

      footerInstagram.style.display = "";
    } else {
      footerInstagram.style.display =
        "none";
    }
  }


  /* トップ画像 */

  const hero =
    document.querySelector(".hero");

  if (hero && data.hero_image_url) {
    hero.style.backgroundImage = `
      linear-gradient(
        rgba(42, 36, 31, 0.55),
        rgba(42, 36, 31, 0.55)
      ),
      url("${data.hero_image_url}")
    `;

    hero.style.backgroundSize =
      "cover";

    hero.style.backgroundPosition =
      "center";
  }


  /* ブラウザタイトル */

  if (data.name) {
    document.title = data.name;
  }
}


/* ========================================
   お知らせ
======================================== */

async function loadNews() {
  if (!currentCompanyId) {
    return;
  }

  const { data, error } =
    await supabaseClient
      .from("news")
      .select("*")
      .eq(
        "company_id",
        currentCompanyId
      )
      .order(
        "created_at",
        { ascending: false }
      );

  if (error) {
    console.error(
      "お知らせの読み込みに失敗しました",
      error
    );

    return;
  }

  const newsList =
    document.getElementById(
      "siteNewsList"
    );

  if (!newsList) {
    return;
  }

  newsList.replaceChildren();

  data.forEach((news) => {
    const div =
      document.createElement("div");

    div.className = "news";


    const title =
      document.createElement("h3");

    title.textContent =
      news.title || "";

    div.appendChild(title);


    if (news.image_url) {
      const img =
        document.createElement("img");

      img.src =
        news.image_url;

      img.alt =
        news.title || "お知らせ画像";

      div.appendChild(img);
    }


    const content =
      document.createElement("p");

    content.textContent =
      news.content || "";

    div.appendChild(content);

    newsList.appendChild(div);
  });
}


/* ========================================
   メニュー・サービス
======================================== */

async function loadMenuItems() {
  if (!currentCompanyId) {
    return;
  }

  const { data, error } =
    await supabaseClient
      .from("menu_items")
      .select("*")
      .eq(
        "company_id",
        currentCompanyId
      )
      .eq(
        "is_visible",
        true
      )
      .order(
        "sort_order",
        { ascending: true }
      )
      .order(
        "created_at",
        { ascending: false }
      );

  if (error) {
    console.error(
      "メニューの読み込みに失敗しました",
      error
    );

    return;
  }

  const menuList =
    document.getElementById(
      "siteMenuList"
    );

  if (!menuList) {
    return;
  }

  menuList.replaceChildren();

  data.forEach((item) => {
    const div =
      document.createElement("div");

    div.className =
      "menu-card";


    /* 上部 */

    const head =
      document.createElement("div");

    head.className =
      "menu-card-head";


    /* カテゴリ */

    if (
      item.category &&
      currentCompany?.business_type !==
        "hospital"
    ) {
      const category =
        document.createElement("p");

      category.className =
        "menu-category-label";

      category.textContent =
        item.category;

      head.appendChild(category);
    }


    /* 名前 */

    const title =
      document.createElement("h3");

    title.textContent =
      item.name || "";

    head.appendChild(title);


    /* おすすめ */

    if (
      item.is_recommended &&
      currentCompany?.business_type ===
        "restaurant"
    ) {
      const recommended =
        document.createElement("p");

      recommended.className =
        "recommended-badge";

      recommended.textContent =
        "⭐ おすすめ";

      head.appendChild(recommended);
    }


    /* 売り切れ */

    if (
      item.is_sold_out &&
      currentCompany?.business_type ===
        "restaurant"
    ) {
      const soldOut =
        document.createElement("p");

      soldOut.className =
        "sold-out-badge";

      soldOut.textContent =
        "売り切れ";

      head.appendChild(soldOut);
    }

    div.appendChild(head);


    /* 画像 */

    if (item.image_url) {
      const img =
        document.createElement("img");

      img.src =
        item.image_url;

      img.alt =
        item.name || "";

      div.appendChild(img);
    }


    /* 説明 */

    const description =
      document.createElement("p");

    description.textContent =
      item.description || "";

    div.appendChild(description);


    /* 料金
       病院では表示しない
    */

    if (
      currentCompany?.business_type !==
      "hospital"
    ) {
      const priceWrap =
        document.createElement("p");

      const price =
        document.createElement("strong");

      price.textContent =
        `¥${Number(
          item.price || 0
        ).toLocaleString()}`;

      priceWrap.appendChild(price);

      div.appendChild(priceWrap);
    }


    menuList.appendChild(div);
  });
}


/* ========================================
   会社が見つからない場合
======================================== */

function showCompanyNotFound() {
  const main =
    document.querySelector("main");

  if (!main) {
    return;
  }

  main.replaceChildren();

  const message =
    document.createElement("p");

  message.textContent =
    "ページが見つかりませんでした。";

  message.style.textAlign =
    "center";

  message.style.padding =
    "80px 20px";

  main.appendChild(message);
}


/* ========================================
   共通
======================================== */

function setText(id, value) {
  const element =
    document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}