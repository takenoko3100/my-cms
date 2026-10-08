const SUPABASE_URL =
  "https://cshieomhxpuaclggicle.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_6mt_8wZcBX9aKPR04NzNBQ_StAq2Qbe";

const supabaseClient =
  supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );


let currentCompany = null;
let currentCompanyId = null;


/* ========================================
   業種ごとの公開ページ設定
======================================== */

const PUBLIC_BUSINESS_SETTINGS = {

  restaurant: {
    heroKicker: "",
    aboutLabel: "INTRODUCTION",
    aboutTitle: "店舗紹介",
    serviceLabel: "MENU",
    serviceTitle: "メニュー",
    companyLabel: "INFORMATION",
    companyTitle: "店舗情報",
    hoursLabel: "営業時間：",
    closedDaysLabel: "定休日：",
    navAbout: "店舗紹介",
    navService: "メニュー",
    navCompany: "店舗情報"
  },


  video_editing: {
    heroKicker: "PHOTOGRAPHY / FILM / EDIT",
    aboutLabel: "ABOUT",
    aboutTitle: "クリエイター紹介",
    serviceLabel: "SERVICES",
    serviceTitle: "撮影・編集サービス",
    companyLabel: "INFORMATION",
companyTitle: "ご依頼について",
    hoursLabel: "対応時間：",
    closedDaysLabel: "休業日：",
    navAbout: "ABOUT",
    navService: "SERVICES",
    navCompany: "INFORMATION"
  },


  hospital: {
    heroKicker: "",
    aboutLabel: "INTRODUCTION",
    aboutTitle: "医院紹介",
    serviceLabel: "MEDICAL",
    serviceTitle: "診療科",
    companyLabel: "INFORMATION",
    companyTitle: "医院情報",
    hoursLabel: "診療時間：",
    closedDaysLabel: "休診日：",
    navAbout: "医院紹介",
    navService: "診療科",
    navCompany: "医院情報"
  },


  auto_repair: {
    heroKicker: "",
    aboutLabel: "INTRODUCTION",
    aboutTitle: "会社紹介",
    serviceLabel: "SERVICES",
    serviceTitle: "サービス・料金",
    companyLabel: "INFORMATION",
    companyTitle: "店舗情報",
    hoursLabel: "営業時間：",
    closedDaysLabel: "定休日：",
    navAbout: "会社紹介",
    navService: "サービス",
    navCompany: "店舗情報"
  }

};


/* ========================================
   初期化
======================================== */

async function initSite() {

  const loaded =
    await loadCompanyInfo();


  if (!loaded) {
    return;
  }


  await Promise.all([
    loadMenuItems(),
    loadPortfolioItems(),
    loadNews()
  ]);

}


initSite();


/* ========================================
   slug
======================================== */

function getCompanySlug() {

  const params =
    new URLSearchParams(
      window.location.search
    );


  return (
    params.get("company") ||
    "takenoko-restaurant"
  );

}


/* ========================================
   会社情報
======================================== */

async function loadCompanyInfo() {

  const slug =
    getCompanySlug();


  const { data, error } =
    await supabaseClient
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


  currentCompany =
    data;

  currentCompanyId =
    data.id;


  renderCompanyInfo(
    data
  );


  return true;
}


/* ========================================
   会社情報表示
======================================== */

function renderCompanyInfo(
  data
) {

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
    data.description ??
      ""
  );


  setText(
    "sitePhone",
    data.phone ?? ""
  );


  setText(
    "siteHours",
    data.business_hours ??
      ""
  );


  setText(
    "siteClosedDays",
    data.closed_days ??
      ""
  );


  applyBusinessTypeUI(
    data.business_type ||
      "restaurant"
  );


  applyTheme(
    data.theme ||
      "default"
  );

  const menuMoreWrap =
  document.getElementById(
    "menuMoreWrap"
  );


const menuMoreLink =
  document.getElementById(
    "menuMoreLink"
  );


