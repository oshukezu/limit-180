// MathSprint Achievements System Module
// Handles achievement checking, persistent counts, neon toast updates, and rendering the achievements wall.

(function() {
  const ACHIEVEMENTS = [
    { id: 'first_step', name: '初試身手', desc: '成功通過 Level 1 考驗', icon: '🐣', color: 'cyan' },
    { id: 'speed_demon', name: '神速反射', desc: '在 1.5 秒內答對任意題目', icon: '⚡', color: 'yellow' },
    { id: 'combo_master', name: '連擊大師', desc: '在任意關卡達成 20 Combo', icon: '🔥', color: 'pink' },
    { id: 'error_buster', name: '錯題終結者', desc: '從錯題消除模式中累計做對 50 題', icon: '🧹', color: 'green' },
    { id: 'legend', name: '踏入傳奇', desc: '成功解鎖 Level 10 傳奇殿堂', icon: '👑', color: 'yellow' }
  ];

  const Achievements = {
    // Check achievements that depend on level stats
    checkAllAchievements(mission, level, avgTime, maxCombo, isPass) {
      const profile = window.MathSprintStorage.getProfile();
      
      // 1. 初試身手 (M1 L1 Passed)
      if (mission === 1 && level === 1 && isPass) {
        this.unlock('first_step');
      }

      // 2. 連擊大師
      if (maxCombo >= 20) {
        this.unlock('combo_master');
      }

      // 3. 踏入傳奇 (Mission 10 Unlocked)
      if (window.MathSprintStorage.isMissionUnlocked(10)) {
        this.unlock('legend');
      }
    },

    // Check speed for Speed Demon
    checkSpeed(timeTaken) {
      if (timeTaken > 0 && timeTaken < 1.5) {
        this.unlock('speed_demon');
      }
    },

    // Unlock logic
    unlock(id) {
      window.MathSprintStorage.unlockAchievement(id);
    },

    // Display neon achievement unlocked alert toast
    showToast(ach) {
      // Audio cue is generated via game.js/shield sound type or we can make a custom synthesizer
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

      // Create overlay toast element
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
      
      // Remove toast after 4s
      setTimeout(() => {
        toast.remove();
      }, 4000);
    },

    // Render achievement grid wall
    renderAchievements() {
      const profile = window.MathSprintStorage.getProfile();
      const unlocked = profile.unlocked_achievements || [];
      const listContainer = document.getElementById('achievements-list');
      
      listContainer.innerHTML = '';

      ACHIEVEMENTS.forEach(ach => {
        const isUnlocked = unlocked.includes(ach.id);
        const card = document.createElement('div');
        
        let borderClass = 'border-slate-800 opacity-50';
        let glowClass = 'text-slate-600';
        let titleColor = 'text-slate-500';
        
        if (isUnlocked) {
          borderClass = `border-glow-${ach.color}`;
          glowClass = `glow-${ach.color}`;
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
      // Event listener for achievement unlock trigger
      window.addEventListener('mathSprintAchievementUnlocked', (e) => {
        const achId = e.detail.id;
        const ach = ACHIEVEMENTS.find(a => a.id === achId);
        if (ach) {
          this.showToast(ach);
        }
      });

      // Event listener for wrong question clearing progress
      window.addEventListener('mathSprintWrongQuestionCleared', () => {
        const profile = window.MathSprintStorage.getProfile();
        // Increment count
        profile.cleared_wrong_count = (profile.cleared_wrong_count || 0) + 1;
        window.MathSprintStorage.saveProfile(profile);
        
        if (profile.cleared_wrong_count >= 50) {
          this.unlock('error_buster');
        }
      });
      
      // Hook speed checks directly in storage recording context or play loops
      // Since speed_demon is verified in real-time, we listen to gameplay events if needed, 
      // or we check it directly during accuracy checks.
      // For precision, game.js will call checkSpeed directly when checking single question times.
    }
  };

  // Export
  window.MathSprintAchievements = Achievements;

  window.addEventListener('DOMContentLoaded', () => {
    Achievements.init();
  });
})();
