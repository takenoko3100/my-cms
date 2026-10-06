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


  document
    .getElementById(
      "saveClientButton"
    )
    .addEventListener(
      "click",
      saveClientChanges
    );


  document
    .getElementById(
      "deleteClientButton"
    )
    .addEventListener(
      "click",
      deleteCurrentClient
    );


  document
    .getElementById(
      "closeEditClientModalButton"
    )
    .addEventListener(
      "click",
      closeEditClientModal
    );


  document
    .querySelector(
      "[data-close-edit-modal]"
    )
    .addEventListener(
      "click",
      closeEditClientModal
    );


  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Escape"
      ) {

        closeEditClientModal();

      }

    }
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
    !isValidSlug(slug)
  ) {

    alert(
      "slugは半角英数字とハイフンで入力してください。"
    );

    return;
  }


  if (
    !isValidUuid(
      customerUserId
    )
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


    handleDatabaseError(
      error
    );

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
    document.createElement(
      "div"
    );


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
        {
          ascending: false
        }
      );


  if (error) {

    console.error(
      "顧客一覧取得エラー:",
      error
    );


    list.replaceChildren();


    const errorMessage =
      document.createElement(
        "div"
      );


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
      document.createElement(
        "div"
      );


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

      list.appendChild(
        createClientCard(
          client
        )
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


  const actions =
    document.createElement(
      "div"
    );


  actions.className =
    "client-actions";


  const adminLink =
    createClientLink(
      "管理画面",
      "admin",
      `index.html?company=${encodeURIComponent(
        client.slug
      )}`
    );


  const publicLink =
    createClientLink(
      "公開ページ",
      "public",
      `site.html?company=${encodeURIComponent(
        client.slug
      )}`
    );


  const editButton =
    document.createElement(
      "button"
    );


  editButton.type =
    "button";


  editButton.className =
    "client-action-button";


  editButton.textContent =
    "顧客情報を編集";


  editButton.addEventListener(
    "click",
    () => {

      openEditClientModal(
        client.id
      );

    }
  );


  actions.appendChild(
    adminLink
  );


  actions.appendChild(
    publicLink
  );


  actions.appendChild(
    editButton
  );


  card.appendChild(
    name
  );


  card.appendChild(
    type
  );


  card.appendChild(
    slug
  );


  card.appendChild(
    actions
  );


  return card;
}


function createClientLink(
  text,
  type,
  href
) {

  const link =
    document.createElement(
      "a"
    );


  link.className =
    `client-action-link ${type}`;


  link.textContent =
    text;


  link.href =
    href;


  link.target =
    "_blank";


  link.rel =
    "noopener noreferrer";


  return link;
}


/* ========================================
   顧客編集
======================================== */

function openEditClientModal(
  clientId
) {

  const client =
    clients.find(
      (item) =>
        String(item.id) ===
        String(clientId)
    );


  if (!client) {
    return;
  }


  document.getElementById(
    "editClientId"
  ).value =
    client.id;


  document.getElementById(
    "editCompanyName"
  ).value =
    client.name ?? "";


  document.getElementById(
    "editCompanySlug"
  ).value =
    client.slug ?? "";


  document.getElementById(
    "editBusinessType"
  ).value =
    client.business_type ||
    "restaurant";


  const modal =
    document.getElementById(
      "editClientModal"
    );


  modal.classList.add(
    "open"
  );


  modal.setAttribute(
    "aria-hidden",
    "false"
  );


  document.body.style.overflow =
    "hidden";
}


function closeEditClientModal() {

  const modal =
    document.getElementById(
      "editClientModal"
    );


  if (!modal) {
    return;
  }


  modal.classList.remove(
    "open"
  );


  modal.setAttribute(
    "aria-hidden",
    "true"
  );


  document.body.style.overflow =
    "";
}


async function saveClientChanges() {

  const button =
    document.getElementById(
      "saveClientButton"
    );


  const clientId =
    document.getElementById(
      "editClientId"
    ).value;


  const name =
    document.getElementById(
      "editCompanyName"
    ).value.trim();


  const slug =
    document.getElementById(
      "editCompanySlug"
    ).value
      .trim()
      .toLowerCase();


  const businessType =
    document.getElementById(
      "editBusinessType"
    ).value;


  if (
    !clientId ||
    !name ||
    !slug
  ) {

    alert(
      "会社名とslugを入力してください。"
    );

    return;
  }


  if (
    !isValidSlug(slug)
  ) {

    alert(
      "slugは半角英数字とハイフンで入力してください。"
    );

    return;
  }


  setBusy(
    button,
    true,
    "保存中..."
  );


  try {

    const {
      error
    } =
      await supabaseClient
        .from("company_info")
        .update({
          name,
          slug,
          business_type:
            businessType,
          updated_at:
            new Date().toISOString()
        })
        .eq(
          "id",
          clientId
        );


    if (error) {
      throw error;
    }


    closeEditClientModal();


    showToast(
      "顧客情報を変更しました"
    );


    await loadClients();


  } catch (error) {

    console.error(
      "顧客編集エラー:",
      error
    );


    handleDatabaseError(
      error
    );

  } finally {

    setBusy(
      button,
      false,
      "変更を保存"
    );

  }
}


/* ========================================
   顧客削除
======================================== */

async function deleteCurrentClient() {

  const clientId =
    document.getElementById(
      "editClientId"
    ).value;


  const client =
    clients.find(
      (item) =>
        String(item.id) ===
        String(clientId)
    );


  if (!client) {
    return;
  }


  const ok =
    confirm(
      `「${client.name}」を削除しますか？\n\nこの操作は元に戻せません。`
    );


  if (!ok) {
    return;
  }


  const button =
    document.getElementById(
      "deleteClientButton"
    );


  setBusy(
    button,
    true,
    "削除中..."
  );


  try {

    const {
      error
    } =
      await supabaseClient
        .rpc(
          "delete_client_company",
          {
            target_company_id:
              Number(clientId)
          }
        );


    if (error) {
      throw error;
    }


    closeEditClientModal();


    showToast(
      "顧客を削除しました"
    );


    await loadClients();


  } catch (error) {

    console.error(
      "顧客削除エラー:",
      error
    );


    if (
      error?.message?.includes(
        "company_has_content"
      )
    ) {

      alert(
        "この顧客にはトップ画像・メニュー・診療科・お知らせなどのデータがあります。\n\n安全のため、この画面からは削除できません。"
      );

    } else {

      alert(
        "顧客の削除に失敗しました。"
      );

    }

  } finally {

    setBusy(
      button,
      false,
      "この顧客を削除"
    );

  }
}


/* ========================================
   登録完了
======================================== */

function showResult(slug) {

  const baseUrl =
    window.location.origin;


  const adminUrl =
    `${baseUrl}/index.html?company=${encodeURIComponent(
      slug
    )}`;


  const publicUrl =
    `${baseUrl}/site.html?company=${encodeURIComponent(
      slug
    )}`;


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


  document.getElementById(
    "resultCard"
  ).hidden =
    false;
}


/* ========================================
   フォーム
======================================== */

function resetForm() {

  document.getElementById(
    "companyName"
  ).value =
    "";


  document.getElementById(
    "companySlug"
  ).value =
    "";


  document.getElementById(
    "businessType"
  ).value =
    "restaurant";


  document.getElementById(
    "customerUserId"
  ).value =
    "";


  document.getElementById(
    "resultCard"
  ).hidden =
    true;


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


function isValidSlug(value) {

  return /^[a-z0-9-]+$/
    .test(value);
}


function isValidUuid(value) {

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(value);
}


/* ========================================
   エラー
======================================== */

function handleDatabaseError(
  error
) {

  if (
    error?.code === "23505"
  ) {

    alert(
      "このslugはすでに使用されています。"
    );

    return;
  }


  if (
    error?.code === "23503"
  ) {

    alert(
      "顧客ユーザーIDが見つかりません。"
    );

    return;
  }


  alert(
    "処理に失敗しました。"
  );
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
    setTimeout(
      () => {

        toast.classList.remove(
          "show"
        );

      },
      2400
    );
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