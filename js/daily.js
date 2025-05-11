// js/daily.js
(function() {
    const dailyContent = document.getElementById('dailyLoginContent');
    if (!dailyContent) {
        // console.log('Daily content not found, script will not run yet.');
        return;
    }
    // console.log('Daily script executing.');

    const tgD = window.Telegram.WebApp;
    // Використовуємо глобальні функції з app.js
    const getFormattedDate = window.getFormattedDate;
    const TODAY_STRING = window.TODAY_STRING;


    const dailyMatchData = {
        team1: "Ворскла Полтава",
        team2: "Зоря Луганськ",
        options: {
            p1: { name: "П1", description: "Перемога Ворскла" },
            x:  { name: "X", description: "Нічия" },
            p2: { name: "П2", description: "Перемога Зоря" }
        },
        correctOutcome: "p1" // Правильний результат для цього матчу (для MVP)
    };

    const dailyLoginState = {
        currentStreak: 0,
        lastPredictionDate: null // YYYY-MM-DD
    };

    const currentStreakEl = dailyContent.querySelector('#currentStreak');
    const dailyMatchTeamsEl = dailyContent.querySelector('#dailyMatchTeams');
    const dailyPredictionOptionsEl = dailyContent.querySelector('#dailyPredictionOptions');
    const dailyPredictionResultEl = dailyContent.querySelector('#dailyPredictionResult');

    function loadDailyLoginState() {
        if (!currentStreakEl) { // Перевірка, чи елемент існує
            console.error('Daily streak element not found.');
            return;
        }

        const savedStreak = localStorage.getItem('betkingDailyStreak');
        const savedDate = localStorage.getItem('betkingLastPredictionDate');

        if (savedStreak !== null) {
            dailyLoginState.currentStreak = parseInt(savedStreak, 10);
        }
        if (savedDate !== null) {
            dailyLoginState.lastPredictionDate = savedDate;
        }
        
        if (dailyLoginState.lastPredictionDate && dailyLoginState.lastPredictionDate !== TODAY_STRING) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (dailyLoginState.lastPredictionDate !== getFormattedDate(yesterday)) {
                dailyLoginState.currentStreak = 0; 
            }
        }
        currentStreakEl.textContent = dailyLoginState.currentStreak;
    }

    function saveDailyLoginState() {
        localStorage.setItem('betkingDailyStreak', dailyLoginState.currentStreak);
        localStorage.setItem('betkingLastPredictionDate', dailyLoginState.lastPredictionDate);
    }

    function displayDailyPredictionModule() {
        if (!dailyMatchTeamsEl || !dailyPredictionOptionsEl || !dailyPredictionResultEl) {
            console.error('Daily DOM elements not found for display.');
            return;
        }
        loadDailyLoginState(); // Завантажуємо стан перед відображенням
        
        currentStreakEl.textContent = dailyLoginState.currentStreak;
        dailyMatchTeamsEl.textContent = `${dailyMatchData.team1} - ${dailyMatchData.team2}`;
        dailyPredictionOptionsEl.innerHTML = '';

        let alreadyPredictedToday = dailyLoginState.lastPredictionDate === TODAY_STRING;

        for (const key in dailyMatchData.options) {
            const option = dailyMatchData.options[key];
            const button = document.createElement('button');
            button.className = 'prediction-button';
            button.dataset.key = key;
            button.textContent = option.name;
            button.title = option.description;
            if (alreadyPredictedToday) {
                button.disabled = true;
            }
            button.addEventListener('click', handleDailyPrediction);
            dailyPredictionOptionsEl.appendChild(button);
        }

        if (alreadyPredictedToday) {
            dailyPredictionResultEl.innerHTML = `<div class="info-message notice">Ви вже зробили свій прогноз на сьогодні. Повертайтесь завтра!</div>`;
        } else {
            dailyPredictionResultEl.innerHTML = `<div class="info-message notice">Зробіть свій прогноз на матч дня!</div>`;
        }
    }

    function handleDailyPrediction(event) {
        if (dailyLoginState.lastPredictionDate === TODAY_STRING) {
            tgD.showAlert("Ви вже зробили прогноз на сьогодні!");
            return;
        }

        const predictedKey = event.currentTarget.dataset.key;
        const isCorrect = predictedKey === dailyMatchData.correctOutcome;
        let message = `Ваш прогноз: ${dailyMatchData.options[predictedKey].description}. `;
        let messageClass = 'notice';


        if (isCorrect) {
            message += "Це ПРАВИЛЬНО! ✅";
            messageClass = 'success';
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (dailyLoginState.lastPredictionDate === getFormattedDate(yesterday)) {
                dailyLoginState.currentStreak++;
            } else {
                dailyLoginState.currentStreak = 1;
            }
            tgD.HapticFeedback.notificationOccurred('success');
            if (window.confetti) { // Використовуємо window.confetti
                window.confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, zIndex: 10000 });
            }
        } else {
            message += "На жаль, НЕПРАВИЛЬНО. ❌";
            messageClass = 'error'; // Використовуємо новий клас для помилки
            dailyLoginState.currentStreak = 0;
            tgD.HapticFeedback.notificationOccurred('error');
        }

        dailyLoginState.lastPredictionDate = TODAY_STRING;
        saveDailyLoginState();
        if(currentStreakEl) currentStreakEl.textContent = dailyLoginState.currentStreak; // Оновлюємо стрік на сторінці
        
        const rewards = { 3: "Фрібет X", 7: "Фрібет Y", 10: "Фрібет Z" };
        if (isCorrect && rewards[dailyLoginState.currentStreak]) {
            message += `\n🎉 Вітаємо! Ви виграли ${rewards[dailyLoginState.currentStreak]} за ${dailyLoginState.currentStreak} правильних прогнозів поспіль!`;
        }
        if(dailyPredictionResultEl) dailyPredictionResultEl.innerHTML = `<div class="info-message ${messageClass}">${message.replace(/\n/g, "<br>")}</div>`;
        
        dailyPredictionOptionsEl.querySelectorAll('.prediction-button').forEach(btn => btn.disabled = true);
    }
    
    displayDailyPredictionModule();
})();