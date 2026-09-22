const SUPABASE_URL = "https://cshieomhxpuaclggicle.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_6mt_8wZcBX9aKPR04NzNBQ_StAq2Qbe";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

async function checkLogin() {
  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  if (!session) {
    alert("未ログインです");
    window.location.href = "login.html";
  } else {
    alert("ログイン中です");
  }
}

checkLogin();

async function addNews() {
  const publishButton = document.querySelector('button[onclick="addNews()"]');

publishButton.disabled = true;
publishButton.textContent = "公開中...";

  const title = document.getElementById("title").value.trim();
const content = document.getElementById("content").value.trim();
  const imageFile = document.getElementById("image").files[0];

  if (imageFile && imageFile.size > 5 * 1024 * 1024) {
  alert("お知らせ画像は5MB以下の画像を選んでください");

  publishButton.disabled = false;
  publishButton.textContent = "公開する";

  return;
}

  if (title === "" || content === "") {
  alert("タイトルと本文を入力してください");

  publishButton.disabled = false;
  publishButton.textContent = "公開する";

  return;
}

  let imageUrl = null;

  if (imageFile) {
    const extension = imageFile.name.split(".").pop();
const fileName = `${Date.now()}.${extension}`;

    const { error: uploadError } = await supabaseClient.storage
      .from("news-images")
      .upload(fileName, imageFile);

    if (uploadError) {
  console.error(uploadError);
  alert(uploadError.message);

  publishButton.disabled = false;
  publishButton.textContent = "公開する";

  return;
}

    const { data: publicUrlData } = supabaseClient.storage
      .from("news-images")
      .getPublicUrl(fileName);

    imageUrl = publicUrlData.publicUrl;
  }

  const { error } = await supabaseClient
    .from("news")
    .insert([
      {
        title: title,
        content: content,
        image_url: imageUrl
      }
    ]);

  if (error) {
  console.error(error);
  alert("保存に失敗しました");

  publishButton.disabled = false;
  publishButton.textContent = "公開する";

  return;
}

  document.getElementById("title").value = "";
  document.getElementById("content").value = "";
  document.getElementById("image").value = "";

  showToast("お知らせを公開しました！");

  loadNews();
  loadDashboardSummary();

  publishButton.disabled = false;
publishButton.textContent = "公開する";
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

  const newsList = document.getElementById("newsList");

  newsList.innerHTML = "";

  data.forEach((news) => {
  const div = document.createElement("div");

  div.className = "news";

  div.innerHTML = `
  <h3>${news.title}</h3>

  ${item.is_recommended ? '<p class="recommended-badge">⭐ おすすめ</p>' : ""}

  ${
    news.image_url
      ? `<img src="${news.image_url}" alt="お知らせ画像" style="width:100%; border-radius:8px; margin-bottom:12px;">`
      : ""
  }

  <p>${news.content}</p>

  <button onclick="editNews(${news.id})">編集</button>
  <button onclick="deleteNews(${news.id})">削除</button>
`;

  newsList.appendChild(div);
});
}


loadNews();

document
  .getElementById("logoutButton")
  .addEventListener("click", async () => {

    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      console.error(error);
      alert("ログアウトに失敗しました");
      return;
    }

    window.location.href = "login.html";
  });

  async function deleteNews(id) {
  const ok = confirm("このお知らせを削除しますか？");

  if (!ok) {
    return;
  }

  const { data: news, error: fetchError } = await supabaseClient
    .from("news")
    .select("image_url")
    .eq("id", id)
    .single();

  if (fetchError) {
    console.error(fetchError);
    alert("お知らせ情報の取得に失敗しました");
    return;
  }

  if (news.image_url) {
    const fileName = decodeURIComponent(
      news.image_url.split("/news-images/")[1]
    );

    if (fileName) {
      const { error: imageDeleteError } = await supabaseClient.storage
        .from("news-images")
        .remove([fileName]);

      if (imageDeleteError) {
        console.error(imageDeleteError);
        alert("画像の削除に失敗しました");
        return;
      }
    }
  }

  const { error } = await supabaseClient
    .from("news")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("お知らせの削除に失敗しました");
    return;
  }

  showToast("お知らせを削除しました！");
  loadNews();
  loadDashboardSummary();
}

