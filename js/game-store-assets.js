// Limit 180 - 特工外觀與成就徽章商品配置資產定義
(function() {
  const AVATARS = {
    'avatar-default': { id: 'avatar-default', name: '🛡️ 實習特工', icon: '🛡️', price: 0 },
    'avatar-cat': { id: 'avatar-cat', name: '🐱 靈貓算力', icon: '🐱', price: 0 },
    'avatar-cypher': { id: 'avatar-cypher', name: '🕶️ 駭客專家', icon: '🕶️', price: 20000 },
    'avatar-overlord': { id: 'avatar-overlord', name: '👑 心算霸主', icon: '👑', price: 100000 },
    'avatar-ninja': { id: 'avatar-ninja', name: '🥷 隱形忍者', icon: '🥷', price: 150000 },
    'avatar-star': { id: 'avatar-star', name: '✨ 璀璨超頻', icon: '✨', price: 250000 },
    'avatar-fox': { id: 'avatar-fox', name: '🦊 算力赤狐', icon: '🦊', price: 15000 },
    'avatar-dragon': { id: 'avatar-dragon', name: '🐉 核心神龍', icon: '🐉', price: 300000 },
    'avatar-tiger': { id: 'avatar-tiger', name: '🐯 狂暴算虎', icon: '🐯', price: 50000 },
    'avatar-rabbit': { id: 'avatar-rabbit', name: '🐰 矩陣玉兔', icon: '🐰', price: 18000 },
    'avatar-koala': { id: 'avatar-koala', name: '🐨 沉穩無尾', icon: '🐨', price: 12000 },
    'avatar-panda': { id: 'avatar-panda', name: '🐼 太極熊貓', icon: '🐼', price: 40000 },
    'avatar-lion': { id: 'avatar-lion', name: '🦁 雄獅盟主', icon: '🦁', price: 80000 },
    'avatar-unicorn': { id: 'avatar-unicorn', name: '🦄 獨角幻獸', icon: '🦄', price: 180000 },
    'avatar-alien': { id: 'avatar-alien', name: '👽 矩陣星人', icon: '👽', price: 90000 },
    'avatar-robot': { id: 'avatar-robot', name: '🤖 算力智械', icon: '🤖', price: 60000 },
    'avatar-ghost': { id: 'avatar-ghost', name: '👻 幽靈代碼', icon: '👻', price: 35000 },
    'avatar-fire': { id: 'avatar-fire', name: '🔥 烈焰特工', icon: '🔥', price: 75000 },
    'avatar-water': { id: 'avatar-water', name: '💧 脈衝流水', icon: '💧', price: 28000 },
    'avatar-earth': { id: 'avatar-earth', name: '🌱 蓋亞心靈', icon: '🌱', price: 22000 }
  };

  const BORDERS = {
    'border-none': { id: 'border-none', name: '無外框', color: 'transparent', price: 0 },
    'border-cyan': { id: 'border-cyan', name: '⚡ 脈衝電青', color: '#00f0ff', price: 30000 },
    'border-pink': { id: 'border-pink', name: '🌸 櫻花落瓣', color: '#F1C4CD', price: 50000 },
    'border-gold': { id: 'border-gold', name: '👑 帝國黃金', color: '#ffd700', price: 200000 },
    'border-red': { id: 'border-red', name: '🔥 烈火紅印', color: '#ff3b30', price: 45000 },
    'border-purple': { id: 'border-purple', name: '🔮 霓虹幽紫', color: '#af52de', price: 60000 },
    'border-green': { id: 'border-green', name: '🔋 矩陣毒綠', color: '#34c759', price: 25000 },
    'border-orange': { id: 'border-orange', name: '☄️ 火山熔岩', color: '#ff9500', price: 80000 },
    'border-blue': { id: 'border-blue', name: '💧 深海冰藍', color: '#007aff', price: 35000 },
    'border-white': { id: 'border-white', name: '◽ 純潔矩陣', color: '#ffffff', price: 10000 },
    'border-dark': { id: 'border-dark', name: '🖤 暗夜幽影', color: '#1c1c1e', price: 55000 },
    'border-rainbow': { id: 'border-rainbow', name: '🌈 彩虹光柵', color: 'linear-gradient(to right, red, orange, yellow, green, blue, purple)', price: 500000 },
    'border-platinum': { id: 'border-platinum', name: '💎 璀璨鉑金', color: '#e5e5ea', price: 400000 },
    'border-neon-pink': { id: 'border-neon-pink', name: '👙 賽博霓粉', color: '#ff007f', price: 95000 },
    'border-acid': { id: 'border-acid', name: '🥑 酸性熒光', color: '#ccff00', price: 70000 },
    'border-shadow': { id: 'border-shadow', name: '🌫️ 虛空迷霧', color: '#8e8e93', price: 48000 },
    'border-laser': { id: 'border-laser', name: '📡 激光鐳射', color: '#5856d6', price: 120000 },
    'border-sakura': { id: 'border-sand', name: '🍡 櫻花春爛', color: '#ffb3ba', price: 110000 },
    'border-sand': { id: 'border-sand', name: '🏜️ 狂沙風暴', color: '#c5a059', price: 32000 },
    'border-matrix': { id: 'border-matrix', name: '📟 虛擬矩陣', color: '#39ff14', price: 160000 },

    /* 8 種慢慢閃爍外框（隨機價位混入） */
    'border-pulse-rose': { id: 'border-pulse-rose', name: '🌹 脈衝玫瑰', color: '#ff8fab', price: 68000, effectClass: 'border-effect-pulse-rose' },
    'border-pulse-ice': { id: 'border-pulse-ice', name: '❄️ 冰脈微閃', color: '#7dd3fc', price: 54000, effectClass: 'border-effect-pulse-ice' },
    'border-pulse-lime': { id: 'border-pulse-lime', name: '🍋 萊姆慢閃', color: '#bef264', price: 72000, effectClass: 'border-effect-pulse-lime' },
    'border-pulse-violet': { id: 'border-pulse-violet', name: '🪻 紫霧波動', color: '#c4b5fd', price: 83000, effectClass: 'border-effect-pulse-violet' },
    'border-pulse-amber': { id: 'border-pulse-amber', name: '🧡 琥珀呼吸', color: '#fbbf24', price: 60000, effectClass: 'border-effect-pulse-amber' },
    'border-pulse-mint': { id: 'border-pulse-mint', name: '🌿 薄荷閃頻', color: '#5eead4', price: 78000, effectClass: 'border-effect-pulse-mint' },
    'border-pulse-coral': { id: 'border-pulse-coral', name: '🪸 珊瑚暖閃', color: '#fb7185', price: 69000, effectClass: 'border-effect-pulse-coral' },
    'border-pulse-silver': { id: 'border-pulse-silver', name: '🩶 銀輝慢閃', color: '#d1d5db', price: 92000, effectClass: 'border-effect-pulse-silver' },

    /* 5 種霓虹特效外框（隨機價位混入） */
    'border-neon-cyan': { id: 'border-neon-cyan', name: '⚡ 霓虹電青', color: '#00f0ff', price: 150000, effectClass: 'border-effect-neon-cyan' },
    'border-neon-magenta': { id: 'border-neon-magenta', name: '💖 霓虹洋紅', color: '#ff1fa8', price: 168000, effectClass: 'border-effect-neon-magenta' },
    'border-neon-lime': { id: 'border-neon-lime', name: '🟢 霓虹毒綠', color: '#39ff14', price: 142000, effectClass: 'border-effect-neon-lime' },
    'border-neon-violet': { id: 'border-neon-violet', name: '🟣 霓虹紫電', color: '#9d4edd', price: 176000, effectClass: 'border-effect-neon-violet' },
    'border-neon-gold': { id: 'border-neon-gold', name: '✨ 霓虹鎏金', color: '#ffd700', price: 188000, effectClass: 'border-effect-neon-gold' }
  };

  const BADGES = {
    'first_step': { id: 'first_step', name: '初試身手', icon: '🐣', desc: '通過 Stage 01', price: 0 },
    'error_buster': { id: 'error_buster', name: '錯題終結者', icon: '🧹', desc: '消除 20 題錯題', price: 0 },
    'mission_clear': { id: 'mission_clear', name: '達成任務', icon: '👑', desc: 'Stage 20 達 S 級', price: 0 },
    'stars_50': { id: 'stars_50', name: '獎金達標', icon: '💰', desc: '累積高額金幣獎勵', price: 0 },
    'mission_perfect': { id: 'mission_perfect', name: '完美達標', icon: '💎', desc: '單關所有題 100% 正確', price: 0 },
    'badge-speedster': { id: 'badge-speedster', name: '超頻閃電', icon: '⚡', desc: '平均答題時間 < 1 秒', price: 20000 },
    'badge-persistent': { id: 'badge-persistent', name: '毅力特工', icon: '🧗', desc: '完成 100 局遊戲', price: 30000 },
    'badge-millionaire': { id: 'badge-millionaire', name: '百萬富翁', icon: '🏦', desc: '擁有 100 萬金幣', price: 50000 },
    'badge-gambler': { id: 'badge-gambler', name: '極限狂熱', icon: '🎰', desc: '挑戰 Mission 50 通關', price: 80000 },
    'badge-heart': { id: 'badge-heart', name: '心算之心', icon: '❤️', desc: '愛與計算的化身', price: 10000 },
    'badge-brain': { id: 'badge-brain', name: '超腦覺醒', icon: '🧠', desc: '算力突破天際', price: 120000 },
    'badge-comet': { id: 'badge-comet', name: '流星暴擊', icon: '☄️', desc: '連擊數突破 50 combo', price: 40000 },
    'badge-rocket': { id: 'badge-rocket', name: '火箭升空', icon: '🚀', desc: '升級速度飛快', price: 15000 },
    'badge-shield': { id: 'badge-shield', name: '護盾守護', icon: '🛡️', desc: '答對率 100% 且無失誤', price: 25000 },
    'badge-ghost': { id: 'badge-ghost', name: '幻影代碼', icon: '👻', desc: '極速通關無蹤影', price: 65000 },
    'badge-clover': { id: 'badge-clover', name: '幸運草', icon: '🍀', desc: '運氣也是實力的一部分', price: 12000 },
    'badge-cup': { id: 'badge-cup', name: '冠軍金盃', icon: '🏆', desc: '全台排行榜第一名', price: 150000 },
    'badge-music': { id: 'badge-music', name: '算術音符', icon: '🎵', desc: '計算如音樂般流暢', price: 8000 },
    'badge-skull': { id: 'badge-skull', name: '深淵霸王', icon: '💀', desc: '挑戰地獄難度 Mission', price: 100000 },
    'badge-star': { id: 'badge-star', name: '璀璨特工', icon: '⭐', desc: '獲得所有 S 級通關', price: 180000 }
  };

  window.MATH_SPRINT_AVATARS = AVATARS;
  window.MATH_SPRINT_BORDERS = BORDERS;
  window.MATH_SPRINT_BADGES = BADGES;
})();
