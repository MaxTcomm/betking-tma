// js/daily.js
const tgD = window.Telegram.WebApp;
// Функція getFormattedDate та TODAY_STRING мають бути доступні. 
// Вони визначені в app.js і будуть в глобальному скоупі, або їх треба імпортувати, якщо використовувати модулі.
// Для простоти MVP припускаємо, що вони доступні глобально. Якщо ні, їх потрібно тут повторити або передати.
// function getFormattedDate(date) { ... } // Якщо потрібно, розкоментуйте і скопіюйте з app.js
// const TODAY_STRING = getFormattedDate(new Date()); // Якщо потрібно

const dailyMatchData = {
    team1: "Ворскла Полтава",
    team2: "Зоря Луганськ",
    options: {
        p1: { name: "П1", description: "Перемога Ворскла" },
        x:  { name: "X", description: "Нічия" },
        p2: { name: "П2", description: "Перемога Зоря" }
    },
    correctOutcome: "p1"
};

const dailyLoginState = {
    currentStreak: 0,
    lastPredictionDate: null
};

const currentStreakEl = document.getElementById('currentStreak');
const dailyMatchTeamsEl = document.getElementById('dailyMatchTeams');
const dailyPredictionOptionsEl = document.getElementById('dailyPredictionOptions');
const dailyPredictionResultEl = document.getElementById('dailyPredictionResult');

function loadDailyLoginState() {
    if (!currentStreakEl) return; // Перевірка наявності елемента

    const savedStreak = localStorage.getItem('betkingDailyStreak');
    const savedDate = localStorage.getItem('betkingLastPredictionDate');

    if (savedStreak !== null) {
        dailyLoginState.currentStreak = parseInt(savedStreak, 10);
    }
    if (savedDate !== null) {
        dailyLoginState.lastPredictionDate = savedDate;
    }
    // Використовуємо глобальну TODAY_STRING з app.js
    if (dailyLoginState.lastPredictionDate && dailyLoginState.lastPredictionDate !== window.TODAY_STRING) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        // Використовуємо глобальну getFormattedDate з app.js
        if (dailyLoginState.lastPredictionDate !== window.getFormattedDate(yesterday)) {
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
    if (!dailyMatchTeamsEl) return; // Елементи можуть бути ще не завантажені

    loadDailyLoginState();
    currentStreakEl.textContent = dailyLoginState.currentStreak;
    dailyMatchTeamsEl.textContent = `${dailyMatchData.team1} - ${dailyMatchData.team2}`;
    dailyPredictionOptionsEl.innerHTML = '';
    // Використовуємо глобальну TODAY_STRING з app.js
    let alreadyPredictedToday = dailyLoginState.lastPredictionDate === window.TODAY_STRING;

    for (const key in dailyMatchData.options) {
        const option = dailyMatchData.options[key];
        const button = document.createElement('button');
        button.className = 'prediction-button';
        button.dataset.key = key;
        button.textContent = option.name;
        button.title = option.description;
        if (alreadyPredictedToday) button.disabled = true;
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
    // Використовуємо глобальну TODAY_STRING з app.js
    if (dailyLoginState.lastPredictionDate === window.TODAY_STRING) {
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
        // Використовуємо глобальну getFormattedDate з app.js
        if (dailyLoginState.lastPredictionDate === window.getFormattedDate(yesterday)) {
            dailyLoginState.currentStreak++;
        } else {
            dailyLoginState.currentStreak = 1;
        }
        tgD.HapticFeedback.notificationOccurred('success');
        if (typeof confetti === 'function') { confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } }); }
    } else {
        message += "На жаль, НЕПРАВИЛЬНО. ❌";
        dailyLoginState.currentStreak = 0;
        tgD.HapticFeedback.notificationOccurred('error');
    }
    // Використовуємо глобальну TODAY_STRING з app.js
    dailyLoginState.lastPredictionDate = window.TODAY_STRING;
    saveDailyLoginState();
    currentStreakEl.textContent = dailyLoginState.currentStreak;
    
    const rewards = { 3: "Фрібет X", 7: "Фрібет Y", 10: "Фрібет Z" };
    if (isCorrect && rewards[dailyLoginState.currentStreak]) {
        message += `\n🎉 Вітаємо! Ви виграли ${rewards[dailyLoginState.currentStreak]} за ${dailyLoginState.currentStreak} правильних прогнозів поспіль!`;
    }
    dailyPredictionResultEl.innerHTML = `<div class="info-message ${messageClass}">${message.replace(/\n/g, "<br>")}</div>`;
    document.querySelectorAll('#dailyPredictionOptions .prediction-button').forEach(btn => btn.disabled = true);
}

displayDailyPredictionModule();