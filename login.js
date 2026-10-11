const SUPABASE_URL = "https://cshieomhxpuaclggicle.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_6mt_8wZcBX9aKPR04NzNBQ_StAq2Qbe";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("loginButton");
const loginForm = document.getElementById("loginForm");
const forgotPasswordButton = document.getElementById("forgotPasswordButton");
const companySlug = new URLSearchParams(window.location.search).get("company");

// 会社名は表示用。管理権限はログイン後に editor.js と RLS で確認する。
async function loadLoginCompanyName() {
  if (!companySlug) return;

  try {
    const { data: company, error } = await supabaseClient
      .from("company_info")
      .select("name")
      .eq("slug", companySlug)
      .maybeSingle();

    if (error) {
      console.error("ログイン画面の会社名取得エラー:", error);
      return;
    }

    const name = company?.name?.trim();
    if (!name) return;

    const title = `${name} 管理画面`;
    const heading = document.getElementById("loginTitle");
    if (heading) heading.textContent = title;
    document.title = `${title} | ログイン`;
  } catch (error) {
    console.error("ログイン画面の会社名取得エラー:", error);
  }
}

function getEditorUrl() {
  const url = new URL("index.html", window.location.href);
  if (companySlug) url.searchParams.set("company", companySlug);
  return url.href;
}

let isLoggingIn = false;

async function handleLogin(event) {
  event.preventDefault();
  if (isLoggingIn) return;

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    alert("メールアドレスとパスワードを入力してください。");
    return;
  }

  const originalLabel = loginButton.textContent;
  isLoggingIn = true;
  loginButton.disabled = true;
  loginButton.textContent = "ログイン中…";

  try {
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
      console.error(error);
      alert("ログインできませんでした。\nメールアドレスとパスワードを確認してください。");
      return;
    }
    window.location.href = getEditorUrl();
  } catch (error) {
    console.error(error);
    alert("通信に失敗しました。\nインターネット接続を確認して、もう一度試してください。");
  } finally {
    isLoggingIn = false;
    loginButton.disabled = false;
    loginButton.textContent = originalLabel;
  }
}

if (loginForm) {
  loginForm.addEventListener("submit", handleLogin);
} else {
  loginButton.addEventListener("click", handleLogin);
}

let isSendingResetEmail = false;

if (forgotPasswordButton) {
  forgotPasswordButton.addEventListener("click", async (event) => {
    event.preventDefault();
    if (isSendingResetEmail) return;

    const email = emailInput.value.trim();
    if (!email) {
      alert("メールアドレスを入力してください。");
      emailInput.focus();
      return;
    }
    if (!emailInput.checkValidity()) {
      emailInput.reportValidity();
      return;
    }

    const originalLabel = forgotPasswordButton.textContent;
    isSendingResetEmail = true;
    forgotPasswordButton.disabled = true;
    forgotPasswordButton.textContent = "メールを送信中…";

    try {
      const resetUrl = new URL("reset-password.html", window.location.href);
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: resetUrl.href
      });
      if (error) {
        console.error(error);
        alert(`再設定メールの送信に失敗しました。\n${error.message}`);
        return;
      }
      alert("パスワード再設定メールを送信しました。\nメールを確認してください。");
    } catch (error) {
      console.error(error);
      alert("通信に失敗しました。\nインターネット接続を確認して、もう一度試してください。");
    } finally {
      isSendingResetEmail = false;
      forgotPasswordButton.disabled = false;
      forgotPasswordButton.textContent = originalLabel;
    }
  });
}

loadLoginCompanyName();