// MathSprint Achievements System Module
// 負責成就檢查、持久存檔、霓虹通知更新與成就牆渲染。

(function() {
  // 10 個核心成就配置
  const ACHIEVEMENTS = [
    { id: 'first_step', name: '初試身手', desc: '成功通過 Stage 01 考驗', icon: '🐣', color: 'cyan' },
    { id: 'speed_demon', name: '神速反射', desc: '在 1.5 秒內答對任意題目', icon: '⚡', color: 'yellow' },
    { id: 'combo_master', name: '連擊大師', desc: '在任意關卡達成 20 Combo', icon: '🔥', color: 'pink' },
    { id: 'error_buster', name: '錯題終結者', desc: '從錯題消除模式中累計做對 50 題', icon: '🧹', color: 'green' },
    { id: 'legend', name: '踏入傳奇', desc: '成功解鎖 Mission 10 傳奇殿堂', icon: '👑', color: 'yellow' },
    { id: 'stars_collector_30', name: '星空初現', desc: '累計獲得 30 顆星星', icon: '⭐', color: 'cyan' },
    { id: 'stars_collector_100', name: '繁星點點', desc: '累計獲得 100 顆星星', icon: '✨', color: 'yellow' },
    { id: 'speed_god', name: '閃電速算', desc: '在 1.0 秒內答對任意題目', icon: '⚡', color: 'pink' },
    { id: 'no_error_run', name: '完美無瑕', desc: '以 100% 正確率通關任意關卡', icon: '💎', color: 'green' },
    { id: 'shield_hoarder', name: '鋼鐵防線', desc: '累計擁有 5 個超時防禦盾', icon: '🛡️', color: 'cyan' }
  ];

  const Achievements = {
    // 檢查依賴於關卡統計數據的成就
    checkAllAchievements(mission, level, avgTime, maxCombo, isPass, correctCount, totalQuestions) {
      const profile = window.MathSprintStorage.getProfile();
      
      // 1. 初試身手 (M1 Stage 1 通關)
      if (mission === 1 && level === 1 && isPass) {
        this.unlock('first_step');
      }

      // 2. 連擊大師
      if (maxCombo >= 20) {
        this.unlock('combo_master');
      }

      // 3. 踏入傳奇 (Mission 10 解鎖)
      if (window.MathSprintStorage.isMissionUnlocked(10)) {
        this.unlock('legend');
      }

      // 6. 星空初現 (累計 30 星)
      if (profile.total_stars >= 30) {
        this.unlock('stars_collector_30');
      }

      // 7. 繁星點點 (累計 100 星)
      if (profile.total_stars >= 100) {
        this.unlock('stars_collector_100');
      }

      // 9. 完美無瑕 (正確率 100% 且通關)
      if (isPass && correctCount !== undefined && totalQuestions !== undefined && correctCount === totalQuestions) {
        this.unlock('no_error_run');
      }

      // 10. 鋼鐵防線 (防呆：若已持有 5 盾以上且先前未觸發，亦在此點亮)
      if ((profile.shields_count || 0) >= 5) {
        this.unlock('shield_hoarder');
      }
    },

    // 檢查單題答題速度的成就 (由 game.js 答題時即時呼叫)
    checkSpeed(timeTaken) {
      if (timeTaken > 0 && timeTaken < 1.5) {
        this.unlock('speed_demon');
      }
      if (timeTaken > 0 && timeTaken < 1.0) {
        this.unlock('speed_god');
      }
    },

    // 解鎖成就 (調用 storage.js 寫入)
    unlock(id) {
      window.MathSprintStorage.unlockAchievement(id);
    },

    // 顯示 Cyber 霓虹通知
    showToast(ach) {
      // 合成音效
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          const now = ctx.currentTime;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, now); // A4
          osc.frequency.setValueAtTime(554.37, now + 0.1); // C#5
          osc.frequency.setValueAtTime(659.25, now + 0.2); // E5
          osc.frequency.setValueAtTime(880, now + 0.3); // A5
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
          osc.start(now);
          osc.stop(now + 0.7);
        }
      } catch (e) {}

      // 建立 Toast DOM 元素
      const toast = document.createElement('div');
      toast.className = `fixed bottom-8 left-1/2 -translate-x-1/2 z-50 hud-panel p-4 bg-slate-950 flex items-center gap-4 border-glow-${ach.color} animate-bounce max-w-sm w-full`;
      toast.innerHTML = `
        <div class="text-3xl">${ach.icon}</div>
        <div>
          <div class="text-[10px] text-pink-500 font-pixel font-bold">// 成就解鎖 ACHIEVEMENT //</div>
          <h4 class="text-sm font-pixel text-white">${ach.name}</h4>
          <p class="text-xs text-slate-400 font-tech">${ach.desc}</p>
        </div>
      `;
      document.body.appendChild(toast);
      
      // 4 秒後移除通知
      setTimeout(() => {
        toast.remove();
      }, 4000);
    },

    // 渲染成就牆
    renderAchievements() {
      const profile = window.MathSprintStorage.getProfile();
      const unlocked = profile.unlocked_achievements || [];
      const listContainer = document.getElementById('achievements-list');
      
      if (!listContainer) return;
      listContainer.innerHTML = '';

      ACHIEVEMENTS.forEach(ach => {
        const isUnlocked = unlocked.includes(ach.id);
        const card = document.createElement('div');
        
        let borderClass = 'border-slate-800 opacity-50';
        let titleColor = 'text-slate-500';
        
        if (isUnlocked) {
          borderClass = `border-glow-${ach.color}`;
          titleColor = ach.color === 'cyan' ? 'text-cyan-400' : ach.color === 'pink' ? 'text-pink-500' : 'text-yellow-400';
        }

        card.className = `hud-panel p-6 bg-slate-900/80 flex flex-col items-center text-center ${borderClass}`;
        card.innerHTML = `
          <div class="text-4xl mb-3 ${isUnlocked ? 'scale-110' : 'filter grayscale'}">${ach.icon}</div>
          <h3 class="text-base font-pixel ${titleColor} mb-2">${ach.name}</h3>
          <p class="text-xs text-slate-400 font-tech leading-relaxed">${ach.desc}</p>
          <div class="mt-4 text-[10px] font-pixel text-slate-600">
            ${isUnlocked ? '// UNLOCKED //' : '// LOCKED //'}
          </div>
        `;

        listContainer.appendChild(card);
      });
    },

    init() {
      // 監聽成就解鎖事件並播放動畫與音效
      window.addEventListener('mathSprintAchievementUnlocked', (e) => {
        const achId = e.detail.id;
        const ach = ACHIEVEMENTS.find(a => a.id === achId);
        if (ach) {
          this.showToast(ach);
        }
      });

      // 監聽錯題清除事件，解鎖錯題終結者
      window.addEventListener('mathSprintWrongQuestionCleared', () => {
        const profile = window.MathSprintStorage.getProfile();
        profile.cleared_wrong_count = (profile.cleared_wrong_count || 0) + 1;
        window.MathSprintStorage.saveProfile(profile);
        
        if (profile.cleared_wrong_count >= 50) {
          this.unlock('error_buster');
        }
      });

      // 監聽獲得盾牌事件，解鎖鋼鐵防線
      window.addEventListener('mathSprintShieldAwarded', (e) => {
        const count = e.detail.count;
        if (count >= 5) {
          this.unlock('shield_hoarder');
        }
      });
    }
  };

  // 匯出至全域
  window.MathSprintAchievements = Achievements;

  window.addEventListener('DOMContentLoaded', () => {
    Achievements.init();
  });
})();
