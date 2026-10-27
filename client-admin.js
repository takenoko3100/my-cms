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
  "restaurant": "飲食店",
  "hospital": "病院・クリニック",
  "video_editing": "動画・映像制作",
  "auto_repair": "自動車整備",
  "salon": "美容室・サロン",
  "retail": "物販・雑貨",
  "school": "教室・スクール"
};
const SITE_DESIGN_LABELS = Object.freeze({standard:"今までのデザイン",natural:"ナチュラル",japanese:"和モダン",chic:"シック",elegant:"エレガント",pop:"ポップ",minimal:"ミニマル",visual:"ビジュアル",clean:"クリーン",craft:"クラフト",bold:"ボールド", "magazine":"マガジン", "split":"スプリット", "gallery":"ギャラリー"});
let operatorUserId = null;
let ownCompanyIds = new Set();
let membershipState = "loading";
const assigningCompanies = new Set();
let pendingCreation = null;
let clients = [];
document.addEventListener("DOMContentLoaded", () => {
  init().catch(error => {
    console.error(error);
    document.getElementById("operatorStatus").textContent = "読み込めませんでした。ページを再読み込みしてください。";
  });
});
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
      "/editor";
    return;
  }
  operatorUserId = session.user.id;
  document.getElementById("operatorStatus").textContent = session.user.email ? `ログイン中（運営者）：${session.user.email}` : "運営者としてログイン中";
  document.body.classList.remove("auth-pending");
  bindEvents();
  bindWorkspaceEvents();
  bindDisplaySettings();
  bindContractEvents();
  await loadClients();
}
/* ========================================
   ログイン確認
======================================== */
async function requireSession() {
  try {
    const { data, error } = await supabaseClient.auth.getUser();
    if (error || !data?.user) { window.location.href = "/login.html"; return null; }
    return { user: data.user };
  } catch (error) {
    console.error(error);
    document.getElementById("operatorStatus").textContent = "ログイン状態を確認できませんでした。ページを再読み込みしてください。";
    return null;
  }
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
  document.getElementById("addOperatorMembershipButton").addEventListener("click", async event => {
    await addOperatorToCompany(document.getElementById("editClientId").value, event.currentTarget);
    refreshEditMembershipStatus();
  });
  document.getElementById("addClientMemberButton").addEventListener("click", addClientMember);

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
  const button = document.getElementById("createClientButton");
  if (button.disabled) return;
  const name = document.getElementById("companyName").value.trim();
  const slug = document.getElementById("companySlug").value.trim().toLowerCase();
  const business_type = document.getElementById("businessType").value;
  const customerId = document.getElementById("customerUserId").value.trim();
  const feedback = document.getElementById("createFeedback");
  if (!name || !slug || !customerId) { alert("会社名・サイト識別名・更新担当者のユーザーIDを入力してください。"); return; }
  if (!isValidSlug(slug)) { alert("サイト識別名は半角英数字とハイフンで入力してください。"); return; }
  if (!isValidUuid(customerId)) { alert("顧客ユーザーIDの形式を確認してください。"); return; }
  if (!Object.hasOwn(BUSINESS_TYPE_LABELS, business_type)) return;
  const displaySettings = readDisplaySettings("create");
  if (!displaySettings) { alert("表示設定を確認してください。"); return; }
  setBusy(button, true, "登録中…");
  feedback.textContent = "";
  let company = null;
  try {
    const creatorId = await requireCreatorIdentity();
    if (pendingCreation?.slug === slug) {
      company = pendingCreation.company;
    } else {
      const { data: existing, error: existingError } = await supabaseClient.from("company_info").select("id").eq("slug", slug).maybeSingle();
      if (existingError) throw existingError;
      if (existing) { feedback.textContent = "このサイト識別名は使用済みです。一覧から会社を開くか、別の識別名を入力してください。"; return; }
      const result = await supabaseClient.from("company_info").insert([{name, slug, business_type, ...displaySettings}]).select("id, name, slug, business_type, site_design, contact_method, price_input_mode, show_closed_days").single();
      if (result.error) throw result.error;
      company = result.data;
      pendingCreation = { slug, company };
    }
    await ensureCompanyMember(company.id, customerId);
    let operatorWarning = false;
    try { await ensureCompanyMember(company.id, creatorId); }
    catch (error) { console.error(error); operatorWarning = true; }
    pendingCreation = null;
    showResult(company.slug);
    feedback.textContent = operatorWarning
      ? "顧客の登録は完了しました。運営者の担当設定を完了できなかったため、一覧の「自分を管理担当に追加」から設定してください。"
      : "顧客と運営者を管理担当に登録しました。デザイン設定と内容の編集へ進めます。";
    showToast("顧客を登録しました");
    await loadClients();
  } catch (error) {
    console.error("顧客登録エラー:", error);
    if (company) {
      feedback.textContent = "会社は登録済みですが、顧客の担当設定が完了していません。ユーザーIDを確認して、このフォームからもう一度登録してください。会社を重複作成せず担当設定を再試行します。";
      await loadClients();
    } else {
      feedback.textContent = "登録できませんでした。入力内容とログイン状態を確認してください。";
    }
    handleDatabaseError(error);
  } finally { setBusy(button, false, pendingCreation?.slug === slug ? "担当者の登録を再試行" : "顧客を登録する"); }
}
/* ========================================
   顧客一覧
======================================== */
async function loadClients() {
  const list =
    document.getElementById(
      "clientList"
    );
  list.setAttribute("aria-busy", "true");
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
        "id, name, slug, business_type, site_design, contact_method, price_input_mode, show_closed_days"
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
    list.setAttribute("aria-busy", "false");
    document.getElementById("listDescription").textContent = "読み込みに失敗しました。「一覧を更新」でもう一度試してください。";
    return;
  }
  clients = data ?? [];
  await Promise.all([loadOwnMemberships(), loadContracts()]);
  renderClients();
  document.getElementById("clientList").setAttribute("aria-busy", "false");
}
function renderClients() {
  const list = document.getElementById("clientList");
  const count = document.getElementById("clientCount");
  const query = document.getElementById("clientSearch").value.trim().normalize("NFKC").toLocaleLowerCase("ja");
  const type = document.getElementById("clientTypeFilter").value;
  const sort = document.getElementById("clientSort").value;
  const contractFilter = document.getElementById("contractStatusFilter").value;
  const shown = clients.filter(client => {
    const text = `${client.name || ""} ${client.slug || ""}`.normalize("NFKC").toLocaleLowerCase("ja");
    return (!query || text.includes(query)) && (!type || client.business_type === type) && matchesContractFilter(client.id, contractFilter);
  });
  shown.sort((a, b) => sort === "contractEnd"
    ? compareContractEnds(a,b) : sort === "name"
    ? (a.name || "").localeCompare(b.name || "", "ja")
    : sort === "oldest" ? Number(a.id) - Number(b.id) : Number(b.id) - Number(a.id));
  list.replaceChildren();
  count.textContent = `${clients.length}件`;
  document.getElementById("totalClientCount").textContent = clients.length;
  for (const key of Object.keys(BUSINESS_TYPE_LABELS)) {
    document.getElementById(`${key}Count`).textContent = clients.filter(client => client.business_type === key).length;
  }
  document.getElementById("listDescription").textContent = query || type || contractFilter
    ? `${clients.length}件中 ${shown.length}件を表示しています。`
    : `${clients.length}件の顧客を表示しています。`;
  if (!shown.length) {
    const empty = document.createElement("div");
    empty.className = "client-empty";
    empty.textContent = clients.length
      ? "条件に合う顧客が見つかりません。検索文字・業種・契約状況を変えてみてください。"
      : "まだ顧客がいません。「新規顧客登録」から最初の会社を登録しましょう。";
    list.appendChild(empty);
    return;
  }
  shown.forEach(client => list.appendChild(createClientCard(client)));
}

