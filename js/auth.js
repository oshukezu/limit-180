// MathSprint 2.0 — 認證模組 (Auth Module)
// 負責 Supabase 認證：匿名登入、Google OAuth、帳號升級與狀態監聽

(function() {
  // 若未設定 Supabase，靜默跳過所有認證邏輯
  const CFG = window.MATH_SPRINT_CONFIG;
  if (!CFG || !CFG.CLOUD_ENABLED) {
    window.MathSprintAuth = { 
      isReady: false, 
      currentUser: null,
      getUser: () => null,
      signInAnonymously: async () => {},
      signInWithGoogle: async () => {},
      linkGoogleAccount: async () => {},
      signOut: async () => {}
    };
    return;
  }

  // 初始化 Supabase client（需先載入 CDN）
  const supabase = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);

  // 生成隨機像素戰隊代號（匿名帳號預設暱稱）
  function generatePixelCodename() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'PIXEL-';
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  const Auth = {
    isReady: false,
    currentUser: null,
    supabase: supabase,

    // 取得目前登入用戶
    getUser() {
      return this.currentUser;
    },

    // 取得或生成用戶暱稱（存在 localStorage 中作為快取）
    getNickname() {
      let nick = localStorage.getItem('math_sprint_nickname');
      if (!nick) {
        nick = generatePixelCodename();
        localStorage.setItem('math_sprint_nickname', nick);
      }
      return nick;
    },

    // 頁面載入時自動靜默匿名登入
    async signInAnonymously() {
      try {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
        this.currentUser = data.user;
        console.log('[Auth] 匿名登入成功:', data.user?.id?.slice(0, 8) + '...');

        // 確保 user_profile 存在
        await this._ensureProfile(data.user);
        return data.user;
      } catch (e) {
        console.warn('[Auth] 匿名登入失敗（將以離線模式執行）:', e.message);
        return null;
      }
    },

    // Google OAuth 登入（popup 模式）
    async signInWithGoogle() {
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { skipBrowserRedirect: false }
        });
        if (error) throw error;
        return data;
      } catch (e) {
        console.error('[Auth] Google 登入失敗:', e.message);
        this._showAuthError('Google 登入失敗：' + e.message);
        return null;
      }
    },

    // 將匿名帳號升級連結至 Google 帳號
    async linkGoogleAccount() {
      try {
        const { data, error } = await supabase.auth.linkIdentity({ provider: 'google' });
        if (error) throw error;
        console.log('[Auth] Google 帳號連結成功');
        return data;
      } catch (e) {
        console.error('[Auth] 帳號連結失敗:', e.message);
        return null;
      }
    },

    // 登出
    async signOut() {
      try {
        await supabase.auth.signOut();
        this.currentUser = null;
        this._updateAuthUI(null);
      } catch (e) {
        console.error('[Auth] 登出失敗:', e.message);
      }
    },

    // 確保 user_profiles 資料表有此用戶的記錄
    async _ensureProfile(user) {
      if (!user) return;
      try {
        const { error } = await supabase
          .from('user_profiles')
          .upsert({
            id: user.id,
            nickname: this.getNickname(),
            updated_at: new Date().toISOString()
          }, { onConflict: 'id', ignoreDuplicates: true });
        if (error) console.warn('[Auth] _ensureProfile 失敗:', error.message);
      } catch (e) {
        console.warn('[Auth] _ensureProfile 例外:', e.message);
      }
    },

    // 監聽認證狀態變化（登入/登出 → 觸發雲端同步）
    onAuthStateChange() {
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('[Auth] 狀態變更:', event);
        this.currentUser = session?.user || null;
        this._updateAuthUI(session?.user || null);

        if (event === 'SIGNED_IN' && session?.user) {
          // 首次登入或恢復登入 → 觸發雙向同步
          if (window.MathSprintCloudSync) {
            await window.MathSprintCloudSync.syncOnLogin();
          }
          // 觸發排行榜更新
          if (window.MathSprintLeaderboard) {
            window.MathSprintLeaderboard.subscribeRealtime();
          }
        }
        this.isReady = true;
      });
    },

    // 更新 Header 帳號按鈕的顯示狀態
    _updateAuthUI(user) {
      const btn = document.getElementById('auth-account-btn');
      const nick = document.getElementById('auth-nickname-display');
      const loginBtn = document.getElementById('auth-google-btn');

      if (!btn) return;

      if (user) {
        const isAnon = user.app_metadata?.provider === 'anonymous';
        nick && (nick.textContent = this.getNickname());
        btn.classList.remove('hidden');
        loginBtn && (loginBtn.textContent = isAnon ? '🔗 連結 Google 帳號' : '✅ 已登入');
      } else {
        nick && (nick.textContent = '未登入');
      }
    },

    // 顯示認證錯誤訊息
    _showAuthError(msg) {
      const el = document.getElementById('auth-error-msg');
      if (el) {
        el.textContent = msg;
        el.classList.remove('hidden');
        setTimeout(() => el.classList.add('hidden'), 4000);
      }
    },

    // 初始化：自動匿名登入 + 監聽狀態
    async init() {
      this.onAuthStateChange();

      // 嘗試還原已有的 session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // 無 session → 自動靜默匿名登入
        await this.signInAnonymously();
      } else {
        this.currentUser = session.user;
        this._updateAuthUI(session.user);
        this.isReady = true;
      }
    }
  };

  window.MathSprintAuth = Auth;
})();
