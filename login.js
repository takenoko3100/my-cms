const SUPABASE_URL = "https://cshieomhxpuaclggicle.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_6mt_8wZcBX9aKPR04NzNBQ_StAq2Qbe";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

document
  .getElementById("loginButton")
  .addEventListener("click", async () => {

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (email === "" || password === "") {
      alert("メールアドレスとパスワードを入力してください");
      return;
    }

    const { data, error } =
      await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
      });

    if (error) {
  console.error(error);
  alert(error.message);
  return;
}

    alert("ログインしました！");
    window.location.href = "index.html";
  });

  const forgotPasswordButton = document.getElementById("forgotPasswordButton");

forgotPasswordButton.addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();

  if (!email) {
    alert("メールアドレスを入力してください。");
    return;
  }

  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: "https://my-cms-phi-weld.vercel.app/reset-password.html",
  });

  if (error) {
    console.error(error);
    alert("再設定メールの送信に失敗しました。");
    return;
  }

  alert("パスワード再設定メールを送信しました。");
});