if (
  menuMoreWrap &&
  menuMoreLink
) {

  if (
    data.business_type ===
    "restaurant"
  ) {

    menuMoreWrap.hidden =
      false;


    menuMoreLink.href =
      `menu.html?company=${encodeURIComponent(
        data.slug
      )}`;

  } else {

    menuMoreWrap.hidden =
      true;

  }

}


  /* Google Map */

  const map =
    document.getElementById(
      "siteMap"
    );


  if (
    map &&
    data.address
  ) {

    map.src =
      `https://www.google.com/maps?q=${encodeURIComponent(
        data.address
      )}&output=embed`;

  }


  const accessSection =
    document.getElementById(
      "access"
    );


  if (
    accessSection &&
    !data.address
  ) {

    accessSection.hidden =
      true;

  }


  /* 電話 */

  const phoneLink =
    document.getElementById(
      "phoneLink"
    );


  if (phoneLink) {

    if (data.phone) {

      phoneLink.href =
        `tel:${data.phone.replace(
          /[^0-9+]/g,
          ""
        )}`;


      phoneLink.style.display =
        "";

    } else {

      phoneLink.style.display =
        "none";

    }

  }


  /* Instagram */

  const instagramLink =
    document.getElementById(
      "instagramLink"
    );


  if (instagramLink) {

    if (data.instagram_url) {

      instagramLink.href =
        data.instagram_url;


      instagramLink.style.display =
        "";

    } else {

      instagramLink.style.display =
        "none";

    }

  }


  /* Footer */

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
      ? data.business_hours
      : ""
  );


  setText(
    "footerClosedDays",
    data.closed_days
      ? ` / ${data.closed_days}`
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


      footerInstagram.style.display =
        "";

    } else {

      footerInstagram.style.display =
        "none";

    }

  }


  /* Hero */

  const hero =
    document.querySelector(
      ".hero"
    );


  if (
    hero &&
    data.hero_image_url
  ) {

    hero.style.backgroundImage =
      `linear-gradient(
        rgba(10, 10, 10, 0.48),
        rgba(10, 10, 10, 0.58)
      ),
      url("${data.hero_image_url}")`;


    hero.style.backgroundSize =
      "cover";


    hero.style.backgroundPosition =
      "center";

  }


  if (data.name) {
    document.title =
      data.name;
  }
}


/* ========================================
   業種UI
======================================== */

function applyBusinessTypeUI(
  businessType
) {

  const settings =
    PUBLIC_BUSINESS_SETTINGS[
      businessType
    ] ||
    PUBLIC_BUSINESS_SETTINGS
      .restaurant;


  setText(
    "heroKicker",
    settings.heroKicker
  );


  setText(
    "aboutSectionLabel",
    settings.aboutLabel
  );


  setText(
    "aboutSectionTitle",
    settings.aboutTitle
  );


  setText(
    "serviceSectionLabel",
    settings.serviceLabel
  );


  setText(
    "serviceSectionTitle",
    settings.serviceTitle
  );


  setText(
    "companySectionLabel",
    settings.companyLabel
  );


  setText(
    "companySectionTitle",
    settings.companyTitle
  );


  setText(
    "hoursLabel",
    settings.hoursLabel
  );


  setText(
    "closedDaysLabel",
    settings.closedDaysLabel
  );


  setText(
    "navAboutLink",
    settings.navAbout
  );


  setText(
    "navServiceLink",
    settings.navService
  );


  setText(
    "navCompanyLink",
    settings.navCompany
  );


  const portfolioSection =
    document.getElementById(
      "portfolio"
    );


  const portfolioLink =
    document.getElementById(
      "navPortfolioLink"
    );


  const showPortfolio =
    businessType ===
    "video_editing";


  if (portfolioSection) {

    portfolioSection.hidden =
      !showPortfolio;

  }


  if (portfolioLink) {

    portfolioLink.hidden =
      !showPortfolio;

  }

}


/* ========================================
   Theme
======================================== */

function applyTheme(
  theme
) {

  document.body.dataset.theme =
    theme || "default";

}


