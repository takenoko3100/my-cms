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

  if (title === "" || content === "") {
    alert("タイトルと本文を入力してください");
    return;
  }

  const { error } = await supabaseClient
    .from("news")
    .insert([
      {
        title: title,
        content: content
      }
    ]);

  if (error) {
    console.error(error);
    alert("保存に失敗しました");
    return;
  }

  document.getElementById("title").value = "";
  document.getElementById("content").value = "";

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

  ddata.forEach((news) => {
  const div = document.createElement("div");

  div.className = "news";

  div.innerHTML = `
    <h3>${news.title}</h3>
    <p>${news.content}</p>
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

  const { error } = await supabaseClient
    .from("news")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("削除に失敗しました");
    return;
  }

  alert("削除しました！");
  loadNews();
}