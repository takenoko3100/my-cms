const SUPABASE_URL =
  "https://cshieomhxpuaclggicle.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_6mt_8wZcBX9aKPR04NzNBQ_StAq2Qbe";

const supabaseClient =
  supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );


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
}


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