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


/* ========================================
   初期化
======================================== */

async function initMenuPage() {

  const company =
    await loadCompany();


  if (!company) {
    return;
  }


  await loadFullMenu();

}


initMenuPage();


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

async function loadCompany() {

  const slug =
    getCompanySlug();


  const { data, error } =
    await supabaseClient
      .from("company_info")
      .select("*")
      .eq("slug", slug)
      .single();


  if (
    error ||
    !data
  ) {

    console.error(
      "会社情報取得エラー:",
      error
    );


    showNotFound();

    return null;

  }


  if (
    data.business_type !==
    "restaurant"
  ) {

    showNotFound();

    return null;

  }


  currentCompany =
    data;


  renderCompany(
    data
  );


  return data;

}


/* ========================================
   会社表示
======================================== */

function renderCompany(
  company
) {

  setText(
    "menuCompanyName",
    company.name || ""
  );


  setText(
    "menuFooterCompanyName",
    company.name || ""
  );


  setText(
  "menuCompanyDescription",
  company.menu_description ||
    "季節の食材を使った料理を、ゆっくりお楽しみください。"
);


  document.title =
    `${company.name || "Restaurant"} | MENU`;


  const homeUrl =
    `site.html?company=${encodeURIComponent(
      company.slug
    )}`;


  const homeLink =
    document.getElementById(
      "menuHomeLink"
    );


  const footerHomeLink =
    document.getElementById(
      "menuFooterHomeLink"
    );


  if (homeLink) {
    homeLink.href =
      homeUrl;
  }


  if (footerHomeLink) {
    footerHomeLink.href =
      homeUrl;
  }


  document.body.dataset.theme =
    company.theme ||
    "default";

}


/* ========================================
   メニュー取得
======================================== */

async function loadFullMenu() {

  if (!currentCompany?.id) {
    return;
  }


  const { data, error } =
    await supabaseClient
      .from("menu_items")
      .select("*")
      .eq(
        "company_id",
        currentCompany.id
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
      "メニュー取得エラー:",
      error
    );


    return;

  }


  renderMenu(
    data || []
  );

}


/* ========================================
   メニュー表示
======================================== */

function renderMenu(
  items
) {

  const list =
    document.getElementById(
      "fullMenuList"
    );


  const nav =
    document.getElementById(
      "menuCategoryNav"
    );


  if (
    !list ||
    !nav
  ) {

    return;

  }


  list.replaceChildren();

  nav.replaceChildren();


  if (
    items.length === 0
  ) {

    const empty =
      document.createElement(
        "p"
      );


    empty.className =
      "menu-empty";


    empty.textContent =
      "現在メニューを準備中です。";


    list.appendChild(
      empty
    );


    return;

  }


  const grouped =
    groupByCategory(
      items
    );


  Object.entries(grouped)
  .sort(([categoryA], [categoryB]) => {

    const indexA =
      MENU_CATEGORY_ORDER.indexOf(
        categoryA
      );

    const indexB =
      MENU_CATEGORY_ORDER.indexOf(
        categoryB
      );


    const orderA =
      indexA === -1
        ? 999
        : indexA;


    const orderB =
      indexB === -1
        ? 999
        : indexB;


    return orderA - orderB;

  })
  .forEach(
    (
      [
        category,
        categoryItems
      ],
      index
    ) => {

      const sectionId =
        `category-${index}`;


      /* カテゴリナビ */

      const navLink =
        document.createElement(
          "a"
        );


      navLink.href =
        `#${sectionId}`;


      navLink.textContent =
        category;


      nav.appendChild(
        navLink
      );


      /* カテゴリ */

      const section =
        document.createElement(
          "section"
        );


      section.className =
        "menu-category-section";


      section.id =
        sectionId;


      const heading =
        document.createElement(
          "div"
        );


      heading.className =
        "menu-category-heading";


      const label =
        document.createElement(
          "p"
        );


      label.textContent =
        "MENU";


      const title =
        document.createElement(
          "h2"
        );


      title.textContent =
        category;


      heading.append(
        label,
        title
      );


      section.appendChild(
        heading
      );


      const grid =
        document.createElement(
          "div"
        );


      grid.className =
        "full-menu-grid";


      categoryItems.forEach(
        (item) => {

          grid.appendChild(
            createMenuCard(
              item
            )
          );

        }
      );


      section.appendChild(
        grid
      );


      list.appendChild(
        section
      );

    }
  );

}


/* ========================================
   カード
======================================== */

function createMenuCard(
  item
) {

  const article =
    document.createElement(
      "article"
    );


  article.className =
    "full-menu-card";


  if (
    item.image_url
  ) {

    const imageWrap =
      document.createElement(
        "div"
      );


    imageWrap.className =
      "full-menu-image-wrap";


    const image =
      document.createElement(
        "img"
      );


    image.src =
      item.image_url;


    image.alt =
      item.name || "";


    image.loading =
      "lazy";


    imageWrap.appendChild(
      image
    );


    if (
      item.is_sold_out
    ) {

      const soldOut =
        document.createElement(
          "span"
        );


      soldOut.className =
        "menu-soldout";


      soldOut.textContent =
        "SOLD OUT";


      imageWrap.appendChild(
        soldOut
      );

    }


    article.appendChild(
      imageWrap
    );

  }


  const body =
    document.createElement(
      "div"
    );


  body.className =
    "full-menu-body";


  if (
    item.is_recommended
  ) {

    const recommended =
      document.createElement(
        "p"
      );


    recommended.className =
      "menu-recommended";


    recommended.textContent =
      "RECOMMENDED";


    body.appendChild(
      recommended
    );

  }


  const titleRow =
    document.createElement(
      "div"
    );


  titleRow.className =
    "menu-title-row";


  const title =
    document.createElement(
      "h3"
    );


  title.textContent =
    item.name || "";


  const price =
    document.createElement(
      "p"
    );


  price.className =
    "menu-price";


  price.textContent =
    `¥${Number(
      item.price || 0
    ).toLocaleString()}`;


  titleRow.append(
    title,
    price
  );


  body.appendChild(
    titleRow
  );


  if (
    item.description
  ) {

    const description =
      document.createElement(
        "p"
      );


    description.className =
      "menu-description";


    description.textContent =
      item.description;


    body.appendChild(
      description
    );

  }


  article.appendChild(
    body
  );


  return article;

}


/* ========================================
   カテゴリ分け
======================================== */

const MENU_CATEGORY_ORDER = [
  "メイン",
  "パスタ",
  "ライス",
  "サイド",
  "ドリンク",
  "デザート",
  "その他"
];

function groupByCategory(
  items
) {

  const groups = {};


  items.forEach(
    (item) => {

      const category =
        item.category?.trim() ||
        "その他";


      if (!groups[category]) {

        groups[category] =
          [];

      }


      groups[category].push(
        item
      );

    }
  );


  return groups;

}


/* ========================================
   Not found
======================================== */

function showNotFound() {

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


  message.className =
    "menu-empty";


  message.textContent =
    "メニューページが見つかりませんでした。";


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