// js/motd.js
(function() {
    const motdContent = document.getElementById('matchOfTheDayContent');
    if (!motdContent) {
        return;
    }

    const tgM = window.Telegram.WebApp;
    const updateBalanceDisplay = window.updateBalanceDisplay;
    const currentBalances = window.currentBalances;
    const confetti = window.confetti; // Має бути window.confetti з app.js

    const matchOfTheDayData = {
        titlePrefix: "Матч дня",
        team1: "Динамо Київ",
        team2: "Шахтар Донецьк",
        date: "12 червня 2025, 19:00", // Як на макеті
        odds: {
            p1: { name: "П1", value: 2.50, description: "Перемога Динамо Київ" },
            x:  { name: "X", value: 3.20, description: "Нічия" },
            p2: { name: "П2", value: 2.80, description: "Перемога Шахтар Донецьк" }
        },
        stakeAmounts: [100, 200, 500]
    };
    let motdSelectedOdd = null;

    // Отримуємо елементи з нового HTML
    const motdTitleDateEl = motdContent.querySelector('#motdTitleDate');
    const motdTeamsEl = motdContent.querySelector('#motdTeams');
    const motdOddsContainerEl = motdContent.querySelector('#motdOddsContainer');
    const motdStakeOptionsAreaEl = motdContent.querySelector('#motdStakeOptionsArea');
    const motdStakeTitleEl = motdContent.querySelector('#motdStakeTitle'); // Оновлено
    const motdStakeButtonsContainerEl = motdContent.querySelector('#motdStakeButtonsContainer');
    const motdFreebetButtonContainerEl = motdContent.querySelector('#motdFreebetButtonContainer');
    const motdBetConfirmationEl = motdContent.querySelector('#motdBetConfirmation');

    function displayMatchOfTheDay() {
        if (!motdTitleDateEl || !motdTeamsEl || !motdOddsContainerEl) {
            console.error('MOTD: Core DOM elements not found for initial display.');
            return;
        }
        motdTitleDateEl.textContent = `${matchOfTheDayData.titlePrefix} • ${matchOfTheDayData.date}`;
        motdTeamsEl.textContent = `${matchOfTheDayData.team1} - ${matchOfTheDayData.team2}`;
        
        motdOddsContainerEl.innerHTML = ''; // Очищення перед додаванням нових
        for (const key in matchOfTheDayData.odds) {
            const odd = matchOfTheDayData.odds[key];
            const button = document.createElement('button');
            button.className = 'odds-button';
            button.dataset.key = key;
            // Створюємо внутрішню структуру для тексту та значення
            button.innerHTML = `
                <span class="odd-name">${odd.name}</span>
                <span class="odd-value">${odd.value.toFixed(2)}</span>
            `;
            button.addEventListener('click', handleMotdOddSelection);
            motdOddsContainerEl.appendChild(button);
        }
    }

    function handleMotdOddSelection(event) {
        motdOddsContainerEl.querySelectorAll('.odds-button').forEach(btn => btn.classList.remove('selected'));
        const selectedButton = event.currentTarget;
        selectedButton.classList.add('selected');
        
        const oddKey = selectedButton.dataset.key;
        motdSelectedOdd = matchOfTheDayData.odds[oddKey];
        
        // Показываем блок выбора ставки
        if (motdStakeOptionsAreaEl) motdStakeOptionsAreaEl.classList.remove('hidden');
        if (motdBetConfirmationEl) motdBetConfirmationEl.innerHTML = ''; // Очищаем предыдущее подтверждение

        // Генерируем кнопки сумм ставок
        if (motdStakeButtonsContainerEl) {
            motdStakeButtonsContainerEl.innerHTML = ''; // Очищаем
            matchOfTheDayData.stakeAmounts.forEach(amount => {
                const stakeButton = document.createElement('button');
                stakeButton.className = 'stake-button motd-stake';
                stakeButton.dataset.amount = amount;
                stakeButton.textContent = `${amount} ₴`; // Текст кнопки як на макеті
                stakeButton.addEventListener('click', processBetPlacement);
                motdStakeButtonsContainerEl.appendChild(stakeButton);
            });
        }

        // Генерируем кнопку фрибета, если есть
        if (motdFreebetButtonContainerEl) {
            motdFreebetButtonContainerEl.innerHTML = ''; // Очищаем
            if (currentBalances.freebets > 0) {
                const freebetButton = document.createElement('button');
                // ID тут не потрібен, стилізуємо по класу або атрибуту
                freebetButton.className = 'action-button'; // Загальний клас для таких кнопок або специфічний
                freebetButton.id = 'motdFreebetButton'; // Як у CSS
                freebetButton.dataset.amount = 'freebet';
                // Текст кнопки як на макеті (сума фрібету може бути динамічною, якщо є різні номінали)
                // Припускаємо, що є один тип фрібету з номіналом 250 грн, як на макеті
                freebetButton.textContent = `Використати Фрібет (${currentBalances.freebets > 0 ? '250 ₴': '0 шт.'})`; 
                if(currentBalances.freebets === 0) freebetButton.disabled = true;

                freebetButton.addEventListener('click', processBetPlacement);
                motdFreebetButtonContainerEl.appendChild(freebetButton);
            }
        }
         // Оновлюємо текст заголовка для ставок
        if (motdStakeTitleEl) motdStakeTitleEl.textContent = "Обери суму ставки для Матчу дня:";
    }

    function processBetPlacement(event) {
        const stakeTypeOrAmount = event.currentTarget.dataset.amount; 

        if (!motdSelectedOdd) {
            tgM.showAlert('Будь ласка, спочатку оберіть результат матчу дня!');
            return;
        }

        let stakeAmountForCalc = 0; // Сума для розрахунку потенційного виграшу
        let messageTitle = "";
        let messageDetails = "";
        let betMade = false;

        if (stakeTypeOrAmount === 'freebet') {
            if (currentBalances.freebets > 0) {
                currentBalances.freebets--;
                // Припускаємо, що фрібет має еквівалент 250 грн для розрахунку виграшу, як на макеті
                stakeAmountForCalc = 250; 
                messageTitle = `Матч дня: Ставка Фрібетом (${stakeAmountForCalc} ₴)`;
                messageDetails = `Твою ставку на “${motdSelectedOdd.description}” (П1 @${motdSelectedOdd.value.toFixed(2)}) прийнято (MVP). Виграш з фрібету буде зараховано на основний баланс.`;
                betMade = true;
            } else {
                tgM.showAlert('У вас немає доступних фрібетів.');
                return;
            }
        } else {
            const numericAmount = parseInt(stakeTypeOrAmount);
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
            if (typeof updateBalanceDisplay === 'function') { // Перевіряємо наявність функції
                updateBalanceDisplay(); 
            }

            if (motdBetConfirmationEl) {
                motdBetConfirmationEl.innerHTML = `
                    <div class="info-message success">
                        <span class="message-title">${messageTitle}</span>
                        <span class="message-details">${messageDetails.replace(/\n/g, "<br>")}</span>
                    </div>`;
            }
            
            tgM.HapticFeedback.notificationOccurred('success');
            if (confetti) { confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, zIndex: 10000 }); }
        }

        if (motdStakeOptionsAreaEl) motdStakeOptionsAreaEl.classList.add('hidden');
        if (motdOddsContainerEl) motdOddsContainerEl.querySelectorAll('.odds-button').forEach(btn => btn.classList.remove('selected'));
        motdSelectedOdd = null;
    }
    
    // Ініціалізація при завантаженні сторінки "Матч дня"
    displayMatchOfTheDay();
})();