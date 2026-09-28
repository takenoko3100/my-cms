const SUPABASE_URL = "https://cshieomhxpuaclggicle.supabase.co";
const SUPABASE_KEY = "sb_publishable_6mt_8wZcBX9aKPR04NzNBQ_StAq2Qbe";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const updatePasswordButton = document.getElementById("updatePasswordButton");

updatePasswordButton.addEventListener("click", async () => {
  const newPassword = document.getElementById("newPassword").value.trim();

  if (!newPassword) {
    alert("新しいパスワードを入力してください。");
    return;
  }

  if (newPassword.length < 8) {
    alert("パスワードは8文字以上にしてください。");
    return;
  }

  const { error } = await supabaseClient.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    console.error(error);
    alert("パスワードの変更に失敗しました。");
    return;
  }

  alert("パスワードを変更しました。");

  window.location.href = "login.html";
});