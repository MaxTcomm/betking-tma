// js/motd.js
(function() {
    const motdContent = document.getElementById('matchOfTheDayContent');
    if (!motdContent) { return; }

    const tgM = window.Telegram.WebApp;
    const updateBalanceDisplay = window.updateBalanceDisplay;
    const currentBalances = window.currentBalances;
    const confetti = window.confetti;

    const matchOfTheDayData = { /* ... (дані як раніше) ... */ };
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
    let motdSelectedStakeTypeOrAmount = null; // Зберігаємо обрану суму/фрібет

    const motdTitleDateEl = motdContent.querySelector('#motdTitleDate');
    const motdTeamsEl = motdContent.querySelector('#motdTeams');
    const motdOddsContainerEl = motdContent.querySelector('#motdOddsContainer');
    const motdStakeOptionsAreaEl = motdContent.querySelector('#motdStakeOptionsArea');
    const motdStakeTitleEl = motdContent.querySelector('#motdStakeTitle');
    const motdStakeButtonsContainerEl = motdContent.querySelector('#motdStakeButtonsContainer');
    const motdFreebetButtonContainerEl = motdContent.querySelector('#motdFreebetButtonContainer');
    const motdPlaceBetButtonContainerEl = motdContent.querySelector('#motdPlaceBetButtonContainer'); // Новий контейнер
    const motdExecuteBetButtonEl = motdContent.querySelector('#motdExecuteBetButton'); // Нова кнопка
    const motdBetConfirmationEl = motdContent.querySelector('#motdBetConfirmation');

    function displayMatchOfTheDay() { /* ... (код без змін з останньої версії) ... */ }
    function displayMatchOfTheDay() {
        if (!motdTitleDateEl || !motdTeamsEl || !motdOddsContainerEl) {
            console.error('MOTD: Core DOM elements not found for initial display.');
            return;
        }
        motdTitleDateEl.textContent = `${matchOfTheDayData.titlePrefix} • ${matchOfTheDayData.date}`;
        motdTeamsEl.textContent = `${matchOfTheDayData.team1} - ${matchOfTheDayData.team2}`;
        
        motdOddsContainerEl.innerHTML = ''; 
        for (const key in matchOfTheDayData.odds) {
            const odd = matchOfTheDayData.odds[key];
            const button = document.createElement('button');
            button.className = 'odds-button'; 
            button.dataset.key = key; 
            button.innerHTML = `
                <span class="odd-name">${odd.name}</span>
                <span class="odd-value">${odd.value.toFixed(2)}</span>
            `;
            button.addEventListener('click', handleMotdOddSelection); 
            motdOddsContainerEl.appendChild(button); 
        }
        if(motdStakeTitleEl) motdStakeTitleEl.classList.add('hidden');
        if(motdPlaceBetButtonContainerEl) motdPlaceBetButtonContainerEl.classList.add('hidden'); // Ховаємо кнопку "Зробити ставку"
    }


    function handleMotdOddSelection(event) {
        motdOddsContainerEl.querySelectorAll('.odds-button').forEach(btn => btn.classList.remove('selected'));
        const selectedButton = event.currentTarget;
        selectedButton.classList.add('selected');
        
        const oddKey = selectedButton.dataset.key; 
        motdSelectedOdd = matchOfTheDayData.odds[oddKey]; 
        
        motdSelectedStakeTypeOrAmount = null; // Скидаємо вибір суми при зміні коефіцієнта
        if(motdPlaceBetButtonContainerEl) motdPlaceBetButtonContainerEl.classList.add('hidden'); // Ховаємо кнопку "Зробити ставку"
        if (motdBetConfirmationEl) motdBetConfirmationEl.innerHTML = ''; 

        if (motdStakeOptionsAreaEl) motdStakeOptionsAreaEl.classList.remove('hidden');
        
        if (motdStakeTitleEl) {
            motdStakeTitleEl.textContent = "Обери суму ставки для Матчу дня:";
            motdStakeTitleEl.classList.remove('hidden');
        }

        if (motdStakeButtonsContainerEl) {
            motdStakeButtonsContainerEl.innerHTML = ''; 
            matchOfTheDayData.stakeAmounts.forEach(amount => {
                const stakeButton = document.createElement('button');
                stakeButton.className = 'stake-button motd-stake'; 
                stakeButton.dataset.amount = amount; 
                stakeButton.textContent = `${amount} ₴`; 
                stakeButton.addEventListener('click', handleStakeSelection); // Новий обробник
                motdStakeButtonsContainerEl.appendChild(stakeButton); 
            });
        }

        if (motdFreebetButtonContainerEl) {
            motdFreebetButtonContainerEl.innerHTML = ''; 
            if (currentBalances.freebets > 0) {
                const freebetButton = document.createElement('button');
                freebetButton.id = 'motdFreebetButton'; 
                freebetButton.dataset.amount = 'freebet'; 
                freebetButton.textContent = `Використати Фрібет (${currentBalances.freebets > 0 ? '250 ₴': '0 шт.'})`;                 
                if(currentBalances.freebets === 0) freebetButton.disabled = true;
                freebetButton.addEventListener('click', handleStakeSelection); // Новий обробник
                motdFreebetButtonContainerEl.appendChild(freebetButton); 
            }
        }
    }

    // Нова функція для обробки вибору суми/фрібету
    function handleStakeSelection(event) {
        motdSelectedStakeTypeOrAmount = event.currentTarget.dataset.amount;

        // Візуально виділяємо обрану кнопку суми/фрібету (опціонально)
        // Наприклад, додаючи клас 'selected' і знімаючи з інших
        motdStakeButtonsContainerEl.querySelectorAll('.stake-button').forEach(btn => btn.classList.remove('selected')); // Припускаємо, що кнопки сум також можуть мати selected стиль
        motdFreebetButtonContainerEl.querySelectorAll('#motdFreebetButton').forEach(btn => btn.classList.remove('selected'));
        event.currentTarget.classList.add('selected'); // Потрібно додати стиль для .stake-button.selected

        // Показуємо кнопку "Зробити ставку"
        if (motdPlaceBetButtonContainerEl) motdPlaceBetButtonContainerEl.classList.remove('hidden');
    }

    // Функція, що викликається кнопкою "Зробити ставку"
    function executeBetPlacement() {
        if (!motdSelectedOdd) { 
            tgM.showAlert('Будь ласка, спочатку оберіть результат матчу дня!');
            return;
        }
        if (!motdSelectedStakeTypeOrAmount) {
            tgM.showAlert('Будь ласка, оберіть суму ставки або фрібет!');
            return;
        }

        let stakeAmountForCalc = 0; 
        let messageTitle = "";      
        let messageDetails = "";    
        let betMade = false;        

        if (motdSelectedStakeTypeOrAmount === 'freebet') { 
            // ... (логіка для фрібету як раніше) ...
            if (currentBalances.freebets > 0) {
                currentBalances.freebets--; 
                stakeAmountForCalc = 250; 
                messageTitle = `Матч дня: Ставка Фрібетом (${stakeAmountForCalc} ₴)`;
                messageDetails = `Твою ставку на “${motdSelectedOdd.description}” (${motdSelectedOdd.name} @${motdSelectedOdd.value.toFixed(2)}) прийнято (MVP). Виграш з фрібету буде зараховано на основний баланс.`;
                betMade = true;
            } else {
                tgM.showAlert('У вас немає доступних фрібетів.'); // Мало б не дійти сюди, якщо кнопка заблокована
                return;
            }
        } else { 
            const numericAmount = parseInt(motdSelectedStakeTypeOrAmount);
            // ... (логіка для грошової ставки як раніше) ...
            if (currentBalances.main >= numericAmount) { 
                currentBalances.main -= numericAmount; 
                stakeAmountForCalc = numericAmount;
                messageTitle = `Матч дня: Ставка ${numericAmount} ₴`;
                const potentialWin = (stakeAmountForCalc * motdSelectedOdd.value).toFixed(2);
                messageDetails = `Твою ставку на “${motdSelectedOdd.description}” (${motdSelectedOdd.name} @${motdSelectedOdd.value.toFixed(2)}) прийнято (MVP). Можливий виграш: ${potentialWin} ₴.`;
                betMade = true;
            } else {
                tgM.showAlert('Недостатньо коштів на основному балансі.');
                return;
            }
        }

        if (betMade) { 
            if (typeof updateBalanceDisplay === 'function') {
                updateBalanceDisplay(); 
            }

            if (motdBetConfirmationEl) {
                motdBetConfirmationEl.innerHTML = `
                    <div class="info-message bet-placed-style"> 
                        <span class="message-title">${messageTitle}</span>
                        <span class="message-details">${messageDetails.replace(/\n/g, "<br>")}</span>
                    </div>`;
            }
            
            tgM.HapticFeedback.notificationOccurred('success'); 
            if (confetti) { 
                 confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, zIndex: 10000 }); 
            }
        }

        // Скидаємо все після ставки
        if (motdStakeOptionsAreaEl) motdStakeOptionsAreaEl.classList.add('hidden');
        if (motdStakeTitleEl) motdStakeTitleEl.classList.add('hidden');
        if (motdPlaceBetButtonContainerEl) motdPlaceBetButtonContainerEl.classList.add('hidden');
        if (motdOddsContainerEl) motdOddsContainerEl.querySelectorAll('.odds-button').forEach(btn => btn.classList.remove('selected'));
        motdSelectedOdd = null;
        motdSelectedStakeTypeOrAmount = null;
    }

    // Додаємо обробник до кнопки "Зробити ставку"
    if (motdExecuteBetButtonEl) {
        motdExecuteBetButtonEl.addEventListener('click', executeBetPlacement);
    }
    
    displayMatchOfTheDay();
})();