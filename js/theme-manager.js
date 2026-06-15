// Limit 180 Theme Manager & Sakura Particles System
// Handles applying stylesheet variables, managing purchased themes, and rendering dynamic sakura background effects.

(function() {
  let canvas = null;
  let ctx = null;
  let animationId = null;
  let petals = [];
  const MAX_PETALS = 50;
  let isRunning = false;

  class SakuraPetal {
    constructor(canvas) {
      this.canvas = canvas;
      this.reset(true);
    }

    reset(initY = false) {
      this.x = Math.random() * this.canvas.width;
      this.y = initY ? (Math.random() * this.canvas.height) : -20;
      this.r = Math.random() * 4 + 3; // 半徑
      this.vx = Math.random() * 1.5 - 0.75; // 風向水平速度
      this.vy = Math.random() * 1.2 + 0.8; // 下落垂直速度
      this.deg = Math.random() * 360;
      this.spin = Math.random() * 2 - 1; // 旋轉速度
      // 合格櫻粉色，隨機透明度
      this.color = `rgba(241, 196, 205, ${Math.random() * 0.4 + 0.4})`;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.deg += this.spin;

      // 飄出視窗則重置
      if (this.y > this.canvas.height + 20 || this.x < -20 || this.x > this.canvas.width + 20) {
        this.reset(false);
      }
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate((this.deg * Math.PI) / 180);
      
      // 繪製簡單的櫻花花瓣形狀
      ctx.beginPath();
      ctx.fillStyle = this.color;
      // 橢圓形狀
      ctx.ellipse(0, 0, this.r * 1.5, this.r, 0, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }
  }

  function resizeCanvas() {
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  }

  function startSakura() {
    if (!canvas) {
      canvas = document.getElementById('sakura-canvas');
      if (!canvas) return;
      ctx = canvas.getContext('2d');
      window.addEventListener('resize', resizeCanvas);
      resizeCanvas();
    }

    canvas.style.display = 'block';
    if (isRunning) return;
    isRunning = true;

    // 初始化花瓣
    petals = [];
    for (let i = 0; i < MAX_PETALS; i++) {
      petals.push(new SakuraPetal(canvas));
    }

    function animate() {
      if (!isRunning) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      petals.forEach(petal => {
        petal.update();
        petal.draw(ctx);
      });

      animationId = requestAnimationFrame(animate);
    }
    animate();
  }

  function stopSakura() {
    isRunning = false;
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    if (canvas) {
      canvas.style.display = 'none';
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }

  const ThemeManager = {
    // 支援的主題清單
    THEMES: {
      akaimon: { id: 'akaimon', name: '赤門櫻花', price: 0, preview: ['#F1C4CD', '#1E1618', '#3A2E31'] },
      neon: { id: 'neon', name: '特務霓虹', price: 80000, preview: ['#ff007f', '#0a0a12', '#00f0ff'] },
      lava: { id: 'lava', name: '熔岩深淵', price: 120000, preview: ['#ff3300', '#120500', '#ff6600'] },
      aurora: { id: 'aurora', name: '極地極光', price: 120000, preview: ['#00ffaa', '#03001e', '#7000ff'] },
      gold: { id: 'gold', name: '黃金帝國', price: 1000000, preview: ['#ffd700', '#100f00', '#b8860b'] }
    },

    // 套用指定主題
    applyTheme(themeId) {
      if (!this.THEMES[themeId]) themeId = 'akaimon';

      // 1. 移除現有所有主題 class
      Object.keys(this.THEMES).forEach(tid => {
        if (tid !== 'akaimon') {
          document.body.classList.remove(`theme-${tid}`);
        }
      });

      // 2. 套用新主題 class
      if (themeId !== 'akaimon') {
        document.body.classList.add(`theme-${themeId}`);
      }

      // 3. 控制流光與櫻花動畫切換
      const scannerLine = document.querySelector('.scanner-line');
      
      if (themeId === 'akaimon') {
        // 赤門櫻花：取消流光，啟動粉色飄雪
        if (scannerLine) scannerLine.style.opacity = '0';
        startSakura();
      } else {
        // 其他主題：關閉飄雪，啟動流光
        stopSakura();
        if (scannerLine) scannerLine.style.opacity = '1';
        
        // 隨機重設一下流光顏色以匹配主題
        if (window.changeScannerColor) {
          window.changeScannerColor();
        }
      }

      console.log(`[ThemeManager] 套用主題: ${themeId} (${this.THEMES[themeId].name})`);
    },

    // 初始化加載存檔的主題
    init() {
      if (window.Storage && window.Storage.getProfile) {
        const profile = window.Storage.getProfile();
        const equipped = profile.equipped_theme || 'akaimon';
        this.applyTheme(equipped);
      } else {
        this.applyTheme('akaimon');
      }
    }
  };

  // 掛載至全域
  window.ThemeManager = ThemeManager;

  // 確保在 DOM 載入後初始化一次
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
  } else {
    ThemeManager.init();
  }
})();
