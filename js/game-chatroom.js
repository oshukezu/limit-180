/**
 * Limit 180 - 實時特工聊天室控制器
 */
(function() {
  let supabase = null;
  let chatChannelSubscription = null;
  let currentChannel = 'global'; // 'global' 或 'class'
  
  const QUICK_TEMPLATES = [
    "⚡ 有人能超越我的速度嗎？",
    "🏆 為了班級榮譽衝啊！",
    "💪 挑戰 Mission 50 成功！",
    "🪙 今天賺取了滿滿的金幣！",
    "🔥 秒殺速度，誰敢挑戰？",
    "💡 這題可以用速算法解答！"
  ];

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
      // 確保 Supabase 初始化成功
      if (window.MathSprintSupabaseService) {
        supabase = window.MathSprintSupabaseService.initSupabase();
      }

      this.bindEvents();
      this.renderQuickTemplates();
      this.updateStatusHUD();
      await this.switchChannel(currentChannel);
    },

    bindEvents() {
      const closeBtn = document.getElementById('chatroom-close-btn');
      if (closeBtn) {
        closeBtn.onclick = () => {
          this.unsubscribe();
          window.showView('view-home');
        };
      }

      const globalTab = document.getElementById('tab-chat-global');
      const classTab = document.getElementById('tab-chat-class');

      if (globalTab) {
        globalTab.onclick = () => this.switchChannel('global');
      }
      if (classTab) {
        classTab.onclick = () => this.switchChannel('class');
      }

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
        return `<button class="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-cyan-500 rounded-lg text-slate-300 whitespace-nowrap cursor-pointer transition-colors" type="button">${escapeHtml(text)}</button>`;
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
        if (count < 10) {
          countSpan.className = "text-cyan-400 font-bold";
          countSpan.textContent = `${count} / 10 次 (免費)`;
        } else {
          countSpan.className = "text-red-400 font-bold";
          countSpan.textContent = `已用 ${count} 次 (每發一封需 10 💰)`;
        }
      }

      if (coinsSpan && profile) {
        coinsSpan.textContent = (profile.total_stars || 0).toLocaleString('zh-TW');
      }
    },

    async switchChannel(channel) {
      currentChannel = channel;
      this.unsubscribe();

      // UI Tab 樣式切換
      const globalTab = document.getElementById('tab-chat-global');
      const classTab = document.getElementById('tab-chat-class');

      if (channel === 'global') {
        globalTab?.classList.add('text-white', 'border-white', 'border-b-2');
        globalTab?.classList.remove('text-slate-400', 'border-slate-800');
        classTab?.classList.add('text-slate-400', 'border-slate-800');
        classTab?.classList.remove('text-white', 'border-white', 'border-b-2');
      } else {
        classTab?.classList.add('text-white', 'border-white', 'border-b-2');
        classTab?.classList.remove('text-slate-400', 'border-slate-800');
        globalTab?.classList.add('text-slate-400', 'border-slate-800');
        globalTab?.classList.remove('text-white', 'border-white', 'border-b-2');
      }

      const container = document.getElementById('chat-messages');
      if (container) {
        container.innerHTML = `<div class="text-center text-slate-500 font-pixel text-[10px] py-8">正在連線加密頻道...</div>`;
      }

      await this.loadHistory();
      this.subscribe();
    },

    async loadHistory() {
      const container = document.getElementById('chat-messages');
      if (!container) return;

      if (!supabase) {
        container.innerHTML = `<div class="text-center text-red-500 font-pixel text-[10px] py-8">❌ 雲端連線未啟用，聊天室不可用。</div>`;
        return;
      }

      const profile = window.MathSprintStorage?.getProfile();
      if (!profile) {
        container.innerHTML = `<div class="text-center text-yellow-500 font-pixel text-[10px] py-8">👤 請先建立特工身份，方可進入聊天室。</div>`;
        return;
      }

      try {
        let query = supabase.from('messages').select('*');
        if (currentChannel === 'global') {
          query = query.eq('channel', 'global');
        } else {
          query = query.eq('channel', 'class').eq('grade_class', profile.grade_class);
        }

        const { data, error } = await query.order('created_at', { ascending: false }).limit(50);

        if (error) throw error;

        container.innerHTML = '';
        if (!data || data.length === 0) {
          container.innerHTML = `<div class="text-center text-slate-600 font-pixel text-[10px] py-8">👾 頻道目前靜悄悄，說點什麼來打破沉默吧！</div>`;
          return;
        }

        // 反轉渲染 (最舊在最上，最新在最下)
        const messages = [...data].reverse();
        messages.forEach(msg => {
          this.appendMessageElement(msg, false);
        });

        this.scrollToBottom();

      } catch (err) {
        console.error('[Chatroom] 載入歷史訊息失敗:', err);
        container.innerHTML = `<div class="text-center text-red-500 font-pixel text-[10px] py-8">❌ 載入歷史紀錄失敗，請稍後再試。</div>`;
      }
    },

    subscribe() {
      if (!supabase) return;
      const profile = window.MathSprintStorage?.getProfile();
      if (!profile) return;

      const filter = currentChannel === 'global'
        ? "channel=eq.global"
        : `channel=eq.class&grade_class=eq.${profile.grade_class}`;

      chatChannelSubscription = supabase.channel(`public:messages:${currentChannel}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: filter },
          (payload) => {
            const newMsg = payload.new;
            this.appendMessageElement(newMsg, true);
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

      // 移除可能存在的「空頻道提示」
      const placeholder = container.querySelector('.text-slate-600, .text-slate-500');
      if (placeholder) placeholder.remove();

      const profile = window.MathSprintStorage?.getProfile();
      const isMe = profile && msg.grade_class === profile.grade_class && String(msg.seat_number) === String(profile.seat_number);

      const bubbleClass = isMe 
        ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-100 self-end ml-12 shadow-[0_0_8px_rgba(6,182,212,0.1)]' 
        : 'bg-slate-900/80 border-slate-800/80 text-slate-100 self-start mr-12';

      const tag = `M${msg.max_mission || 1}L${msg.max_level || 1}`;
      const nameText = escapeHtml(msg.nickname);
      const contentText = escapeHtml(msg.content);

      const msgHtml = `
        <div class="flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'} max-w-full animate-fade-in">
          <div class="flex items-center gap-1.5 text-[9px] text-slate-500 font-tech">
            <span>${msg.grade_class}班 ${msg.seat_number}號</span>
            <span class="text-white font-bold">${nameText}</span>
            <span class="text-green-400 font-black bg-slate-950/60 px-1 border border-green-950 rounded">${tag}</span>
            ${isMe ? '<span class="text-[8px] bg-cyan-500 text-black px-1 font-bold rounded">我</span>' : ''}
          </div>
          <div class="px-3 py-2 rounded-2xl border ${bubbleClass} text-xs leading-relaxed break-all font-pixel">
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

      const profile = window.MathSprintStorage?.getProfile();
      if (!profile) {
        window.UIFeedback?.toast?.('請建立特工身分方可發言', 'warning');
        return;
      }

      const dailyCount = getDailyChatCount();
      let willCharge = dailyCount >= 10;

      // 檢查餘額
      if (willCharge && (profile.total_stars || 0) < 10) {
        window.UIFeedback?.toast?.('❌ 金幣餘額不足 10 💰，無法發言', 'error');
        return;
      }

      // 第一次超額警告
      if (willCharge && dailyCount === 10) {
        const confirmSend = window.UIFeedback?.confirm
          ? await window.UIFeedback.confirm("🚨 特工請注意：您今日的 10 則免費發言額度已用完。接下來的每條訊息將消耗 10 💰 金幣，是否繼續發送？", "發言收費提示")
          : confirm("【發言收費提示】\n\n您今日的 10 則免費發言額度已用完。\n接下來的每條訊息將消耗 10 💰 金幣，是否繼續發送？");
        
        if (!confirmSend) return;
      }

      try {
        // 如果需要扣幣，執行交易
        if (willCharge) {
          if (window.MathSprintSupabaseService?.applyCoinTransaction) {
            const tx = await window.MathSprintSupabaseService.applyCoinTransaction(
              profile.grade_class,
              profile.seat_number,
              profile.nickname,
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

        // 取得當前真實最高關卡
        const maxStage = getAgentMaxUnlocked();

        // 插入資料表
        const { error } = await supabase.from('messages').insert({
          grade_class: profile.grade_class,
          seat_number: String(profile.seat_number),
          nickname: profile.nickname,
          max_mission: maxStage.max_mission,
          max_level: maxStage.max_level,
          content: content,
          channel: currentChannel
        });

        if (error) throw error;

        // 更新本地計數器與介面
        incrementDailyChatCount();
        inputField.value = '';
        this.updateStatusHUD();

        // 同步首頁/商店的金幣展示
        if (window.MathSprintDashboard?.renderCharts) {
          window.MathSprintDashboard.renderCharts();
        }

      } catch (err) {
        console.error('[Chatroom] 發送訊息失敗:', err);
        window.UIFeedback?.toast?.('發送失敗，請稍後再試', 'error');
      }
    }
  };

  window.MathSprintChatroom = Chatroom;
})();
