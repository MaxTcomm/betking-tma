// js/app.js
document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    if (tg.themeParams.secondary_bg_color) {
        tg.setHeaderColor(tg.themeParams.secondary_bg_color);
    } else if (tg.themeParams.bg_color) {
        tg.setHeaderColor(tg.themeParams.bg_color);
    }

    const pageContentArea = document.getElementById('page-content-area');
    const navButtons = document.querySelectorAll('nav .nav-button');
    const userInfoFooter = document.getElementById('user-info-footer');

    // Завантажуємо бібліотеку confetti тут
    const confettiScript = document.createElement('script');
    confettiScript.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js';
    confettiScript.onload = () => {
        console.log('Confetti library loaded.');
        // Тепер confetti доступна глобально для інших скриптів, якщо вони завантажуються після цього
    };
    document.head.appendChild(confettiScript);


    async function loadPage(pageUrl, targetPageId) {
        try {
            const response = await fetch(pageUrl);
            if (!response.ok) {
                throw new Error(`Failed to load page: ${response.status}`);
            }
            const html = await response.text();
            pageContentArea.innerHTML = html;
            setActiveNavButton(targetPageId); // targetPageId тут - це ID кнопки навігації
            localStorage.setItem('betkingActivePageUrl', pageUrl);
            localStorage.setItem('betkingActiveNavId', targetPageId);

        } catch (error) {
            console.error('Error loading page:', error);
            pageContentArea.innerHTML = `<p style="color: red; text-align:center;">Помилка завантаження сторінки.</p>`;
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
            loadPage(pageUrl, navId);
        });
    });

    // Відображення інформації про користувача (загальне для всіх сторінок)
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

// Глобальні утиліти, якщо потрібні в інших файлах (краще експортувати/імпортувати з модулями)
function getFormattedDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
const TODAY_STRING = getFormattedDate(new Date());