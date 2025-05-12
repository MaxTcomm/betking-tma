// js/eotd.js
(function() {
    const eotdContent = document.getElementById('expressOfTheDayContent');
    if (!eotdContent) { return; }

    const tgE = window.Telegram.WebApp;
    const updateBalanceDisplay = window.updateBalanceDisplay;
    const currentBalances = window.currentBalances;
    const confetti = window.confetti;
    const getFormattedDate = window.getFormattedDate;

    let expressOfTheDayData = {
        pageTitleDate: `Експрес дня • ${getFormattedDate(new Date())}`,
        selections: [
            // Демо-дані, ID тепер важливий
            { id: `sel_${Date.now()}_1`, teams: "Динамо Київ VS Шахтар Донецьк", datetime: `${getFormattedDate(new Date())} • 19:00`, market: "1X2 - Підвищені коефіцієнти", outcomeName: "Динамо Київ", odds: 1.59 },
            { id: `sel_${Date.now()}_2`, teams: "Манчестер Сіті VS Арсенал", datetime: `${getFormattedDate(new Date(Date.now() + 86400000))} • 22:00`, market: "Результат матчу", outcomeName: "Манчестер Сіті", odds: 1.85 },
            { id: `sel_${Date.now()}_3`, teams: "Баварія Мюнхен VS Боруссія Д", datetime: `${getFormattedDate(new Date(Date.now() + 2*86400000))} • 21:30`, market: "Тотал голів", outcomeName: "Більше 2.5", odds: 1.60 },
        ],
        stakeAmounts: [100, 200, 500]
    };

    let currentTotalOdds = 0;
    let currentTotalStake = 0;
    let eotdSelectedStakeTypeOrAmount = null; // Зберігаємо обрану суму/фрібет для експресу

    // DOM-елементи
    const eotdPageTitleEl = eotdContent.querySelector('#eotdPageTitle');
    const expressCardsListEl = eotdContent.querySelector('#expressCardsList');
    const eotdTotalOddsValueEl = eotdContent.querySelector('#eotdTotalOddsValue');
    const eotdTotalStakeValueEl = eotdContent.querySelector('#eotdTotalStakeValue');
    const eotdTotalWinningsValueEl = eotdContent.querySelector('#eotdTotalWinningsValue');
    
    const eotdStakeOptionsAreaEl = eotdContent.querySelector('#eotdStakeOptionsArea');
    const eotdStakeTitleEl = eotdContent.querySelector('#eotdStakeTitle');
    const eotdStakeTabsSumContainerEl = eotdContent.querySelector('#eotdStakeTabsSumContainer');
    const eotdFreebetButtonContainerSingleEl = eotdContent.querySelector('#eotdFreebetButtonContainerSingle');
    const eotdPlaceBetButtonContainerEl = eotdContent.querySelector('#eotdPlaceBetButtonContainer');
    const eotdExecuteBetButtonEl = eotdPlaceBetButtonContainerEl ? eotdPlaceBetButtonContainerEl.querySelector('#eotdExecuteBetButton') : null;
    const eotdBetConfirmationEl = eotdContent.querySelector('#eotdBetConfirmation');

    function calculateTotalOdds() {
        if (expressOfTheDayData.selections.length === 0) {
            return 0;
        }
        currentTotalOdds = expressOfTheDayData.selections.reduce((acc, sel) => acc * sel.odds, 1);
        return currentTotalOdds;
    }

    function updateSummaryAndStakeOptionsVisibility() {
        calculateTotalOdds();
        if (eotdTotalOddsValueEl) eotdTotalOddsValueEl.textContent = expressOfTheDayData.selections.length > 0 ? currentTotalOdds.toFixed(2) : "0.00";
        if (eotdTotalStakeValueEl) eotdTotalStakeValueEl.textContent = `${currentTotalStake.toFixed(2)} ₴`;
        if (eotdTotalWinningsValueEl) {
            const potentialWinnings = expressOfTheDayData.selections.length > 0 && currentTotalStake > 0 ? (currentTotalStake * currentTotalOdds).toFixed(2) : "0.00";
            eotdTotalWinningsValueEl.textContent = `${potentialWinnings} ₴`;
        }

        const hasSelections = expressOfTheDayData.selections.length > 0;
        if (eotdStakeOptionsAreaEl) eotdStakeOptionsAreaEl.classList.toggle('hidden', !hasSelections);
        if (eotdStakeTitleEl) eotdStakeTitleEl.classList.toggle('hidden', !hasSelections);

        if (hasSelections) {
            renderStakeTabs(); // Генеруємо таби сум та фрібету
            if (eotdBetConfirmationEl) eotdBetConfirmationEl.innerHTML = ''; // Очищаємо повідомлення, якщо є події
        } else {
            if (eotdStakeTabsSumContainerEl) eotdStakeTabsSumContainerEl.innerHTML = '';
            if (eotdFreebetButtonContainerSingleEl) eotdFreebetButtonContainerSingleEl.innerHTML = '';
            if (eotdPlaceBetButtonContainerEl) eotdPlaceBetButtonContainerEl.classList.add('hidden');
            if (eotdBetConfirmationEl) eotdBetConfirmationEl.innerHTML = '<div class="info-message notice">Експрес порожній. Ставки неможливі.</div>';
        }
        // Скидаємо вибір суми, якщо експрес змінився
        eotdSelectedStakeTypeOrAmount = null; 
        if (eotdPlaceBetButtonContainerEl) eotdPlaceBetButtonContainerEl.classList.add('hidden');
        if (eotdStakeTabsSumContainerEl) eotdStakeTabsSumContainerEl.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        if (eotdFreebetButtonContainerSingleEl) eotdFreebetButtonContainerSingleEl.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));

    }

    function handleDeleteMatch(event) {
        const matchIdToDelete = event.currentTarget.dataset.matchId;
        const cardToRemove = event.currentTarget.closest('.express-match-card');

        if (cardToRemove) {
            cardToRemove.classList.add('removing');
            cardToRemove.addEventListener('transitionend', () => {
                if (cardToRemove.parentElement) { cardToRemove.remove(); }
            }, { once: true });
        }
        
        expressOfTheDayData.selections = expressOfTheDayData.selections.filter(sel => sel.id !== matchIdToDelete);
        currentTotalStake = 0; // Скидаємо загальну ставку при зміні експресу
        updateSummaryAndStakeOptionsVisibility();
        tgE.HapticFeedback.impactOccurred('light');
    }

    function displayExpressOfTheDay() {
        if (!eotdPageTitleEl || !expressCardsListEl ) {
            console.error('EOTD: Core DOM elements not found for initial display.');
            return;
        }
        eotdPageTitleEl.textContent = expressOfTheDayData.pageTitleDate;

        expressCardsListEl.innerHTML = ''; 
        expressOfTheDayData.selections.forEach(selection => {
            const card = document.createElement('div');
            card.className = 'express-match-card';
            card.dataset.id = selection.id; 
            const arrowSvg = `<svg class="odds-arrow-svg" width="12" height="12" viewBox="0 0 24 24" fill="${getComputedStyle(document.documentElement).getPropertyValue('--accent-green-color').trim() || '#11FF11'}" style="vertical-align: middle; margin-right: 2px;"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>`;
            card.innerHTML = `
                <div class="card-row">
                    <span class="match-teams">${selection.teams}</span>
                    <button class="delete-match-button" data-match-id="${selection.id}" aria-label="Видалити матч">×</button>
                </div>
                <div class="match-datetime">${selection.datetime}</div>
                <div class="market-name">${selection.market}</div>
                <div class="selected-outcome-details">
                    <span class="outcome-name">${selection.outcomeName}</span>
                    ${arrowSvg}
                    <span class="outcome-odds">${selection.odds.toFixed(2)}</span>
                </div>
            `;
            card.querySelector('.delete-match-button').addEventListener('click', handleDeleteMatch);
            expressCardsListEl.appendChild(card);
        });
        
        currentTotalStake = 0;
        updateSummaryAndStakeOptionsVisibility(); 
    }
    
    // Функція для генерації табів сум та фрібету
    function renderStakeTabs() {
        if (eotdStakeTabsSumContainerEl) {
            eotdStakeTabsSumContainerEl.innerHTML = '';
            expressOfTheDayData.stakeAmounts.forEach(amount => {
                const stakeTab = document.createElement('button');
                stakeTab.className = 'tab-button stake-tab';
                stakeTab.dataset.amount = amount;
                stakeTab.textContent = `${amount} ₴`;
                stakeTab.addEventListener('click', handleEotdStakeSelection);
                eotdStakeTabsSumContainerEl.appendChild(stakeTab);
            });
        }

        if (eotdFreebetButtonContainerSingleEl) {
            eotdFreebetButtonContainerSingleEl.innerHTML = '';
            if (currentBalances.freebets > 0 && currentBalances.freebetAmount > 0) {
                const freebetButton = document.createElement('button');
                freebetButton.className = 'tab-button freebet-tab-single';
                freebetButton.dataset.amount = 'freebet';
                freebetButton.textContent = `Фрібет на ${currentBalances.freebetAmount.toFixed(0)} ₴`;
                freebetButton.addEventListener('click', handleEotdStakeSelection);
                eotdFreebetButtonContainerSingleEl.appendChild(freebetButton);
            }
        }
    }

    function handleEotdStakeSelection(event) {
        eotdSelectedStakeTypeOrAmount = event.currentTarget.dataset.amount;

        if (eotdStakeTabsSumContainerEl) {
            eotdStakeTabsSumContainerEl.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        }
        if (eotdFreebetButtonContainerSingleEl) {
            eotdFreebetButtonContainerSingleEl.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        }
        event.currentTarget.classList.add('active');
        
        currentTotalStake = (eotdSelectedStakeTypeOrAmount === 'freebet') ? currentBalances.freebetAmount : parseInt(eotdSelectedStakeTypeOrAmount);
        updateSummaryDisplay(); // Оновлюємо загальну ставку та виграш

        if (eotdPlaceBetButtonContainerEl) eotdPlaceBetButtonContainerEl.classList.remove('hidden');
    }

    function processEotdBetPlacement() {
        if (expressOfTheDayData.selections.length === 0) {
             tgE.showAlert("Неможливо зробити ставку на порожній експрес."); return;
        }
        if (!eotdSelectedStakeTypeOrAmount) {
            tgE.showAlert('Будь ласка, оберіть суму ставки або фрібет!'); return;
        }

        let stakeAmountForCalc = 0; 
        let messageTitle = "";
        let messageDetails = "";
        let betMade = false;
        let insufficientFunds = false;

        if (eotdSelectedStakeTypeOrAmount === 'freebet') {
            if (currentBalances.freebets > 0 && currentBalances.freebetAmount > 0) {
                currentBalances.freebets--;
                stakeAmountForCalc = currentBalances.freebetAmount; 
                messageTitle = `Експрес дня: Ставка Фрібетом (${stakeAmountForCalc.toFixed(0)} ₴)`;
                const potentialWin = (stakeAmountForCalc * currentTotalOdds).toFixed(2);
                messageDetails = `Твою ставку на експрес (коеф. ${currentTotalOdds.toFixed(2)}) прийнято (MVP). Потенційний виграш з фрібету: ${potentialWin} ₴.`;
                betMade = true;
            } else { tgE.showAlert('У вас немає доступних фрібетів.'); return; }
        } else {
            const numericAmount = parseInt(eotdSelectedStakeTypeOrAmount);
            if (currentBalances.main >= numericAmount) {
                currentBalances.main -= numericAmount;
                stakeAmountForCalc = numericAmount;
                messageTitle = `Експрес дня: Ставка ${numericAmount} ₴`;
                const potentialWin = (stakeAmountForCalc * currentTotalOdds).toFixed(2);
                messageDetails = `Твою ставку на експрес (коеф. ${currentTotalOdds.toFixed(2)}) прийнято (MVP). Можливий виграш: ${potentialWin} ₴.`;
                betMade = true;
            } else if (currentBalances.bonus >= numericAmount) {
                currentBalances.bonus -= numericAmount;
                stakeAmountForCalc = numericAmount;
                messageTitle = `Експрес дня: Ставка ${numericAmount} ₴ (з бонусного балансу)`;
                const potentialWin = (stakeAmountForCalc * currentTotalOdds).toFixed(2);
                messageDetails = `Твою ставку на експрес (коеф. ${currentTotalOdds.toFixed(2)}) прийнято (MVP) з бонусного балансу. Можливий виграш: ${potentialWin} ₴.`;
                betMade = true;
            } else {
                insufficientFunds = true;
            }
        }

        if (insufficientFunds) {
            tgE.showConfirm("Недостатньо коштів. Зробити депозит?", (confirmed) => {
                if (confirmed) {
                    console.log("User wants to deposit (EOTD simulation)");
                    tgE.showAlert("Функція депозиту в розробці."); 
                }
            });
            return; 
        }

        if (betMade) {
            // `currentTotalStake` вже встановлено в `handleEotdStakeSelection`
            // або оновлюємо тут, якщо фрібет
            currentTotalStake = (eotdSelectedStakeTypeOrAmount === 'freebet') ? currentBalances.freebetAmount : parseInt(eotdSelectedStakeTypeOrAmount);
            updateSummaryDisplay(); // Оновлюємо підсумки, включаючи виграш
            if (typeof updateBalanceDisplay === 'function') { updateBalanceDisplay(); }

            if (eotdBetConfirmationEl) {
                eotdBetConfirmationEl.innerHTML = `
                    <div class="info-message bet-placed-style">
                        <span class="message-title">${messageTitle}</span>
                        <span class="message-details">${messageDetails.replace(/\n/g, "<br>")}</span>
                    </div>`;
            }
            tgE.HapticFeedback.notificationOccurred('success');
            if (confetti) { confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, zIndex: 10000 }); }
            
            // Скидаємо вибір ставки та ховаємо кнопку "Зробити ставку"
            eotdSelectedStakeTypeOrAmount = null;
            if (eotdPlaceBetButtonContainerEl) eotdPlaceBetButtonContainerEl.classList.add('hidden');
            if (eotdStakeTabsSumContainerEl) eotdStakeTabsSumContainerEl.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            if (eotdFreebetButtonContainerSingleEl) eotdFreebetButtonContainerSingleEl.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));

        }
    }
    
    if (eotdExecuteBetButtonEl) {
        eotdExecuteBetButtonEl.addEventListener('click', processEotdBetPlacement);
    }
    
    // Ініціалізація
    displayExpressOfTheDay();
})();