/* ========================================
   Services / Menu
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
        {
          ascending: true
        }
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(
      "サービスの読み込みに失敗しました",
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


  if (
    !data ||
    data.length === 0
  ) {

    const empty =
      document.createElement(
        "p"
      );


    empty.className =
      "public-empty";


    empty.textContent =
      currentCompany
        ?.business_type ===
        "restaurant"
        ? "現在メニューを準備中です。"
        : "現在サービスを準備中です。";


    menuList.appendChild(
      empty
    );


    return;
  }

  const itemsToShow =
  currentCompany?.business_type ===
  "restaurant"
    ? [
        ...data.filter(
          (item) =>
            item.is_recommended
        ),
        ...data.filter(
          (item) =>
            !item.is_recommended
        )
      ].slice(0, 3)
    : data;


  itemsToShow.forEach(
  (item) => {

      const div =
        document.createElement(
          "article"
        );


      div.className =
        "menu-card";


      const head =
        document.createElement(
          "div"
        );


      head.className =
        "menu-card-head";


      if (
        item.category &&
        currentCompany
          ?.business_type !==
          "hospital"
      ) {

        const category =
          document.createElement(
            "p"
          );


        category.className =
          "menu-category-label";


        category.textContent =
          item.category;


        head.appendChild(
          category
        );

      }


      const title =
        document.createElement(
          "h3"
        );


      title.textContent =
        item.name || "";


      head.appendChild(
        title
      );


      if (
        item.is_recommended &&
        currentCompany
          ?.business_type ===
          "restaurant"
      ) {

        const badge =
          document.createElement(
            "p"
          );


        badge.className =
          "recommended-badge";


        badge.textContent =
          "⭐ おすすめ";


        head.appendChild(
          badge
        );

      }


      if (
        item.is_sold_out &&
        currentCompany
          ?.business_type ===
          "restaurant"
      ) {

        const badge =
          document.createElement(
            "p"
          );


        badge.className =
          "sold-out-badge";


        badge.textContent =
          "売り切れ";


        head.appendChild(
          badge
        );

      }


      div.appendChild(
        head
      );


      if (item.image_url) {

        const img =
          document.createElement(
            "img"
          );


        img.src =
          item.image_url;


        img.alt =
          item.name || "";


        div.appendChild(
          img
        );

      }


      if (item.description) {

        const description =
          document.createElement(
            "p"
          );


        description.textContent =
          item.description;


        div.appendChild(
          description
        );

      }


      if (
        currentCompany
          ?.business_type !==
        "hospital"
      ) {

        const priceWrap =
          document.createElement(
            "p"
          );


        const price =
          document.createElement(
            "strong"
          );


        price.textContent =
          `¥${Number(
            item.price || 0
          ).toLocaleString()}`;


        priceWrap.appendChild(
          price
        );


        div.appendChild(
          priceWrap
        );

      }


      menuList.appendChild(
        div
      );

    }
  );
}


/* ========================================
   Portfolio
======================================== */

