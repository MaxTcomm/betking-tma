// js/motd.js
(function() {
    const motdContent = document.getElementById('matchOfTheDayContent');
    if (!motdContent) { return; }

    const tgM = window.Telegram.WebApp;
    const updateBalanceDisplay = window.updateBalanceDisplay;
    const currentBalances = window.currentBalances;
    const confetti = window.confetti;

    const matchOfTheDayData = { /* ... (дані як раніше) ... */ };
    // ... (залишаємо дані матчу без змін) ...
    matchOfTheDayData.team1 = "Динамо Київ";
    matchOfTheDayData.team2 = "Шахтар Донецьк";
    matchOfTheDayData.date = "12 червня 2025, 19:00";
    matchOfTheDayData.odds = {
        p1: { name: "П1", value: 2.50, description: "Перемога Динамо Київ" },
        x:  { name: "X", value: 3.20, description: "Нічия" },
        p2: { name: "П2", value: 2.80, description: "Перемога Шахтар Донецьк" }
    };
    matchOfTheDayData.stakeAmounts = [100, 200, 500];

    let motdSelectedOdd = null;
    let motdSelectedStakeTypeOrAmount = null; 

    const motdTitleDateEl = motdContent.querySelector('#motdTitleDate');
    const motdTeamsEl = motdContent.querySelector('#motdTeams');
    const motdOddsContainerEl = motdContent.querySelector('#motdOddsContainer');
    const motdStakeOptionsAreaEl = motdContent.querySelector('#motdStakeOptionsArea');
    const motdStakeTitleEl = motdContent.querySelector('#motdStakeTitle');
    // Новий контейнер для всіх табів сум та фрібету
    const motdStakeTabsContainerEl = motdContent.querySelector('#motdStakeTabsContainer'); 
    const motdPlaceBetButtonContainerEl = motdContent.querySelector('#motdPlaceBetButtonContainer');
    const motdExecuteBetButtonEl = motdContent.querySelector('#motdExecuteBetButton'); 
    const motdBetConfirmationEl = motdContent.querySelector('#motdBetConfirmation');

    function displayMatchOfTheDay() {
        // ... (код для motdTitleDateEl, motdTeamsEl, motdOddsContainerEl - без змін) ...
        if (!motdTitleDateEl || !motdTeamsEl || !motdOddsContainerEl) { /* ... */ return; }
        motdTitleDateEl.textContent = `${matchOfTheDayData.titlePrefix} • ${matchOfTheDayData.date}`;
        motdTeamsEl.textContent = `${matchOfTheDayData.team1} - ${matchOfTheDayData.team2}`;
        motdOddsContainerEl.innerHTML = ''; 
        for (const key in matchOfTheDayData.odds) {
            const odd = matchOfTheDayData.odds[key];
            const button = document.createElement('button');
            button.className = 'tab-button'; // ВИКОРИСТОВУЄМО НОВИЙ ЗАГАЛЬНИЙ КЛАС
            button.dataset.key = key; 
            button.innerHTML = `<span class="odd-name">${odd.name}</span><span class="odd-value">${odd.value.toFixed(2)}</span>`;
            button.addEventListener('click', handleMotdOddSelection); 
            motdOddsContainerEl.appendChild(button); 
        }

        if(motdStakeTitleEl) motdStakeTitleEl.classList.add('hidden');
        if(motdPlaceBetButtonContainerEl) motdPlaceBetButtonContainerEl.classList.add('hidden');
    }

    function handleMotdOddSelection(event) {
        // Виділення активного табу коефіцієнтів
        motdOddsContainerEl.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        const selectedButton = event.currentTarget;
        selectedButton.classList.add('active');
        
        const oddKey = selectedButton.dataset.key; 
        motdSelectedOdd = matchOfTheDayData.odds[oddKey]; 
        
        motdSelectedStakeTypeOrAmount = null; 
        if(motdPlaceBetButtonContainerEl) motdPlaceBetButtonContainerEl.classList.add('hidden');
        if (motdBetConfirmationEl) motdBetConfirmationEl.innerHTML = ''; 

        if (motdStakeOptionsAreaEl) motdStakeOptionsAreaEl.classList.remove('hidden');
        
        if (motdStakeTitleEl) {
            motdStakeTitleEl.textContent = "Обери суму ставки для Матчу дня:";
            motdStakeTitleEl.classList.remove('hidden');
        }

        // Генеруємо ТАБИ сум ставок та фрібету
        if (motdStakeTabsContainerEl) {
            motdStakeTabsContainerEl.innerHTML = ''; // Очищуємо контейнер табів

            // Таби сум
            matchOfTheDayData.stakeAmounts.forEach(amount => {
                const stakeTab = document.createElement('button');
                stakeTab.className = 'tab-button stake-tab'; // Новий клас
                stakeTab.dataset.amount = amount; 
                stakeTab.textContent = `${amount} ₴`; 
                stakeTab.addEventListener('click', handleStakeSelection); 
                motdStakeTabsContainerEl.appendChild(stakeTab); 
            });

            // Таб Фрібету
            if (currentBalances.freebets > 0) {
                const freebetTab = document.createElement('button');
                freebetTab.className = 'tab-button freebet-tab'; // Новий клас
                freebetTab.dataset.amount = 'freebet'; 
                // Текст як на макеті для кнопки фрібету
                freebetTab.textContent = `Фрібет ${currentBalances.freebetAmount.toFixed(0)} ₴`; 
                freebetTab.addEventListener('click', handleStakeSelection); 
                motdStakeTabsContainerEl.appendChild(freebetTab); 
            }
        }
    }

    function handleStakeSelection(event) {
        motdSelectedStakeTypeOrAmount = event.currentTarget.dataset.amount;

        // Виділення активного табу суми/фрібету
        motdStakeTabsContainerEl.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        event.currentTarget.classList.add('active');

        if (motdPlaceBetButtonContainerEl) motdPlaceBetButtonContainerEl.classList.remove('hidden');
    }

    function executeBetPlacement() {
        if (!motdSelectedOdd) { /* ... */ return; }
        if (!motdSelectedStakeTypeOrAmount) { /* ... */ return; }
        // ... (початок функції як раніше)
        let stakeAmountForCalc = 0; 
        let messageTitle = "";      
        let messageDetails = "";    
        let betMade = false;   

        let insufficientFunds = false; // Прапорець для недостатньо коштів

        if (motdSelectedStakeTypeOrAmount === 'freebet') { 
            if (currentBalances.freebets > 0) {
                // ... (логіка фрібету) ...
                currentBalances.freebets--; 
                stakeAmountForCalc = currentBalances.freebetAmount; // Використовуємо номінал фрібету
                messageTitle = `Матч дня: Ставка Фрібетом (${stakeAmountForCalc.toFixed(0)} ₴)`; // Як на макеті
                messageDetails = `Твою ставку на “${motdSelectedOdd.description}” (${motdSelectedOdd.name} @${motdSelectedOdd.value.toFixed(2)}) прийнято (MVP). Виграш з фрібету буде зараховано на основний баланс.`;
                betMade = true;
            } else { /* ... */ return; }
        } else { 
            const numericAmount = parseInt(motdSelectedStakeTypeOrAmount);
            if (currentBalances.main >= numericAmount) { 
                currentBalances.main -= numericAmount; 
                stakeAmountForCalc = numericAmount;
                // ... (повідомлення для ставки з основного балансу) ...
                 messageTitle = `Матч дня: Ставка ${numericAmount} ₴`;
                const potentialWin = (stakeAmountForCalc * motdSelectedOdd.value).toFixed(2);
                messageDetails = `Твою ставку на “${motdSelectedOdd.description}” (${motdSelectedOdd.name} @${motdSelectedOdd.value.toFixed(2)}) прийнято (MVP). Можливий виграш: ${potentialWin} ₴.`;
                betMade = true;
            } else if (currentBalances.bonus >= numericAmount) { // Спроба списати з бонусного
                currentBalances.bonus -= numericAmount;
                stakeAmountForCalc = numericAmount;
                messageTitle = `Матч дня: Ставка ${numericAmount} ₴ (з бонусного балансу)`;
                const potentialWin = (stakeAmountForCalc * motdSelectedOdd.value).toFixed(2);
                messageDetails = `Твою ставку на “${motdSelectedOdd.description}” (${motdSelectedOdd.name} @${motdSelectedOdd.value.toFixed(2)}) прийнято (MVP) з бонусного балансу. Можливий виграш: ${potentialWin} ₴.`;
                betMade = true;
            } else {
                insufficientFunds = true; // Встановлюємо прапорець
            }
        }

        if (insufficientFunds) {
            tgM.showConfirm("Недостатньо коштів на балансі. Бажаєте поповнити рахунок?", (ok) => {
                if (ok) {
                    // Тут буде логіка переходу на сторінку/екран депозиту
                    // Поки що просто закриваємо або нічого не робимо
                    tgM.showAlert("Перехід на сторінку депозиту (в розробці).");
                }
            });
            // Не скидаємо вибір, даємо користувачу можливість поповнити
            return; 
        }


        if (betMade) { /* ... (код як раніше, але повідомлення з .bet-placed-style) ... */ }
        // ... (частина з updateBalanceDisplay, confetti, скиданням стану) ...
        if (betMade) { 
            if (typeof updateBalanceDisplay === 'function') { updateBalanceDisplay(); }
            if (motdBetConfirmationEl) {
                motdBetConfirmationEl.innerHTML = `
                    <div class="info-message bet-placed-style"> 
                        <span class="message-title">${messageTitle}</span>
                        <span class="message-details">${messageDetails.replace(/\n/g, "<br>")}</span>
                    </div>`;
            }
            tgM.HapticFeedback.notificationOccurred('success'); 
            if (confetti) { confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, zIndex: 10000 }); }
        }

        if (motdStakeOptionsAreaEl) motdStakeOptionsAreaEl.classList.add('hidden');
        if (motdStakeTitleEl) motdStakeTitleEl.classList.add('hidden');
        if (motdPlaceBetButtonContainerEl) motdPlaceBetButtonContainerEl.classList.add('hidden');
        if (motdOddsContainerEl) motdOddsContainerEl.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active')); // Змінено клас
        // Також очистити активний таб суми/фрібету
        if (motdStakeTabsContainerEl) motdStakeTabsContainerEl.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        motdSelectedOdd = null;
        motdSelectedStakeTypeOrAmount = null;
    }
    
    if (motdExecuteBetButtonEl) {
        motdExecuteBetButtonEl.addEventListener('click', executeBetPlacement);
    }
    
    displayMatchOfTheDay();
})();