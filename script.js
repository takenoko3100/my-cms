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