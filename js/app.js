document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    // --- Стан користувача ---
    let isUserLoggedInGlobally = false; // Початковий стан - не залогінений
    // Для тестування:
    // isUserLoggedInGlobally = true; 
    // ------------------------

    // DOM елементи
    const pageContentArea = document.getElementById('page-content-area');
    const navButtons = document.querySelectorAll('nav .nav-button');
    const userInfoFooter = document.getElementById('user-info-footer');
    const initialLoaderHTML = '<div class="loader-container"><div class="loader"></div></div>';

    const loggedInHeaderEl = document.getElementById('loggedInHeader');
    const loggedOutHeaderEl = document.getElementById('loggedOutHeader');
    const loginRegisterButtonEl = document.getElementById('loginRegisterButton');
    const depositButtonEl = document.getElementById('depositButton');

    // Баланси
    window.currentBalances = { 
        main: 0.00,
        bonus: 0.00,
        freebets: 0, 
        freebetAmount: 250.00 
    };
    const mainBalanceDisplayEl = document.getElementById('mainBalanceDisplay');
    const bonusBalanceDisplayEl = document.getElementById('bonusBalanceDisplay');
    const freebetLineEl = document.getElementById('freebetLine'); 

    window.updateBalanceDisplay = function() {
        if (mainBalanceDisplayEl) mainBalanceDisplayEl.textContent = window.currentBalances.main.toFixed(2);
        if (bonusBalanceDisplayEl) bonusBalanceDisplayEl.textContent = window.currentBalances.bonus.toFixed(2);
        if (freebetLineEl) {
            if (window.currentBalances.freebets > 0 && window.currentBalances.freebetAmount > 0) {
                freebetLineEl.innerHTML = `${window.currentBalances.freebets} фрібет на <strong style="font-weight: 500;">${window.currentBalances.freebetAmount.toFixed(2)}</strong> ₴`;
            } else {
                freebetLineEl.textContent = "Фрібети: 0"; 
            }
        }
    };

    // Утилита для отображения сообщения о неавторизованном состоянии
    window.showNotLoggedInMessage = function(container) {
        if (container) {
            container.innerHTML = '<div class="info-message notice">Будь ласка, увійдіть або зареєструйтеся, щоб переглянути цю секцію.</div>';
        }
    };

    // Утилита для предотвращения множественных кликов
    window.disableButtonDuringAction = function(button, action) {
        if (button) button.disabled = true;
        try {
            return action();
        } finally {
            if (button) button.disabled = false;
        }
    };
    
    function updateUserLoginStateUI() {
        if (!loggedInHeaderEl || !loggedOutHeaderEl || !userInfoFooter) {
            console.error('Header or footer elements not found during updateUserLoginStateUI');
            return;
        }

        if (isUserLoggedInGlobally) {
            loggedInHeaderEl.classList.remove('hidden');
            loggedOutHeaderEl.classList.add('hidden');
            userInfoFooter.classList.remove('hidden');

            window.currentBalances.main = 1500.00;
            window.currentBalances.bonus = 500.00;
            window.currentBalances.freebets = 1;
            updateBalanceDisplay();

            if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
                const user = tg.initDataUnsafe.user;
                userInfoFooter.innerHTML = `Користувач: ${user.first_name || ''} ${user.last_name || ''} (@${user.username || 'N/A'}, ID: ${user.id})`;
            } else {
                userInfoFooter.textContent = "Користувач: Demo User";
            }
        } else {
            loggedInHeaderEl.classList.add('hidden');
            loggedOutHeaderEl.classList.remove('hidden');
            userInfoFooter.classList.add('hidden');

            window.currentBalances.main = 0.00;
            window.currentBalances.bonus = 0.00;
            window.currentBalances.freebets = 0;
            updateBalanceDisplay(); 
        }
    }

    if (loginRegisterButtonEl) {
        loginRegisterButtonEl.addEventListener('click', () => {
            tg.showConfirm("Ви будете перенаправлені на сайт BetKing для входу або реєстрації. Продовжити?", (confirmed) => {
                if (confirmed) {
                    tg.showAlert("Імітація переходу на сайт... Для цілей MVP, вважаємо, що ви успішно увійшли!");
                    isUserLoggedInGlobally = true;
                    const currentPageUrl = localStorage.getItem('betkingActivePageUrl') || 'pages/match-of-the-day.html';
                    const currentNavId = localStorage.getItem('betkingActiveNavId') || 'navMotd';
                    loadPage(currentPageUrl, currentNavId).then(() => {
                        updateUserLoginStateUI();
                    });
                }
            });
        });
    }

    if (depositButtonEl) {
        depositButtonEl.addEventListener('click', () => {
            tg.showConfirm("Ви будете перенаправлені на сторінку поповнення BetKing. Продовжити?", (confirmed) => {
                if (confirmed) {
                    tg.showAlert("Імітація переходу на сторінку депозиту... (в розробці)");
                }
            });
        });
    }
    
    window.isUserCurrentlyLoggedIn = function() {
        return isUserLoggedInGlobally;
    };

    window.confetti = null; 
    const confettiScript = document.createElement('script');
    confettiScript.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js';
    confettiScript.onload = () => {};
    confettiScript.onerror = () => console.error('Failed to load confetti library.');
    document.head.appendChild(confettiScript);
    
    window.getFormattedDate = function(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    window.TODAY_STRING = window.getFormattedDate(new Date());

    async function loadPage(pageUrl, targetNavButtonId) {
        pageContentArea.innerHTML = initialLoaderHTML; 
        try {
            const response = await fetch(pageUrl);
            if (!response.ok) { throw new Error(`Failed to load page ${pageUrl}: ${response.status}`); }
            const html = await response.text();
            pageContentArea.innerHTML = html; 

            let scriptSrc = null;
            if (pageUrl.includes('match-of-the-day.html')) { scriptSrc = 'js/motd.js'; }
            else if (pageUrl.includes('express-of-the-day.html')) { scriptSrc = 'js/eotd.js'; }
            else if (pageUrl.includes('daily-login.html')) { scriptSrc = 'js/daily.js'; }
            
            if (scriptSrc) {
                const oldScript = document.getElementById('pageSpecificScript');
                if (oldScript) { oldScript.remove(); }
                const pageScript = document.createElement('script');
                pageScript.id = 'pageSpecificScript'; 
                pageScript.src = scriptSrc;
                pageScript.type = 'text/javascript'; 
                pageScript.onload = () => {};
                pageScript.onerror = () => console.error(`Failed to load script: ${scriptSrc}`);
                document.body.appendChild(pageScript); 
            }
            setActiveNavButton(targetNavButtonId);
            localStorage.setItem('betkingActivePageUrl', pageUrl);
            localStorage.setItem('betkingActiveNavId', targetNavButtonId);
        } catch (error) {
            console.error('Error loading page:', error);
            pageContentArea.innerHTML = '<div class="info-message error">Помилка завантаження сторінки. Спробуйте ще раз.</div>';
            tg.showAlert('Не вдалося завантажити сторінку. Перевірте підключення до мережі.');
        }
    }

    function setActiveNavButton(activeButtonId) {
        navButtons.forEach(button => { button.classList.toggle('active', button.id === activeButtonId); });
    }

    navButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const pageUrl = e.currentTarget.dataset.page;
            const navId = e.currentTarget.id;
            if (pageUrl) { loadPage(pageUrl, navId); }
            else { console.warn('Nav button missing data-page or value empty:', e.currentTarget); }
        });
    });

    // Обробка параметра startapp для глибоких посилань
    const initData = tg.initDataUnsafe;
    const startParam = initData.start_param || '';

    // Вибір сторінки залежно від параметра startapp
    let initialPageUrl = 'pages/match-of-the-day.html';
    let initialNavId = 'navMotd';

    if (startParam === 'forecast') {
        initialPageUrl = 'pages/daily-login.html';
        initialNavId = 'navDaily';
    } else if (startParam === 'match') {
        initialPageUrl = 'pages/match-of-the-day.html';
        initialNavId = 'navMotd';
    } else if (startParam === 'express') {
        initialPageUrl = 'pages/express-of-the-day.html';
        initialNavId = 'navEotd';
    }

    // Завантажуємо сторінку
    updateUserLoginStateUI();
    const lastActivePageUrl = localStorage.getItem('betkingActivePageUrl') || initialPageUrl;
    const lastActiveNavId = localStorage.getItem('betkingActiveNavId') || initialNavId;
    loadPage(lastActivePageUrl, lastActiveNavId);
});