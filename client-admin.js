const SUPABASE_URL =
  "https://cshieomhxpuaclggicle.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_6mt_8wZcBX9aKPR04NzNBQ_StAq2Qbe";

const supabaseClient =
  supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );


const BUSINESS_TYPE_LABELS = {
  restaurant: "飲食店",
  hospital: "病院・クリニック",
  video_editing: "動画編集",
  auto_repair: "自動車整備"
};


let clients = [];


document.addEventListener(
  "DOMContentLoaded",
  init
);


async function init() {

  const session =
    await requireSession();

  if (!session) {
    return;
  }


  const isCreator =
    await checkCreatorAdmin(
      session.user.id
    );


  if (!isCreator) {

    alert(
      "このページを利用する権限がありません。"
    );

    window.location.href =
      "index.html";

    return;
  }


  bindEvents();

  await loadClients();
}


/* ========================================
   ログイン確認
======================================== */

async function requireSession() {

  const {
    data: { session },
    error
  } =
    await supabaseClient.auth
      .getSession();


  if (error) {
    console.error(error);
  }


  if (!session) {

    window.location.href =
      "login.html";

    return null;
  }


  return session;
}


async function checkCreatorAdmin(
  userId
) {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("creator_admins")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();


  if (error) {

    console.error(
      "制作管理者確認エラー:",
      error
    );

    return false;
  }


  return Boolean(data);
}


/* ========================================
   イベント
======================================== */

function bindEvents() {

  document
    .getElementById(
      "createClientButton"
    )
    .addEventListener(
      "click",
      createClient
    );


  document
    .getElementById(
      "createAnotherButton"
    )
    .addEventListener(
      "click",
      resetForm
    );


  document
    .getElementById(
      "logoutButton"
    )
    .addEventListener(
      "click",
      logout
    );
}


/* ========================================
   新規顧客登録
======================================== */

async function createClient() {

  const button =
    document.getElementById(
      "createClientButton"
    );


  const companyName =
    document.getElementById(
      "companyName"
    ).value.trim();


  const slug =
    document.getElementById(
      "companySlug"
    ).value
      .trim()
      .toLowerCase();


  const businessType =
    document.getElementById(
      "businessType"
    ).value;


  const customerUserId =
    document.getElementById(
      "customerUserId"
    ).value.trim();


  if (
    !companyName ||
    !slug ||
    !customerUserId
  ) {

    alert(
      "会社名・slug・顧客ユーザーIDを入力してください。"
    );

    return;
  }


  if (
    !/^[a-z0-9-]+$/.test(slug)
  ) {

    alert(
      "slugは半角英数字とハイフンで入力してください。"
    );

    return;
  }


  if (
    !isValidUuid(customerUserId)
  ) {

    alert(
      "顧客ユーザーIDの形式を確認してください。"
    );

    return;
  }


  setBusy(
    button,
    true,
    "登録中..."
  );


  try {

    const {
      data: existingCompany,
      error: existingError
    } =
      await supabaseClient
        .from("company_info")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();


    if (existingError) {
      throw existingError;
    }


    if (existingCompany) {

      alert(
        "このslugはすでに使用されています。"
      );

      return;
    }


    const {
      data: company,
      error: companyError
    } =
      await supabaseClient
        .from("company_info")
        .insert([
          {
            name: companyName,
            slug,
            business_type:
              businessType
          }
        ])
        .select(
          "id, name, slug, business_type"
        )
        .single();


    if (companyError) {
      throw companyError;
    }


    const {
      error: memberError
    } =
      await supabaseClient
        .from("company_members")
        .insert([
          {
            company_id:
              company.id,

            user_id:
              customerUserId
          }
        ]);


    if (memberError) {
      throw memberError;
    }


    showResult(
      company.slug
    );


    showToast(
      "顧客を登録しました"
    );


    await loadClients();


  } catch (error) {

    console.error(
      "顧客登録エラー:",
      error
    );


    if (
      error?.code === "23505"
    ) {

      alert(
        "このslugはすでに使用されています。"
      );

    } else if (
      error?.code === "23503"
    ) {

      alert(
        "顧客ユーザーIDが見つかりません。AuthenticationのUser UIDを確認してください。"
      );

    } else {

      alert(
        "顧客登録に失敗しました。"
      );

    }

  } finally {

    setBusy(
      button,
      false,
      "顧客を登録する"
    );

  }
}


/* ========================================
   顧客一覧
======================================== */

async function loadClients() {

  const list =
    document.getElementById(
      "clientList"
    );


  list.replaceChildren();


  const loading =
    document.createElement("div");

  loading.className =
    "client-loading";

  loading.textContent =
    "読み込み中...";

  list.appendChild(
    loading
  );


  const {
    data,
    error
  } =
    await supabaseClient
      .from("company_info")
      .select(
        "id, name, slug, business_type"
      )
      .order(
        "id",
        { ascending: false }
      );


  if (error) {

    console.error(
      "顧客一覧取得エラー:",
      error
    );

    list.replaceChildren();

    const errorMessage =
      document.createElement("div");

    errorMessage.className =
      "client-empty";

    errorMessage.textContent =
      "顧客一覧を読み込めませんでした";

    list.appendChild(
      errorMessage
    );

    return;
  }


  clients =
    data ?? [];


  renderClients();
}


