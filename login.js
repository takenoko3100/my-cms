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
const forgotPasswordButton =
  document.getElementById("forgotPasswordButton");

const companySlug = new URLSearchParams(
  window.location.search
).get("company");

function getEditorUrl() {
  const url = new URL("index.html", window.location.href);

  if (companySlug) {
    url.searchParams.set("company", companySlug);
  }

  return url.href;
}

let isLoggingIn = false;

loginButton.addEventListener("click", async (event) => {
  event.preventDefault();

  if (isLoggingIn) return;

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    alert("メールアドレスとパスワードを入力してください。");
    return;
  }

  isLoggingIn = true;
  loginButton.disabled = true;

  try {
    const { error } =
      await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

    if (error) {
      console.error(error);
      alert(
        "ログインできませんでした。\n" +
        "メールアドレスとパスワードを確認してください。"
      );
      return;
    }

    window.location.href = getEditorUrl();
  } catch (error) {
    console.error(error);
    alert(
      "通信に失敗しました。\n" +
      "インターネット接続を確認して、もう一度試してください。"
    );
  } finally {
    isLoggingIn = false;
    loginButton.disabled = false;
  }
});

let isSendingResetEmail = false;

if (forgotPasswordButton) {
  forgotPasswordButton.addEventListener("click", async (event) => {
    event.preventDefault();

    if (isSendingResetEmail) return;

    const email = emailInput.value.trim();

    if (!email) {
      alert("メールアドレスを入力してください。");
      return;
    }

    isSendingResetEmail = true;
    forgotPasswordButton.disabled = true;

    try {
      const resetUrl = new URL(
        "reset-password.html",
        window.location.href
      );

      const { error } =
        await supabaseClient.auth.resetPasswordForEmail(email, {
          redirectTo: resetUrl.href
        });

      if (error) {
        console.error(error);
        alert(
          `再設定メールの送信に失敗しました。\n${error.message}`
        );
        return;
      }

      alert(
        "パスワード再設定メールを送信しました。\n" +
        "メールを確認してください。"
      );
    } catch (error) {
      console.error(error);
      alert(
        "通信に失敗しました。\n" +
        "インターネット接続を確認して、もう一度試してください。"
      );
    } finally {
      isSendingResetEmail = false;
      forgotPasswordButton.disabled = false;
    }
  });
}