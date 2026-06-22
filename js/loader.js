/**
 * Limit 180 - 元件視圖載入器
 * 負責將 views/ 底下的 HTML 元件動態載入至主頁面，解決 index.html 過於肥大的問題。
 */
(function() {
  const VIEWS = [
    { id: 'view-home', path: 'views/home.html', parent: 'main' },
    { id: 'view-lobby', path: 'views/lobby.html', parent: 'main' },
    { id: 'view-game', path: 'views/game.html', parent: 'main' },
    { id: 'view-result', path: 'views/result.html', parent: 'main' },
    { id: 'view-achievements', path: 'views/achievements.html', parent: 'main' },
    { id: 'view-review', path: 'views/review.html', parent: 'main' },
    { id: 'view-store', path: 'views/store.html', parent: 'main' },
    { id: 'demote-modal', path: 'views/demote-modal.html', parent: 'body' },
    { id: 'auth-modal', path: 'views/auth-modal.html', parent: 'body' },
    { id: 'profile-modal', path: 'views/profile-modal.html', parent: 'body' },
    { id: 'placement-modal', path: 'views/placement-modal.html', parent: 'body' }
  ];

  // 加上時間戳以避免瀏覽器或 CDN 快取舊版 HTML 元件
  const CACHE_BUSTER = `?v=${Date.now()}`;

  // 偵測是否為手機 In-App 內建瀏覽器 (如 Line, FB, WeChat)，並強制外部瀏覽器開啟
  function checkMobileInAppBrowser() {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    const isLine = ua.indexOf('LINE') > -1;
    const isFb = (ua.indexOf('FBAN') > -1) || (ua.indexOf('FBAV') > -1);
    const isWeChat = ua.indexOf('MicroMessenger') > -1;
    const isInstagram = ua.indexOf('Instagram') > -1;

    if (isLine || isFb || isWeChat || isInstagram) {
      showExternalBrowserGuide();
      return true;
    }
    return false;
  }

  function showExternalBrowserGuide() {
    const guideOverlay = document.createElement('div');
    guideOverlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: #0a0a12;
      color: #ff007f;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      font-family: 'Share Tech Mono', 'Microsoft JhengHei', sans-serif;
      padding: 24px;
      text-align: center;
      border: 4px solid #ff007f;
      box-shadow: 0 0 25px #ff007f;
    `;
    guideOverlay.innerHTML = `
      <h2 style="font-size: 1.8rem; margin-bottom: 20px; text-shadow: 0 0 10px #ff007f; font-weight: 900;">⚠️ 偵測到內建瀏覽器 ⚠️</h2>
      <p style="max-width: 500px; line-height: 1.6; color: #cbd5e1; font-size: 1rem; margin-bottom: 30px;">
        為確保遊戲的鍵盤輸入、音效與本地成績存檔能正常運作，請勿在手機通訊軟體 (如 LINE、FB) 內直接開啟。<br><br>
        <strong>請點擊右上角選單「...」，選擇「在外部瀏覽器開啟」(如 Chrome 或 Safari) 進行操作。</strong>
      </p>
      <div style="background: #121224; border: 1px solid #1f2937; padding: 15px; border-radius: 8px; color: #39ff14; font-size: 0.9rem; word-break: break-all; width: 100%; max-width: 400px; margin-bottom: 20px;">
        網址：<br>
        <strong>${window.location.href}</strong>
      </div>
      <button onclick="navigator.clipboard.writeText('${window.location.href}'); alert('網址已複製！請至 Chrome / Safari 開啟！');" 
        style="background: #ff007f; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; cursor: pointer; transition: transform 0.2s;">
        📋 複製網址
      </button>
    `;
    document.body.appendChild(guideOverlay);
  }

  async function loadComponent(view) {
    const response = await fetch(view.path + CACHE_BUSTER);
    if (!response.ok) {
      throw new Error(`無法載入視圖元件: ${view.path}`);
    }
    const htmlText = await response.text();
    return { ...view, html: htmlText };
  }

  async function init() {
    // 若為手機 app 內置瀏覽器則中斷載入並顯示強導頁面
    if (checkMobileInAppBrowser()) {
      return;
    }
    try {
      const results = await Promise.all(VIEWS.map(view => loadComponent(view)));
      
      // 將載入的 HTML 注入到對應的位置
      results.forEach(result => {
        const parentEl = document.querySelector(result.parent);
        if (parentEl) {
          // 建立一個臨時的 div 來解析 HTML
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = result.html.trim();
          
          // 取得解析後的第一個子元素
          const newElement = tempDiv.firstElementChild;
          if (newElement) {
            parentEl.appendChild(newElement);
          }
        }
      });

      console.log('[Loader] 所有視圖元件載入成功。');
      
      // 觸發自訂事件，通知 game.js 進行初始化與事件綁定
      window.dispatchEvent(new Event('limit180ComponentsLoaded'));
      
    } catch (error) {
      console.error('[Loader] 載入元件失敗：', error);
      
      // 偵測是否為 CORS 錯誤 (通常在 file:// 協定下雙擊打開會發生)
      if (window.location.protocol === 'file:') {
        showCorsError();
      } else {
        alert('載入遊戲元件失敗，請重新整理網頁！\n詳細資訊：' + error.message);
      }
    }
  }

  function showCorsError() {
    const errorOverlay = document.createElement('div');
    errorOverlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: #0a0a12;
      color: #ff007f;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      font-family: 'Share Tech Mono', monospace;
      padding: 20px;
      text-align: center;
      border: 4px solid #ff007f;
      box-shadow: 0 0 20px #ff007f;
    `;
    errorOverlay.innerHTML = `
      <h2 style="font-size: 2rem; margin-bottom: 20px; text-shadow: 0 0 10px #ff007f;">⚠️ 瀏覽器 CORS 安全限制 ⚠️</h2>
      <p style="max-width: 600px; line-height: 1.6; color: #cbd5e1; font-size: 1.1rem; margin-bottom: 30px;">
        偵測到您直接以「雙擊檔案 (file://)」的方式開啟網頁。<br>
        由於瀏覽器的安全性考量，動態元件拆解機制 (CORS) 無法在直接雙擊的情況下運行。
      </p>
      <div style="background: #121224; border: 1px solid #1f2937; padding: 20px; border-radius: 4px; text-align: left; color: #39ff14; font-family: monospace;">
        <strong>請使用以下任一方式運行：</strong><br>
        1. 在終端機執行本機伺服器 (例如：python -m http.server 8000)<br>
        2. 使用 VS Code 的 Live Server 延伸模組開啟<br>
        3. 執行本專案的 dev 開發指令伺服器
      </div>
    `;
    document.body.appendChild(errorOverlay);
  }

  // 確保 DOM 載入後才執行載入器
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
