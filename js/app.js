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
    const initialLoaderHTML = '<div class="loader-container"><div class="loader"></div></div>';

    // --- Управління балансами ---
    window.currentBalances = { // Робимо глобальним для доступу з інших скриптів
        main: 1500.00,
        bonus: 250.50,
        freebets: 3
    };

    const mainBalanceDisplayEl = document.getElementById('mainBalanceDisplay');
    const bonusBalanceDisplayEl = document.getElementById('bonusBalanceDisplay');
    const freebetsDisplayEl = document.getElementById('freebetsDisplay');

    window.updateBalanceDisplay = function() {
        if (mainBalanceDisplayEl) mainBalanceDisplayEl.textContent = window.currentBalances.main.toFixed(2);
        if (bonusBalanceDisplayEl) bonusBalanceDisplayEl.textContent = window.currentBalances.bonus.toFixed(2);
        if (freebetsDisplayEl) freebetsDisplayEl.textContent = window.currentBalances.freebets;
    }
    // Ініціалізація відображення балансів при першому завантаженні
    window.updateBalanceDisplay(); 
    // ---------------------------


    window.confetti = null; 
    const confettiScript = document.createElement('script');
    confettiScript.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js';
    confettiScript.onload = () => { /* console.log('Confetti loaded'); */ };
    confettiScript.onerror = () => console.error('Failed to load confetti library.');
    document.head.appendChild(confettiScript);
    
    window.getFormattedDate = function(date) { /* ... (код без змін) ... */ };
    window.TODAY_STRING = window.getFormattedDate(new Date());
    // Копіюємо тіло функції getFormattedDate
    window.getFormattedDate = function(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    async function loadPage(pageUrl, targetNavButtonId) {
        // ... (код функції loadPage без змін, як у попередньому кроці)
        pageContentArea.innerHTML = initialLoaderHTML; 

        try {
            const response = await fetch(pageUrl);
            if (!response.ok) {
                throw new Error(`Failed to load page ${pageUrl}: ${response.status}`);
            }
            const html = await response.text();
            pageContentArea.innerHTML = html; 

            let scriptSrc = null;
            if (pageUrl.includes('match-of-the-day.html')) {
                scriptSrc = 'js/motd.js';
            } else if (pageUrl.includes('express-of-the-day.html')) {
                scriptSrc = 'js/eotd.js';
            } else if (pageUrl.includes('daily-login.html')) {
                scriptSrc = 'js/daily.js';
            }

            if (scriptSrc) {
                const oldScript = document.getElementById('pageSpecificScript');
                if (oldScript) {
                    oldScript.remove();
                }
                const pageScript = document.createElement('script');
                pageScript.id = 'pageSpecificScript'; 
                pageScript.src = scriptSrc;
                pageScript.type = 'text/javascript'; 
                pageScript.onload = () => { /* console.log(`${scriptSrc} loaded`); */ };
                pageScript.onerror = () => console.error(`Failed to load script: ${scriptSrc}`);
                document.body.appendChild(pageScript); 
            }

            setActiveNavButton(targetNavButtonId);
            localStorage.setItem('betkingActivePageUrl', pageUrl);
            localStorage.setItem('betkingActiveNavId', targetNavButtonId);

        } catch (error) {
            console.error('Error loading page:', error);
            pageContentArea.innerHTML = `<div class="info-message error">Помилка завантаження сторінки. Будь ласка, спробуйте оновити.</div>`;
        }
    }

    function setActiveNavButton(activeButtonId) { /* ... (код без змін) ... */ }
    // Копіюємо тіло функції setActiveNavButton
    function setActiveNavButton(activeButtonId) {
        navButtons.forEach(button => {
            button.classList.toggle('active', button.id === activeButtonId);
        });
    }


    navButtons.forEach(button => { /* ... (код без змін) ... */ });
    // Копіюємо тіло обробника для navButtons
    navButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const pageUrl = e.currentTarget.dataset.page;
            const navId = e.currentTarget.id;
            if (pageUrl) { 
                 loadPage(pageUrl, navId);
            } else {
                console.warn('Nav button is missing data-page attribute or its value is empty:', e.currentTarget);
            }
        });
    });


    if (tg.initDataUnsafe && tg.initDataUnsafe.user) { /* ... (код без змін) ... */ }
    // Копіюємо тіло для userInfoFooter
     if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const user = tg.initDataUnsafe.user;
        userInfoFooter.innerHTML = `Користувач: ${user.first_name || ''} ${user.last_name || ''} (@${user.username || 'N/A'}, ID: ${user.id})`;
    } else {
        userInfoFooter.textContent = "Дані користувача Telegram недоступні.";
    }

    const lastActivePageUrl = localStorage.getItem('betkingActivePageUrl') || 'pages/match-of-the-day.html';
    const lastActiveNavId = localStorage.getItem('betkingActiveNavId') || 'navMotd';
    loadPage(lastActivePageUrl, lastActiveNavId);
});