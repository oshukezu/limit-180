// Limit 180 Game Store - Purchase/Sell Ops
(function() {
  function cleanName(name) {
    return String(name || '')
      .replace(/[🛡️🐱🕶️👑🥷✨🦊🐉🐯🐰🐨🐼🦁🦄👽🤖👻🔥💧🌱⚡🌸🔮🔋☄️◽🖤🌈💎👙🥑🌫️📡🍡🏜️📟⭐🧗🏦🎰❤️🧠🎖️🎵💀]/g, '')
      .trim();
  }

  function getItemName(itemId, type) {
    if (type === 'theme') return window.ThemeManager.THEMES[itemId]?.name || '新主題';
    if (type === 'avatar') return window.MATH_SPRINT_AVATARS[itemId]?.name || '新頭像';
    if (type === 'border') return window.MATH_SPRINT_BORDERS[itemId]?.name || '新外框';
    if (type === 'badge') return window.MATH_SPRINT_BADGES[itemId]?.name || '新徽章';
    return '新商品';
  }

  async function purchase(itemId, price, type) {
    const name = cleanName(getItemName(itemId, type));
    const agreed = window.UIFeedback
      ? await window.UIFeedback.confirm(`確定要花費 ${price.toLocaleString('zh-TW')} 💰 購買「${name}」嗎？`, '確認購買')
      : confirm(`確定要花費 💰${price.toLocaleString()} 金幣購買「${name}」嗎？`);
    if (!agreed) return;

    const profile = window.MathSprintStorage.getProfile();
    if ((profile.total_stars || 0) < price) {
      window.UIFeedback?.toast?.('特工，您的金幣餘額不足！', 'error');
      return;
    }
    profile.total_stars -= price;

    if (type === 'theme') {
      if (profile.purchased_themes.includes(itemId)) return;
      profile.purchased_themes.push(itemId);
      profile.equipped_theme = itemId;
      window.ThemeManager.applyTheme(itemId);
    } else if (type === 'avatar') {
      profile.unlocked_assets = profile.unlocked_assets || ['avatar-default', 'border-none'];
      if (profile.unlocked_assets.includes(itemId)) return;
      profile.unlocked_assets.push(itemId);
      profile.equipped_avatar = itemId;
    } else if (type === 'border') {
      profile.unlocked_assets = profile.unlocked_assets || ['avatar-default', 'border-none'];
      if (profile.unlocked_assets.includes(itemId)) return;
      profile.unlocked_assets.push(itemId);
      profile.equipped_border = itemId;
    } else if (type === 'badge') {
      profile.unlocked_achievements = profile.unlocked_achievements || [];
      if (profile.unlocked_achievements.includes(itemId)) return;
      profile.unlocked_achievements.push(itemId);
      profile.equipped_badges = profile.equipped_badges || [];
      if (profile.equipped_badges.length < 2) profile.equipped_badges.push(itemId);
    }

    window.MathSprintStorage.saveProfile(profile);
    this.renderStore();
    window.MathSprintAudio?.play?.('success');
    window.UIFeedback?.toast?.(`已成功解鎖並裝備「${name}」`, 'success');
  }

  async function sell(itemId, price, type) {
    const originPrice = Number(price || 0);
    if (!Number.isFinite(originPrice) || originPrice <= 0) return window.UIFeedback?.toast?.('此商品不可賣出', 'error');
    const refund = Math.floor(originPrice / 2);
    const profile = window.MathSprintStorage.getProfile();
    const name = cleanName(getItemName(itemId, type));
    const agreed = window.UIFeedback
      ? await window.UIFeedback.confirm(`確定要賣出「${name}」嗎？可回收 ${refund.toLocaleString('zh-TW')} 💰`, '確認賣出')
      : confirm(`確定要賣出「${name}」嗎？可回收 💰${refund.toLocaleString()}`);
    if (!agreed) return;

    let sold = false;
    if (type === 'theme') {
      profile.purchased_themes = profile.purchased_themes || ['akaimon'];
      if (!profile.purchased_themes.includes(itemId) || itemId === 'akaimon') return;
      profile.purchased_themes = profile.purchased_themes.filter(id => id !== itemId);
      if (profile.equipped_theme === itemId) {
        profile.equipped_theme = profile.purchased_themes.includes('akaimon') ? 'akaimon' : (profile.purchased_themes[0] || 'akaimon');
        window.ThemeManager?.applyTheme?.(profile.equipped_theme);
      }
      sold = true;
    } else if (type === 'avatar') {
      profile.unlocked_assets = profile.unlocked_assets || ['avatar-default', 'border-none'];
      if (!profile.unlocked_assets.includes(itemId) || itemId === 'avatar-default') return;
      profile.unlocked_assets = profile.unlocked_assets.filter(id => id !== itemId);
      if (profile.equipped_avatar === itemId) profile.equipped_avatar = 'avatar-default';
      sold = true;
    } else if (type === 'border') {
      profile.unlocked_assets = profile.unlocked_assets || ['avatar-default', 'border-none'];
      if (!profile.unlocked_assets.includes(itemId) || itemId === 'border-none') return;
      profile.unlocked_assets = profile.unlocked_assets.filter(id => id !== itemId);
      if (profile.equipped_border === itemId) profile.equipped_border = 'border-none';
      sold = true;
    } else if (type === 'badge') {
      profile.unlocked_achievements = profile.unlocked_achievements || [];
      if (!profile.unlocked_achievements.includes(itemId)) return;
      profile.unlocked_achievements = profile.unlocked_achievements.filter(id => id !== itemId);
      profile.equipped_badges = (profile.equipped_badges || []).filter(id => id !== itemId);
      sold = true;
    }
    if (!sold) return;
    profile.total_stars = (profile.total_stars || 0) + refund;
    window.MathSprintStorage.saveProfile(profile);
    this.renderStore();
    window.UIFeedback?.toast?.(`已賣出「${name}」，回收 ${refund.toLocaleString('zh-TW')} 💰`, 'success');
  }

  window.GameStoreOps = { purchase, sell };
})();