async function editNews(id) {
  const { data, error } = await supabaseClient
    .from("news")
    .select("title, content")
    .eq("id", id)
    .single();

  if (error) {
    console.error(error);
    alert("お知らせの読み込みに失敗しました");
    return;
  }

  const newTitle = prompt("タイトルを編集してください", data.title);

  if (newTitle === null) {
    return;
  }

  const newContent = prompt("本文を編集してください", data.content);

  if (newContent === null) {
    return;
  }

  if (newTitle.trim() === "" || newContent.trim() === "") {
    alert("タイトルと本文は空欄にできません");
    return;
  }

  const { error: updateError } = await supabaseClient
    .from("news")
    .update({
      title: newTitle,
      content: newContent
    })
    .eq("id", id);

  if (updateError) {
    console.error(updateError);
    alert("編集に失敗しました");
    return;
  }

  showToast("お知らせを編集しました！");
  loadNews();
}

async function loadCompanyInfo() {
  const { data, error } = await supabaseClient
    .from("company_info")
    .select("*")
    .limit(1)
    .single();

  if (error) {
    console.error(error);
    alert("会社情報の読み込みに失敗しました");
    return;
  }

  document.getElementById("companyName").value = data.name ?? "";
document.getElementById("companyAddress").value = data.address ?? "";
document.getElementById("companyDescription").value = data.description ?? "";
document.getElementById("companyPhone").value = data.phone ?? "";
document.getElementById("companyInstagram").value = data.instagram_url ?? "";
  document.getElementById("companyHours").value = data.business_hours ?? "";
  document.getElementById("companyClosedDays").value = data.closed_days ?? "";
}

loadCompanyInfo();

