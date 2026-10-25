(() => {
  "use strict";

  const form = document.getElementById("resetPasswordForm");
  const passwordInput = document.getElementById("newPassword");
  const confirmInput = document.getElementById("confirmPassword");
  const button = document.getElementById("updatePasswordButton");
  const errorMessage = document.getElementById("errorMessage");
  const successMessage = document.getElementById("successMessage");
  const loginLink = document.getElementById("loginLink");
  let expiredMessage = "再設定リンクが無効か、有効期限が切れています。ログイン画面の「パスワードを忘れた方」から、もう一度メールを送信してください。";
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.slice(1));
  // 招待のtypeはSDKがURLから取り除く前に読み取る。表示の切り替えにだけ使う。
  const isInvite = query.get("mode") === "invite" || hash.get("type") === "invite";
  const actionLabel = isInvite ? "パスワードを設定" : "パスワードを変更";
  if (isInvite) {
    document.title = "初回パスワード設定 | sasulie";
    document.getElementById("resetTitle").textContent = "初回パスワード設定";
    document.getElementById("passwordLead").textContent = "ようこそ！管理画面にログインするためのパスワードを設定してください。";
    expiredMessage = "この招待リンクは無効か、有効期限が切れています。一度使った招待リンクは再利用できません。設定済みの場合はログイン画面へ進んでください。未設定の場合は招待元の担当者へ連絡してください。";
  }
  button.textContent = actionLabel;
  const hasLinkError = [query, hash].some(params => params.has("error") || params.has("error_code"));
  let isUpdating = false;
  let isComplete = false;

  function showError(message, field) {
    errorMessage.textContent = message;
    errorMessage.hidden = false;
    if (field) {
      field.setAttribute("aria-invalid", "true");
      field.focus();
    }
  }

  document.querySelectorAll("[data-password-target]").forEach(toggle => {
    const input = document.getElementById(toggle.dataset.passwordTarget);
    const label = input === passwordInput ? "新しいパスワード" : "確認用パスワード";
    toggle.addEventListener("click", () => {
      const visible = input.type === "password";
      input.type = visible ? "text" : "password";
      toggle.setAttribute("aria-pressed", String(visible));
      toggle.setAttribute("aria-label", label + (visible ? "を非表示" : "を表示"));
    });
  });

  [passwordInput, confirmInput].forEach(input => {
    input.addEventListener("input", () => {
      passwordInput.removeAttribute("aria-invalid");
      confirmInput.removeAttribute("aria-invalid");
      errorMessage.hidden = true;
    });
  });

  if (!window.supabase) {
    showError("読み込みに失敗しました。インターネット接続を確認して、ページを再読み込みしてください。");
    button.disabled = true;
    form.addEventListener("submit", event => event.preventDefault());
    return;
  }

  const client = window.supabase.createClient(
    "https://cshieomhxpuaclggicle.supabase.co",
    "sb_publishable_6mt_8wZcBX9aKPR04NzNBQ_StAq2Qbe"
  );

  if (hasLinkError) {
    showError(expiredMessage);
    button.disabled = true;
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (isUpdating || isComplete || hasLinkError) return;
    errorMessage.hidden = true;
    passwordInput.removeAttribute("aria-invalid");
    confirmInput.removeAttribute("aria-invalid");

    // 入力したパスワードを勝手に変更しないよう、trimは使わない。
    const password = passwordInput.value;
    if (!password || !password.trim()) {
      showError("新しいパスワードを入力してください。", passwordInput);
      return;
    }
    if (password.length < 8) {
      showError("パスワードは8文字以上で入力してください。", passwordInput);
      return;
    }
    if (!confirmInput.value) {
      showError("確認用のパスワードを入力してください。", confirmInput);
      return;
    }
    if (password !== confirmInput.value) {
      showError("パスワードが一致していません。同じパスワードをもう一度入力してください。", confirmInput);
      return;
    }

    isUpdating = true;
    button.disabled = true;
    button.textContent = isInvite ? "設定中…" : "変更中…";
    try {
      const { data, error: sessionError } = await client.auth.getSession();
      if (sessionError) throw sessionError;
      if (!data.session) {
        showError(expiredMessage);
        return;
      }
      const { error } = await client.auth.updateUser({ password });
      if (error) throw error;

      isComplete = true;
      passwordInput.value = "";
      confirmInput.value = "";
      form.hidden = true;
      successMessage.textContent = isInvite
        ? "初回パスワードを設定しました。設定したメールアドレスとパスワードでログインしてください。"
        : "パスワードを変更しました。新しいパスワードでログインしてください。";
      successMessage.hidden = false;
      loginLink.className = "primary";
      loginLink.textContent = "ログイン画面へ";
      // 再ログインを確認できるよう、このブラウザのセッションを終了。
      try { await client.auth.signOut({ scope: "local" }); } catch (_) { /* 変更は完了済み */ }
      loginLink.focus();
    } catch (error) {
      const code = error?.code || "";
      if (["session_not_found", "refresh_token_not_found", "refresh_token_already_used", "otp_expired"].includes(code)) {
        showError(expiredMessage);
      } else if (code === "same_password") {
        showError("現在とは異なる、新しいパスワードを設定してください。", passwordInput);
      } else if (code === "weak_password") {
        showError("このパスワードは利用できません。文字数を増やし、英字・数字・記号を組み合わせてください。", passwordInput);
      } else {
        showError(isInvite
          ? "パスワードを設定できませんでした。通信状態を確認して、もう一度試してください。改善しない場合は招待元の担当者に連絡してください。"
          : "パスワードを変更できませんでした。通信状態を確認して、もう一度試してください。改善しない場合は管理者に連絡してください。");
      }
    } finally {
      isUpdating = false;
      button.disabled = isComplete;
      button.textContent = actionLabel;
    }
  });
})();
