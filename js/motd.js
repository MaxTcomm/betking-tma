// js/motd.js
(function() {
    // Ця обгортка IIFE (Immediately Invoked Function Expression) допомагає уникнути забруднення глобального простору імен.

    // Спочатку перевіряємо, чи існує контейнер для контенту цієї сторінки.
    // Якщо його немає (наприклад, завантажена інша сторінка), скрипт не буде виконуватися.
    const motdContent = document.getElementById('matchOfTheDayContent');
    if (!motdContent) {
        // console.log('MOTD content not found on this page, script motd.js will not run.');
        return; 
    }
    // console.log('MOTD script executing because motdContent was found.');

    // Отримуємо доступ до глобальних об'єктів/функцій з app.js
    const tgM = window.Telegram.WebApp;
    const updateBalanceDisplay = window.updateBalanceDisplay; // Функція для оновлення балансу в хедері
    const currentBalances = window.currentBalances;         // Об'єкт з поточними балансами
    const confetti = window.confetti;                     // Функція для анімації конфеті

    // Дані для "Матчу дня" (можуть бути завантажені з сервера в реальному додатку)
    const matchOfTheDayData = {
        titlePrefix: "Матч дня",
        team1: "Динамо Київ",
        team2: "Шахтар Донецьк",
        date: "12 червня 2025, 19:00", // Дата з ваших макетів
        odds: {
            p1: { name: "П1", value: 2.50, description: "Перемога Динамо Київ" },
            x:  { name: "X", value: 3.20, description: "Нічия" },
            p2: { name: "П2", value: 2.80, description: "Перемога Шахтар Донецьк" }
        },
        stakeAmounts: [100, 200, 500] // Доступні суми для ставки
    };
    let motdSelectedOdd = null; // Зберігає дані про вибраний коефіцієнт

    // Отримуємо посилання на DOM-елементи зі сторінки pages/match-of-the-day.html
    const motdTitleDateEl = motdContent.querySelector('#motdTitleDate');
    const motdTeamsEl = motdContent.querySelector('#motdTeams');
    const motdOddsContainerEl = motdContent.querySelector('#motdOddsContainer');
    const motdStakeOptionsAreaEl = motdContent.querySelector('#motdStakeOptionsArea');
    const motdStakeTitleEl = motdContent.querySelector('#motdStakeTitle');
    const motdStakeButtonsContainerEl = motdContent.querySelector('#motdStakeButtonsContainer');
    const motdFreebetButtonContainerEl = motdContent.querySelector('#motdFreebetButtonContainer');
    const motdBetConfirmationEl = motdContent.querySelector('#motdBetConfirmation');

    // Функція для відображення початкової інформації про матч та коефіцієнти
    function displayMatchOfTheDay() {
        if (!motdTitleDateEl || !motdTeamsEl || !motdOddsContainerEl) {
            console.error('MOTD: Core DOM elements not found for initial display.');
            return;
        }
        // Встановлюємо заголовок з датою
        motdTitleDateEl.textContent = `${matchOfTheDayData.titlePrefix} • ${matchOfTheDayData.date}`;
        // Встановлюємо назви команд
        motdTeamsEl.textContent = `${matchOfTheDayData.team1} - ${matchOfTheDayData.team2}`;
        
        motdOddsContainerEl.innerHTML = ''; // Очищуємо контейнер коефіцієнтів перед додаванням нових
        // Створюємо кнопки для кожного коефіцієнта
        for (const key in matchOfTheDayData.odds) {
            const odd = matchOfTheDayData.odds[key];
            const button = document.createElement('button');
            button.className = 'odds-button'; // Клас для стилізації
            button.dataset.key = key; // Зберігаємо ключ коефіцієнта (p1, x, p2)
            // Створюємо HTML-структуру всередині кнопки для назви та значення коефіцієнта
            button.innerHTML = `
                <span class="odd-name">${odd.name}</span>
                <span class="odd-value">${odd.value.toFixed(2)}</span>
            `;
            button.addEventListener('click', handleMotdOddSelection); // Додаємо обробник кліку
            motdOddsContainerEl.appendChild(button); // Додаємо кнопку в контейнер
        }
    }

    // Функція, що викликається при виборі коефіцієнта
    function handleMotdOddSelection(event) {
        // Знімаємо клас 'selected' з усіх кнопок коефіцієнтів
        motdOddsContainerEl.querySelectorAll('.odds-button').forEach(btn => btn.classList.remove('selected'));
        // Додаємо клас 'selected' до натиснутої кнопки
        const selectedButton = event.currentTarget;
        selectedButton.classList.add('selected');
        
        const oddKey = selectedButton.dataset.key; // Отримуємо ключ вибраного коефіцієнта
        motdSelectedOdd = matchOfTheDayData.odds[oddKey]; // Зберігаємо дані вибраного коефіцієнта
        
        // Показуємо блок для вибору суми ставки
        if (motdStakeOptionsAreaEl) motdStakeOptionsAreaEl.classList.remove('hidden');
        // Очищуємо попереднє повідомлення про ставку
        if (motdBetConfirmationEl) motdBetConfirmationEl.innerHTML = ''; 

        // Генеруємо кнопки для вибору суми ставки
        if (motdStakeButtonsContainerEl) {
            motdStakeButtonsContainerEl.innerHTML = ''; // Очищуємо контейнер
            matchOfTheDayData.stakeAmounts.forEach(amount => {
                const stakeButton = document.createElement('button');
                stakeButton.className = 'stake-button motd-stake'; // Класи для стилізації
                stakeButton.dataset.amount = amount; // Зберігаємо суму ставки
                stakeButton.textContent = `${amount} ₴`; // Текст кнопки
                stakeButton.addEventListener('click', processBetPlacement); // Додаємо обробник кліку
                motdStakeButtonsContainerEl.appendChild(stakeButton); // Додаємо кнопку
            });
        }

        // Генеруємо кнопку для використання фрібету, якщо вони є
        if (motdFreebetButtonContainerEl) {
            motdFreebetButtonContainerEl.innerHTML = ''; // Очищуємо контейнер
            if (currentBalances.freebets > 0) {
                const freebetButton = document.createElement('button');
                freebetButton.id = 'motdFreebetButton'; // ID для CSS
                freebetButton.dataset.amount = 'freebet'; // Позначаємо, що це фрібет
                // Текст кнопки, як на макеті, з урахуванням номіналу фрібету (припускаємо 250)
                freebetButton.textContent = `Використати Фрібет (${currentBalances.freebets > 0 ? '250 ₴': '0 шт.'})`; 
                
                if(currentBalances.freebets === 0) freebetButton.disabled = true;

                freebetButton.addEventListener('click', processBetPlacement); // Додаємо обробник кліку
                motdFreebetButtonContainerEl.appendChild(freebetButton); // Додаємо кнопку
            }
        }
        // Встановлюємо заголовок для блоку вибору ставки
        if (motdStakeTitleEl) motdStakeTitleEl.textContent = "Обери суму ставки для Матчу дня:";
    }

    // Функція для обробки розміщення ставки (як за гроші, так і фрібетом)
    function processBetPlacement(event) {
        const stakeTypeOrAmount = event.currentTarget.dataset.amount; // 'freebet' або числова сума

        if (!motdSelectedOdd) { // Перевірка, чи вибрано коефіцієнт
            tgM.showAlert('Будь ласка, спочатку оберіть результат матчу дня!');
            return;
        }

        let stakeAmountForCalc = 0; // Сума для розрахунку потенційного виграшу
        let messageTitle = "";      // Заголовок повідомлення про ставку
        let messageDetails = "";    // Деталі повідомлення про ставку
        let betMade = false;        // Прапорець, чи була зроблена ставка

        if (stakeTypeOrAmount === 'freebet') { // Якщо використовується фрібет
            if (currentBalances.freebets > 0) {
                currentBalances.freebets--; // Зменшуємо кількість фрібетів
                stakeAmountForCalc = 250; // Умовний номінал фрібету для розрахунку виграшу
                messageTitle = `Матч дня: Ставка Фрібетом (${stakeAmountForCalc} ₴)`;
                messageDetails = `Твою ставку на “${motdSelectedOdd.description}” (${motdSelectedOdd.name} @${motdSelectedOdd.value.toFixed(2)}) прийнято (MVP). Виграш з фрібету буде зараховано на основний баланс.`;
                betMade = true;
            } else {
                tgM.showAlert('У вас немає доступних фрібетів.');
                return;
            }
        } else { // Якщо ставка за гроші
            const numericAmount = parseInt(stakeTypeOrAmount);
            if (currentBalances.main >= numericAmount) { // Перевірка балансу
                currentBalances.main -= numericAmount; // Списання з балансу
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

        if (betMade) { // Якщо ставка успішно зроблена
            if (typeof updateBalanceDisplay === 'function') {
                updateBalanceDisplay(); // Оновлюємо відображення балансів у хедері
            }

            if (motdBetConfirmationEl) {
                // Формуємо HTML для повідомлення з потрібними класами
                motdBetConfirmationEl.innerHTML = `
                    <div class="info-message bet-placed-style"> 
                        <span class="message-title">${messageTitle}</span>
                        <span class="message-details">${messageDetails.replace(/\n/g, "<br>")}</span>
                    </div>`;
            }
            
            tgM.HapticFeedback.notificationOccurred('success'); // Вібровідгук
            if (confetti) { // Анімація конфеті
                 confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, zIndex: 10000 }); 
            }
        }

        // Ховаємо блок вибору ставки та скидаємо вибраний коефіцієнт
        if (motdStakeOptionsAreaEl) motdStakeOptionsAreaEl.classList.add('hidden');
        if (motdOddsContainerEl) motdOddsContainerEl.querySelectorAll('.odds-button').forEach(btn => btn.classList.remove('selected'));
        motdSelectedOdd = null;
    }
    
    // Ініціалізація відображення "Матчу дня" при завантаженні цієї "сторінки"
    displayMatchOfTheDay();
})();