document
  .getElementById("saveCompanyInfo")
  .addEventListener("click", async () => {

    const saveButton = document.getElementById("saveCompanyInfo");
    saveButton.disabled = true;
    saveButton.textContent = "保存中...";

    const name = document.getElementById("companyName").value.trim();
const address = document.getElementById("companyAddress").value.trim();
const description = document.getElementById("companyDescription").value.trim();
const phone = document.getElementById("companyPhone").value.trim();
const instagramUrl = document.getElementById("companyInstagram").value.trim();
const businessHours = document.getElementById("companyHours").value.trim();
const closedDays = document.getElementById("companyClosedDays").value.trim();

if (
  instagramUrl !== "" &&
  !/^https:\/\/www\.instagram\.com\/[A-Za-z0-9._]+\/?$/.test(instagramUrl)
) {
  alert("InstagramのプロフィールURLを正しく入力してください");

  saveButton.disabled = false;
  saveButton.textContent = "会社情報を保存";

  return;
}

if (
  phone !== "" &&
  !/^[0-9-]+$/.test(phone)
) {
  alert("電話番号は数字とハイフンだけで入力してください");

  saveButton.disabled = false;
  saveButton.textContent = "会社情報を保存";

  return;
}

if (name === "") {
  alert("会社名・店舗名を入力してください");

  saveButton.disabled = false;
  saveButton.textContent = "会社情報を保存";

  return;
}

    const heroImageFile = document.getElementById("heroImage").files[0];

    if (heroImageFile && heroImageFile.size > 5 * 1024 * 1024) {
  alert("トップ画像は5MB以下の画像を選んでください");

  saveButton.disabled = false;
  saveButton.textContent = "会社情報を保存";

  return;
}

    const { data: companyData, error: fetchError } = await supabaseClient
      .from("company_info")
      .select("id, hero_image_url")
      .limit(1)
      .single();

    if (fetchError) {
      console.error(fetchError);
      alert("会社情報の取得に失敗しました");

      saveButton.disabled = false;
saveButton.textContent = "会社情報を保存";

      return;
    }

    let heroImageUrl = companyData.hero_image_url;

    if (heroImageFile) {
      const extension = heroImageFile.name.split(".").pop();
      const fileName = `hero-${Date.now()}.${extension}`;

      const { error: uploadError } = await supabaseClient.storage
        .from("news-images")
        .upload(fileName, heroImageFile);

      if (uploadError) {
        console.error(uploadError);
        alert(uploadError.message);

        saveButton.disabled = false;
saveButton.textContent = "会社情報を保存";

        return;
      }

      const { data: publicUrlData } = supabaseClient.storage
        .from("news-images")
        .getPublicUrl(fileName);

      heroImageUrl = publicUrlData.publicUrl;
    }

    const { error } = await supabaseClient
      .from("company_info")
      .update({
  name: name,
  address: address,
  description: description,
  phone: phone,
  instagram_url: instagramUrl,
        business_hours: businessHours,
        closed_days: closedDays,
        hero_image_url: heroImageUrl,
        updated_at: new Date().toISOString()
      })
      .eq("id", companyData.id);

    if (error) {
      console.error(error);
      alert("会社情報の保存に失敗しました");

      saveButton.disabled = false;
saveButton.textContent = "会社情報を保存";

      return;
    }

    document.getElementById("heroImage").value = "";

    showToast("会社情報を保存しました！");

      loadDashboardSummary();

  saveButton.disabled = false;
saveButton.textContent = "会社情報を保存";
  });

  document
  .getElementById("addMenuButton")
  .addEventListener("click", async () => {

    const addMenuButton = document.getElementById("addMenuButton");
addMenuButton.disabled = true;
addMenuButton.textContent = "追加中...";

    const name = document.getElementById("menuName").value.trim();
const description = document.getElementById("menuDescription").value.trim();
const price = document.getElementById("menuPrice").value.trim();
const sortOrder = document.getElementById("menuSortOrder").value.trim();
const category = document.getElementById("menuCategory").value.trim();
const isRecommended = document.getElementById("menuRecommended").checked;
const isSoldOut = document.getElementById("menuSoldOut").checked;
    const imageFile = document.getElementById("menuImage").files[0];

    if (imageFile && imageFile.size > 5 * 1024 * 1024) {
  alert("メニュー画像は5MB以下の画像を選んでください");

  addMenuButton.disabled = false;
  addMenuButton.textContent = "メニューを追加";

  return;
}

    if (name === "" || price === "") {
  alert("メニュー名と価格を入力してください");

  addMenuButton.disabled = false;
  addMenuButton.textContent = "メニューを追加";

  return;
}

const priceNumber = Number(price);

if (!Number.isInteger(priceNumber) || priceNumber <= 0) {
  alert("価格は1円以上の整数で入力してください");

  addMenuButton.disabled = false;
  addMenuButton.textContent = "メニューを追加";

  return;
}

const sortOrderNumber = Number(sortOrder || 0);

if (!Number.isInteger(sortOrderNumber) || sortOrderNumber < 0) {
  alert("並び順は0以上の整数で入力してください");

  addMenuButton.disabled = false;
  addMenuButton.textContent = "メニューを追加";

  return;
}

    let imageUrl = null;

    if (imageFile) {
      const extension = imageFile.name.split(".").pop();
      const fileName = `menu-${Date.now()}.${extension}`;

      const { error: uploadError } = await supabaseClient.storage
        .from("news-images")
        .upload(fileName, imageFile);

      if (uploadError) {
  console.error(uploadError);
  alert(uploadError.message);

  addMenuButton.disabled = false;
  addMenuButton.textContent = "メニューを追加";

  return;
}

      const { data: publicUrlData } = supabaseClient.storage
        .from("news-images")
        .getPublicUrl(fileName);

      imageUrl = publicUrlData.publicUrl;
    }

    const { error } = await supabaseClient
      .from("menu_items")
    .insert([
  {
    name: name,
    description: description,
    price: Number(price),
    sort_order: sortOrderNumber,
    category: category || "その他",
    is_recommended: isRecommended,
    is_sold_out: isSoldOut,
    image_url: imageUrl
  }
]);

    if (error) {
  console.error(error);
  alert("メニューの保存に失敗しました");

  addMenuButton.disabled = false;
  addMenuButton.textContent = "メニューを追加";

  return;
}

    document.getElementById("menuName").value = "";
    document.getElementById("menuDescription").value = "";
    document.getElementById("menuPrice").value = "";
    document.getElementById("menuImage").value = "";

    showToast("メニューを追加しました！");
    loadMenuItems();
    loadDashboardSummary();

    addMenuButton.disabled = false;
addMenuButton.textContent = "メニューを追加";
  });

  async function loadMenuItems() {
  const { data, error } = await supabaseClient
  .from("menu_items")
  .select("*")
  .order("sort_order", { ascending: true })
  .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    alert("メニューの読み込みに失敗しました");
    return;
  }

  const menuList = document.getElementById("menuList");
  menuList.innerHTML = "";

  data.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  data.forEach((item) => {
    const div = document.createElement("div");

    div.className = "news";

    div.innerHTML = `
  <h3>${item.name}</h3>
  ${item.is_recommended ? "<p>⭐ おすすめ</p>" : ""}
  ${item.is_sold_out ? "<p>売り切れ</p>" : ""}
  <p>カテゴリ：${item.category ?? "その他"}</p>
  <p>並び順：${item.sort_order ?? 0}</p>

  ${
    item.image_url
      ? `<img src="${item.image_url}" alt="${item.name}" style="width:100%; border-radius:8px; margin-bottom:12px;">`
      : ""
  }

  <p>${item.description ?? ""}</p>
  <p><strong>¥${Number(item.price).toLocaleString()}</strong></p>

  <button onclick="editMenuItem(${item.id})">編集</button>
  <button onclick="deleteMenuItem(${item.id})">削除</button>
`;

    menuList.appendChild(div);
  });
}

