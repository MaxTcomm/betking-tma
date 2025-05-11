// js/app.js
document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    // Налаштування кольору хедера Telegram
    if (tg.themeParams.secondary_bg_color) {
        tg.setHeaderColor(tg.themeParams.secondary_bg_color);
    } else if (tg.themeParams.bg_color) {
        tg.setHeaderColor(tg.themeParams.bg_color);
    }

    const pageContentArea = document.getElementById('page-content-area');
    const navButtons = document.querySelectorAll('nav .nav-button');
    const userInfoFooter = document.getElementById('user-info-footer');
    const initialLoaderHTML = '<div class="loader-container"><div class="loader"></div></div>';

    // Глобальна змінна для confetti, щоб інші скрипти мали до неї доступ
    window.confetti = null; 
    const confettiScript = document.createElement('script');
    confettiScript.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js';
    confettiScript.onload = () => {
        // console.log('Confetti library loaded and assigned to window.confetti');
        // Тепер window.confetti доступна глобально
    };
    confettiScript.onerror = () => console.error('Failed to load confetti library.');
    document.head.appendChild(confettiScript);
    
    // Глобальні утиліти
    window.getFormattedDate = function(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    window.TODAY_STRING = window.getFormattedDate(new Date());


    async function loadPage(pageUrl, targetNavButtonId) {
        pageContentArea.innerHTML = initialLoaderHTML; // Показати лоадер

        try {
            const response = await fetch(pageUrl);
            if (!response.ok) {
                throw new Error(`Failed to load page ${pageUrl}: ${response.status}`);
            }
            const html = await response.text();
            pageContentArea.innerHTML = html; // Вставити вміст сторінки

            // Визначити, який скрипт завантажити на основі URL сторінки
            let scriptSrc = null;
            if (pageUrl.includes('match-of-the-day.html')) {
                scriptSrc = 'js/motd.js';
            } else if (pageUrl.includes('express-of-the-day.html')) {
                scriptSrc = 'js/eotd.js';
            } else if (pageUrl.includes('daily-login.html')) {
                scriptSrc = 'js/daily.js';
            }

            if (scriptSrc) {
                // Видаляємо старий скрипт сторінки, якщо він був
                const oldScript = document.getElementById('pageSpecificScript');
                if (oldScript) {
                    oldScript.remove();
                }
                // Завантажуємо новий скрипт
                const pageScript = document.createElement('script');
                pageScript.id = 'pageSpecificScript'; // ID для можливого видалення
                pageScript.src = scriptSrc;
                pageScript.type = 'text/javascript'; // Можна не вказувати для сучасних браузерів
                pageScript.onload = () => {
                    // console.log(`${scriptSrc} loaded and executed.`);
                };
                pageScript.onerror = () => console.error(`Failed to load script: ${scriptSrc}`);
                document.body.appendChild(pageScript); // Додаємо в кінець body
            }

            setActiveNavButton(targetNavButtonId);
            localStorage.setItem('betkingActivePageUrl', pageUrl);
            localStorage.setItem('betkingActiveNavId', targetNavButtonId);

        } catch (error) {
            console.error('Error loading page:', error);
            pageContentArea.innerHTML = `<div class="info-message error">Помилка завантаження сторінки. Будь ласка, спробуйте оновити.</div>`;
        }
    }

    function setActiveNavButton(activeButtonId) {
        navButtons.forEach(button => {
            button.classList.toggle('active', button.id === activeButtonId);
        });
    }

    navButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const pageUrl = e.currentTarget.dataset.page;
            const navId = e.currentTarget.id;
            if (pageUrl) { // Перевірка, чи є URL
                 loadPage(pageUrl, navId);
            } else {
                console.warn('Nav button is missing data-page attribute or its value is empty:', e.currentTarget);
            }
        });
    });

    // Відображення інформації про користувача
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const user = tg.initDataUnsafe.user;
        userInfoFooter.innerHTML = `Користувач: ${user.first_name || ''} ${user.last_name || ''} (@${user.username || 'N/A'}, ID: ${user.id})`;
    } else {
        userInfoFooter.textContent = "Дані користувача Telegram недоступні.";
    }

    // Завантаження початкової сторінки
    const lastActivePageUrl = localStorage.getItem('betkingActivePageUrl') || 'pages/match-of-the-day.html';
    const lastActiveNavId = localStorage.getItem('betkingActiveNavId') || 'navMotd';
    loadPage(lastActivePageUrl, lastActiveNavId);
});