// js/motd.js
(function() {
    const motdContent = document.getElementById('matchOfTheDayContent');
    if (!motdContent) {
        return;
    }

    const tgM = window.Telegram.WebApp;
    // Доступ до глобальних функцій та змінних з app.js
    const updateBalanceDisplay = window.updateBalanceDisplay;
    const currentBalances = window.currentBalances;
    const confetti = window.confetti;


    const matchOfTheDayData = { /* ... (дані матчу як раніше) ... */ };
    matchOfTheDayData.team1 = "Динамо Київ"; // Для повноти, якщо вони були скорочені
    matchOfTheDayData.team2 = "Шахтар Донецьк";
    matchOfTheDayData.date = "12 Травня 2025, 19:00";
    matchOfTheDayData.odds = {
        p1: { name: "П1", value: 2.50, description: "Перемога Динамо Київ" },
        x:  { name: "X", value: 3.20, description: "Нічия" },
        p2: { name: "П2", value: 2.80, description: "Перемога Шахтар Донецьк" }
    };
    let motdSelectedOdd = null;

    const matchTeamsEl = motdContent.querySelector('#matchTeams');
    const matchDateEl = motdContent.querySelector('#matchDate');
    const oddsContainerEl = motdContent.querySelector('#oddsContainer');
    const motdStakeOptionsEl = motdContent.querySelector('#motdStakeOptions');
    const motdBetConfirmationEl = motdContent.querySelector('#motdBetConfirmation');

    function displayMatchOfTheDay() { /* ... (код без змін) ... */ }
    // Копіюємо тіло функції displayMatchOfTheDay
    function displayMatchOfTheDay() {
        if (!matchTeamsEl || !matchDateEl || !oddsContainerEl) {
            console.error('MOTD DOM elements not found for display.');
            return;
        }
        matchTeamsEl.textContent = `${matchOfTheDayData.team1} - ${matchOfTheDayData.team2}`;
        matchDateEl.textContent = matchOfTheDayData.date;
        oddsContainerEl.innerHTML = '';
        for (const key in matchOfTheDayData.odds) {
            const odd = matchOfTheDayData.odds[key];
            const button = document.createElement('button');
            button.className = 'odds-button';
            button.dataset.key = key;
            button.innerHTML = `${odd.name}<br>${odd.value.toFixed(2)}`;
            button.addEventListener('click', handleMotdOddSelection);
            oddsContainerEl.appendChild(button);
        }
    }


    function handleMotdOddSelection(event) {
        oddsContainerEl.querySelectorAll('.odds-button').forEach(btn => btn.classList.remove('selected'));
        const selectedButton = event.currentTarget;
        selectedButton.classList.add('selected');
        const oddKey = selectedButton.dataset.key;
        motdSelectedOdd = matchOfTheDayData.odds[oddKey];
        
        if (motdStakeOptionsEl) {
            // Очистити попередні кнопки фрібетів, якщо вони були
            const existingFreebetButton = motdStakeOptionsEl.querySelector('.freebet-stake-button');
            if (existingFreebetButton) {
                existingFreebetButton.remove();
            }

            // Якщо є фрібети, додаємо кнопку для їх використання
            if (currentBalances.freebets > 0) {
                const freebetButton = document.createElement('button');
                freebetButton.className = 'stake-button freebet-stake-button'; // Додаємо новий клас
                freebetButton.textContent = `Використати Фрібет (${currentBalances.freebets} шт.)`;
                freebetButton.dataset.amount = 'freebet'; // Спеціальне значення для ідентифікації
                freebetButton.addEventListener('click', processBetPlacement);
                // Вставляємо кнопку фрібету перед кнопками звичайних сум
                motdStakeOptionsEl.insertBefore(freebetButton, motdStakeOptionsEl.querySelector('.motd-stake'));
            }
            motdStakeOptionsEl.classList.remove('hidden');
        }
        if (motdBetConfirmationEl) motdBetConfirmationEl.innerHTML = '';
    }

    // Функція для обробки розміщення ставки (і для фрібетів, і для грошей)
    function processBetPlacement(event) {
        const stakeType = event.currentTarget.dataset.amount; // 'freebet' або числова сума

        if (!motdSelectedOdd) {
            tgM.showAlert('Будь ласка, спочатку оберіть результат матчу дня!');
            return;
        }

        let amount = 0;
        let messagePrefix = "Матч дня: ";
        let betMade = false;

        if (stakeType === 'freebet') {
            if (currentBalances.freebets > 0) {
                currentBalances.freebets--;
                amount = 0; // Сума не списується з основного балансу
                messagePrefix += `Ставка Фрібетом. `;
                betMade = true;
            } else {
                tgM.showAlert('У вас немає доступних фрібетів.');
                return;
            }
        } else {
            amount = parseInt(stakeType);
            if (currentBalances.main >= amount) {
                currentBalances.main -= amount;
                messagePrefix += `Ставка ${amount} грн. `;
                betMade = true;
            } else {
                tgM.showAlert('Недостатньо коштів на основному балансі.');
                return;
            }
        }

        if (betMade) {
            updateBalanceDisplay(); // Оновлюємо відображення балансів у хедері

            const potentialWin = (amount > 0 ? amount : 100) * motdSelectedOdd.value; // Умовний розрахунок виграшу для фрібету, ніби він 100 грн
            const confirmationMessage = `${messagePrefix}Вашу ставку на "${motdSelectedOdd.description}" (${motdSelectedOdd.name} @${motdSelectedOdd.value.toFixed(2)}) прийнято (MVP).<br>${stakeType !== 'freebet' ? `Можливий виграш: ${potentialWin.toFixed(2)} грн.` : `Виграш з фрібету буде зараховано на основний баланс.` }`;
            
            if (motdBetConfirmationEl) motdBetConfirmationEl.innerHTML = `<div class="info-message success">${confirmationMessage.replace(/\n/g, "<br>")}</div>`;
            
            tgM.HapticFeedback.notificationOccurred('success');
            if (confetti) { confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, zIndex: 10000 }); }
        }

        if (motdStakeOptionsEl) motdStakeOptionsEl.classList.add('hidden');
        if (oddsContainerEl) oddsContainerEl.querySelectorAll('.odds-button').forEach(btn => btn.classList.remove('selected'));
        motdSelectedOdd = null;
    }
    
    if (motdStakeOptionsEl) {
        motdStakeOptionsEl.querySelectorAll('.motd-stake').forEach(button => {
            // Тепер ця функція викликає processBetPlacement
            button.addEventListener('click', processBetPlacement);
        });
    }
    
    displayMatchOfTheDay();
})();