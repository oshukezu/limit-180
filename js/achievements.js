// MathSprint Achievements System Module
// 負責成就檢查、持久存檔、霓虹通知更新與成就牆渲染。

(function() {
  function formatCoins(value) {
    const val = Number(value) || 0;
    if (val < 10000) {
      return val.toLocaleString('zh-TW') + ' 💰';
    } else if (val < 1000000) {
      const wan = val / 10000;
      return (wan % 1 === 0 ? wan : wan.toFixed(1)) + '萬 💰';
    } else {
      const million = val / 1000000;
      return (million % 1 === 0 ? million : million.toFixed(1)) + 'M 💰';
    }
  }

  const RANK_ICONS = { 1: '🥇', 2: '🥈', 3: '🥉' };

  const Achievements = {
    currentMission: 1,

    // 檢查依賴於關卡統計數據的成就
    checkAllAchievements(mission, level, avgTime, maxCombo, isPass, correctCount, totalQuestions) {
      const profile = window.MathSprintStorage.getProfile();
      
      // 1. 初試身手 (M[M] Stage 1 通關)
      if (level === 1 && isPass) {
        this.unlock(`m${mission}_first_step`);
      }

      // 2. 達成任務 (M[M] Stage 20 完美過關，即答對率 100%)
      if (level === 20 && isPass && correctCount !== undefined && totalQuestions !== undefined && (correctCount / totalQuestions) >= 1.0) {
        this.unlock(`m${mission}_mission_clear`);
      }

      // 3. 繁星點點 (個人累積獎金達到 10,000,000 💰 以上)
      if (profile.total_stars >= 10000000) {
        this.unlock('stars_50');
      }

      // 4. 完美達標 (該大關 Mission 20 個 Stages 答對率皆為 100%)
      let isPerfect = true;
      for (let l = 1; l <= 20; l++) {
        const key = `mission-${mission}-level-${l}`;
        const rec = profile.level_records[key];
        if (!rec || !rec.is_passed || !(rec.accuracy >= 1.0)) {
          isPerfect = false;
          break;
        }
      }
      if (isPerfect) {
        this.unlock(`m${mission}_mission_perfect`);
      }
    },

    // 檢查單題答題速度的成就 (已廢止，保持相容空實作)
    checkSpeed(timeTaken) {
    },

    // 解鎖成就 (調用 storage.js 寫入)
    unlock(id) {
      window.MathSprintStorage.unlockAchievement(id);
    },

    // 顯示 Cyber 霓虹通知
    showToast(ach) {
      // 合成音效
      try {
        const _audioCtx = window.AudioContext || window.webkitAudioContext;
        if (_audioCtx) {
          const ctx = new _audioCtx();
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
    renderAchievements(missionId) {
      const profile = window.MathSprintStorage.getProfile();
      const unlocked = profile.unlocked_achievements || [];
      const listContainer = document.getElementById('achievements-list');
      
      if (!listContainer) return;
      listContainer.innerHTML = '';

      const mId = missionId || this.currentMission;
      this.currentMission = mId;

      // 檢查此 Mission 的解鎖與星數狀況
      const recordL1 = profile.level_records[`mission-${mId}-level-1`];
      const isFirstStepUnlocked = unlocked.includes(`m${mId}_first_step`) || (recordL1 && recordL1.stars > 0);
      const isErrorBusterUnlocked = (profile.total_review_correct_count || 0) >= 20;
      
      const recordL20 = profile.level_records[`mission-${mId}-level-20`];
      const isMissionClearUnlocked = unlocked.includes(`m${mId}_mission_clear`) || (recordL20 && recordL20.is_passed && recordL20.accuracy >= 1.0);
      const isStars50Unlocked = (profile.total_stars || 0) >= 10000000;

      let all100Percent = true;
      for (let l = 1; l <= 20; l++) {
        const rec = profile.level_records[`mission-${mId}-level-${l}`];
        if (!rec || !rec.is_passed || !(rec.accuracy >= 1.0)) {
          all100Percent = false;
          break;
        }
      }
      const isMissionPerfectUnlocked = unlocked.includes(`m${mId}_mission_perfect`) || all100Percent;

      // 當前 Mission 的動態徽章列表
      const badges = [
        { 
          id: `m${mId}_first_step`, 
          name: '初試身手', 
          desc: `成功通過 Mission ${mId} Stage 01 考驗`, 
          icon: '🐣', 
          color: 'cyan',
          isUnlocked: isFirstStepUnlocked
        },
        { 
          id: 'error_buster', 
          name: '錯題終結者', 
          desc: `在錯題消除模式中，累計答對 20 題 (當前: ${profile.total_review_correct_count || 0}/20)`, 
          icon: '🧹', 
          color: 'green',
          isUnlocked: isErrorBusterUnlocked
        },
        { 
          id: `m${mId}_mission_clear`, 
          name: '達成任務', 
          desc: `Mission ${mId} Stage 20 完美過關`, 
          icon: '👑', 
          color: 'yellow',
          isUnlocked: isMissionClearUnlocked
        },
        { 
          id: 'stars_50', 
          name: '大富豪特工', 
          desc: `累積獎金達到 1,000 萬以上 (當前: ${formatCoins(profile.total_stars)}/10M)`, 
          icon: '💰', 
          color: 'pink',
          isUnlocked: isStars50Unlocked
        },
        { 
          id: `m${mId}_mission_perfect`, 
          name: '完美達標', 
          desc: `Mission ${mId} 旗下的 20 個 Stages 答對率皆為 100%`, 
          icon: '💎', 
          color: 'pink',
          isUnlocked: isMissionPerfectUnlocked
        }
      ];

      badges.forEach(ach => {
        const card = document.createElement('div');
        
        let borderClass = 'border-slate-800 opacity-50';
        let titleColor = 'text-slate-500';
        
        if (ach.isUnlocked) {
          borderClass = `border-glow-${ach.color}`;
          titleColor = ach.color === 'cyan' ? 'text-cyan-400' : ach.color === 'pink' ? 'text-pink-500' : ach.color === 'green' ? 'text-green-400' : 'text-yellow-400';
        }

        card.className = `hud-panel p-6 bg-slate-900/80 flex flex-col items-center text-center transition-all duration-300 ${borderClass}`;
        card.innerHTML = `
          <div class="text-4xl mb-3 ${ach.isUnlocked ? 'scale-110' : 'filter grayscale'}">${ach.icon}</div>
          <h3 class="text-base font-pixel ${titleColor} mb-2">${ach.name}</h3>
          <p class="text-xs text-slate-400 font-tech leading-relaxed">${ach.desc}</p>
          <div class="mt-4 text-[10px] font-pixel text-slate-600">
            ${ach.isUnlocked ? '// UNLOCKED //' : '// LOCKED //'}
          </div>
        `;

        listContainer.appendChild(card);
      });
    },

    init() {
      // 監聽成就解鎖事件並播放動畫與音效
      window.addEventListener('mathSprintAchievementUnlocked', (e) => {
        const achId = e.detail.id;
        
        let typeId = achId;
        let mNum = '';
        if (achId.startsWith('m') && achId.includes('_')) {
          const parts = achId.split('_');
          mNum = parts[0].replace('m', '');
          typeId = parts.slice(1).join('_');
        }

        const badgeMeta = {
          first_step: { name: '初試身手', desc: `成功通過 Mission ${mNum} Stage 01 考驗`, icon: '🐣', color: 'cyan' },
          error_buster: { name: '錯題終結者', desc: '在錯題消除模式中，累計答對 20 題', icon: '🧹', color: 'green' },
          mission_clear: { name: '達成任務', desc: `Mission ${mNum} Stage 20 完美過關`, icon: '👑', color: 'yellow' },
          stars_50: { name: '大富豪特工', desc: '累積獎金達到 1,000 萬以上', icon: '💰', color: 'pink' },
          mission_perfect: { name: '完美達標', desc: `Mission ${mNum} 旗下的 20 個 Stages 答對率皆為 100%`, icon: '💎', color: 'pink' }
        };

        const meta = badgeMeta[typeId];
        if (meta) {
          this.showToast({
            name: meta.name,
            desc: meta.desc,
            icon: meta.icon,
            color: meta.color
          });
        }
      });

      // 監聽錯題清除事件 (已廢止，保持相容空實作)
      window.addEventListener('mathSprintWrongQuestionCleared', () => {
      });

      // 監聽獲得盾牌事件 (已廢止，保持相容空實作)
      window.addEventListener('mathSprintShieldAwarded', () => {
      });

      // 初始化下拉選單
      window.addEventListener('limit180ComponentsLoaded', () => {
        const select = document.getElementById('achievements-mission-select');
        if (select) {
          const count = Object.keys(window.MathSprintConfigs.MISSION_CONFIGS).length;
          select.innerHTML = Array.from({ length: count }, (_, i) => `<option value="${i + 1}">Mission ${i + 1}</option>`).join('');
          select.addEventListener('change', (e) => {
            this.renderAchievements(parseInt(e.target.value));
          });
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