function createClientCard(client) {
  const card = document.createElement("article");
  card.className = "client-card";
  card.dataset.companyId = client.id;
  const top = document.createElement("div"); top.className = "client-card-top";
  const avatar = document.createElement("span"); avatar.className = "client-avatar"; avatar.setAttribute("aria-hidden", "true"); avatar.textContent = Array.from(client.name || "?")[0];
  const info = document.createElement("div"); info.className = "client-card-info";
  const name = document.createElement("h3"); name.className = "client-name"; name.textContent = client.name || "名称未設定";
  const type = document.createElement("span"); type.className = "client-business-type"; type.textContent = BUSINESS_TYPE_LABELS[client.business_type] || "業種未設定";
  info.append(name, type); top.append(avatar, info);
  const meta = document.createElement("div"); meta.className = "client-meta";
  const design = document.createElement("span"); design.textContent = `デザイン：${Object.hasOwn(SITE_DESIGN_LABELS, client.site_design) ? SITE_DESIGN_LABELS[client.site_design] : "今までのデザイン"}`;
  const own = ownCompanyIds.has(String(client.id));
  const status = document.createElement("span"); status.className = `client-access ${own ? "ready" : "pending"}`;
  status.textContent = membershipState === "error" ? "管理担当を確認できません" : own ? "編集できます" : "運営者の担当設定が必要";
  const options = window.companySettings.settings(client);
  const display = document.createElement("span");display.className="client-display-summary";
  display.textContent = `連絡先：${window.companySettings.CONTACT_METHODS[options.contactMethod]} ／ 料金：${client.business_type === "hospital" ? "表示なし" : window.companySettings.PRICE_MODES[options.priceMode]} ／ 休業日：${options.showClosedDays ? "表示" : "非表示"}`;
  meta.append(design,display,status);
  const actions = document.createElement("div"); actions.className = "client-actions";
  const links = buildCompanyLinks(client.slug);
  if (links) {
    if (own) {
      const editLink = createClientLink("編集・デザイン設定 ↗", "admin", links.admin);
      editLink.setAttribute("aria-label", `${client.name || "この会社"}の編集・デザイン設定を開く`);
      actions.appendChild(editLink);
    } else {
      const setup = document.createElement("button"); setup.type = "button"; setup.className = "client-action-link admin setup-access";
      setup.textContent = membershipState === "error" ? "担当確認が必要です" : "自分を管理担当に追加";
      setup.disabled = membershipState !== "ready" || assigningCompanies.has(String(client.id));
      setup.addEventListener("click", () => addOperatorToCompany(client.id, setup)); actions.appendChild(setup);
    }
    const publicLink = createClientLink("公開サイトを見る ↗", "public", links.public);
    publicLink.setAttribute("aria-label", `${client.name || "この会社"}の公開サイトを見る`); actions.appendChild(publicLink);
  } else {
    const note = document.createElement("p"); note.className="client-link-note"; note.textContent="サイト識別名を設定すると、編集・公開リンクを使えます。"; actions.appendChild(note);
  }
  const edit = document.createElement("button"); edit.type="button"; edit.className="client-action-button"; edit.textContent="会社情報・表示設定"; edit.addEventListener("click",()=>openEditClientModal(client.id)); actions.appendChild(edit);
  const contractButton=document.createElement("button");
  contractButton.type="button";contractButton.className="client-action-button contract-open-button";
  contractButton.textContent="契約を管理";
  contractButton.setAttribute("aria-label",`${client.name || "この会社"}の契約を管理`);
  contractButton.addEventListener("click",()=>openContractModal(client.id));
  actions.appendChild(contractButton);
  card.append(top,meta,createContractSummary(client.id),actions);
  if (links) {
    const details = document.createElement("details"); details.className="client-link-details";
    const summary = document.createElement("summary"); summary.textContent="URLを確認・コピー"; details.appendChild(summary);
    for (const [label,href] of [["編集画面",links.admin],["公開サイト",links.public]]) {
      const row=document.createElement("div"); row.className="client-url-row";
      const title=document.createElement("span"); title.textContent=label;
      const url=document.createElement("a");url.href=href;url.textContent=href;url.target="_blank";url.rel="noopener noreferrer";
      const copy=document.createElement("button");copy.type="button";copy.className="client-copy-button";copy.textContent=`${label}のURLをコピー`;copy.addEventListener("click",()=>copyLink(href));
      row.append(title,url,copy);details.appendChild(row);
    }
    card.appendChild(details);
  }
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
  previousModalFocus = document.activeElement;
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
  writeDisplaySettings("edit", client);
  refreshPriceModeHelp("edit");
  const modal =
    document.getElementById(
      "editClientModal"
    );
  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";
  modal.classList.add(
    "open"
  );
  modal.setAttribute(
    "aria-hidden",
    "false"
  );
  modal.scrollTop = 0;
  document.getElementById("additionalMemberUid").value = "";
  document.getElementById("memberFeedback").textContent = "";
  refreshEditMembershipStatus();
  document.getElementById("editCompanyName").focus();
}
function closeEditClientModal() {
  const modal =
    document.getElementById(
      "editClientModal"
    );
  if (!modal) {
    return;
  }
  const wasOpen = modal.classList.contains("open");
  modal.classList.remove(
    "open"
  );
  modal.setAttribute(
    "aria-hidden",
    "true"
  );
  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";
  if (wasOpen && previousModalFocus?.isConnected) previousModalFocus.focus();
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
      "会社名とサイト識別名を入力してください。"
    );
    return;
  }
  if (
    !isValidSlug(slug)
  ) {
    alert(
      "サイト識別名は半角英数字とハイフンで入力してください。"
    );
    return;
  }
  if (!Object.hasOwn(BUSINESS_TYPE_LABELS, businessType)) { alert("業種を選択してください。"); return; }
  const displaySettings = readDisplaySettings("edit");
  if (!displaySettings) { alert("表示設定を確認してください。"); return; }
  if (button.disabled) return;
  if (!ownCompanyIds.has(String(clientId))) { alert("先に「自分を管理担当に追加」で、この会社の編集を有効にしてください。"); return; }
  setBusy(
    button,
    true,
    "保存中..."
  );
  try {
    await requireCreatorIdentity();
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
          ...displaySettings,
          updated_at:
            new Date().toISOString()
        })
        .eq(
          "id",
          clientId
        ).select("id").single();
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
  const adminUrl = window.sasulieURLs.editorURL(slug);
  const publicUrl = window.sasulieURLs.publicURL(slug);
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
  document.getElementById("resultCard").scrollIntoView({ behavior: "smooth", block: "start" });
}
/* ========================================
   フォーム
======================================== */
function resetForm() {
  pendingCreation = null;
  document.getElementById("createFeedback").textContent = "";
  document.getElementById("createClientButton").textContent = "顧客を登録する";
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
  writeDisplaySettings("create", null);
  refreshPriceModeHelp("create");
  setCreateSection(true);
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
function handleDatabaseError(error) {
  if (error?.code === "42501") { alert("この操作を行う権限がありません。運営者アカウントと会社の管理担当設定を確認してください。"); return; }

  if (
    error?.code === "23505"
  ) {
    alert(
      "このサイト識別名はすでに使用されています。"
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
    "/login.html";
}

// 一覧・登録フォームの操作。DBの権限や登録方法は既存処理を使用する。
let previousModalFocus = null;

function setCreateSection(open) {
  const section = document.getElementById("createSection");
  section.hidden = !open;
  document.getElementById("toggleCreateButton").setAttribute("aria-expanded", String(open));
  if (open) {
    section.scrollIntoView({ behavior: "smooth", block: "start" });
    document.getElementById("companyName").focus({ preventScroll: true });
  } else {
    document.getElementById("toggleCreateButton").focus();
  }
}

function bindWorkspaceEvents() {
  document.getElementById("toggleCreateButton").addEventListener("click", () => {
    setCreateSection(document.getElementById("createSection").hidden);
  });
  document.getElementById("sidebarCreateButton").addEventListener("click", () => setCreateSection(true));
  document.getElementById("closeCreateButton").addEventListener("click", () => setCreateSection(false));
  document.getElementById("clientSearch").addEventListener("input", renderClients);
  document.getElementById("clientTypeFilter").addEventListener("change", renderClients);
  document.getElementById("clientSort").addEventListener("change", renderClients);
  document.getElementById("refreshClientsButton").addEventListener("click", async event => {
    const button = event.currentTarget;
    setBusy(button, true, "更新中…");
    try { await loadClients(); }
    catch (error) { console.error(error); showToast("一覧を更新できませんでした"); }
    finally { setBusy(button, false, "↻ 一覧を更新"); }
  });
  document.getElementById("copyAdminUrlButton").addEventListener("click", () => copyLink(document.getElementById("adminUrl").href));
  document.getElementById("copyPublicUrlButton").addEventListener("click", () => copyLink(document.getElementById("publicUrl").href));
  document.getElementById("editClientModal").addEventListener("keydown", event => {
    if (event.key !== "Tab") return;
    const controls = [...event.currentTarget.querySelectorAll('button:not(:disabled), input:not([type="hidden"]):not(:disabled), select:not(:disabled), summary')]
      .filter(el => el.getClientRects().length);
    const first = controls[0], last = controls[controls.length - 1];
    if (!first) return;
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
}

async function copyLink(url) {
  try {
    if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
    await navigator.clipboard.writeText(url);
    showToast("リンクをコピーしました");
  } catch (error) {
    // コピーが許可されないブラウザでは手動コピーできるようにする。
    window.prompt("このリンクをコピーしてください。", url);
  }
}

function buildCompanyLinks(slug) {
  if (typeof slug !== "string" || !isValidSlug(slug)) return null;
  return {admin:window.sasulieURLs.editorURL(slug),public:window.sasulieURLs.publicURL(slug)};
}
async function requireCreatorIdentity() {
  const {data,error} = await supabaseClient.auth.getUser();
  if (error || !data?.user || data.user.id !== operatorUserId || !await checkCreatorAdmin(data.user.id)) {
    throw {code:"42501",message:"creator_required"};
  }
  return data.user.id;
}
async function loadOwnMemberships() {
  membershipState = "loading";
  ownCompanyIds = new Set();
  try {
    const {data,error} = await supabaseClient.from("company_members").select("company_id").eq("user_id",operatorUserId);
    if (error) throw error;
    ownCompanyIds = new Set((data || []).map(row=>String(row.company_id)));
    membershipState = "ready";
  } catch (error) {
    console.error("管理担当の取得エラー:",error);
    membershipState = "error";
  }
}
async function ensureCompanyMember(companyId,userId) {
  const query = () => supabaseClient.from("company_members").select("company_id").eq("company_id",companyId).eq("user_id",userId).maybeSingle();
  const existing = await query();
  if (existing.error) throw existing.error;
  if (existing.data) return;
  const {error} = await supabaseClient.from("company_members").insert([{company_id:companyId,user_id:userId}]);
  if (error) {
    if (error.code === "23505") { const checked = await query(); if (!checked.error && checked.data) return; }
    throw error;
  }
}
async function addOperatorToCompany(companyId,button) {
  const id = String(companyId);
  if (assigningCompanies.has(id) || membershipState !== "ready" || !clients.some(c=>String(c.id)===id)) return;
  assigningCompanies.add(id);
  setBusy(button,true,"設定中…");
  try {
    const uid = await requireCreatorIdentity();
    await ensureCompanyMember(companyId,uid);
    await loadOwnMemberships();
    renderClients();
    refreshEditMembershipStatus();
    showToast("編集できるようになりました。「編集・デザイン設定」から開けます");
  } catch(error) { console.error(error); handleDatabaseError(error); }
  finally { assigningCompanies.delete(id); setBusy(button,false,"自分を管理担当に追加"); }
}
function refreshEditMembershipStatus() {
  const id = document.getElementById("editClientId").value;
  const own = ownCompanyIds.has(String(id));
  document.getElementById("editAccessStatus").textContent = membershipState === "error"
    ? "管理担当を確認できません。一覧を更新してから再確認してください。"
    : own ? "自分もこの会社の管理担当です。編集画面から内容やデザインを変更できます。"
    : "自分を管理担当に追加すると、この会社の内容やデザインを編集できます。";
  document.getElementById("addOperatorMembershipButton").hidden = own || membershipState !== "ready";
}
async function addClientMember() {
  const button = document.getElementById("addClientMemberButton");
  if (button.disabled) return;
  const id = document.getElementById("editClientId").value;
  const uid = document.getElementById("additionalMemberUid").value.trim();
  if (!clients.some(c=>String(c.id)===String(id)) || !isValidUuid(uid)) { alert("作成済みアカウントのユーザーIDを確認してください。"); return; }
  setBusy(button,true,"追加中…");
  try {
    await requireCreatorIdentity();
    await ensureCompanyMember(id,uid);
    document.getElementById("memberFeedback").textContent = "担当者を追加しました。この会社の編集リンクと、本人のログイン情報を案内できます。";
    await loadOwnMemberships();
    renderClients();
    refreshEditMembershipStatus();
  } catch(error) { console.error(error); document.getElementById("memberFeedback").textContent="担当者を追加できませんでした。ユーザーIDと権限を確認してください。"; handleDatabaseError(error); }
  finally { setBusy(button,false,"この会社の担当者に追加"); }
}


function readDisplaySettings(prefix) {
  const contact = document.getElementById(`${prefix}ContactMethod`).value;
  const price = document.getElementById(`${prefix}PriceMode`).value;
  const closed = document.getElementById(`${prefix}ShowClosedDays`).value;
  if (!Object.hasOwn(window.companySettings.CONTACT_METHODS,contact) || !Object.hasOwn(window.companySettings.PRICE_MODES,price) || !["true","false"].includes(closed)) return null;
  return {contact_method:contact,price_input_mode:price,show_closed_days:closed === "true"};
}
function writeDisplaySettings(prefix,company) {
  const options=window.companySettings.settings(company);
  document.getElementById(`${prefix}ContactMethod`).value=options.contactMethod;
  document.getElementById(`${prefix}PriceMode`).value=options.priceMode;
  document.getElementById(`${prefix}ShowClosedDays`).value=String(options.showClosedDays);
}
function refreshPriceModeHelp(prefix) {
  const type=document.getElementById(prefix === "edit" ? "editBusinessType" : "businessType").value;
  const hospital=type === "hospital";
  document.getElementById(`${prefix}PriceMode`).disabled=hospital;
  document.getElementById(`${prefix}PriceModeHelp`).textContent=hospital
    ? "病院・クリニックの診療科には料金を表示しません。料金の入力設定は他の業種に変更した場合に使います。"
    : "保存済みの料金は自動変換しません。各サービスで料金を保存すると表記が切り替わります。";
}
function bindDisplaySettings() {
  document.getElementById("businessType").addEventListener("change",()=>refreshPriceModeHelp("create"));
  document.getElementById("editBusinessType").addEventListener("change",()=>refreshPriceModeHelp("edit"));
  refreshPriceModeHelp("create");
}

// Operator-only contract records. No public/editor cutoff or billing changes.
const CONTRACT_FIELDS = "company_id,billing_plan,service_status,start_date,end_date,updated_at";
const CONTRACT_PLANS = Object.freeze({monthly:"月払い",annual:"年払い"});
const CONTRACT_STATUSES = Object.freeze({active:"利用中",ending:"終了予定",ended:"利用終了"});
let contractRecords = new Map();
let contractsState = "loading";
let contractCompanyId = null;
let contractOriginal = null;
let contractSaving = false;
let contractConflict = false;
let contractPreviousFocus = null;
let contractInertStates = [];

function dateParts(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y,m,d]=value.split("-").map(Number);
  if (y<1 || y>9999 || m<1 || m>12 || d<1 || d>31) return null;
  const date=new Date(0);date.setUTCHours(0,0,0,0);date.setUTCFullYear(y,m-1,d);
  if (date.getUTCFullYear()!==y || date.getUTCMonth()!==m-1 || date.getUTCDate()!==d) return null;
  return {y,m,d,date};
}
function japanToday() {
  const parts=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Tokyo",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
  const get=type=>parts.find(p=>p.type===type).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}
function annualEndDate(start) {
  const p=dateParts(start);if(!p || p.y>=9999)return "";
  const date=new Date(0);date.setUTCHours(0,0,0,0);date.setUTCFullYear(p.y+1,p.m-1,p.d);
  date.setUTCDate(date.getUTCDate()-1);
  return `${String(date.getUTCFullYear()).padStart(4,"0")}-${String(date.getUTCMonth()+1).padStart(2,"0")}-${String(date.getUTCDate()).padStart(2,"0")}`;
}
function contractDateLabel(value) {
  const p=dateParts(value);return p ? `${p.y}/${String(p.m).padStart(2,"0")}/${String(p.d).padStart(2,"0")}` : "未設定";
}
function contractDaysLeft(record) {
  const end=dateParts(record?.end_date),today=dateParts(japanToday());
  return end&&today ? Math.round((end.date-today.date)/86400000) : null;
}
function matchesContractFilter(companyId,filter) {
  if (!filter)return true;
  if (contractsState!=="ready")return false;
  const record=contractRecords.get(String(companyId));
  if (filter==="unregistered")return !record;
  if (filter==="overdue")return Boolean(record && record.service_status!=="ended" && contractDaysLeft(record)<0);
  return record?.service_status===filter;
}
function compareContractEnds(a,b) {
  const key=client=>contractRecords.get(String(client.id))?.end_date || "9999-99-99";
  return key(a).localeCompare(key(b)) || String(a.id).localeCompare(String(b.id),"en",{numeric:true});
}
async function loadContracts() {
  contractsState="loading";contractRecords=new Map();
  const status=document.getElementById("contractLoadStatus");
  const filter=document.getElementById("contractStatusFilter");
  status.textContent="契約情報を確認しています。";filter.disabled=true;
  try {
    const next=new Map();
    for(let i=0;i<clients.length;i+=200) {
      const ids=clients.slice(i,i+200).map(c=>c.id);
      const {data,error}=await supabaseClient.from("client_contracts").select(CONTRACT_FIELDS).in("company_id",ids);
      if(error)throw error;
      for(const record of data||[])next.set(String(record.company_id),record);
    }
    contractRecords=next;contractsState="ready";filter.disabled=false;
    status.textContent=`契約登録 ${next.size}件 ／ 未登録 ${clients.filter(c=>!next.has(String(c.id))).length}件。日付は日本時間・終了日当日までの記録です。`;
  } catch(error) {
    console.error("契約情報の取得エラー:",error);
    contractsState="error";filter.value="";
    status.textContent=["42P01","PGRST205"].includes(error?.code)
      ? "契約情報の保存先が未準備です。同梱のSQLを実行してから「一覧を更新」してください。"
      : "契約情報を読み込めませんでした。通信状態・運営者権限を確認し、「一覧を更新」してください。";
  }
}
function createContractSummary(companyId) {
  const box=document.createElement("div");box.className="client-contract-summary";
  if(contractsState!=="ready") {
    box.textContent=contractsState==="error" ? "契約情報：確認できません" : "契約情報：確認中";
    return box;
  }
  const record=contractRecords.get(String(companyId));
  const badge=document.createElement("span");badge.className="contract-badge";
  if(!record) {
    badge.textContent="契約未登録";
    const note=document.createElement("p");note.textContent="契約が決まったら、プランと利用期間を記録できます。";
    box.append(badge,note);return box;
  }
  badge.dataset.status=record.service_status;
  badge.textContent=`契約：${CONTRACT_STATUSES[record.service_status]||"要確認"}`;
  const plan=document.createElement("span");plan.className="contract-plan";plan.textContent=CONTRACT_PLANS[record.billing_plan]||"プラン未設定";
  const dates=document.createElement("p");dates.className="contract-dates";
  dates.textContent=`${contractDateLabel(record.start_date)} 〜 ${contractDateLabel(record.end_date)}（当日まで）`;
  box.append(badge,plan,dates);
  const left=contractDaysLeft(record);
  if(record.service_status!=="ended" && left!==null && left<=30) {
    const notice=document.createElement("p");notice.className="contract-deadline";
    notice.textContent=left<0 ? "記録上の期間が終了しています。継続・終了の確認が必要です。"
      : left===0 ? "本日が記録上の利用終了日です。" : `記録上の利用終了日まで、あと${left}日です。`;
    box.appendChild(notice);
  }
  return box;
}
function contractError(message) {
  const feedback=document.getElementById("contractFeedback");
  feedback.textContent=message;feedback.classList.add("is-error");
}
function updateContractPeriodHelp() {
  const plan=document.getElementById("contractPlan").value;
  const start=document.getElementById("contractStart").value;
  const expected=annualEndDate(start);
  const button=document.getElementById("suggestAnnualEndButton");
  button.hidden=plan!=="annual";button.disabled=contractSaving||!expected;
  const help=document.getElementById("contractPeriodHelp");
  if(plan!=="annual")help.textContent="月払いは、支払いの対象となる期間を入力してください。";
  else if(!expected)help.textContent="年払いは契約開始日を入力すると、1年間の終了日を入力できます。";
  else {
    const end=document.getElementById("contractEnd").value;
    help.textContent=`年払いの1年間の満了日は ${contractDateLabel(expected)} です。`+
      (end && end!==expected ? " 現在の終了日はこれと異なります。契約内容と照合してください。" : " 下の保存ボタンで記録できます。");
  }
}
function openContractModal(companyId) {
  if(contractSaving)return;
  const client=clients.find(c=>String(c.id)===String(companyId));if(!client)return;
  if(document.getElementById("editClientModal").classList.contains("open"))closeEditClientModal();
  contractPreviousFocus=document.activeElement;
  contractCompanyId=String(client.id);
  contractOriginal=contractRecords.get(contractCompanyId)||null;
  contractConflict=false;
  document.getElementById("contractCompanyName").textContent=client.name||"名称未設定";
  document.getElementById("contractPlan").value=contractOriginal?.billing_plan||"";
  document.getElementById("contractStatus").value=contractOriginal?.service_status||"active";
  document.getElementById("contractStart").value=contractOriginal?.start_date||"";
  document.getElementById("contractEnd").value=contractOriginal?.end_date||"";
  const feedback=document.getElementById("contractFeedback");feedback.classList.remove("is-error");feedback.textContent="";
  document.getElementById("contractFields").disabled=contractsState!=="ready";
  document.getElementById("saveContractButton").disabled=contractsState!=="ready";
  if(contractsState!=="ready")contractError("契約情報を確認できないため保存できません。閉じて「一覧を更新」してください。SQL未実行の場合は先に実行してください。");
  updateContractPeriodHelp();
  const modal=document.getElementById("contractModal");modal.classList.add("open");modal.setAttribute("aria-hidden","false");modal.scrollTop=0;
  contractInertStates=[...document.querySelectorAll(".workspace,.sidebar")].map(el=>({el,inert:el.inert}));
  for(const item of contractInertStates)item.el.inert=true;
  (contractsState==="ready" ? document.getElementById("contractPlan") : document.getElementById("closeContractButton")).focus();
}
function closeContractModal() {
  if(contractSaving)return;
  const modal=document.getElementById("contractModal");if(!modal.classList.contains("open"))return;
  const companyId=contractCompanyId;
  modal.classList.remove("open");modal.setAttribute("aria-hidden","true");
  for(const item of contractInertStates)item.el.inert=item.inert;
  contractInertStates=[];contractCompanyId=null;contractOriginal=null;
  const fallback=[...document.querySelectorAll(".client-card")].find(c=>c.dataset.companyId===companyId)?.querySelector(".contract-open-button");
  if(contractPreviousFocus?.isConnected)contractPreviousFocus.focus();else (fallback||document.getElementById("refreshClientsButton")).focus();
}
async function saveContract(event) {
  event.preventDefault();
  if(contractSaving||contractConflict||contractsState!=="ready"||!contractCompanyId)return;
  if(!document.getElementById("contractForm").reportValidity())return;
  const id=contractCompanyId;
  if(!clients.some(c=>String(c.id)===id))return;
  const billing_plan=document.getElementById("contractPlan").value;
  const service_status=document.getElementById("contractStatus").value;
  const start_date=document.getElementById("contractStart").value;
  const end_date=document.getElementById("contractEnd").value;
  if(!Object.hasOwn(CONTRACT_PLANS,billing_plan)||!Object.hasOwn(CONTRACT_STATUSES,service_status)||!dateParts(start_date)||!dateParts(end_date)) {
    contractError("プラン・利用状況・日付を確認してください。");return;
  }
  if(end_date<start_date) {contractError("利用終了日は、契約開始日以降の日付にしてください。");document.getElementById("contractEnd").focus();return;}
  contractSaving=true;
  const button=document.getElementById("saveContractButton");setBusy(button,true,"保存中…");
  document.getElementById("contractFields").disabled=true;
  document.getElementById("closeContractButton").disabled=true;
  document.getElementById("cancelContractButton").disabled=true;
  const feedback=document.getElementById("contractFeedback");feedback.textContent="";feedback.classList.remove("is-error");
  let saved=false;
  try {
    await requireCreatorIdentity();
    const changes={billing_plan,service_status,start_date,end_date};
    let result;
    if(contractOriginal) {
      result=await supabaseClient.from("client_contracts").update(changes).eq("company_id",id).eq("updated_at",contractOriginal.updated_at).select(CONTRACT_FIELDS).maybeSingle();
      if(!result.error&&!result.data)throw {code:"CONTRACT_CONFLICT"};
    } else result=await supabaseClient.from("client_contracts").insert([{company_id:id,...changes}]).select(CONTRACT_FIELDS).single();
    if(result.error)throw result.error;
    if(!result.data || String(result.data.company_id)!==id)throw {code:"CONTRACT_SAVE_FAILED"};
    contractRecords.set(id,result.data);saved=true;
  } catch(error) {
    console.error("契約情報の保存エラー:",error);
    if(error?.code==="23505"||error?.code==="CONTRACT_CONFLICT") {
      contractConflict=true;
      contractError("別の画面で契約情報が変更されています。上書きしていません。この画面を閉じて「一覧を更新」し、内容を確認してください。");
    } else if(error?.code==="42501")contractError("契約情報を保存する権限がありません。運営者アカウントでログインし直してください。");
    else if(["42P01","PGRST205"].includes(error?.code))contractError("契約情報の保存先が未準備です。SQLを実行してから一覧を更新してください。");
    else if(error?.code==="23514")contractError("保存条件に合わない値があります。日付と入力内容を確認してください。");
    else contractError("保存できませんでした。入力内容は残っています。通信状態を確認して、もう一度保存してください。");
  } finally {
    contractSaving=false;
    document.getElementById("contractFields").disabled=false;
    document.getElementById("closeContractButton").disabled=false;
    document.getElementById("cancelContractButton").disabled=false;
    setBusy(button,contractConflict,"契約情報を保存");
    updateContractPeriodHelp();
  }
  if(saved) {
    renderClients();closeContractModal();
    document.getElementById("contractLoadStatus").textContent=`契約登録 ${contractRecords.size}件 ／ 未登録 ${clients.filter(c=>!contractRecords.has(String(c.id))).length}件。日付は日本時間・終了日当日までの記録です。`;
    showToast("契約情報を保存しました。公開・編集・請求の状態は変わりません。");
  }
}
function bindContractEvents() {
  document.getElementById("contractStatusFilter").addEventListener("change",renderClients);
  document.getElementById("contractForm").addEventListener("submit",saveContract);
  document.getElementById("closeContractButton").addEventListener("click",closeContractModal);
  document.getElementById("cancelContractButton").addEventListener("click",closeContractModal);
  document.querySelector("[data-close-contract-modal]").addEventListener("click",closeContractModal);
  document.addEventListener("keydown",event=>{if(event.key==="Escape")closeContractModal();});
  for(const id of ["contractPlan","contractStart","contractEnd"])document.getElementById(id).addEventListener("change",updateContractPeriodHelp);
  document.getElementById("suggestAnnualEndButton").addEventListener("click",()=>{
    if(contractSaving||document.getElementById("contractPlan").value!=="annual")return;
    const end=annualEndDate(document.getElementById("contractStart").value);
    if(end)document.getElementById("contractEnd").value=end;
    updateContractPeriodHelp();
  });
  document.getElementById("contractModal").addEventListener("keydown",event=>{
    if(event.key!=="Tab")return;
    const controls=[...event.currentTarget.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled)')].filter(el=>el.getClientRects().length&&!el.closest('fieldset[disabled]'));
    const first=controls[0],last=controls[controls.length-1];if(!first)return;
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
}
