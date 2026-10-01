const SUPABASE_URL = "https://cshieomhxpuaclggicle.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_6mt_8wZcBX9aKPR04NzNBQ_StAq2Qbe";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

let currentCompanyId = null;
let currentCompany = null;
let menuItems = [];
let newsItems = [];


/* ========================================
   初期化
======================================== */

document.addEventListener("DOMContentLoaded", init);

async function init() {
  const session = await requireSession();

  if (!session) {
    return;
  }

  const companyId = await resolveCompanyId(session.user.id);

  if (!companyId) {
    alert("管理できる店舗が設定されていません。");
    return;
  }

  currentCompanyId = companyId;

  bindEvents();

  await Promise.all([
    loadCompanyInfo(),
    loadMenuItems(),
    loadNews()
  ]);
}


async function requireSession() {
  const {
    data: { session },
    error
  } = await supabaseClient.auth.getSession();

  if (error) {
    console.error(error);
  }

  if (!session) {
    window.location.href = "login.html";
    return null;
  }

  return session;
}


async function resolveCompanyId(userId) {
  const { data, error } = await supabaseClient
    .from("company_members")
    .select("company_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("店舗所属情報の取得エラー:", error);
    return null;
  }

  return data?.company_id ?? null;
}


/* ========================================
   イベント
======================================== */

function bindEvents() {
  document
    .getElementById("logoutButton")
    .addEventListener("click", logout);

  document
    .getElementById("editHeroImageButton")
    .addEventListener("click", () => {
      document.getElementById("heroImageInput").click();
    });

  document
    .getElementById("heroImageInput")
    .addEventListener("change", handleHeroImageChange);

  document
    .querySelectorAll("[data-company-field]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        openCompanyModal(button.dataset.companyField);
      });
    });

  document
    .getElementById("saveCompanyInfo")
    .addEventListener("click", saveCompanyInfo);

  document
    .getElementById("addMenuQuickButton")
    .addEventListener("click", () => openMenuModal());

  document
    .getElementById("saveMenuButton")
    .addEventListener("click", saveMenuItem);

  document
    .getElementById("deleteMenuButton")
    .addEventListener("click", deleteCurrentMenuItem);

  document
    .getElementById("addNewsQuickButton")
    .addEventListener("click", () => openNewsModal());

  document
    .getElementById("saveNewsButton")
    .addEventListener("click", saveNewsItem);

  document
    .getElementById("deleteNewsButton")
    .addEventListener("click", deleteCurrentNewsItem);

  document
    .querySelectorAll("[data-close-modal]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        closeModal(button.dataset.closeModal);
      });
    });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      document.querySelectorAll(".modal.open").forEach((modal) => {
        closeModal(modal.id);
      });
    }
  });
}


async function logout() {
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    console.error(error);
    showToast("ログアウトに失敗しました");
    return;
  }

  window.location.href = "login.html";
}


/* ========================================
   店舗情報
======================================== */

async function loadCompanyInfo() {
  const { data, error } = await supabaseClient
    .from("company_info")
    .select("*")
    .eq("id", currentCompanyId)
    .single();

  if (error) {
    console.error(error);
    showToast("店舗情報を読み込めませんでした");
    return;
  }

  currentCompany = data;
  renderCompanyInfo();
}


function renderCompanyInfo() {
  if (!currentCompany) {
    return;
  }

  setText("editorCompanyName", currentCompany.name || "店舗名");
  setText("editorCompanyAddress", currentCompany.address || "住所");
  setText(
    "editorCompanyDescription",
    currentCompany.description || "店舗紹介文を入力してください"
  );

  setText("editorInfoAddress", currentCompany.address || "-");
  setText("editorInfoPhone", currentCompany.phone || "-");
  setText("editorInfoHours", currentCompany.business_hours || "-");
  setText("editorInfoClosedDays", currentCompany.closed_days || "-");
  setText(
    "editorInfoInstagram",
    currentCompany.instagram_url ? "設定済み" : "未設定"
  );

  const hero = document.getElementById("editorHero");

  if (currentCompany.hero_image_url) {
    hero.style.backgroundImage =
      `linear-gradient(rgba(31,24,19,.40), rgba(31,24,19,.40)), ` +
      `url("${escapeCssUrl(currentCompany.hero_image_url)}")`;
  } else {
    hero.style.backgroundImage =
      "linear-gradient(rgba(31,24,19,.40), rgba(31,24,19,.40)), " +
      "linear-gradient(135deg, #86776b, #3c342e)";
  }

  fillCompanyForm();
}


