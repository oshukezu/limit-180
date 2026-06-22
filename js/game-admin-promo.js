// Limit 180 — 後台兌換代碼管理模組
(function() {
  function setMsg(msg, isError = false) {
    const el = document.getElementById('admin-promo-msg');
    if (!el) return;
    el.textContent = msg || '';
    el.className = `text-[10px] font-tech ${isError ? 'text-red-400' : 'text-slate-400'}`;
  }

  function fmtDate(dateIso) {
    if (!dateIso) return '無期限';
    const d = new Date(dateIso);
    if (Number.isNaN(d.getTime())) return '格式錯誤';
    return d.toLocaleString('zh-TW');
  }

  function isExpired(dateIso) {
    return !!dateIso && new Date(dateIso).getTime() < Date.now();
  }

  function formatMaxRedemptions(value) {
    if (value === null || value === undefined) return 'all';
    return `${value}`;
  }

  function generateRandomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 7; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  async function generatePromoCode() {
    if (!window.GameAdmin?.authorized) return;
    const codeEl = document.getElementById('admin-promo-code');
    const coinsEl = document.getElementById('admin-promo-coins');
    if (!codeEl) return;

    try {
      const rows = await window.MathSprintSupabaseService.listPromoCodes();
      const exists = new Set((rows || []).map(r => String(r.code || '').toUpperCase()));
      let nextCode = generateRandomCode();
      let guard = 0;
      while (exists.has(nextCode) && guard < 50) {
        nextCode = generateRandomCode();
        guard++;
      }
      codeEl.value = nextCode;
      setMsg(`已產生代碼：${nextCode}`);
      if (coinsEl) {
        coinsEl.focus();
        coinsEl.select();
      }
    } catch (err) {
      // 即使讀取失敗也可先產生，提交時仍有資料庫驗證
      const fallback = generateRandomCode();
      codeEl.value = fallback;
      setMsg(`已產生代碼：${fallback}（未檢查重複）`);
      if (coinsEl) {
        coinsEl.focus();
        coinsEl.select();
      }
    }
  }

  async function reloadPromoCodes() {
    const tbody = document.getElementById('admin-promo-list');
    if (!tbody) return;
    if (!window.GameAdmin?.authorized) return;
    if (!window.MathSprintSupabaseService?.listPromoCodes) return;

    tbody.innerHTML = `<tr><td colspan="7" class="py-3 px-2 text-slate-500 text-center">載入中...</td></tr>`;

    try {
      const rows = await window.MathSprintSupabaseService.listPromoCodes();
      if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="py-3 px-2 text-slate-500 text-center">尚無代碼</td></tr>`;
        return;
      }

      tbody.innerHTML = '';
      rows.forEach((row) => {
        const expired = isExpired(row.expires_at);
        const active = !!row.is_active && !expired;
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-900/20';
        tr.innerHTML = `
          <td class="py-2 px-2 text-cyan-300 font-mono">${row.code}</td>
          <td class="py-2 px-2 text-right text-green-400 font-mono">${window.formatCoins(row.coins_reward || 0, true)}</td>
          <td class="py-2 px-2 text-center text-purple-300 font-mono">${formatMaxRedemptions(row.max_total_redemptions)}</td>
          <td class="py-2 px-2 text-slate-300">${fmtDate(row.expires_at)}</td>
          <td class="py-2 px-2 text-center ${active ? 'text-green-400' : 'text-red-400'}">${active ? '啟用中' : (expired ? '已過期' : '停用')}</td>
          <td class="py-2 px-2 text-right text-yellow-300 font-mono">${row.redeemed_count || 0}</td>
          <td class="py-2 px-2 text-center">
            <div class="flex flex-wrap justify-center gap-1">
              <button data-action="copy" data-code="${row.code}"
                class="cyber-btn px-2 py-1 text-[9px] rounded text-cyan-300">
                複製
              </button>
              <button data-action="toggle" data-code="${row.code}" data-active="${row.is_active ? '1' : '0'}"
                class="cyber-btn px-2 py-1 text-[9px] rounded ${row.is_active ? 'text-yellow-300' : 'text-green-300'}">
                ${row.is_active ? '停用' : '啟用'}
              </button>
              <button data-action="delete" data-code="${row.code}"
                class="cyber-btn cyber-btn-pink px-2 py-1 text-[9px] rounded text-red-400">
                刪除
              </button>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" class="py-3 px-2 text-red-400 text-center">載入失敗</td></tr>`;
      setMsg(`讀取代碼失敗：${err.message}`, true);
    }
  }

  async function createOrUpdatePromoCode() {
    if (!window.GameAdmin?.authorized) return;
    const codeEl = document.getElementById('admin-promo-code');
    const coinsEl = document.getElementById('admin-promo-coins');
    const maxEl = document.getElementById('admin-promo-max');
    const expireEl = document.getElementById('admin-promo-expire');
    if (!codeEl || !coinsEl || !maxEl || !expireEl) return;

    const code = codeEl.value.trim().toUpperCase();
    const coins = Number(coinsEl.value);
    const maxRaw = maxEl.value.trim();
    const expiresAt = expireEl.value ? new Date(expireEl.value).toISOString() : null;

    if (!code) return setMsg('請輸入代碼', true);
    if (!/^[A-Z0-9]{7}$/.test(code)) return setMsg('代碼需為 7 位英數字', true);
    if (!Number.isFinite(coins) || coins <= 0) return setMsg('請輸入有效的金幣數量', true);
    if (maxRaw && maxRaw.toLowerCase() !== 'all') {
      const parsed = Number(maxRaw);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        return setMsg('總名額請輸入正整數或 all', true);
      }
    }

    try {
      await window.MathSprintSupabaseService.upsertPromoCode(code, coins, expiresAt, maxRaw || 'all');
      codeEl.value = '';
      coinsEl.value = '';
      maxEl.value = '';
      expireEl.value = '';
      setMsg(`代碼 ${code} 已儲存`);
      await reloadPromoCodes();
    } catch (err) {
      setMsg(`儲存失敗：${err.message}`, true);
    }
  }

  async function onPromoTableClick(event) {
    const btn = event.target.closest('button[data-action]');
    if (!btn) return;
    if (!window.GameAdmin?.authorized) return;
    const code = btn.dataset.code;
    const action = btn.dataset.action;
    if (!code || !action) return;

    try {
      if (action === 'copy') {
        await navigator.clipboard.writeText(code);
        setMsg(`已複製代碼：${code}`);
        return;
      } else if (action === 'toggle') {
        const currentActive = btn.dataset.active === '1';
        await window.MathSprintSupabaseService.setPromoCodeActive(code, !currentActive);
        setMsg(`代碼 ${code} 已${currentActive ? '停用' : '啟用'}`);
      } else if (action === 'delete') {
        if (!confirm(`確定刪除代碼 ${code}？`)) return;
        await window.MathSprintSupabaseService.deletePromoCode(code);
        setMsg(`代碼 ${code} 已刪除`);
      }
      await reloadPromoCodes();
    } catch (err) {
      setMsg(`操作失敗：${err.message}`, true);
    }
  }

  window.addEventListener('limit180ComponentsLoaded', () => {
    const createBtn = document.getElementById('admin-promo-create-btn');
    const genBtn = document.getElementById('admin-promo-generate-btn');
    const list = document.getElementById('admin-promo-list');
    if (createBtn) createBtn.addEventListener('click', createOrUpdatePromoCode);
    if (genBtn) genBtn.addEventListener('click', generatePromoCode);
    if (list) list.addEventListener('click', onPromoTableClick);
  });

  window.addEventListener('limit180AdminAuthorized', () => {
    reloadPromoCodes();
  });
})();