loadMenuItems();

async function deleteMenuItem(id) {
  const ok = confirm("このメニューを削除しますか？");

  if (!ok) {
    return;
  }

  const { data: menuItem, error: fetchError } = await supabaseClient
    .from("menu_items")
    .select("image_url")
    .eq("id", id)
    .single();

  if (fetchError) {
    console.error(fetchError);
    alert("メニュー情報の取得に失敗しました");
    return;
  }

  if (menuItem.image_url) {
    const fileName = decodeURIComponent(
      menuItem.image_url.split("/news-images/")[1]
    );

    if (fileName) {
      const { error: imageDeleteError } = await supabaseClient.storage
        .from("news-images")
        .remove([fileName]);

      if (imageDeleteError) {
        console.error(imageDeleteError);
        alert("画像の削除に失敗しました");
        return;
      }
    }
  }

  const { error } = await supabaseClient
    .from("menu_items")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("メニューの削除に失敗しました");
    return;
  }

  showToast("メニューを削除しました！");
  loadMenuItems();
  loadDashboardSummary();
}

async function editMenuItem(id) {
  const newImageFile = await selectImageFile();
  const { data: item, error: fetchError } = await supabaseClient
    .from("menu_items")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError) {
    console.error(fetchError);
    alert("メニュー情報の取得に失敗しました");
    return;
  }

  const newName = prompt("メニュー名を編集してください", item.name);

  if (newName === null) {
    return;
  }

  const newDescription = prompt(
    "メニュー説明を編集してください",
    item.description ?? ""
  );

  if (newDescription === null) {
    return;
  }

  const newPrice = prompt(
    "価格を編集してください",
    item.price
  );

  const newSortOrder = prompt(
  "並び順を編集してください",
  item.sort_order ?? 0
);

if (newSortOrder === null) {
  return;
}

const newCategory = prompt(
  "カテゴリを編集してください",
  item.category ?? "その他"
);

if (newCategory === null) {
  return;
}

const newRecommended = confirm(
  item.is_recommended
    ? "おすすめを解除しますか？"
    : "おすすめにしますか？"
);