function fillCompanyForm() {
  if (!currentCompany) {
    return;
  }

  document.getElementById("companyName").value =
    currentCompany.name ?? "";

  document.getElementById("companyAddress").value =
    currentCompany.address ?? "";

  document.getElementById("companyDescription").value =
    currentCompany.description ?? "";

  document.getElementById("companyPhone").value =
    currentCompany.phone ?? "";

  document.getElementById("companyHours").value =
    currentCompany.business_hours ?? "";

  document.getElementById("companyClosedDays").value =
    currentCompany.closed_days ?? "";

  document.getElementById("companyInstagram").value =
    currentCompany.instagram_url ?? "";
}


function openCompanyModal(fieldToFocus = "") {
  fillCompanyForm();
  openModal("companyModal");

  const fieldMap = {
    name: "companyName",
    address: "companyAddress",
    description: "companyDescription",
    phone: "companyPhone",
    business_hours: "companyHours",
    closed_days: "companyClosedDays",
    instagram_url: "companyInstagram"
  };

  const elementId = fieldMap[fieldToFocus];

  if (elementId) {
    setTimeout(() => {
      document.getElementById(elementId)?.focus();
    }, 150);
  }
}


async function saveCompanyInfo() {
  const button = document.getElementById("saveCompanyInfo");

  const name =
    document.getElementById("companyName").value.trim();

  const address =
    document.getElementById("companyAddress").value.trim();

  const description =
    document.getElementById("companyDescription").value.trim();

  const phone =
    document.getElementById("companyPhone").value.trim();

  const businessHours =
    document.getElementById("companyHours").value.trim();

  const closedDays =
    document.getElementById("companyClosedDays").value.trim();

  const instagramUrl =
    document.getElementById("companyInstagram").value.trim();

  if (!name) {
    alert("店舗名を入力してください。");
    return;
  }

  if (phone && !/^[0-9+\-() ]+$/.test(phone)) {
    alert("電話番号を確認してください。");
    return;
  }

  if (
    instagramUrl &&
    !/^https:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._]+\/?$/i.test(instagramUrl)
  ) {
    alert("InstagramのプロフィールURLを確認してください。");
    return;
  }

  setBusy(button, true, "保存中...");

  const values = {
    name,
    address,
    description,
    phone,
    business_hours: businessHours,
    closed_days: closedDays,
    instagram_url: instagramUrl,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabaseClient
    .from("company_info")
    .update(values)
    .eq("id", currentCompanyId)
    .select()
    .single();

  setBusy(button, false, "保存する");

  if (error) {
    console.error(error);
    alert("店舗情報の保存に失敗しました。");
    return;
  }

  currentCompany = data;
  renderCompanyInfo();
  closeModal("companyModal");
  showToast("店舗情報を保存しました");
}


