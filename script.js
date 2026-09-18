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
  const title = document.getElementById("title").value;
  const content = document.getElementById("content").value;
  const imageFile = document.getElementById("image").files[0];

  if (title === "" || content === "") {
    alert("タイトルと本文を入力してください");
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
    return;
  }

  document.getElementById("title").value = "";
  document.getElementById("content").value = "";
  document.getElementById("image").value = "";

  alert("公開しました！");

  loadNews();
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

  alert("削除しました！");
  loadNews();
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

  alert("編集しました！");
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

    const name = document.getElementById("companyName").value;
    const address = document.getElementById("companyAddress").value;
    const description = document.getElementById("companyDescription").value;
    const phone = document.getElementById("companyPhone").value;
    const instagramUrl = document.getElementById("companyInstagram").value;
    const businessHours = document.getElementById("companyHours").value;
    const closedDays = document.getElementById("companyClosedDays").value;
    const heroImageFile = document.getElementById("heroImage").files[0];

    const { data: companyData, error: fetchError } = await supabaseClient
      .from("company_info")
      .select("id, hero_image_url")
      .limit(1)
      .single();

    if (fetchError) {
      console.error(fetchError);
      alert("会社情報の取得に失敗しました");
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
      return;
    }

    document.getElementById("heroImage").value = "";

    alert("会社情報を保存しました！");
  });

  document
  .getElementById("addMenuButton")
  .addEventListener("click", async () => {

    const name = document.getElementById("menuName").value;
    const description = document.getElementById("menuDescription").value;
    const price = document.getElementById("menuPrice").value;
    const imageFile = document.getElementById("menuImage").files[0];

    if (name === "" || price === "") {
      alert("メニュー名と価格を入力してください");
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
          image_url: imageUrl
        }
      ]);

    if (error) {
      console.error(error);
      alert("メニューの保存に失敗しました");
      return;
    }

    document.getElementById("menuName").value = "";
    document.getElementById("menuDescription").value = "";
    document.getElementById("menuPrice").value = "";
    document.getElementById("menuImage").value = "";

    alert("メニューを追加しました！");
    loadMenuItems();
  });

  async function loadMenuItems() {
  const { data, error } = await supabaseClient
    .from("menu_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    alert("メニューの読み込みに失敗しました");
    return;
  }

  const menuList = document.getElementById("menuList");
  menuList.innerHTML = "";

  data.forEach((item) => {
    const div = document.createElement("div");

    div.className = "news";

    div.innerHTML = `
  <h3>${item.name}</h3>

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

  alert("メニューを削除しました！");
  loadMenuItems();
}

async function editMenuItem(id) {
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

  if (newPrice === null) {
    return;
  }

  if (newName.trim() === "" || newPrice.trim() === "") {
    alert("メニュー名と価格は空欄にできません");
    return;
  }

  const { error: updateError } = await supabaseClient
    .from("menu_items")
    .update({
      name: newName,
      description: newDescription,
      price: Number(newPrice)
    })
    .eq("id", id);

  if (updateError) {
    console.error(updateError);
    alert("メニューの編集に失敗しました");
    return;
  }

  alert("メニューを編集しました！");
  loadMenuItems();
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