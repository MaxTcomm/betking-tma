// js/app.js
document.addEventListener('DOMContentLoaded', () => {
    // ... (початок app.js як раніше) ...
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    if (tg.themeParams.secondary_bg_color) { /* ... */ }

    const pageContentArea = document.getElementById('page-content-area');
    const navButtons = document.querySelectorAll('nav .nav-button');
    const userInfoFooter = document.getElementById('user-info-footer');
    const initialLoaderHTML = '<div class="loader-container"><div class="loader"></div></div>';


    // --- Управління балансами ---
    window.currentBalances = { 
        main: 1500.00,
        bonus: 250.50,
        freebets: 1, // Тепер 1 фрібет
        freebetAmount: 250.00 // Номінал фрібету
    };

    const mainBalanceDisplayEl = document.getElementById('mainBalanceDisplay');
    const bonusBalanceDisplayEl = document.getElementById('bonusBalanceDisplay');
    const freebetsDisplayEl = document.getElementById('freebetsDisplay');

    window.updateBalanceDisplay = function() {
        if (mainBalanceDisplayEl) mainBalanceDisplayEl.textContent = window.currentBalances.main.toFixed(2);
        if (bonusBalanceDisplayEl) bonusBalanceDisplayEl.textContent = window.currentBalances.bonus.toFixed(2);
        if (freebetsDisplayEl) {
            if (window.currentBalances.freebets > 0) {
                // Оновлений текст для фрібету
                freebetsDisplayEl.innerHTML = `на <strong style="font-weight: 500;">${window.currentBalances.freebetAmount.toFixed(2)}</strong> ₴`;
                // Або, якщо ви хочете зберегти "Фрібет:" як лейбл, а поруч значення:
                // freebetsDisplayEl.parentElement.querySelector('p').childNodes[0].nodeValue = "Фрібет: "; // Змінюємо текст лейбла
                // freebetsDisplayEl.innerHTML = `на <strong style="font-weight: 500;">${window.currentBalances.freebetAmount.toFixed(2)}</strong> ₴`;

                // Для відповідності макету, де написано "Фрібет: 1 шт. (250.00 ₴)"
                // Потрібно буде змінити HTML в index.html, щоб було місце для "1 шт."
                // Поки що зробимо як ви просили "Фрібет на 250.00 ₴"
                // Щоб це виглядало краще, HTML для фрібетів в index.html має бути:
                // <p id="freebetLabel">Фрібет:</p> <p><strong id="freebetsDisplay">на 250.00</strong> ₴</p>
                // Або просто:
                // <p>Фрібет: <strong id="freebetsDisplay">на 250.00</strong> ₴</p> 
                // На макеті у вас "Фрібет: 1 шт. (250.00 ₴)"
                // Давайте спробуємо так:
                const freebetText = window.currentBalances.freebets > 0 ? `1 шт. (${window.currentBalances.freebetAmount.toFixed(2)} ₴)` : "0 шт.";
                freebetsDisplayEl.textContent = freebetText;


            } else {
                freebetsDisplayEl.textContent = "0 шт.";
            }
        }
    }
    window.updateBalanceDisplay(); 
    
    // ... (решта app.js як раніше: confetti, getFormattedDate, loadPage, etc.) ...
    window.confetti = null; 
    const confettiScript = document.createElement('script'); /* ... */
    document.head.appendChild(confettiScript);
    
    window.getFormattedDate = function(date) { /* ... */ };
    window.TODAY_STRING = window.getFormattedDate(new Date());
    window.getFormattedDate = function(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    async function loadPage(pageUrl, targetNavButtonId) { /* ... */ }
    async function loadPage(pageUrl, targetNavButtonId) {
        pageContentArea.innerHTML = initialLoaderHTML; 
        try {
            const response = await fetch(pageUrl);
            if (!response.ok) { throw new Error(`Failed to load page ${pageUrl}: ${response.status}`);}
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

    if (tg.initDataUnsafe && tg.initDataUnsafe.user) { /* ... */ }
     if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const user = tg.initDataUnsafe.user;
        userInfoFooter.innerHTML = `Користувач: ${user.first_name || ''} ${user.last_name || ''} (@${user.username || 'N/A'}, ID: ${user.id})`;
    } else { userInfoFooter.textContent = "Дані користувача Telegram недоступні."; }

    const lastActivePageUrl = localStorage.getItem('betkingActivePageUrl') || 'pages/match-of-the-day.html';
    const lastActiveNavId = localStorage.getItem('betkingActiveNavId') || 'navMotd';
    loadPage(lastActivePageUrl, lastActiveNavId);
});