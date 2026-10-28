/* CÈDREの公開サイト専用オープニング。認証やデータベースは変更しない。 */
(async () => {
  "use strict";
  if (!await window.serviceAccess.ready) return;

  const dialog = document.getElementById("siteOpening");
  const video = document.getElementById("siteOpeningVideo");
  const skip = document.getElementById("siteOpeningSkip");
  if (!dialog || !video || !skip) return;

  // 会社ごとの設定。falseにすると、その会社の動画を表示しない。
  const settings = {
    "cedre-visual": {
      enabled: true,
      video: "cedre-opening.mp4?v=2",
      portraitVideo: "cedre-opening-portrait.mp4?v=2",
      landscapeVideo: "cedre-opening-landscape.mp4?v=2",
      version: "1"
    }
  };

  const root = document.documentElement;
  let storageKey = "";
  let finished = false;
  let released = false;
  let startupTimer;
  let maximumTimer;
  let fadeTimer;
  let motion;
  let viewportMeta;
  let originalViewport;
  let addedThemeMeta;
  let themeMetaStates = [];

  // 動画中だけ画面端まで背景を伸ばし、Safariの周辺色も揃える。
  function prepareScreen() {
    root.classList.add("site-opening-active");
    viewportMeta = document.querySelector?.('meta[name="viewport"]');
    if (viewportMeta) {
      originalViewport = viewportMeta.getAttribute("content");
      const value = (originalViewport || "width=device-width, initial-scale=1")
        .replace(/,?\s*viewport-fit\s*=\s*[^,]+/gi, "");
      viewportMeta.setAttribute("content", value + ", viewport-fit=cover");
    }
    const themes = document.querySelectorAll?.('meta[name="theme-color"]') || [];
    for (const meta of themes) {
      themeMetaStates.push({ meta, content: meta.getAttribute("content"), media: meta.getAttribute("media") });
      meta.setAttribute("content", "#091a1c");
      meta.removeAttribute("media");
    }
    if (!themes.length && document.head && document.createElement) {
      addedThemeMeta = document.createElement("meta");
      addedThemeMeta.setAttribute("name", "theme-color");
      addedThemeMeta.setAttribute("content", "#091a1c");
      document.head.prepend(addedThemeMeta);
    }
  }

  function restoreScreen() {
    if (viewportMeta) {
      if (originalViewport === null) viewportMeta.removeAttribute("content");
      else viewportMeta.setAttribute("content", originalViewport);
    }
    for (const { meta, content, media } of themeMetaStates) {
      if (content === null) meta.removeAttribute("content");
      else meta.setAttribute("content", content);
      if (media === null) meta.removeAttribute("media");
      else meta.setAttribute("media", media);
    }
    themeMetaStates = [];
    addedThemeMeta?.remove();
    addedThemeMeta = undefined;
  }

  function markSeen() {
    if (!storageKey) return;
    try {
      window.sessionStorage.setItem(storageKey, "seen");
    } catch {
      // 保存できないブラウザでも、サイトの表示を続ける。
    }
  }

  function release() {
    if (released) return;
    released = true;
    window.clearTimeout(startupTimer);
    window.clearTimeout(maximumTimer);
    window.clearTimeout(fadeTimer);

    skip.removeEventListener("click", onSkip);
    dialog.removeEventListener("cancel", onCancel);
    dialog.removeEventListener("close", onUnexpectedClose);
    dialog.removeEventListener("keydown", onKeyboard);
    dialog.removeEventListener("pointerdown", onPointer);
    video.removeEventListener("playing", onPlaying);
    video.removeEventListener("ended", onEnded);
    video.removeEventListener("error", onError);
    window.removeEventListener("pagehide", onPageHide);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    motion?.removeEventListener?.("change", onMotionChange);

    try {
      video.pause();
      video.removeAttribute("src");
      video.load();
    } catch {
      // 動画の停止に失敗しても、ページの操作は必ず戻す。
    }
    try {
      if (dialog.open) dialog.close();
    } finally {
      dialog.remove();
      restoreScreen();
      root.classList.remove("site-opening-active");
    }
  }

  function finish(immediate = false) {
    if (finished) {
      if (immediate) release();
      return;
    }
    finished = true;
    markSeen();
    window.clearTimeout(startupTimer);
    window.clearTimeout(maximumTimer);
    try { video.pause(); } catch { /* ページ表示を優先する。 */ }

    if (immediate || !dialog.open) {
      release();
    } else {
      dialog.classList.add("is-closing");
      fadeTimer = window.setTimeout(release, 220);
    }
  }

  function onKeyboard(event) {
    if (event.key === "Tab") dialog.classList.add("is-keyboard");
  }
  function onPointer() { dialog.classList.remove("is-keyboard"); }
  function onSkip() { finish(); }
  function onCancel(event) {
    event.preventDefault();
    finish();
  }
  function onUnexpectedClose() { finish(true); }
  function onPlaying() { window.clearTimeout(startupTimer); }
  function onEnded() { finish(); }
  function onError() { finish(true); }
  function onPageHide() { finish(true); }
  function onVisibilityChange() {
    if (document.visibilityState === "hidden") finish(true);
  }
  function onMotionChange(event) {
    if (event.matches) finish(true);
  }

  try {
    const slug = window.sasulieURLs.company();
    const config = settings[slug];
    motion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (
      !config?.enabled ||
      window.location.hash ||
      motion.matches ||
      navigator.connection?.saveData ||
      document.visibilityState === "hidden" ||
      typeof dialog.showModal !== "function"
    ) {
      release();
      return;
    }

    storageKey = `cms:opening:${slug}:v${config.version}`;
    try {
      if (window.sessionStorage.getItem(storageKey) === "seen") {
        release();
        return;
      }
    } catch {
      // sessionStorageを使えない場合は、今回のページ表示だけで動作する。
    }

    prepareScreen();

    // 正方形の動画を無理に拡大せず、画面に近い比率の動画を選ぶ。
    const viewportWidth = window.innerWidth || root.clientWidth;
    const viewportHeight = window.innerHeight || root.clientHeight;
    const viewportRatio = viewportWidth / viewportHeight;
    const videoPath = viewportRatio < 0.8
      ? (config.portraitVideo || config.video)
      : viewportRatio > 1.3
        ? (config.landscapeVideo || config.video)
        : config.video;
    const source = new URL("/" + videoPath, location.origin);
    if (source.origin !== window.location.origin) {
      release();
      return;
    }

    skip.addEventListener("click", onSkip);
    dialog.addEventListener("cancel", onCancel);
    dialog.addEventListener("close", onUnexpectedClose);
    dialog.addEventListener("keydown", onKeyboard);
    dialog.addEventListener("pointerdown", onPointer);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("ended", onEnded);
    video.addEventListener("error", onError);
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibilityChange);
    motion.addEventListener?.("change", onMotionChange);

    // 読み込みが遅い場合は1.8秒、途中で止まっても最大6秒でサイトへ進む。
    startupTimer = window.setTimeout(() => finish(true), 1800);
    maximumTimer = window.setTimeout(() => finish(true), 6000);

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.autoplay = true;
    dialog.hidden = false;
    root.classList.add("site-opening-active");
    dialog.showModal();
    skip.focus({ preventScroll: true });
    video.src = source.href;

    const playback = video.play();
    if (playback && typeof playback.catch === "function") {
      playback.catch(() => finish(true));
    }
  } catch (error) {
    finish(true);
    console.warn("オープニングを省略してサイトを表示します。", error);
  }
})();
