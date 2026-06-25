/**
 * Limit 180 - 實時特工聊天室控制器
 */
(function() {
  let supabase = null;
  let chatChannelSubscription = null;
  
  const QUICK_TEMPLATES = [
    "⚡ 有人能超越我的速度嗎？",
    "🏆 為了班級榮譽衝啊！",
    "💪 挑戰 Mission 50 成功！",
    "🪙 今天賺取了滿滿的金幣！",
    "🔥 秒殺速度，誰敢挑戰？",
    "💡 這題可以用速算法解答！"
  ];

  function getUserIdentity() {
    try {
      return JSON.parse(localStorage.getItem('limit180_user_profile') || 'null');
    } catch (_) {
      return null;
    }
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
  }

  function getDailyChatCount() {
    const today = new Date().toLocaleDateString('zh-TW');
    const storedDate = localStorage.getItem('limit180_chat_date');
    if (storedDate !== today) {
      localStorage.setItem('limit180_chat_date', today);
      localStorage.setItem('limit180_chat_count', '0');
      return 0;
    }
    return parseInt(localStorage.getItem('limit180_chat_count') || '0', 10);
  }

  function incrementDailyChatCount() {
    const count = getDailyChatCount() + 1;
    localStorage.setItem('limit180_chat_count', count.toString());
    return count;
  }

  // 取得特工實際最高關卡與小關
  function getAgentMaxUnlocked() {
    let maxM = 1, maxL = 1;
    if (window.MathSprintStorage) {
      const localProfile = window.MathSprintStorage.getProfile();
      if (localProfile) {
        const configs = window.MathSprintConfigs?.MISSION_CONFIGS || {};
        const missionCount = Object.keys(configs).length || 50;
        for (let m = 1; m <= missionCount; m++) {
          if (window.MathSprintStorage.isMissionUnlocked(m, localProfile)) {
            maxM = m;
          }
        }
        Object.keys(localProfile.level_records || {}).forEach((key) => {
          const m = key.match(/mission-(\d+)-level-(\d+)/);
          if (!m || !localProfile.level_records[key]?.is_passed) return;
          const mi = parseInt(m[1], 10), lv = parseInt(m[2], 10);
          if (mi === maxM && lv > maxL) {
            maxL = lv;
          }
        });
      }
    }
    return { max_mission: maxM, max_level: maxL };
  }

  const Chatroom = {
    async init() {
      if (window.MathSprintSupabaseService) {
        supabase = window.MathSprintSupabaseService.initSupabase();
      }

      this.bindEvents();
      this.renderQuickTemplates();
      this.updateStatusHUD();

      const container = document.getElementById('chat-messages');
      if (container) {
        container.innerHTML = `<div class="text-center text-slate-500 font-pixel text-xs py-8">正在連線班級留言板...</div>`;
      }

      this.unsubscribe();
      await this.loadHistory();
      this.subscribe();
    },

    bindEvents() {
      const sendBtn = document.getElementById('chat-send-btn');
      if (sendBtn) {
        sendBtn.onclick = () => this.sendMessage();
      }

      const inputField = document.getElementById('chat-input-field');
      if (inputField) {
        inputField.onkeydown = (e) => {
          if (e.key === 'Enter') {
            this.sendMessage();
          }
        };
      }
    },

    renderQuickTemplates() {
      const container = document.getElementById('chat-quick-templates');
      if (!container) return;
      container.innerHTML = QUICK_TEMPLATES.map(text => {
        return `<button class="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-cyan-500 rounded-lg text-slate-300 whitespace-nowrap cursor-pointer transition-colors" type="button">${escapeHtml(text)}</button>`;
      }).join('');

      container.querySelectorAll('button').forEach((btn, idx) => {
        btn.onclick = () => {
          const inputField = document.getElementById('chat-input-field');
          if (inputField) {
            inputField.value = QUICK_TEMPLATES[idx];
            inputField.focus();
          }
        };
      });
    },

    updateStatusHUD() {
      const profile = window.MathSprintStorage?.getProfile();
      const countSpan = document.getElementById('chat-today-count');
      const coinsSpan = document.getElementById('chat-current-coins');

      const count = getDailyChatCount();
      if (countSpan) {
        countSpan.textContent = `${count} / 10`;
      }

      if (coinsSpan && profile) {
        coinsSpan.textContent = (profile.total_stars || 0).toLocaleString('zh-TW');
      }
    },

    async loadHistory() {
      const container = document.getElementById('chat-messages');
      if (!container) return;

      if (!supabase) {
        container.innerHTML = `<div class="text-center text-red-500 font-pixel text-xs py-8">❌ 雲端連線未啟用，留言板不可用。</div>`;
        return;
      }

      const identity = getUserIdentity();
      if (!identity) {
        container.innerHTML = `<div class="text-center text-yellow-500 font-pixel text-xs py-8">👤 請先建立特工身份，方可使用班級留言板。</div>`;
        return;
      }

      try {
        const { data, error } = await supabase.from('messages')
          .select('*')
          .eq('grade_class', identity.grade_class)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        container.innerHTML = '';
        if (!data || data.length === 0) {
          container.innerHTML = `<div class="text-center text-slate-500 font-pixel text-xs py-8">💬 目前尚無留言，留下第一筆訊息吧！</div>`;
          return;
        }

        const messages = [...data].reverse();
        messages.forEach(msg => {
          this.appendMessageElement(msg, false);
        });

        this.scrollToBottom();

      } catch (err) {
        console.error('[Chatroom] 載入留言失敗:', err);
        container.innerHTML = `<div class="text-center text-red-400 font-pixel text-xs py-8 px-4">💬 留言板連線中，若持續失敗請確認資料庫中已建立 messages 資料表。</div>`;
      }
    },

    subscribe() {
      if (!supabase) return;
      const identity = getUserIdentity();
      if (!identity) return;

      chatChannelSubscription = supabase.channel(`public:messages:class:${identity.grade_class}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `grade_class=eq.${identity.grade_class}` },
          (payload) => {
            this.appendMessageElement(payload.new, true);
          }
        )
        .subscribe();
    },

    unsubscribe() {
      if (chatChannelSubscription) {
        supabase?.removeChannel(chatChannelSubscription);
        chatChannelSubscription = null;
      }
    },

    appendMessageElement(msg, isNew = true) {
      const container = document.getElementById('chat-messages');
      if (!container) return;

      const placeholder = container.querySelector('.text-slate-500, .text-red-400, .text-yellow-500');
      if (placeholder) placeholder.remove();

      const identity = getUserIdentity();
      const isMe = identity && msg.grade_class === identity.grade_class && String(msg.seat_number) === String(identity.seat_number);

      const bubbleClass = isMe 
        ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-100 self-end ml-12 shadow-[0_0_8px_rgba(6,182,212,0.1)]' 
        : 'bg-slate-900/80 border-slate-800/80 text-slate-100 self-start mr-12';

      const tag = `M${msg.max_mission || 1}L${msg.max_level || 1}`;
      const nameText = escapeHtml(msg.nickname);
      const contentText = escapeHtml(msg.content);

      const msgHtml = `
        <div class="flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'} max-w-full animate-fade-in">
          <div class="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 font-tech">
            <span>${msg.grade_class}班 ${msg.seat_number}號</span>
            <span class="text-white font-bold">${nameText}</span>
            <span class="text-green-400 font-black bg-slate-950/60 px-1.5 py-0.5 border border-green-950 rounded">${tag}</span>
            ${isMe ? '<span class="text-[9px] bg-cyan-500 text-black px-1 font-bold rounded">我</span>' : ''}
          </div>
          <div class="px-4 py-2.5 rounded-2xl border ${bubbleClass} text-sm sm:text-base leading-relaxed break-all font-pixel">
            ${contentText}
          </div>
        </div>
      `;

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = msgHtml.trim();
      container.appendChild(tempDiv.firstElementChild);

      if (isNew) {
        this.scrollToBottom();
      }
    },

    scrollToBottom() {
      const container = document.getElementById('chat-messages');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    },

    async sendMessage() {
      const inputField = document.getElementById('chat-input-field');
      if (!inputField) return;

      const content = inputField.value.trim();
      if (!content) return;

      if (!supabase) {
        window.UIFeedback?.toast?.('雲端伺服器未連線', 'error');
        return;
      }

      const identity = getUserIdentity();
      if (!identity) {
        window.UIFeedback?.toast?.('請建立特工身分方可發言', 'warning');
        return;
      }

      const profile = window.MathSprintStorage?.getProfile();
      if (!profile) {
        window.UIFeedback?.toast?.('無法讀取本機存檔', 'error');
        return;
      }

      const dailyCount = getDailyChatCount();
      let willCharge = dailyCount >= 10;

      if (willCharge && (profile.total_stars || 0) < 10) {
        window.UIFeedback?.toast?.('❌ 金幣餘額不足 10 💰，無法發言', 'error');
        return;
      }

      if (willCharge && dailyCount === 10) {
        const confirmSend = window.UIFeedback?.confirm
          ? await window.UIFeedback.confirm("🚨 特工請注意：您今日 of 10 則免費發言額度已用完。接下來的每條訊息將消耗 10 💰 金幣，是否繼續發送？", "發言收費提示")
          : confirm("【發言收費提示】\n\n您今日的 10 則免費發言額度已用完。\n接下來的每條訊息將消耗 10 💰 金幣，是否繼續發送？");
        
        if (!confirmSend) return;
      }

      try {
        if (willCharge) {
          if (window.MathSprintSupabaseService?.applyCoinTransaction) {
            const tx = await window.MathSprintSupabaseService.applyCoinTransaction(
              identity.grade_class,
              identity.seat_number,
              identity.nickname,
              -10,
              'chat_send_fee'
            );
            if (tx && tx.newBalance !== undefined) {
              profile.total_stars = tx.newBalance;
            } else {
              profile.total_stars = (profile.total_stars || 0) - 10;
            }
          } else {
            profile.total_stars = (profile.total_stars || 0) - 10;
          }
          window.MathSprintStorage.saveProfile(profile);
        }

        const maxStage = getAgentMaxUnlocked();

        const { error } = await supabase.from('messages').insert({
          grade_class: identity.grade_class,
          seat_number: String(identity.seat_number),
          nickname: identity.nickname,
          max_mission: maxStage.max_mission,
          max_level: maxStage.max_level,
          content: content,
          channel: 'class'
        });

        if (error) throw error;

        incrementDailyChatCount();
        inputField.value = '';
        this.updateStatusHUD();

        if (window.MathSprintDashboard?.renderCharts) {
          window.MathSprintDashboard.renderCharts();
        }

      } catch (err) {
        console.error('[Chatroom] 發送訊息失敗:', err);
        const errMsg = err?.message || err?.details || JSON.stringify(err) || '未知錯誤';
        window.UIFeedback?.toast?.(`發送失敗：${errMsg}`, 'error');
      }
    }
  };

  window.MathSprintChatroom = Chatroom;
})();
