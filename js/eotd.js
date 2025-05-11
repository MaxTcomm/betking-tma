// js/eotd.js
(function() {
    const eotdContent = document.getElementById('expressOfTheDayContent');
    if (!eotdContent) {
        return;
    }

    const tgE = window.Telegram.WebApp;
    const updateBalanceDisplay = window.updateBalanceDisplay;
    const currentBalances = window.currentBalances;
    const confetti = window.confetti; // Має бути window.confetti з app.js
    const getFormattedDate = window.getFormattedDate; // З app.js

    // Початкові дані для експресу (можуть бути завантажені або оновлені)
    // Додав ID до кожної події для легшого видалення
    let expressOfTheDayData = {
        pageTitleDate: `Експрес дня • ${getFormattedDate(new Date())}`, // Динамічна дата
        // title: "Мега Буст на Єврокубки!", // На макеті немає окремої назви експресу
        selections: [
            { id: 'match1', teams: "Динамо Київ VS Шахтар Донецьк", datetime: `${getFormattedDate(new Date())} • 19:00`, market: "1X2 - Підвищені коефіцієнти", outcomeName: "Динамо Київ", odds: 1.59 },
            { id: 'match2', teams: "Манчестер Сіті VS Арсенал", datetime: `${getFormattedDate(new Date(Date.now() + 86400000))} • 22:00`, market: "Результат матчу", outcomeName: "Манчестер Сіті", odds: 1.85 },
            { id: 'match3', teams: "Баварія Мюнхен VS Боруссія Д", datetime: `${getFormattedDate(new Date(Date.now() + 2*86400000))} • 21:30`, market: "Тотал голів", outcomeName: "Більше 2.5", odds: 1.60 },
            { id: 'match4', teams: "Реал Мадрид VS Барселона", datetime: `${getFormattedDate(new Date(Date.now() + 3*86400000))} • 22:00`, market: "Обидві заб'ють", outcomeName: "Так", odds: 1.70 },
        ],
        // totalOdds: 0, // Буде розраховуватися динамічно
        stakeAmounts: [100, 200, 500]
    };

    // DOM-елементи
    const eotdPageTitleEl = eotdContent.querySelector('#eotdPageTitle');
    // const eotdNameEl = eotdContent.querySelector('#eotdName'); // Прибрали, немає на макеті
    const expressCardsListEl = eotdContent.querySelector('#expressCardsList');
    
    const eotdTotalOddsValueEl = eotdContent.querySelector('#eotdTotalOddsValue');
    const eotdTotalStakeValueEl = eotdContent.querySelector('#eotdTotalStakeValue'); // Додано
    const eotdTotalWinningsValueEl = eotdContent.querySelector('#eotdTotalWinningsValue'); // Додано

    const acceptExpressButtonEl = eotdContent.querySelector('#acceptExpressButton');
    const eotdStakeOptionsAreaEl = eotdContent.querySelector('#eotdStakeOptionsArea');
    const eotdStakeTitleEl = eotdContent.querySelector('#eotdStakeTitle');
    const eotdStakeButtonsContainerEl = eotdContent.querySelector('#eotdStakeButtonsContainer');
    const eotdFreebetButtonContainerEl = eotdContent.querySelector('#eotdFreebetButtonContainer');
    const eotdBetConfirmationEl = eotdContent.querySelector('#eotdBetConfirmation');

    let currentTotalOdds = 0;
    let currentTotalStake = 0; // Додано для відстеження загальної ставки

    function calculateTotalOdds() {
        if (expressOfTheDayData.selections.length === 0) {
            return 0;
        }
        currentTotalOdds = expressOfTheDayData.selections.reduce((acc, sel) => acc * sel.odds, 1);
        return currentTotalOdds;
    }

    function updateSummaryDisplay() {
        calculateTotalOdds();
        if (eotdTotalOddsValueEl) eotdTotalOddsValueEl.textContent = expressOfTheDayData.selections.length > 0 ? currentTotalOdds.toFixed(2) : "0.00";
        if (eotdTotalStakeValueEl) eotdTotalStakeValueEl.textContent = `${currentTotalStake.toFixed(2)} ₴`;
        if (eotdTotalWinningsValueEl) {
            const potentialWinnings = expressOfTheDayData.selections.length > 0 && currentTotalStake > 0 ? (currentTotalStake * currentTotalOdds).toFixed(2) : "0.00";
            eotdTotalWinningsValueEl.textContent = `${potentialWinnings} ₴`;
        }
        // Показати/сховати кнопку ставки та блок сум, якщо експрес порожній
        const hasSelections = expressOfTheDayData.selections.length > 0;
        if (acceptExpressButtonEl) acceptExpressButtonEl.style.display = hasSelections ? 'block' : 'none';
        if (!hasSelections && eotdStakeOptionsAreaEl && !eotdStakeOptionsAreaEl.classList.contains('hidden')) {
            eotdStakeOptionsAreaEl.classList.add('hidden');
            if (eotdStakeTitleEl) eotdStakeTitleEl.classList.add('hidden');
            if (eotdBetConfirmationEl) eotdBetConfirmationEl.innerHTML = '<div class="info-message notice">Експрес порожній. Додайте події для ставки.</div>';
        } else if (hasSelections && eotdBetConfirmationEl && eotdBetConfirmationEl.textContent.includes('Експрес порожній')) {
             if (eotdBetConfirmationEl) eotdBetConfirmationEl.innerHTML = ''; // Очистити, якщо є події
        }

    }

    function handleDeleteMatch(event) {
        const matchIdToDelete = event.currentTarget.dataset.matchId;
        const cardToRemove = event.currentTarget.closest('.express-match-card');

        if (cardToRemove) {
            cardToRemove.classList.add('removing'); // Додаємо клас для анімації
            
            // Після завершення CSS-анімації видаляємо елемент з DOM та даних
            cardToRemove.addEventListener('transitionend', () => {
                if (cardToRemove.parentElement) { // Перевірка, чи елемент ще в DOM
                    cardToRemove.remove();
                }
            }, { once: true }); // Обробник спрацює лише один раз
        }
        
        expressOfTheDayData.selections = expressOfTheDayData.selections.filter(sel => sel.id !== matchIdToDelete);
        currentTotalStake = 0; // Скидаємо ставку при зміні експресу
        updateSummaryDisplay();
        // Якщо експрес став порожнім, ховаємо опції ставки
        if (expressOfTheDayData.selections.length === 0) {
            if (eotdStakeOptionsAreaEl) eotdStakeOptionsAreaEl.classList.add('hidden');
            if (eotdStakeTitleEl) eotdStakeTitleEl.classList.add('hidden');
        }

        tgE.HapticFeedback.impactOccurred('light');
    }


    function displayExpressOfTheDay() {
        if (!eotdPageTitleEl || !expressCardsListEl || !acceptExpressButtonEl) {
            console.error('EOTD: Core DOM elements not found for initial display.');
            return;
        }

        eotdPageTitleEl.textContent = expressOfTheDayData.pageTitleDate;
        // if (eotdNameEl) eotdNameEl.textContent = expressOfTheDayData.title; // Якщо назва експресу повернеться

        expressCardsListEl.innerHTML = ''; 
        expressOfTheDayData.selections.forEach(selection => {
            const card = document.createElement('div');
            card.className = 'express-match-card';
            card.dataset.id = selection.id; // Для ідентифікації при видаленні

            // Стрілка (можна використовувати SVG або символ)
            // Простий символ стрілки: ▲ ▼ ▶ ◀ ↑ ↓ → ←
            // Для SVG: <svg width="12" height="12" viewBox="0 0 24 24"><path d="M7 14l5-5 5 5z" fill="#11FF11"/></svg>
            const arrowSvg = `<svg class="odds-arrow-svg" width="12" height="12" viewBox="0 0 24 24" fill="#11FF11" style="vertical-align: middle; margin-right: 2px;"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>`;
            // Або просто символ: const arrowSymbol = `<span class="odds-arrow">▲</span>`;

            card.innerHTML = `
                <div class="card-row">
                    <span class="match-teams">${selection.teams}</span>
                    <button class="delete-match-button" data-match-id="${selection.id}" aria-label="Видалити матч">×</button>
                </div>
                <div class="match-datetime">${selection.datetime}</div>
                <div class="market-name">${selection.market}</div>
                <div class="selected-outcome-details">
                    <span class="outcome-name">${selection.outcomeName}</span>
                    ${arrowSvg} <span class="outcome-odds">${selection.odds.toFixed(2)}</span>
                </div>
            `;
            card.querySelector('.delete-match-button').addEventListener('click', handleDeleteMatch);
            expressCardsListEl.appendChild(card);
        });
        
        currentTotalStake = 0; // Початкова ставка нуль
        updateSummaryDisplay(); // Розрахувати та відобразити підсумки
    }

    if (acceptExpressButtonEl) {
        acceptExpressButtonEl.addEventListener('click', function() {
            if (expressOfTheDayData.selections.length === 0) {
                tgE.showAlert("Експрес порожній. Будь ласка, додайте події."); // Теоретично, кнопка не має бути видима
                return;
            }
            if (eotdStakeOptionsAreaEl) eotdStakeOptionsAreaEl.classList.remove('hidden');
            if (eotdBetConfirmationEl) eotdBetConfirmationEl.innerHTML = '';
            
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

            if (eotdFreebetButtonContainerEl) {
                eotdFreebetButtonContainerEl.innerHTML = '';
                if (currentBalances.freebets > 0) {
                    const freebetButton = document.createElement('button');
                    freebetButton.id = 'eotdFreebetButton';
                    freebetButton.dataset.amount = 'freebet';
                    freebetButton.textContent = `Використати Фрібет (${currentBalances.freebets > 0 ? '250 ₴': '0 шт.'})`;
                    if(currentBalances.freebets === 0) freebetButton.disabled = true;
                    freebetButton.addEventListener('click', processEotdBetPlacement);
                    eotdFreebetButtonContainerEl.appendChild(freebetButton);
                }
            }
            if (eotdStakeTitleEl) {
                eotdStakeTitleEl.textContent = "Обери суму ставки для Експресу дня:";
                eotdStakeTitleEl.classList.remove('hidden');
            }
        });
    }

    function processEotdBetPlacement(event) {
        const stakeTypeOrAmount = event.currentTarget.dataset.amount;

        if (expressOfTheDayData.selections.length === 0) {
             tgE.showAlert("Неможливо зробити ставку на порожній експрес.");
             return;
        }

        let stakeAmountForCalc = 0; // Це сума, яка використовується для розрахунку виграшу
        let actualStakeValue = 0; // Це сума, яка списується або вартість фрібету

        let messageTitle = "";
        let messageDetails = "";
        let betMade = false;

        if (stakeTypeOrAmount === 'freebet') {
            if (currentBalances.freebets > 0) {
                currentBalances.freebets--;
                actualStakeValue = 250; // Умовний номінал фрібету
                stakeAmountForCalc = 250; 
                messageTitle = `Експрес дня: Ставка Фрібетом (${actualStakeValue} ₴)`;
                const potentialWin = (stakeAmountForCalc * currentTotalOdds).toFixed(2);
                messageDetails = `Твою ставку на експрес (коеф. ${currentTotalOdds.toFixed(2)}) прийнято (MVP). Потенційний виграш з фрібету: ${potentialWin} ₴.`;
                betMade = true;
            } else {
                tgE.showAlert('У вас немає доступних фрібетів.');
                return;
            }
        } else {
            const numericAmount = parseInt(stakeTypeOrAmount);
            if (currentBalances.main >= numericAmount) {
                currentBalances.main -= numericAmount;
                actualStakeValue = numericAmount;
                stakeAmountForCalc = numericAmount;
                messageTitle = `Експрес дня: Ставка ${numericAmount} ₴`;
                const potentialWin = (stakeAmountForCalc * currentTotalOdds).toFixed(2);
                messageDetails = `Твою ставку на експрес (коеф. ${currentTotalOdds.toFixed(2)}) прийнято (MVP). Можливий виграш: ${potentialWin} ₴.`;
                betMade = true;
            } else {
                tgE.showAlert('Недостатньо коштів на основному балансі.');
                return;
            }
        }

        if (betMade) {
            currentTotalStake = actualStakeValue; // Оновлюємо загальну ставку для відображення
            updateSummaryDisplay(); // Оновлюємо підсумки, включаючи виграш
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
        if (eotdStakeTitleEl) eotdStakeTitleEl.classList.add('hidden');
        // Не скидаємо експрес після ставки, користувач може захотіти зробити ще одну або змінити
    }
    
    // Ініціалізація
    displayExpressOfTheDay();
})();