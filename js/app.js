// js/app.js
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
    
    function updateUserLoginStateUI() {
        if (isUserLoggedInGlobally) {
            if (loggedInHeaderEl) loggedInHeaderEl.style.display = 'flex'; 
            if (loggedOutHeaderEl) loggedOutHeaderEl.style.display = 'none';
            if (userInfoFooter) userInfoFooter.style.display = 'block'; // Або 'flex' якщо він flex-контейнер

            window.currentBalances.main = 1500.00;
            window.currentBalances.bonus = 500.00;
            window.currentBalances.freebets = 1;
            updateBalanceDisplay();

            if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
                const user = tg.initDataUnsafe.user;
                if (userInfoFooter) userInfoFooter.innerHTML = `Користувач: ${user.first_name || ''} ${user.last_name || ''} (@${user.username || 'N/A'}, ID: ${user.id})`;
            } else {
                if (userInfoFooter) userInfoFooter.textContent = "Користувач: Demo User";
            }
        } else {
            if (loggedInHeaderEl) loggedInHeaderEl.style.display = 'none';
            if (loggedOutHeaderEl) loggedOutHeaderEl.style.display = 'flex';
            if (userInfoFooter) userInfoFooter.style.display = 'none';

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
                    isUserLoggedInGlobally = true; // Змінюємо глобальну змінну
                    updateUserLoginStateUI(); 
                    const currentPageUrl = localStorage.getItem('betkingActivePageUrl') || 'pages/match-of-the-day.html';
                    const currentNavId = localStorage.getItem('betkingActiveNavId') || 'navMotd';
                    loadPage(currentPageUrl, currentNavId); // Перезавантажуємо контент сторінки
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
    
    // Глобальна функція для перевірки стану логіну з інших скриптів
    window.isUserCurrentlyLoggedIn = function() {
        return isUserLoggedInGlobally;
    };

    window.confetti = null; 
    const confettiScript = document.createElement('script');
    confettiScript.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js';
    confettiScript.onload = () => {};
    confettiScript.onerror = () => console.error('Failed to load confetti library.');
    document.head.appendChild(confettiScript);
    
    window.getFormattedDate = function(date) { /* ... тіло функції ... */ };
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
                pageScript.id = 'pageSpecificScript'; pageScript.src = scriptSrc;
                pageScript.type = 'text/javascript'; 
                pageScript.onload = () => {};
                pageScript.onerror = () => console.error(`Failed to load script: ${scriptSrc}`);
                document.body.appendChild(pageScript); 
            }
            setActiveNavButton(targetNavButtonId);
            localStorage.setItem('betkingActivePageUrl', pageUrl);
            localStorage.setItem('betkingActiveNavId', targetNavButtonId);
        } catch (error) { /* ... */ }
    }

    function setActiveNavButton(activeButtonId) { /* ... */ }
    function setActiveNavButton(activeButtonId) {
        navButtons.forEach(button => { button.classList.toggle('active', button.id === activeButtonId); });
    }
    navButtons.forEach(button => { /* ... */ });
    navButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const pageUrl = e.currentTarget.dataset.page;
            const navId = e.currentTarget.id;
            if (pageUrl) { loadPage(pageUrl, navId); }
            else { console.warn('Nav button missing data-page or value empty:', e.currentTarget); }
        });
    });
    
    updateUserLoginStateUI(); 
    const lastActivePageUrl = localStorage.getItem('betkingActivePageUrl') || 'pages/match-of-the-day.html';
    const lastActiveNavId = localStorage.getItem('betkingActiveNavId') || 'navMotd';
    loadPage(lastActivePageUrl, lastActiveNavId); 
});