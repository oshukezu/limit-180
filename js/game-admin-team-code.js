// Limit 180 — 後台開團分享碼管理（5位英數）
(function() {
  function setMsg(msg, isError = false) {
    const el = document.getElementById('admin-team-msg');
    if (!el) return;
    el.textContent = msg || '';
    el.className = `text-[10px] font-tech ${isError ? 'text-red-400' : 'text-slate-400'}`;
  }

  function randomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out = '';
    for (let i = 0; i < 5; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }

  function normalizeCode(code) {
    return String(code || '').trim().toUpperCase();
  }

  function validateCode(code) {
    return /^[A-Z0-9]{5}$/.test(code);
  }

  async function reloadTeamCodes() {
    if (!window.GameAdmin?.authorized) return;
    const tbody = document.getElementById('admin-team-list');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="7" class="py-3 px-2 text-slate-500 text-center">載入中...</td></tr>`;
    try {
      const rows = await window.MathSprintSupabaseService.listClassShareCodes();
      if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="py-3 px-2 text-slate-500 text-center">尚無分享碼</td></tr>`;
        return;
      }
      tbody.innerHTML = '';
      rows.forEach((row) => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-900/20';
        tr.innerHTML = `
          <td class="py-2 px-2 text-emerald-300 font-mono">${row.share_code || '--'}</td>
          <td class="py-2 px-2 text-slate-200">${row.owner_grade_class || '--'}</td>
          <td class="py-2 px-2 text-slate-200">${row.owner_seat_number || '--'}</td>
          <td class="py-2 px-2 text-white">${row.owner_nickname || '--'}</td>
          <td class="py-2 px-2 text-slate-300">${row.class_name || '--'}</td>
          <td class="py-2 px-2 text-center ${row.is_active ? 'text-green-400' : 'text-red-400'}">${row.is_active ? '啟用' : '停用'}</td>
          <td class="py-2 px-2 text-center">
            <div class="flex flex-wrap justify-center gap-1">
              <button data-action="edit" data-id="${row.id}" data-code="${row.share_code}" class="cyber-btn px-2 py-1 text-[9px] rounded text-cyan-300">修正碼</button>
              <button data-action="toggle" data-id="${row.id}" data-active="${row.is_active ? '1' : '0'}" class="cyber-btn px-2 py-1 text-[9px] rounded ${row.is_active ? 'text-yellow-300' : 'text-green-300'}">${row.is_active ? '停用' : '啟用'}</button>
              <button data-action="delete" data-id="${row.id}" class="cyber-btn cyber-btn-pink px-2 py-1 text-[9px] rounded text-red-400">刪除</button>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" class="py-3 px-2 text-red-400 text-center">載入失敗</td></tr>`;
      setMsg(`讀取分享碼失敗：${err.message}`, true);
    }
  }

  function fillRandomCodeHint() {
    setMsg(`建議分享碼：${randomCode()}`);
  }

  async function createTeamCode() {
    if (!window.GameAdmin?.authorized) return;
    const cls = document.getElementById('admin-team-class')?.value?.trim()?.toUpperCase() || '';
    const seat = document.getElementById('admin-team-seat')?.value?.trim() || '';
    const name = document.getElementById('admin-team-name')?.value?.trim() || '';
    const className = document.getElementById('admin-team-class-name')?.value?.trim() || '';
    if (!cls || !seat || !name) {
      setMsg('請輸入班級、座號、開團者姓名', true);
      return;
    }
    try {
      const row = await window.MathSprintSupabaseService.createClassShareCode(cls, seat, name, className);
      setMsg(`已建立分享碼：${row?.share_code || '成功'}`);
      await reloadTeamCodes();
    } catch (err) {
      setMsg(`建立失敗：${err.message}`, true);
    }
  }

  async function onTableClick(event) {
    const btn = event.target.closest('button[data-action]');
    if (!btn || !window.GameAdmin?.authorized) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    if (!id) return;
    try {
      if (action === 'edit') {
        const next = prompt('請輸入新的 5 位分享碼（英數字）', btn.dataset.code || '');
        if (next === null) return;
        const code = normalizeCode(next);
        if (!validateCode(code)) throw new Error('分享碼需為 5 位英數字');
        await window.MathSprintSupabaseService.updateClassShareCode(id, { share_code: code });
        setMsg(`分享碼已更新為 ${code}`);
      } else if (action === 'toggle') {
        const active = btn.dataset.active === '1';
        await window.MathSprintSupabaseService.updateClassShareCode(id, { is_active: !active });
        setMsg(`分享碼已${active ? '停用' : '啟用'}`);
      } else if (action === 'delete') {
        const agreed = window.UIFeedback
          ? await window.UIFeedback.confirm('確定刪除這筆開團分享碼？', '刪除分享碼')
          : confirm('確定刪除這筆開團分享碼？');
        if (!agreed) return;
        await window.MathSprintSupabaseService.deleteClassShareCode(id);
        setMsg('分享碼已刪除');
      }
      await reloadTeamCodes();
    } catch (err) {
      setMsg(`操作失敗：${err.message}`, true);
    }
  }

  window.addEventListener('limit180ComponentsLoaded', () => {
    const createBtn = document.getElementById('admin-team-create-btn');
    const randomBtn = document.getElementById('admin-team-generate-btn');
    const table = document.getElementById('admin-team-list');
    if (createBtn) createBtn.addEventListener('click', createTeamCode);
    if (randomBtn) randomBtn.addEventListener('click', fillRandomCodeHint);
    if (table) table.addEventListener('click', onTableClick);
  });

  window.addEventListener('limit180AdminAuthorized', () => {
    reloadTeamCodes();
  });
})();
