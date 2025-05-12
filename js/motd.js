// js/motd.js
(function() {
    const motdContent = document.getElementById('matchOfTheDayContent');
    if (!motdContent) { return; }

    if (typeof window.isUserCurrentlyLoggedIn !== 'function' || !window.isUserCurrentlyLoggedIn()) {
        if (motdContent) { 
             motdContent.innerHTML = '<div class="info-message notice">Будь ласка, увійдіть або зареєструйтеся, щоб переглянути цю секцію.</div>';
        }
        return; 
    }
    
    const tgM = window.Telegram.WebApp;
    const updateBalanceDisplay = window.updateBalanceDisplay;
    const currentBalances = window.currentBalances;
    const confetti = window.confetti;

    const matchOfTheDayData = {
        titlePrefix: "Матч дня",
        team1: "Динамо Київ",
        team2: "Шахтар Донецьк",
        date: "12 червня 2025, 19:00",
        odds: {
            p1: { name: "П1", value: 2.50, description: "Перемога Динамо Київ" },
            x:  { name: "X", value: 3.20, description: "Нічия" },
            p2: { name: "П2", value: 2.80, description: "Перемога Шахтар Донецьк" }
        },
        stakeAmounts: [100, 200, 500]
    };
    let motdSelectedOdd = null;
    let motdSelectedStakeTypeOrAmount = null; 

    const motdTitleDateEl = motdContent.querySelector('#motdTitleDate');
    const motdTeamsEl = motdContent.querySelector('#motdTeams');
    const motdOddsContainerEl = motdContent.querySelector('#motdOddsContainer');
    const motdStakeOptionsAreaEl = motdContent.querySelector('#motdStakeOptionsArea');
    const motdStakeTitleEl = motdContent.querySelector('#motdStakeTitle');
    const motdStakeTabsSumContainerEl = motdContent.querySelector('#motdStakeTabsSumContainer');
    const motdFreebetButtonContainerSingleEl = motdContent.querySelector('#motdFreebetButtonContainerSingle');
    const motdPlaceBetButtonContainerEl = motdContent.querySelector('#motdPlaceBetButtonContainer');
    const motdExecuteBetButtonEl = motdPlaceBetButtonContainerEl ? motdPlaceBetButtonContainerEl.querySelector('#motdExecuteBetButton') : null;
    const motdBetConfirmationEl = motdContent.querySelector('#motdBetConfirmation');

    function displayMatchOfTheDay() {
        if (!motdTitleDateEl || !motdTeamsEl || !motdOddsContainerEl) {
            console.error('MOTD: Core DOM elements not found for initial display.');
            return;
        }
        if (matchOfTheDayData.titlePrefix && matchOfTheDayData.date) {
             motdTitleDateEl.textContent = `${matchOfTheDayData.titlePrefix} • ${matchOfTheDayData.date}`;
        } else {
            motdTitleDateEl.textContent = "Матч дня"; 
            console.warn("MOTD: titlePrefix or date is missing in matchOfTheDayData for title.");
        }
        motdTeamsEl.textContent = `${matchOfTheDayData.team1} - ${matchOfTheDayData.team2}`;
        
        motdOddsContainerEl.innerHTML = ''; 
        for (const key in matchOfTheDayData.odds) {
            const odd = matchOfTheDayData.odds[key];
            const button = document.createElement('button');
            button.className = 'tab-button'; 
            button.dataset.key = key; 
            button.innerHTML = `<span class="odd-name">${odd.name}</span><span class="odd-value">${odd.value.toFixed(2)}</span>`;
            button.addEventListener('click', handleMotdOddSelection); 
            motdOddsContainerEl.appendChild(button); 
        }
        if(motdStakeTitleEl) motdStakeTitleEl.classList.add('hidden');
        if(motdStakeOptionsAreaEl) motdStakeOptionsAreaEl.classList.add('hidden'); // Ховаємо весь блок спочатку
        if(motdPlaceBetButtonContainerEl) motdPlaceBetButtonContainerEl.classList.add('hidden');
    }

    function handleMotdOddSelection(event) {
        motdOddsContainerEl.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        event.currentTarget.classList.add('active');
        
        const oddKey = event.currentTarget.dataset.key; 
        motdSelectedOdd = matchOfTheDayData.odds[oddKey]; 
        
        motdSelectedStakeTypeOrAmount = null; 
        if(motdPlaceBetButtonContainerEl) motdPlaceBetButtonContainerEl.classList.add('hidden');
        if (motdBetConfirmationEl) motdBetConfirmationEl.innerHTML = ''; 

        if (motdStakeOptionsAreaEl) motdStakeOptionsAreaEl.classList.remove('hidden');
        
        if (motdStakeTitleEl) {
            motdStakeTitleEl.textContent = "Обери суму ставки для Матчу дня:";
            motdStakeTitleEl.classList.remove('hidden');
        }

        if (motdStakeTabsSumContainerEl) {
            motdStakeTabsSumContainerEl.innerHTML = ''; 
            matchOfTheDayData.stakeAmounts.forEach(amount => {
                const stakeTab = document.createElement('button');
                stakeTab.className = 'tab-button stake-tab'; 
                stakeTab.dataset.amount = amount; 
                stakeTab.textContent = `${amount} ₴`; 
                stakeTab.addEventListener('click', handleStakeSelection); 
                motdStakeTabsSumContainerEl.appendChild(stakeTab); 
            });
        }

        if (motdFreebetButtonContainerSingleEl) {
            motdFreebetButtonContainerSingleEl.innerHTML = ''; 
            if (currentBalances.freebets > 0 && currentBalances.freebetAmount > 0) {
                const freebetButton = document.createElement('button');
                freebetButton.className = 'tab-button freebet-tab-single'; 
                freebetButton.dataset.amount = 'freebet'; 
                freebetButton.textContent = `Фрібет на ${currentBalances.freebetAmount.toFixed(0)} ₴`; 
                freebetButton.addEventListener('click', handleStakeSelection); 
                motdFreebetButtonContainerSingleEl.appendChild(freebetButton); 
            }
        }
    }

    function handleStakeSelection(event) {
        motdSelectedStakeTypeOrAmount = event.currentTarget.dataset.amount;

        if (motdStakeTabsSumContainerEl) {
            motdStakeTabsSumContainerEl.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        }
        if (motdFreebetButtonContainerSingleEl) {
            motdFreebetButtonContainerSingleEl.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        }
        event.currentTarget.classList.add('active');

        if (motdPlaceBetButtonContainerEl) motdPlaceBetButtonContainerEl.classList.remove('hidden');
    }

    function executeBetPlacement() {
        if (!motdSelectedOdd) { tgM.showAlert('Будь ласка, спочатку оберіть результат матчу дня!'); return; }
        if (!motdSelectedStakeTypeOrAmount) { tgM.showAlert('Будь ласка, оберіть суму ставки або фрібет!'); return; }

        let stakeAmountForCalc = 0; 
        let messageTitle = "";      
        let messageDetails = "";    
        let betMade = false;   
        let insufficientFunds = false; 

        if (motdSelectedStakeTypeOrAmount === 'freebet') { 
            if (currentBalances.freebets > 0 && currentBalances.freebetAmount > 0) {
                currentBalances.freebets--; 
                stakeAmountForCalc = currentBalances.freebetAmount;
                messageTitle = `Матч дня: Ставка Фрібетом (${stakeAmountForCalc.toFixed(0)} ₴)`;
                messageDetails = `Твою ставку на “${motdSelectedOdd.description}” (${motdSelectedOdd.name} @${motdSelectedOdd.value.toFixed(2)}) прийнято (MVP). Виграш з фрібету буде зараховано на основний баланс.`;
                betMade = true;
            } else { tgM.showAlert('У вас немає доступних фрібетів.'); return; }
        } else { 
            const numericAmount = parseInt(motdSelectedStakeTypeOrAmount);
            if (currentBalances.main >= numericAmount) { 
                currentBalances.main -= numericAmount; 
                stakeAmountForCalc = numericAmount;
                messageTitle = `Матч дня: Ставка ${numericAmount} ₴`;
                const potentialWin = (stakeAmountForCalc * motdSelectedOdd.value).toFixed(2);
                messageDetails = `Твою ставку на “${motdSelectedOdd.description}” (${motdSelectedOdd.name} @${motdSelectedOdd.value.toFixed(2)}) прийнято (MVP). Можливий виграш: ${potentialWin} ₴.`;
                betMade = true;
            } else if (currentBalances.bonus >= numericAmount) { 
                currentBalances.bonus -= numericAmount;
                stakeAmountForCalc = numericAmount;
                messageTitle = `Матч дня: Ставка ${numericAmount} ₴ (з бонусного балансу)`;
                const potentialWin = (stakeAmountForCalc * motdSelectedOdd.value).toFixed(2);
                messageDetails = `Твою ставку на “${motdSelectedOdd.description}” (${motdSelectedOdd.name} @${motdSelectedOdd.value.toFixed(2)}) прийнято (MVP) з бонусного балансу. Можливий виграш: ${potentialWin} ₴.`;
                betMade = true;
            } else {
                insufficientFunds = true;
            }
        }

        if (insufficientFunds) {
            tgM.showConfirm("Недостатньо коштів. Зробити депозит?", (confirmed) => {
                if (confirmed) {
                    console.log("User wants to deposit (simulation)");
                    // В майбутньому тут може бути tg.open টেলিগ্রামLink() або tg.openInvoice()
                    // Або перехід на відповідну сторінку в міні-додатку, якщо вона буде
                    tgM.showAlert("Функція депозиту в розробці."); 
                }
            });
            return; 
        }

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
        if (motdPlaceBetButtonContainerEl) motdPlaceBetButtonContainerEl.classList.add('hidden');
        if (motdOddsContainerEl) motdOddsContainerEl.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        if (motdStakeTabsSumContainerEl) motdStakeTabsSumContainerEl.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        if (motdFreebetButtonContainerSingleEl) motdFreebetButtonContainerSingleEl.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        motdSelectedOdd = null;
        motdSelectedStakeTypeOrAmount = null;
    }
    
    if (motdExecuteBetButtonEl) {
        motdExecuteBetButtonEl.addEventListener('click', executeBetPlacement);
    }
    
    displayMatchOfTheDay();
})();