async function loadPortfolioItems() {

  if (!currentCompanyId) {
    return;
  }


  if (
    currentCompany
      ?.business_type !==
    "video_editing"
  ) {
    return;
  }


  const { data, error } =
    await supabaseClient
      .from("portfolio_items")
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
        {
          ascending: true
        }
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(
      "ポートフォリオの読み込みに失敗しました",
      error
    );

    return;
  }


  const list =
    document.getElementById(
      "sitePortfolioList"
    );


  if (!list) {
    return;
  }


  list.replaceChildren();


  if (
    !data ||
    data.length === 0
  ) {

    const empty =
      document.createElement("p");

    empty.className =
      "public-empty";

    empty.textContent =
      "制作実績を準備中です。";

    list.appendChild(empty);

    return;
  }


  data.forEach((item) => {

    const card =
      document.createElement(
        "article"
      );

    card.className =
      "portfolio-card";


    const visual =
      document.createElement(
        "div"
      );

    visual.className =
      "portfolio-visual";


    /* =========================
       動画
    ========================== */

    if (
  item.media_type === "video" &&
  item.video_url
) {

  const directVideoUrl =
    getDirectVideoUrl(
      item.video_url
    );


  const embedUrl =
    getSafeVideoEmbedUrl(
      item.video_url
    );


  /* MP4 / WebMを直接再生 */

  if (directVideoUrl) {

    const video =
      document.createElement(
        "video"
      );


    video.src =
      directVideoUrl;


    video.className =
      "portfolio-video";


    video.controls =
      true;


    video.preload =
      "metadata";


    video.playsInline =
      true;


    if (item.image_url) {

      video.poster =
        item.image_url;

    }


    visual.appendChild(
      video
    );


  /* YouTube / Vimeo */

  } else if (embedUrl) {

    const iframe =
      document.createElement(
        "iframe"
      );


    iframe.src =
      embedUrl;


    iframe.title =
      item.title ||
      "動画";


    iframe.loading =
      "lazy";


    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";


    iframe.referrerPolicy =
      "strict-origin-when-cross-origin";


    iframe.allowFullscreen =
      true;


    iframe.className =
      "portfolio-video";


    visual.appendChild(
      iframe
    );


  } else {

    const placeholder =
      document.createElement(
        "div"
      );


    placeholder.className =
      "portfolio-placeholder";


    placeholder.textContent =
      "VIDEO";


    visual.appendChild(
      placeholder
    );

  }

      if (embedUrl) {

        const iframe =
          document.createElement(
            "iframe"
          );

        iframe.src =
          embedUrl;

        iframe.title =
          item.title ||
          "動画";

        iframe.loading =
          "lazy";

        iframe.allow =
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";

        iframe.referrerPolicy =
          "strict-origin-when-cross-origin";

        iframe.allowFullscreen =
          true;

        iframe.className =
          "portfolio-video";

        visual.appendChild(
          iframe
        );


      } else if (
        item.image_url
      ) {

        const img =
          document.createElement(
            "img"
          );

        img.src =
          item.image_url;

        img.alt =
          item.title || "";

        visual.appendChild(
          img
        );

      } else {

        const placeholder =
          document.createElement(
            "div"
          );

        placeholder.className =
          "portfolio-placeholder";

        placeholder.textContent =
          "VIDEO";

        visual.appendChild(
          placeholder
        );

      }


    /* =========================
       写真
    ========================== */

    } else if (
      item.image_url
    ) {

      const img =
        document.createElement(
          "img"
        );

      img.src =
        item.image_url;

      img.alt =
        item.title || "";

      visual.appendChild(
        img
      );


    } else {

      const placeholder =
        document.createElement(
          "div"
        );

      placeholder.className =
        "portfolio-placeholder";

      placeholder.textContent =
        "PHOTO";

      visual.appendChild(
        placeholder
      );

    }


    card.appendChild(
      visual
    );


    /* =========================
       作品情報
    ========================== */

    const meta =
      document.createElement(
        "div"
      );

    meta.className =
      "portfolio-meta";


    const category =
      document.createElement(
        "p"
      );

    category.className =
      "portfolio-category";

    category.textContent =
      item.category ||
      (
        item.media_type ===
        "video"
          ? "FILM"
          : "PHOTOGRAPHY"
      );

    meta.appendChild(
      category
    );


    const title =
      document.createElement(
        "h3"
      );

    title.textContent =
      item.title || "";

    meta.appendChild(
      title
    );


    if (
      item.description
    ) {

      const description =
        document.createElement(
          "p"
        );

      description.className =
        "portfolio-description";

      description.textContent =
        item.description;

      meta.appendChild(
        description
      );

    }


    card.appendChild(
      meta
    );


    list.appendChild(
      card
    );

  });

}


/* ========================================
   YouTube / Vimeo URL
======================================== */

function getDirectVideoUrl(
  videoUrl
) {

  if (!videoUrl) {
    return null;
  }


  try {

    const url =
      new URL(videoUrl);


    const isSupabaseVideo =
      url.hostname ===
        "cshieomhxpuaclggicle.supabase.co" &&
      url.pathname.includes(
        "/portfolio-videos/"
      );


    const isVideoFile =
      /\.(mp4|webm)$/i.test(
        url.pathname
      );


    if (
      isSupabaseVideo &&
      isVideoFile
    ) {

      return url.href;

    }


  } catch {

    return null;

  }


  return null;

}

