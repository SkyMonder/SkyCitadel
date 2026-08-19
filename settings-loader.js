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
  // Фон — применяем через !important, чтобы перебить CSS
  const bg = localStorage.getItem('skycitadel_bg');
  if (bg) {
    document.body.style.setProperty('background-image', `url(${bg})`, 'important');
    document.body.style.setProperty('background-size', 'cover', 'important');
    document.body.style.setProperty('background-position', 'center center', 'important');
    document.body.style.setProperty('background-attachment', 'fixed', 'important');
    document.body.style.setProperty('background-repeat', 'no-repeat', 'important');
  } else {
    // Если фона нет, сбрасываем
    document.body.style.removeProperty('background-image');
    document.body.style.removeProperty('background-size');
    document.body.style.removeProperty('background-position');
    document.body.style.removeProperty('background-attachment');
    document.body.style.removeProperty('background-repeat');
  }
})();