async function handleHeroImageChange(event) {
  const input = event.currentTarget;
  const file = input.files?.[0];

  if (!file) {
    return;
  }

  if (!validateImage(file)) {
    input.value = "";
    return;
  }

  const button = document.getElementById("editHeroImageButton");
  setBusy(button, true, "変更中...");

  const oldUrl = currentCompany?.hero_image_url || null;

  try {
    const imageUrl = await uploadImage(file, "hero");

    const { data, error } = await supabaseClient
      .from("company_info")
      .update({
        hero_image_url: imageUrl,
        updated_at: new Date().toISOString()
      })
      .eq("id", currentCompanyId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    currentCompany = data;
    renderCompanyInfo();

    if (oldUrl && oldUrl !== imageUrl) {
      await removeStorageFileByPublicUrl(oldUrl);
    }

    showToast("トップ画像を変更しました");
  } catch (error) {
    console.error(error);
    alert("トップ画像の変更に失敗しました。");
  } finally {
    input.value = "";
    setBusy(button, false, "📷 画像を変更");
  }
}


/* ========================================
   メニュー
======================================== */

async function loadMenuItems() {
  const { data, error } = await supabaseClient
    .from("menu_items")
    .select("*")
    .eq("company_id", currentCompanyId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    showToast("メニューを読み込めませんでした");
    return;
  }

  menuItems = data ?? [];
  renderMenuItems();
}


function renderMenuItems() {
  const list = document.getElementById("visualMenuList");
  list.replaceChildren();

  if (menuItems.length === 0) {
    list.appendChild(createEmptyState("まだメニューがありません"));
    return;
  }

  menuItems.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "editor-menu-card";
    button.addEventListener("click", () => openMenuModal(item.id));

    if (item.image_url) {
      const image = document.createElement("img");
      image.className = "editor-menu-image";
      image.src = item.image_url;
      image.alt = item.name || "";
      button.appendChild(image);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "editor-menu-placeholder";
      placeholder.textContent = "写真を追加";
      button.appendChild(placeholder);
    }

    const meta = document.createElement("div");
    meta.className = "editor-menu-meta";

    const category = document.createElement("p");
    category.className = "editor-menu-category";
    category.textContent = item.category || "その他";
    meta.appendChild(category);

    const title = document.createElement("h3");
    title.textContent = item.name || "";
    meta.appendChild(title);

    const description = document.createElement("p");
    description.className = "editor-menu-description";
    description.textContent = item.description || "";
    meta.appendChild(description);

    const price = document.createElement("p");
    price.className = "editor-menu-price";
    price.textContent = `¥${Number(item.price || 0).toLocaleString()}`;
    meta.appendChild(price);

    const badgeRow = document.createElement("div");
    badgeRow.className = "badge-row";

    if (item.is_recommended) {
      badgeRow.appendChild(createBadge("⭐ おすすめ"));
    }

    if (item.is_sold_out) {
      badgeRow.appendChild(createBadge("売り切れ", "soldout"));
    }

    if (item.is_visible === false) {
      badgeRow.appendChild(createBadge("非公開", "hidden-item"));
    }

    if (badgeRow.childElementCount > 0) {
      meta.appendChild(badgeRow);
    }

    button.appendChild(meta);
    list.appendChild(button);
  });
}


function openMenuModal(itemId = null) {
  resetMenuForm();

  const title = document.getElementById("menuModalTitle");
  const deleteButton = document.getElementById("deleteMenuButton");
  const saveButton = document.getElementById("saveMenuButton");

  if (!itemId) {
    title.textContent = "メニューを追加";
    deleteButton.hidden = true;
    saveButton.textContent = "追加する";
    openModal("menuModal");
    return;
  }

  const item = menuItems.find(
    (menuItem) => String(menuItem.id) === String(itemId)
  );

  if (!item) {
    return;
  }

  document.getElementById("menuEditId").value = item.id;
  document.getElementById("menuName").value = item.name ?? "";
  document.getElementById("menuDescription").value =
    item.description ?? "";
  document.getElementById("menuPrice").value = item.price ?? "";
  document.getElementById("menuSortOrder").value =
    item.sort_order ?? 0;
  document.getElementById("menuCategory").value =
    item.category ?? "その他";
  document.getElementById("menuRecommended").checked =
    item.is_recommended ?? false;
  document.getElementById("menuSoldOut").checked =
    item.is_sold_out ?? false;
  document.getElementById("menuVisible").checked =
    item.is_visible ?? true;

  title.textContent = "メニューを編集";
  deleteButton.hidden = false;
  saveButton.textContent = "変更を保存";

  openModal("menuModal");
}


