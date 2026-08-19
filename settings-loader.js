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
    document.body.classList.add('has-bg');

    // Добавляем динамические стили для полупрозрачности контейнеров
    if (!document.getElementById('sky-bg-styles')) {
      const style = document.createElement('style');
      style.id = 'sky-bg-styles';
      style.textContent = `
        body.has-bg .container,
        body.has-bg .card,
        body.has-bg .auth-box,
        body.has-bg .modal,
        body.has-bg .sidebar,
        body.has-bg .settings-group {
          background: rgba(26, 35, 58, 0.85) !important;
          backdrop-filter: blur(10px) !important;
          border-color: rgba(255,255,255,0.1) !important;
        }
        body.has-bg.light .container,
        body.has-bg.light .card,
        body.has-bg.light .auth-box,
        body.has-bg.light .modal,
        body.has-bg.light .sidebar,
        body.has-bg.light .settings-group {
          background: rgba(255, 255, 255, 0.85) !important;
          border-color: rgba(0,0,0,0.1) !important;
        }
        /* Дополнительно для чатов и других элементов */
        body.has-bg .msg {
          background: rgba(31, 43, 74, 0.8) !important;
          backdrop-filter: blur(5px) !important;
        }
        body.has-bg .msg.own {
          background: rgba(95, 126, 207, 0.8) !important;
        }
        body.has-bg .chat-item {
          background: rgba(26, 35, 58, 0.6) !important;
          backdrop-filter: blur(4px) !important;
        }
        body.has-bg .chat-item:hover {
          background: rgba(31, 43, 74, 0.8) !important;
        }
        body.has-bg .result-card {
          background: rgba(26, 35, 58, 0.8) !important;
          backdrop-filter: blur(5px) !important;
        }
        body.has-bg .video-card {
          background: rgba(26, 35, 58, 0.8) !important;
          backdrop-filter: blur(5px) !important;
        }
        body.has-bg .post {
          background: rgba(26, 35, 58, 0.8) !important;
          backdrop-filter: blur(5px) !important;
        }
      `;
      document.head.appendChild(style);
    }
  } else {
    document.body.classList.remove('has-bg');
    const existingStyle = document.getElementById('sky-bg-styles');
    if (existingStyle) existingStyle.remove();
    // Сбрасываем фон
    document.body.style.backgroundImage = '';
    document.body.style.backgroundSize = '';
    document.body.style.backgroundPosition = '';
    document.body.style.backgroundAttachment = '';
    document.body.style.backgroundRepeat = '';
  }
})();
