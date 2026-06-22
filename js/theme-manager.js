// Limit 180 Theme Manager & Sakura Particles System
// Handles applying stylesheet variables, managing purchased themes, and rendering dynamic theme background effects.

(function() {
  let canvas = null;
  let ctx = null;
  let animationId = null;
  let particles = [];
  const MAX_PARTICLES = 50;
  let isRunning = false;
  let activeTheme = 'akaimon';

  class ThemeParticle {
    constructor(canvas) {
      this.canvas = canvas;
      this.reset(true);
    }

    reset(initY = false) {
      this.x = Math.random() * this.canvas.width;
      this.r = Math.random() * 4 + 3; // 半徑
      this.deg = Math.random() * 360;
      this.spin = Math.random() * 2 - 1; // 旋轉速度

      if (activeTheme === 'lava') {
        // 熔岩深淵：從底部往上升的火星灰燼
        this.y = initY ? (Math.random() * this.canvas.height) : this.canvas.height + 20;
        this.vx = Math.random() * 1.0 - 0.5; 
        this.vy = -(Math.random() * 1.2 + 0.8); // 負數代表向上飄
        this.color = `rgba(${Math.random() > 0.5 ? '255, 68, 0' : '255, 170, 0'}, ${Math.random() * 0.5 + 0.5})`;
      } else if (activeTheme === 'aurora') {
        // 極地極光：下落的雪花
        this.y = initY ? (Math.random() * this.canvas.height) : -20;
        this.vx = Math.random() * 1.0 - 0.5; // 風向微弱
        this.vy = Math.random() * 0.8 + 0.5; // 下落較慢
        this.color = `rgba(255, 255, 255, ${Math.random() * 0.6 + 0.4})`;
      } else if (activeTheme === 'gold') {
        // 黃金帝國：旋轉掉落的金幣
        this.y = initY ? (Math.random() * this.canvas.height) : -20;
        this.vx = Math.random() * 0.8 - 0.4;
        this.vy = Math.random() * 1.5 + 1.2; // 下落較快
        this.color = '#ffd700';
      } else {
        // 赤門櫻花 (akaimon) 及其他：粉色櫻花
        this.y = initY ? (Math.random() * this.canvas.height) : -20;
        this.vx = Math.random() * 1.5 - 0.75; 
        this.vy = Math.random() * 1.2 + 0.8; 
        this.color = `rgba(241, 196, 205, ${Math.random() * 0.4 + 0.4})`;
      }
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.deg += this.spin;

      // 飄出視窗則重置
      if (activeTheme === 'lava') {
        // 向上飄出頂部重置
        if (this.y < -20 || this.x < -20 || this.x > this.canvas.width + 20) {
          this.reset(false);
        }
      } else {
        // 向下飄出底部重置
        if (this.y > this.canvas.height + 20 || this.x < -20 || this.x > this.canvas.width + 20) {
          this.reset(false);
        }
      }
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate((this.deg * Math.PI) / 180);
      
      ctx.beginPath();
      ctx.fillStyle = this.color;

      if (activeTheme === 'lava') {
        // 繪製微小、發光的方形或多邊形火星
        ctx.fillRect(-this.r / 2, -this.r / 2, this.r, this.r);
      } else if (activeTheme === 'aurora') {
        // 繪製柔軟、模糊的圓形雪花
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.r);
        grad.addColorStop(0, this.color);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.arc(0, 0, this.r, 0, 2 * Math.PI);
        ctx.fill();
      } else if (activeTheme === 'gold') {
        // 繪製橢圓形且有立體感的金幣
        ctx.ellipse(0, 0, this.r * 1.2, this.r * 0.6, 0, 0, 2 * Math.PI);
        ctx.fill();
        // 加上亮金邊框
        ctx.strokeStyle = '#b8860b';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        // 櫻花：橢圓花瓣形狀
        ctx.ellipse(0, 0, this.r * 1.5, this.r, 0, 0, 2 * Math.PI);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  function resizeCanvas() {
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  }

  function startParticleEngine() {
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

    // 初始化粒子
    particles = [];
    for (let i = 0; i < MAX_PARTICLES; i++) {
      particles.push(new ThemeParticle(canvas));
    }

    function animate() {
      if (!isRunning) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(p => {
        p.update();
        p.draw(ctx);
      });

      animationId = requestAnimationFrame(animate);
    }
    animate();
  }

  function stopParticleEngine() {
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
      activeTheme = themeId;

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

      // 3. 控制流光與粒子動畫切換
      const scannerLine = document.querySelector('.scanner-line');
      
      // 特務霓虹：純掃描流光，不啟動背景粒子
      if (themeId === 'neon') {
        stopParticleEngine();
        if (scannerLine) scannerLine.style.opacity = '1';
      } else {
        // 啟動粒子引擎（自動依 activeTheme 判定是櫻花、火星、雪景或金幣）
        if (scannerLine) scannerLine.style.opacity = '0';
        startParticleEngine();
      }

      console.log(`[ThemeManager] 套用主題: ${themeId} (${this.THEMES[themeId].name})`);
    },

    // 初始化加載存檔的主題
    init() {
      if (window.MathSprintStorage && window.MathSprintStorage.getProfile) {
        const profile = window.MathSprintStorage.getProfile();
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