const newSoldOut = confirm(
  item.is_sold_out
    ? "売り切れを解除しますか？"
    : "売り切れにしますか？"
);

const sortOrderNumber = Number(newSortOrder);

if (!Number.isInteger(sortOrderNumber) || sortOrderNumber < 0) {
  alert("並び順は0以上の整数で入力してください");
  return;
}

  if (newPrice === null) {
    return;
  }

  if (newName.trim() === "" || newPrice.trim() === "") {
    alert("メニュー名と価格は空欄にできません");
    return;
  }


if (newImageFile && newImageFile.size > 5 * 1024 * 1024) {
  alert("メニュー画像は5MB以下の画像を選んでください");
  return;
}

let newImageUrl = item.image_url;

if (newImageFile) {
  const extension = newImageFile.name.split(".").pop();
  const fileName = `menu-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabaseClient.storage
    .from("news-images")
    .upload(fileName, newImageFile);

  if (uploadError) {
    console.error(uploadError);
    alert("画像のアップロードに失敗しました");
    return;
  }

  const { data: publicUrlData } = supabaseClient.storage
    .from("news-images")
    .getPublicUrl(fileName);

  newImageUrl = publicUrlData.publicUrl;
}

  const { error: updateError } = await supabaseClient
    .from("menu_items")
    .update({
  name: newName.trim(),
  description: newDescription.trim(),
  price: Number(newPrice),
  sort_order: Number(newSortOrder || 0),
  category: newCategory.trim() || "その他",
  is_recommended: newRecommended,
  is_sold_out: newSoldOut,
  image_url: newImageUrl
})
    .eq("id", id);

  if (updateError) {
    console.error(updateError);
    alert("メニューの編集に失敗しました");
    return;
  }

  if (
  newImageFile &&
  item.image_url &&
  item.image_url.includes("/news-images/")
) {
  const oldFileName = item.image_url.split("/news-images/").pop();

  const { error: deleteOldImageError } = await supabaseClient.storage
    .from("news-images")
    .remove([oldFileName]);

  if (deleteOldImageError) {
    console.error(deleteOldImageError);
  }
}

  showToast("メニューを編集しました！");
  loadMenuItems();
  loadDashboardSummary();
}
const tabButtons = document.querySelectorAll(".tab-button");
const tabContents = document.querySelectorAll(".tab-content");

function showTab(tabName) {
  tabContents.forEach((content) => {
    content.style.display =
      content.dataset.tabContent === tabName ? "block" : "none";
  });

  tabButtons.forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.tab === tabName
    );
  });
}

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showTab(button.dataset.tab);
  });
});

showTab("news");

async function loadDashboardSummary() {
  const { count: newsCount, error: newsError } = await supabaseClient
    .from("news")
    .select("*", { count: "exact", head: true });

  if (newsError) {
    console.error(newsError);
    return;
  }

  document.getElementById("newsCount").textContent = `${newsCount ?? 0}件`;

const { count: menuCount, error: menuError } = await supabaseClient
  .from("menu_items")
  .select("*", { count: "exact", head: true });

if (menuError) {
  console.error(menuError);
  return;
}

document.getElementById("menuCount").textContent = `${menuCount ?? 0}件`;

const { data: companyInfo, error: companyError } = await supabaseClient
  .from("company_info")
  .select("updated_at")
  .limit(1)
  .single();

if (companyError) {
  console.error(companyError);
  return;
}

if (companyInfo?.updated_at) {
  const updatedDate = new Date(companyInfo.updated_at);

  document.getElementById("lastUpdated").textContent =
    updatedDate.toLocaleString("ja-JP");
}

}

loadDashboardSummary();

function showToast(message) {
  const toast = document.getElementById("toastMessage");

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

function selectImageFile() {
  return new Promise((resolve) => {
    const input = document.createElement("input");

    input.type = "file";
    input.accept = "image/*";

    input.addEventListener("change", () => {
      resolve(input.files[0] ?? null);
    });

    input.click();
  });
}