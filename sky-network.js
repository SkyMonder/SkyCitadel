// sky-network.js – единый сетевой модуль для всей экосистемы SkyCitadel
(function() {
    'use strict';

    // ====== Конфигурация ======
    const CONFIG = {
        MAX_RETRIES: 3,
        RETRY_DELAY: 1000, // начальная задержка в мс
        TIMEOUT: 30000,    // таймаут для fetch (30 секунд)
        BANNER_ID: 'sky-network-banner',
    };

    // ====== Состояние ======
    let isOnline = navigator.onLine;
    let retryCount = 0;
    let bannerElement = null;

    // ====== Создание баннера ======
    function createBanner() {
        if (document.getElementById(CONFIG.BANNER_ID)) return;
        const banner = document.createElement('div');
        banner.id = CONFIG.BANNER_ID;
        banner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 10000;
            background: #c44;
            color: white;
            padding: 1rem 2rem;
            text-align: center;
            font-weight: bold;
            font-family: Arial, sans-serif;
            box-shadow: 0 4px 20px rgba(0,0,0,0.8);
            display: none;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
            border-bottom: 3px solid #ff8a8a;
        `;
        banner.innerHTML = `
            <div>⚠️ Ошибка соединения с сервером</div>
            <small>Попробуйте обновить страницу (Ctrl+Shift+R или Cmd+Shift+R). Если ошибка повторяется, подождите 2–3 минуты и обновите страницу.</small>
            <button id="sky-network-retry-btn" style="
                background: white;
                color: #c44;
                border: none;
                padding: 0.5rem 2rem;
                border-radius: 20px;
                font-weight: bold;
                cursor: pointer;
            ">🔄 Обновить страницу</button>
        `;
        document.body.prepend(banner);
        bannerElement = banner;
        document.getElementById('sky-network-retry-btn').addEventListener('click', () => {
            window.location.reload();
        });
    }

    // ====== Показать/скрыть баннер ======
    function showBanner(show = true) {
        if (!bannerElement) createBanner();
        bannerElement.style.display = show ? 'flex' : 'none';
    }

    // ====== Основная функция запроса с повторными попытками ======
    async function apiFetch(url, options = {}) {
        // Если сеть недоступна, сразу показываем баннер
        if (!navigator.onLine) {
            showBanner(true);
            throw new Error('Нет соединения с интернетом');
        }

        // Убираем баннер перед новым запросом (если он был показан)
        showBanner(false);

        // Добавляем таймаут к fetch (через AbortController)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);
        const fetchOptions = { ...options, signal: controller.signal };

        let lastError = null;
        for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
            try {
                const response = await fetch(url, fetchOptions);
                clearTimeout(timeoutId);
                // Если ответ успешный, возвращаем его
                if (response.ok) {
                    return response;
                }
                // Если статус 5xx или 429 (Too Many Requests), пробуем повторить
                if (response.status >= 500 || response.status === 429) {
                    throw new Error(`Server error: ${response.status}`);
                }
                // Иначе возвращаем ответ как есть (клиентские ошибки не ретраим)
                return response;
            } catch (err) {
                clearTimeout(timeoutId);
                lastError = err;
                console.warn(`🌐 Попытка ${attempt} из ${CONFIG.MAX_RETRIES} не удалась:`, err.message);
                if (attempt < CONFIG.MAX_RETRIES) {
                    // Экспоненциальная задержка
                    const delay = CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        // Все попытки провалились
        showBanner(true);
        throw new Error(`Не удалось выполнить запрос после ${CONFIG.MAX_RETRIES} попыток: ${lastError?.message || 'неизвестная ошибка'}`);
    }

    // ====== Обёртка для JSON-запросов ======
    async function apiJson(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };
        const response = await apiFetch(url, { ...options, headers });
        if (!response.ok) {
            // Попытка прочитать тело ошибки
            let errorBody = '';
            try { errorBody = await response.text(); } catch (e) {}
            throw new Error(`HTTP ${response.status}: ${response.statusText}${errorBody ? ' - ' + errorBody : ''}`);
        }
        return response.json();
    }

    // ====== Мониторинг состояния сети ======
    window.addEventListener('online', () => {
        isOnline = true;
        showBanner(false);
        console.log('🌐 Сеть восстановлена');
    });
    window.addEventListener('offline', () => {
        isOnline = false;
        showBanner(true);
        console.log('🌐 Сеть потеряна');
    });

    // ====== Инициализация ======
    createBanner();
    // Если изначально офлайн, показываем баннер
    if (!navigator.onLine) {
        showBanner(true);
    }

    // ====== Экспортируем публичный API ======
    window.SkyNetwork = {
        fetch: apiFetch,
        json: apiJson,
        showBanner,
        get isOnline() { return isOnline; },
        config: CONFIG,
    };

    console.log('🌐 SkyNetwork загружен. API доступен как window.SkyNetwork');
})();
