// js/eotd.js
(function() {
    const eotdContent = document.getElementById('expressOfTheDayContent');
    if (!eotdContent) {
        return;
    }

    const tgE = window.Telegram.WebApp;
    const updateBalanceDisplay = window.updateBalanceDisplay;
    const currentBalances = window.currentBalances;
    const confetti = window.confetti;

    // Оновлюємо дані експресу, додаємо більше матчів
    const expressOfTheDayData = {
        pageTitle: "Експрес дня", // Для заголовка сторінки
        title: "Мега Буст на Єврокубки!", // Назва самого експресу
        selections: [
            { description: "Реал Мадрид - Перемога в матчі" },
            { description: "Баварія Мюнхен - Тотал більше 2.5" },
            { description: "Ліверпуль - Обидві заб'ють: Так" },
            { description: "ПСЖ - Індивідуальний тотал Мбаппе більше 0.5" },
            { description: "Інтер Мілан - Не програє (X2)" }
        ],
        totalOdds: 12.55, // Приклад нового коефіцієнта
        stakeAmounts: [100, 200, 500] // Доступні суми для ставки
    };

    // DOM-елементи
    const eotdTitleEl = eotdContent.querySelector('#eotdTitle');
    const eotdNameEl = eotdContent.querySelector('#eotdName');
    const eotdSelectionsEl = eotdContent.querySelector('#eotdSelections');
    const eotdTotalOddsEl = eotdContent.querySelector('#eotdTotalOdds');
    const acceptExpressButtonEl = eotdContent.querySelector('#acceptExpressButton'); // Змінив назву змінної
    const eotdStakeOptionsAreaEl = eotdContent.querySelector('#eotdStakeOptionsArea');
    const eotdStakeTitleEl = eotdContent.querySelector('#eotdStakeTitle');
    const eotdStakeButtonsContainerEl = eotdContent.querySelector('#eotdStakeButtonsContainer');
    const eotdFreebetButtonContainerEl = eotdContent.querySelector('#eotdFreebetButtonContainer');
    const eotdBetConfirmationEl = eotdContent.querySelector('#eotdBetConfirmation');

    function displayExpressOfTheDay() {
        if (!eotdTitleEl || !eotdNameEl || !eotdSelectionsEl || !eotdTotalOddsEl || !acceptExpressButtonEl) {
            console.error('EOTD: Core DOM elements not found for initial display.');
            return;
        }

        eotdTitleEl.textContent = expressOfTheDayData.pageTitle; // Можна додати дату, якщо потрібно
        eotdNameEl.textContent = expressOfTheDayData.title;

        eotdSelectionsEl.innerHTML = ''; 
        expressOfTheDayData.selections.forEach(selection => {
            const listItem = document.createElement('li');
            listItem.textContent = selection.description;
            eotdSelectionsEl.appendChild(listItem);
        });
        eotdTotalOddsEl.textContent = `Загальний коефіцієнт: ${expressOfTheDayData.totalOdds.toFixed(2)}`;
    }

    if (acceptExpressButtonEl) {
        acceptExpressButtonEl.addEventListener('click', function() {
            if (eotdStakeOptionsAreaEl) eotdStakeOptionsAreaEl.classList.remove('hidden');
            if (eotdBetConfirmationEl) eotdBetConfirmationEl.innerHTML = '';
            
            // Генеруємо кнопки сум ставок
            if (eotdStakeButtonsContainerEl) {
                eotdStakeButtonsContainerEl.innerHTML = '';
                expressOfTheDayData.stakeAmounts.forEach(amount => {
                    const stakeButton = document.createElement('button');
                    stakeButton.className = 'stake-button eotd-stake';
                    stakeButton.dataset.amount = amount;
                    stakeButton.textContent = `${amount} ₴`;
                    stakeButton.addEventListener('click', processEotdBetPlacement);
                    eotdStakeButtonsContainerEl.appendChild(stakeButton);
                });
            }

            // Генеруємо кнопку фрібету
            if (eotdFreebetButtonContainerEl) {
                eotdFreebetButtonContainerEl.innerHTML = '';
                if (currentBalances.freebets > 0) {
                    const freebetButton = document.createElement('button');
                    freebetButton.id = 'eotdFreebetButton'; // ID для CSS
                    freebetButton.dataset.amount = 'freebet';
                    freebetButton.textContent = `Використати Фрібет (${currentBalances.freebets > 0 ? '250 ₴': '0 шт.'})`;
                     if(currentBalances.freebets === 0) freebetButton.disabled = true;
                    freebetButton.addEventListener('click', processEotdBetPlacement);
                    eotdFreebetButtonContainerEl.appendChild(freebetButton);
                }
            }
             // Оновлюємо текст заголовка для ставок
            if (eotdStakeTitleEl) {
                eotdStakeTitleEl.textContent = "Обери суму ставки для Експресу дня:";
                eotdStakeTitleEl.classList.remove('hidden');
            }
        });
    }

    function processEotdBetPlacement(event) {
        const stakeTypeOrAmount = event.currentTarget.dataset.amount;

        let stakeAmountForCalc = 0;
        let messageTitle = "";
        let messageDetails = "";
        let betMade = false;

        if (stakeTypeOrAmount === 'freebet') {
            if (currentBalances.freebets > 0) {
                currentBalances.freebets--;
                stakeAmountForCalc = 250; // Умовний номінал фрібету
                messageTitle = `Експрес дня: Ставка Фрібетом (${stakeAmountForCalc} ₴)`;
                messageDetails = `Твою ставку на експрес (коеф. ${expressOfTheDayData.totalOdds.toFixed(2)}) прийнято (MVP). Виграш з фрібету буде зараховано на основний баланс.`;
                betMade = true;
            } else {
                tgE.showAlert('У вас немає доступних фрібетів.');
                return;
            }
        } else {
            const numericAmount = parseInt(stakeTypeOrAmount);
            if (currentBalances.main >= numericAmount) {
                currentBalances.main -= numericAmount;
                stakeAmountForCalc = numericAmount;
                messageTitle = `Експрес дня: Ставка ${numericAmount} ₴`;
                const potentialWin = (stakeAmountForCalc * expressOfTheDayData.totalOdds).toFixed(2);
                messageDetails = `Твою ставку на експрес (коеф. ${expressOfTheDayData.totalOdds.toFixed(2)}) прийнято (MVP). Можливий виграш: ${potentialWin} ₴.`;
                betMade = true;
            } else {
                tgE.showAlert('Недостатньо коштів на основному балансі.');
                return;
            }
        }

        if (betMade) {
            if (typeof updateBalanceDisplay === 'function') {
                updateBalanceDisplay();
            }

            if (eotdBetConfirmationEl) {
                eotdBetConfirmationEl.innerHTML = `
                    <div class="info-message bet-placed-style">
                        <span class="message-title">${messageTitle}</span>
                        <span class="message-details">${messageDetails.replace(/\n/g, "<br>")}</span>
                    </div>`;
            }
            
            tgE.HapticFeedback.notificationOccurred('success');
            if (confetti) { confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, zIndex: 10000 }); }
        }

        if (eotdStakeOptionsAreaEl) eotdStakeOptionsAreaEl.classList.add('hidden');
        if (eotdStakeTitleEl) eotdStakeTitleEl.classList.add('hidden'); // Ховаємо заголовок після ставки
    }
    
    displayExpressOfTheDay();
})();