function resetMenuForm() {
  document.getElementById("menuEditId").value = "";
  document.getElementById("menuName").value = "";
  document.getElementById("menuDescription").value = "";
  document.getElementById("menuPrice").value = "";
  document.getElementById("menuSortOrder").value = "";
  document.getElementById("menuCategory").value = "";
  document.getElementById("menuRecommended").checked = false;
  document.getElementById("menuSoldOut").checked = false;
  document.getElementById("menuVisible").checked = true;
  document.getElementById("menuImage").value = "";
}


async function saveMenuItem() {
  const button = document.getElementById("saveMenuButton");
  const editId = document.getElementById("menuEditId").value;

  const name =
    document.getElementById("menuName").value.trim();

  const description =
    document.getElementById("menuDescription").value.trim();

  const priceText =
    document.getElementById("menuPrice").value.trim();

  const sortText =
    document.getElementById("menuSortOrder").value.trim();

  const category =
    document.getElementById("menuCategory").value.trim();

  const isRecommended =
    document.getElementById("menuRecommended").checked;

  const isSoldOut =
    document.getElementById("menuSoldOut").checked;

  const isVisible =
    document.getElementById("menuVisible").checked;

  const imageFile =
    document.getElementById("menuImage").files?.[0];

  if (!name || !priceText) {
    alert("メニュー名と価格を入力してください。");
    return;
  }

  const price = Number(priceText);
  const sortOrder = Number(sortText || 0);

  if (!Number.isInteger(price) || price <= 0) {
    alert("価格は1円以上の整数で入力してください。");
    return;
  }

  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    alert("並び順は0以上の整数で入力してください。");
    return;
  }

  if (imageFile && !validateImage(imageFile)) {
    return;
  }

  setBusy(button, true, editId ? "保存中..." : "追加中...");

  const existingItem = editId
    ? menuItems.find((item) => String(item.id) === String(editId))
    : null;

  let imageUrl = existingItem?.image_url ?? null;
  let newImageUrl = null;

  try {
    if (imageFile) {
      newImageUrl = await uploadImage(imageFile, "menu");
      imageUrl = newImageUrl;
    }

    const values = {
      name,
      description,
      price,
      sort_order: sortOrder,
      category: category || "その他",
      is_recommended: isRecommended,
      is_sold_out: isSoldOut,
      is_visible: isVisible,
      image_url: imageUrl,
      company_id: currentCompanyId
    };

    let error = null;

    if (editId) {
      const result = await supabaseClient
        .from("menu_items")
        .update(values)
        .eq("id", editId)
        .eq("company_id", currentCompanyId);

      error = result.error;
    } else {
      const result = await supabaseClient
        .from("menu_items")
        .insert([values]);

      error = result.error;
    }

    if (error) {
      throw error;
    }

    if (
      imageFile &&
      existingItem?.image_url &&
      existingItem.image_url !== newImageUrl
    ) {
      await removeStorageFileByPublicUrl(existingItem.image_url);
    }

    closeModal("menuModal");
    showToast(editId ? "メニューを変更しました" : "メニューを追加しました");
    await loadMenuItems();
  } catch (error) {
    console.error(error);
    alert("メニューの保存に失敗しました。");
  } finally {
    setBusy(button, false, editId ? "変更を保存" : "追加する");
  }
}


async function deleteCurrentMenuItem() {
  const editId = document.getElementById("menuEditId").value;

  if (!editId) {
    return;
  }

  const item = menuItems.find(
    (menuItem) => String(menuItem.id) === String(editId)
  );

  const ok = confirm(`「${item?.name || "このメニュー"}」を削除しますか？`);

  if (!ok) {
    return;
  }

  const button = document.getElementById("deleteMenuButton");
  setBusy(button, true, "削除中...");

  const { error } = await supabaseClient
    .from("menu_items")
    .delete()
    .eq("id", editId)
    .eq("company_id", currentCompanyId);

  if (error) {
    console.error(error);
    setBusy(button, false, "削除");
    alert("メニューの削除に失敗しました。");
    return;
  }

  if (item?.image_url) {
    await removeStorageFileByPublicUrl(item.image_url);
  }

  setBusy(button, false, "削除");
  closeModal("menuModal");
  showToast("メニューを削除しました");
  await loadMenuItems();
}