function getSafeVideoEmbedUrl(
  videoUrl
) {

  if (!videoUrl) {
    return null;
  }


  let url;


  try {

    url =
      new URL(videoUrl);

  } catch {

    return null;

  }


  const hostname =
    url.hostname
      .toLowerCase()
      .replace(/^www\./, "");


  /* YouTube */

  if (
    hostname ===
    "youtube.com" ||
    hostname ===
    "m.youtube.com"
  ) {

    let videoId = null;


    if (
      url.pathname ===
      "/watch"
    ) {

      videoId =
        url.searchParams.get(
          "v"
        );

    } else if (
      url.pathname.startsWith(
        "/shorts/"
      )
    ) {

      videoId =
        url.pathname
          .split("/")[2];

    } else if (
      url.pathname.startsWith(
        "/embed/"
      )
    ) {

      videoId =
        url.pathname
          .split("/")[2];

    }


    if (
      isValidYouTubeId(
        videoId
      )
    ) {

      return (
        "https://www.youtube-nocookie.com/embed/" +
        videoId
      );

    }

  }


  /* youtu.be */

  if (
    hostname ===
    "youtu.be"
  ) {

    const videoId =
      url.pathname
        .replace("/", "")
        .split("/")[0];


    if (
      isValidYouTubeId(
        videoId
      )
    ) {

      return (
        "https://www.youtube-nocookie.com/embed/" +
        videoId
      );

    }

  }


  /* Vimeo */

  if (
    hostname ===
      "vimeo.com" ||
    hostname ===
      "player.vimeo.com"
  ) {

    const parts =
      url.pathname
        .split("/")
        .filter(Boolean);


    const videoId =
      parts.find(
        (part) =>
          /^\d+$/.test(part)
      );


    if (videoId) {

      return (
        "https://player.vimeo.com/video/" +
        videoId
      );

    }

  }


  return null;
}


/* ========================================
   YouTube ID確認
======================================== */

function isValidYouTubeId(
  videoId
) {

  return (
    typeof videoId ===
      "string" &&
    /^[A-Za-z0-9_-]{11}$/.test(
      videoId
    )
  );

}

/* ========================================
   News
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
        {
          ascending: false
        }
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


  if (
    !data ||
    data.length === 0
  ) {

    const empty =
      document.createElement(
        "p"
      );


    empty.className =
      "public-empty";


    empty.textContent =
      "現在お知らせはありません。";


    newsList.appendChild(
      empty
    );


    return;
  }


  data.forEach(
    (news) => {

      const div =
        document.createElement(
          "article"
        );


      div.className =
        "news";


      const title =
        document.createElement(
          "h3"
        );


      title.textContent =
        news.title || "";


      div.appendChild(
        title
      );


      if (news.image_url) {

        const img =
          document.createElement(
            "img"
          );


        img.src =
          news.image_url;


        img.alt =
          news.title ||
          "お知らせ画像";


        div.appendChild(
          img
        );

      }


      const content =
        document.createElement(
          "p"
        );


      content.textContent =
        news.content || "";


      div.appendChild(
        content
      );


      newsList.appendChild(
        div
      );

    }
  );
}


/* ========================================
   Not Found
======================================== */

function showCompanyNotFound() {

  const main =
    document.querySelector(
      "main"
    );


  if (!main) {
    return;
  }


  main.replaceChildren();


  const message =
    document.createElement(
      "p"
    );


  message.textContent =
    "ページが見つかりませんでした。";


  message.style.textAlign =
    "center";


  message.style.padding =
    "80px 20px";


  main.appendChild(
    message
  );
}


/* ========================================
   共通
======================================== */

function setText(
  id,
  value
) {

  const element =
    document.getElementById(
      id
    );


  if (element) {
    element.textContent =
      value;
  }
}