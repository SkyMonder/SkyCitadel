// settings-loader.js — применяет настройки на всех страницах
(function applySettings() {
  // Тема
  const theme = localStorage.getItem('skycitadel_theme') || 'dark';
  if (theme === 'light') {
    document.body.classList.add('light');
  } else if (theme === 'system') {
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    if (prefersLight) document.body.classList.add('light');
  }
  // Фон
  const bg = localStorage.getItem('skycitadel_bg');
  if (bg) {
    document.body.style.backgroundImage = `url(${bg})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center center';
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.backgroundRepeat = 'no-repeat';
  }
})();
