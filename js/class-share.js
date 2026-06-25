// Limit 180 — 前台開團分享碼入口
(function() {
  const PENDING_SHARE_CODE_KEY = 'limit180_pending_join_share_code';
  function getIdentity() {
    try {
      return JSON.parse(localStorage.getItem('limit180_user_profile') || 'null');
    } catch (_) {
      return null;
    }
  }

  function isValidIdentity(identity) {
    return !!(identity && identity.grade_class && identity.seat_number && identity.nickname && identity.grade_class !== '訪客');
  }

  function setUI(code, hint) {
    const codeEl = document.getElementById('home-team-share-code');
    const hintEl = document.getElementById('home-team-share-hint');
    if (codeEl) codeEl.textContent = code || '-----';
    if (hintEl) hintEl.textContent = hint || '';
  }

  function setTeamInfo(teamInfo) {
    const emptyEl = document.getElementById('home-team-info-empty');
    const cardEl = document.getElementById('home-team-info-card');
    const nameEl = document.getElementById('home-team-info-name');
    const roleEl = document.getElementById('home-team-info-role');
    const countEl = document.getElementById('home-team-info-count');
    if (!emptyEl || !cardEl || !nameEl || !roleEl || !countEl) return;

    if (!teamInfo) {
      emptyEl.classList.remove('hidden');
      cardEl.classList.add('hidden');
      return;
    }

    nameEl.textContent = teamInfo.className || '未命名團隊';
    roleEl.textContent = teamInfo.myRole === 'owner' ? '團主' : '成員';
    countEl.textContent = String(teamInfo.memberCount || 0);
    emptyEl.classList.add('hidden');
    cardEl.classList.remove('hidden');
  }

  async function getMyLatestCode() {
    const identity = getIdentity();
    if (!isValidIdentity(identity)) return null;
    if (!window.MathSprintSupabaseService?.listClassShareCodes) return null;
    const rows = await window.MathSprintSupabaseService.listClassShareCodes();
    const mine = (rows || []).filter((r) =>
      String(r.owner_grade_class || '') === String(identity.grade_class || '') &&
      String(r.owner_seat_number || '') === String(identity.seat_number || '') &&
      String(r.owner_nickname || '') === String(identity.nickname || '') &&
      !!r.is_active
    );
    mine.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return mine[0] || null;
  }

  async function refreshMyCode() {
    const identity = getIdentity();
    const joinInput = document.getElementById('home-team-join-code-input');
    const joinBtn = document.getElementById('home-team-join-btn');

    if (isValidIdentity(identity)) {
      if (joinInput) {
        joinInput.disabled = true;
        joinInput.placeholder = '已加入班級團隊';
        joinInput.classList.add('opacity-50', 'cursor-not-allowed');
        joinInput.value = '';
      }
      if (joinBtn) {
        joinBtn.disabled = true;
        joinBtn.classList.add('opacity-50', 'cursor-not-allowed');
      }
    } else {
      if (joinInput) {
        joinInput.disabled = false;
        joinInput.placeholder = '輸入5位碼';
        joinInput.classList.remove('opacity-50', 'cursor-not-allowed');
      }
      if (joinBtn) {
        joinBtn.disabled = false;
        joinBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      }
    }

    if (!isValidIdentity(identity)) {
      setUI('-----', '登入後可建立專屬分享碼');
      setTeamInfo(null);
      return null;
    }
    try {
      const row = await getMyLatestCode();
      if (row?.share_code) {
        setUI(row.share_code, `${identity.grade_class} 班 ${identity.seat_number} 號・${identity.nickname}`);
      } else {
        setUI('-----', '尚未建立，點擊「建立分享碼」');
      }
      if (window.MathSprintSupabaseService?.getMyTeamInfo) {
        const teamInfo = await window.MathSprintSupabaseService.getMyTeamInfo(
          identity.grade_class,
          identity.seat_number,
          identity.nickname
        );
        setTeamInfo(teamInfo);
      } else {
        setTeamInfo(null);
      }
      return row?.share_code || null;
    } catch (err) {
      setUI('-----', '讀取分享碼失敗，稍後再試');
      setTeamInfo(null);
      return null;
    }
  }

  async function createMyCode() {
    const identity = getIdentity();
    if (!isValidIdentity(identity)) {
      window.UIFeedback?.toast?.('請先登入再建立分享碼', 'error');
      return;
    }
    try {
      const existing = await getMyLatestCode();
      if (existing?.share_code) {
        setUI(existing.share_code, `${identity.grade_class} 班 ${identity.seat_number} 號・${identity.nickname}`);
        window.UIFeedback?.toast?.('已存在可用分享碼，直接使用即可', 'info');
        return;
      }

      const created = await window.MathSprintSupabaseService.createClassShareCode(
        identity.grade_class,
        identity.seat_number,
        identity.nickname,
        `${identity.grade_class} 班團`
      );
      const code = created?.share_code || '-----';
      setUI(code, `${identity.grade_class} 班 ${identity.seat_number} 號・${identity.nickname}`);
      window.UIFeedback?.toast?.('分享碼建立成功', 'success');
    } catch (err) {
      window.UIFeedback?.toast?.(`建立失敗：${err.message}`, 'error');
    }
  }

  async function copyMyCode() {
    const codeEl = document.getElementById('home-team-share-code');
    const code = String(codeEl?.textContent || '').trim();
    if (!code || code === '-----') {
      window.UIFeedback?.toast?.('目前沒有可複製的分享碼', 'error');
      return;
    }
    try {
      await navigator.clipboard.writeText(code);
      window.UIFeedback?.toast?.('已複製開團分享碼', 'success');
    } catch (_) {
      window.UIFeedback?.toast?.('複製失敗，請手動複製', 'error');
    }
  }

  async function joinByShareCode() {
    const identity = getIdentity();
    if (isValidIdentity(identity)) {
      window.UIFeedback?.toast?.('您已擁有班級身份，無法填寫其他邀請代碼！', 'error');
      return;
    }
    const input = document.getElementById('home-team-join-code-input');
    const raw = String(input?.value || '').trim().toUpperCase();
    if (!/^[A-Z0-9]{5}$/.test(raw)) {
      window.UIFeedback?.toast?.('請輸入 5 位英數字分享碼', 'error');
      return;
    }
    try {
      const row = await window.MathSprintSupabaseService.getClassShareCodeByCode(raw);
      if (!row) {
        window.UIFeedback?.toast?.('此分享碼不存在或已停用', 'error');
        return;
      }
      if (window.MathSprintOnboarding?.showProfileModal) {
        localStorage.setItem(PENDING_SHARE_CODE_KEY, raw);
        window.MathSprintOnboarding.showProfileModal(false, null, {
          grade_class: row.owner_grade_class || '',
          seat_number: '',
          nickname: ''
        });
      }
      window.UIFeedback?.toast?.(`已帶入班級 ${row.owner_grade_class || '--'}，請完成座號與姓名`, 'success');
    } catch (err) {
      window.UIFeedback?.toast?.(`加入失敗：${err.message}`, 'error');
    }
  }

  window.addEventListener('limit180ComponentsLoaded', () => {
    const genBtn = document.getElementById('home-team-share-generate-btn');
    const copyBtn = document.getElementById('home-team-share-copy-btn');
    const joinBtn = document.getElementById('home-team-join-btn');
    const joinInput = document.getElementById('home-team-join-code-input');
    if (genBtn) genBtn.addEventListener('click', createMyCode);
    if (copyBtn) copyBtn.addEventListener('click', copyMyCode);
    if (joinBtn) joinBtn.addEventListener('click', joinByShareCode);
    if (joinInput) {
      joinInput.addEventListener('input', (e) => {
        e.target.value = String(e.target.value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
      });
      joinInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          joinByShareCode();
        }
      });
    }
    refreshMyCode();
  });

  window.addEventListener('mathSprintProfileUpdated', () => {
    refreshMyCode();
  });
})();