function renderClients() {

  const list =
    document.getElementById(
      "clientList"
    );


  const count =
    document.getElementById(
      "clientCount"
    );


  list.replaceChildren();


  count.textContent =
    `${clients.length}件`;


  if (
    clients.length === 0
  ) {

    const empty =
      document.createElement("div");

    empty.className =
      "client-empty";

    empty.textContent =
      "まだ顧客が登録されていません";

    list.appendChild(
      empty
    );

    return;
  }


  clients.forEach(
    (client) => {

      const card =
        createClientCard(
          client
        );

      list.appendChild(
        card
      );

    }
  );
}


function createClientCard(
  client
) {

  const card =
    document.createElement(
      "article"
    );

  card.className =
    "client-card";


  const top =
    document.createElement(
      "div"
    );

  top.className =
    "client-card-top";


  const info =
    document.createElement(
      "div"
    );


  const name =
    document.createElement(
      "h3"
    );

  name.className =
    "client-name";

  name.textContent =
    client.name ||
    "名称未設定";


  const type =
    document.createElement(
      "span"
    );

  type.className =
    "client-business-type";

  type.textContent =
    BUSINESS_TYPE_LABELS[
      client.business_type
    ] ||
    client.business_type ||
    "業種未設定";


  const slug =
    document.createElement(
      "p"
    );

  slug.className =
    "client-slug";

  slug.textContent =
    `slug：${client.slug || "-"}`;


  info.appendChild(
    name
  );

  info.appendChild(
    type
  );

  info.appendChild(
    slug
  );


  top.appendChild(
    info
  );


  const actions =
    document.createElement(
      "div"
    );

  actions.className =
    "client-actions";


  const adminLink =
    document.createElement(
      "a"
    );

  adminLink.className =
    "client-action-link admin";

  adminLink.textContent =
    "管理画面";

  adminLink.target =
    "_blank";

  adminLink.rel =
    "noopener noreferrer";

  adminLink.href =
    `index.html?company=${encodeURIComponent(
      client.slug
    )}`;


  const publicLink =
    document.createElement(
      "a"
    );

  publicLink.className =
    "client-action-link public";

  publicLink.textContent =
    "公開ページ";

  publicLink.target =
    "_blank";

  publicLink.rel =
    "noopener noreferrer";

  publicLink.href =
    `site.html?company=${encodeURIComponent(
      client.slug
    )}`;


  actions.appendChild(
    adminLink
  );

  actions.appendChild(
    publicLink
  );


  card.appendChild(
    top
  );

  card.appendChild(
    actions
  );


  return card;
}


/* ========================================
   登録完了表示
======================================== */

function showResult(slug) {

  const baseUrl =
    window.location.origin;


  const adminUrl =
    `${baseUrl}/index.html?company=${encodeURIComponent(slug)}`;


  const publicUrl =
    `${baseUrl}/site.html?company=${encodeURIComponent(slug)}`;


  const adminLink =
    document.getElementById(
      "adminUrl"
    );


  const publicLink =
    document.getElementById(
      "publicUrl"
    );


  adminLink.href =
    adminUrl;

  adminLink.textContent =
    adminUrl;


  publicLink.href =
    publicUrl;

  publicLink.textContent =
    publicUrl;


  document
    .getElementById(
      "resultCard"
    )
    .hidden = false;
}


/* ========================================
   フォーム
======================================== */

function resetForm() {

  document.getElementById(
    "companyName"
  ).value = "";


  document.getElementById(
    "companySlug"
  ).value = "";


  document.getElementById(
    "businessType"
  ).value =
    "restaurant";


  document.getElementById(
    "customerUserId"
  ).value = "";


  document.getElementById(
    "resultCard"
  ).hidden = true;


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


function isValidUuid(value) {

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(value);
}


/* ========================================
   UI
======================================== */

function setBusy(
  button,
  busy,
  text
) {

  button.disabled =
    busy;

  button.textContent =
    text;
}


function showToast(message) {

  const toast =
    document.getElementById(
      "toastMessage"
    );


  toast.textContent =
    message;


  toast.classList.add(
    "show"
  );


  clearTimeout(
    showToast.timer
  );


  showToast.timer =
    setTimeout(() => {

      toast.classList.remove(
        "show"
      );

    }, 2400);
}


/* ========================================
   ログアウト
======================================== */

async function logout() {

  const {
    error
  } =
    await supabaseClient.auth
      .signOut();


  if (error) {

    console.error(error);

    showToast(
      "ログアウトに失敗しました"
    );

    return;
  }


  window.location.href =
    "login.html";
}