/* ========================================
   お知らせ
======================================== */

async function loadNews() {
  const { data, error } = await supabaseClient
    .from("news")
    .select("*")
    .eq("company_id", currentCompanyId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    showToast("お知らせを読み込めませんでした");
    return;
  }

  newsItems = data ?? [];
  renderNews();
}


function renderNews() {
  const list = document.getElementById("visualNewsList");
  list.replaceChildren();

  if (newsItems.length === 0) {
    list.appendChild(createEmptyState("まだお知らせがありません"));
    return;
  }

  newsItems.forEach((news) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "editor-news-card";

    if (!news.image_url) {
  button.classList.add("no-image");
}

    button.addEventListener("click", () => openNewsModal(news.id));

    if (news.image_url) {
      const image = document.createElement("img");
      image.className = "editor-news-image";
      image.src = news.image_url;
      image.alt = "";
      button.appendChild(image);
    }

    const body = document.createElement("div");

    const date = document.createElement("p");
    date.className = "editor-news-date";
    date.textContent = formatDate(news.created_at);
    body.appendChild(date);

    const title = document.createElement("h3");
    title.textContent = news.title || "";
    body.appendChild(title);

    const content = document.createElement("p");
    content.className = "editor-news-content";
    content.textContent = news.content || "";
    body.appendChild(content);

    button.appendChild(body);
    list.appendChild(button);
  });
}


function openNewsModal(newsId = null) {
  resetNewsForm();

  const title = document.getElementById("newsModalTitle");
  const deleteButton = document.getElementById("deleteNewsButton");
  const saveButton = document.getElementById("saveNewsButton");

  if (!newsId) {
    title.textContent = "お知らせを追加";
    deleteButton.hidden = true;
    saveButton.textContent = "公開する";
    openModal("newsModal");
    return;
  }

  const news = newsItems.find(
    (item) => String(item.id) === String(newsId)
  );

  if (!news) {
    return;
  }

  document.getElementById("newsEditId").value = news.id;
  document.getElementById("newsTitle").value = news.title ?? "";
  document.getElementById("newsContent").value = news.content ?? "";

  title.textContent = "お知らせを編集";
  deleteButton.hidden = false;
  saveButton.textContent = "変更を保存";

  openModal("newsModal");
}


function resetNewsForm() {
  document.getElementById("newsEditId").value = "";
  document.getElementById("newsTitle").value = "";
  document.getElementById("newsContent").value = "";
  document.getElementById("newsImage").value = "";
}


async function saveNewsItem() {
  const button = document.getElementById("saveNewsButton");
  const editId = document.getElementById("newsEditId").value;

  const title =
    document.getElementById("newsTitle").value.trim();

  const content =
    document.getElementById("newsContent").value.trim();

  const imageFile =
    document.getElementById("newsImage").files?.[0];

  if (!title || !content) {
    alert("タイトルと内容を入力してください。");
    return;
  }

  if (imageFile && !validateImage(imageFile)) {
    return;
  }

  setBusy(button, true, editId ? "保存中..." : "公開中...");

  const existingNews = editId
    ? newsItems.find((item) => String(item.id) === String(editId))
    : null;

  let imageUrl = existingNews?.image_url ?? null;
  let newImageUrl = null;

  try {
    if (imageFile) {
      newImageUrl = await uploadImage(imageFile, "news");
      imageUrl = newImageUrl;
    }

    let error = null;

    if (editId) {
      const result = await supabaseClient
        .from("news")
        .update({
          title,
          content,
          image_url: imageUrl
        })
        .eq("id", editId)
        .eq("company_id", currentCompanyId);

      error = result.error;
    } else {
      const result = await supabaseClient
        .from("news")
        .insert([
          {
            title,
            content,
            image_url: imageUrl,
            company_id: currentCompanyId
          }
        ]);

      error = result.error;
    }

    if (error) {
      throw error;
    }

    if (
      imageFile &&
      existingNews?.image_url &&
      existingNews.image_url !== newImageUrl
    ) {
      await removeStorageFileByPublicUrl(existingNews.image_url);
    }

    closeModal("newsModal");
    showToast(editId ? "お知らせを変更しました" : "お知らせを公開しました");
    await loadNews();
  } catch (error) {
    console.error(error);
    alert("お知らせの保存に失敗しました。");
  } finally {
    setBusy(button, false, editId ? "変更を保存" : "公開する");
  }
}


