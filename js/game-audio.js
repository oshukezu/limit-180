// Limit 180 — 音效產生器模組 (Audio Module)
(function() {
  // 模組級單例 AudioContext 以避免快速答題時超出瀏覽器限制
  const _audioCtx = (function() {
    const AC = window.AudioContext || window.webkitAudioContext;
    return AC ? new AC() : null;
  })();

  function playSound(type) {
    try {
      if (!_audioCtx) return;
      // 自動恢復被瀏覽器暫停的 AudioContext（需要使用者互動後才會生效）
      if (_audioCtx.state === 'suspended') _audioCtx.resume();
      const ctx = _audioCtx;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const now = ctx.currentTime;
      
      if (type === 'correct') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        osc.frequency.setValueAtTime(783.99, now + 0.16);
        osc.frequency.setValueAtTime(1046.50, now + 0.24);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.45);
      } else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(30, now + 0.35);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.45);
      } else if (type === 'shield') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.25);
        osc.frequency.exponentialRampToValueAtTime(1500, now + 0.5);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
        osc.start(now);
        osc.stop(now + 0.7);
      }
    } catch (e) {
      console.warn("Web Audio context blocked", e);
    }
  }

  // 同步掛載至 MathSprintAudio 與全域 window.playSound，維持最大相容性
  window.MathSprintAudio = {
    playSound
  };
  window.playSound = playSound;
})();