async function deleteCurrentNewsItem() {
  const editId = document.getElementById("newsEditId").value;

  if (!editId) {
    return;
  }

  const news = newsItems.find(
    (item) => String(item.id) === String(editId)
  );

  const ok = confirm(`「${news?.title || "このお知らせ"}」を削除しますか？`);

  if (!ok) {
    return;
  }

  const button = document.getElementById("deleteNewsButton");
  setBusy(button, true, "削除中...");

  const { error } = await supabaseClient
    .from("news")
    .delete()
    .eq("id", editId)
    .eq("company_id", currentCompanyId);

  if (error) {
    console.error(error);
    setBusy(button, false, "削除");
    alert("お知らせの削除に失敗しました。");
    return;
  }

  if (news?.image_url) {
    await removeStorageFileByPublicUrl(news.image_url);
  }

  setBusy(button, false, "削除");
  closeModal("newsModal");
  showToast("お知らせを削除しました");
  await loadNews();
}


/* ========================================
   Storage
======================================== */

function validateImage(file) {
  if (!file.type.startsWith("image/")) {
    alert("画像ファイルを選んでください。");
    return false;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert("画像は5MB以下のものを選んでください。");
    return false;
  }

  return true;
}


async function uploadImage(file, prefix) {
  const extension =
    file.name.split(".").pop()?.toLowerCase() || "jpg";

  const fileName =
    `company-${currentCompanyId}/${prefix}-${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const { error } = await supabaseClient.storage
    .from("news-images")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false
    });

  if (error) {
    throw error;
  }

  const { data } = supabaseClient.storage
    .from("news-images")
    .getPublicUrl(fileName);

  return data.publicUrl;
}


async function removeStorageFileByPublicUrl(url) {
  try {
    if (!url || !url.includes("/news-images/")) {
      return;
    }

    const path = decodeURIComponent(
      url.split("/news-images/")[1].split("?")[0]
    );

    if (!path) {
      return;
    }

    const { error } = await supabaseClient.storage
      .from("news-images")
      .remove([path]);

    if (error) {
      console.warn("画像削除:", error);
    }
  } catch (error) {
    console.warn("画像削除処理:", error);
  }
}


/* ========================================
   UI helpers
======================================== */

function openModal(id) {
  const modal = document.getElementById(id);

  if (!modal) {
    return;
  }

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}


function closeModal(id) {
  const modal = document.getElementById(id);

  if (!modal) {
    return;
  }

  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");

  if (!document.querySelector(".modal.open")) {
    document.body.style.overflow = "";
  }
}


function setBusy(button, busy, text) {
  button.disabled = busy;
  button.textContent = text;
}


function setText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}


function showToast(message) {
  const toast = document.getElementById("toastMessage");

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2400);
}


function createEmptyState(message) {
  const element = document.createElement("div");
  element.className = "empty-state";
  element.textContent = message;
  return element;
}


function createBadge(text, className = "") {
  const badge = document.createElement("span");
  badge.className = `mini-badge ${className}`.trim();
  badge.textContent = text;
  return badge;
}


function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}


function escapeCssUrl(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "");
}