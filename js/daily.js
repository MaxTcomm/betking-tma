(function() {
    const dailyContent = document.getElementById('dailyLoginContent');
    if (!dailyContent) {
        return;
    }

    if (typeof window.isUserCurrentlyLoggedIn !== 'function' || !window.isUserCurrentlyLoggedIn()) {
        window.showNotLoggedInMessage(dailyContent);
        return; 
    }

    const tgD = window.Telegram.WebApp;
    const getFormattedDate = window.getFormattedDate;
    const TODAY_STRING = window.TODAY_STRING;

    // Дані про поточний "щоденний матч"
    const currentDailyMatch = {
        key: `dailyMatch_${TODAY_STRING}`,
        team1: "Колос Ковалівка",
        team2: "ЛНЗ Черкаси",
        options: {
            p1: { name: "П1", description: "Перемога Колос" },
            x:  { name: "X", description: "Нічия" },
            p2: { name: "П2", description: "Перемога ЛНЗ" }
        },
        correctOutcome: "x" 
    };

    // Стан, що зберігається в localStorage
    const dailyLoginState = {
        currentStreak: 0,
        pendingPrediction: null,
        lastSettledDate: null
    };

    const currentStreakEl = dailyContent.querySelector('#currentStreak');
    const dailyMatchTeamsEl = dailyContent.querySelector('#dailyMatchTeams');
    const dailyPredictionOptionsEl = dailyContent.querySelector('#dailyPredictionOptions');
    const dailyPredictionResultEl = dailyContent.querySelector('#dailyPredictionResult');

    function loadState() {
        const savedStreak = localStorage.getItem('betkingDailyStreak_v2');
        const savedPendingPrediction = localStorage.getItem('betkingPendingPrediction_v2');
        const savedLastSettledDate = localStorage.getItem('betkingLastSettledDate_v2');

        if (savedStreak !== null) {
            dailyLoginState.currentStreak = parseInt(savedStreak, 10);
        }
        if (savedPendingPrediction !== null) {
            try {
                dailyLoginState.pendingPrediction = JSON.parse(savedPendingPrediction);
            } catch (e) {
                console.error("Error parsing pending prediction:", e);
                dailyLoginState.pendingPrediction = null;
            }
        }
        if (savedLastSettledDate !== null) {
            dailyLoginState.lastSettledDate = savedLastSettledDate;
        }
        currentStreakEl.textContent = dailyLoginState.currentStreak;
    }

    function saveState() {
        localStorage.setItem('betkingDailyStreak_v2', dailyLoginState.currentStreak);
        if (dailyLoginState.pendingPrediction) {
            localStorage.setItem('betkingPendingPrediction_v2', JSON.stringify(dailyLoginState.pendingPrediction));
        } else {
            localStorage.removeItem('betkingPendingPrediction_v2');
        }
        if (dailyLoginState.lastSettledDate) {
            localStorage.setItem('betkingLastSettledDate_v2', dailyLoginState.lastSettledDate);
        } else {
            localStorage.removeItem('betkingLastSettledDate_v2');
        }
    }

    function settlePendingPrediction() {
        let message = "";
        let messageClass = "notice";

        if (dailyLoginState.pendingPrediction) {
            const prediction = dailyLoginState.pendingPrediction;
            if (prediction.dateMade < TODAY_STRING) {
                const actualOutcome = currentDailyMatch.correctOutcome;
                const isCorrect = prediction.predictedOutcome === actualOutcome;
                
                message = `Результат вашого прогнозу від ${prediction.dateMade} на матч (${prediction.matchKey.substring(11)}):\nВи обрали "${currentDailyMatch.options[prediction.predictedOutcome]?.description || 'невідомо'}". `;

                if (isCorrect) {
                    message += "Це ПРАВИЛЬНО! ✅";
                    messageClass = 'success';
                    
                    const predictionDate = new Date(prediction.dateMade);
                    const dayBeforePrediction = new Date(predictionDate);
                    dayBeforePrediction.setDate(predictionDate.getDate() - 1);

                    if (dailyLoginState.lastSettledDate === getFormattedDate(dayBeforePrediction)) {
                        dailyLoginState.currentStreak++;
                    } else {
                        dailyLoginState.currentStreak = 1;
                    }
                    tgD.HapticFeedback.notificationOccurred('success');
                    if (window.confetti) { window.confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, zIndex: 10000 }); }
                } else {
                    message += "На жаль, НЕПРАВИЛЬНО. ❌";
                    messageClass = 'error';
                    dailyLoginState.currentStreak = 0;
                    tgD.HapticFeedback.notificationOccurred('error');
                }

                dailyLoginState.lastSettledDate = prediction.dateMade;
                dailyLoginState.pendingPrediction = null;
                saveState();
                currentStreakEl.textContent = dailyLoginState.currentStreak;

                // Перевірка нагород
                const rewards = {
                    3: { name: "Фрібет 100 ₴", amount: 100 },
                    7: { name: "Фрібет 250 ₴", amount: 250 },
                    10: { name: "Фрібет 500 ₴", amount: 500 }
                };
                if (isCorrect && rewards[dailyLoginState.currentStreak]) {
                    const reward = rewards[dailyLoginState.currentStreak];
                    message += `\n🎉 Вітаємо! Ви виграли ${reward.name} за ${dailyLoginState.currentStreak} правильних прогнозів поспіль!`;
                    window.currentBalances.freebets += 1;
                    window.currentBalances.freebetAmount = reward.amount;
                    window.updateBalanceDisplay();
                }
                dailyPredictionResultEl.innerHTML = `<div class="info-message ${messageClass}">${message.replace(/\n/g, "<br>")}</div>`;
                return true;
            }
        }
        return false;
    }

    function displayDailyOffer() {
        if (!dailyMatchTeamsEl || !dailyPredictionOptionsEl || !dailyPredictionResultEl) {
            console.error('Daily DOM elements not found for display offer.');
            return;
        }
        
        currentStreakEl.textContent = dailyLoginState.currentStreak;
        dailyMatchTeamsEl.textContent = `${currentDailyMatch.team1} - ${currentDailyMatch.team2}`;
        dailyPredictionOptionsEl.innerHTML = '';

        const hasActivePredictionForToday = dailyLoginState.pendingPrediction && dailyLoginState.pendingPrediction.dateMade === TODAY_STRING;

        if (hasActivePredictionForToday) {
            dailyPredictionResultEl.innerHTML = `<div class="info-message notice">Ваш прогноз на сьогоднішній матч (${currentDailyMatch.team1} vs ${currentDailyMatch.team2}) прийнято. Результат буде відомий пізніше.</div>`;
            dailyPredictionOptionsEl.innerHTML = '';
        } else {
            if (!dailyPredictionResultEl.innerHTML.includes('Результат вашого прогнозу')) {
                dailyPredictionResultEl.innerHTML = `<div class="info-message notice">Зробіть свій прогноз на сьогоднішній матч!</div>`;
            }

            for (const key in currentDailyMatch.options) {
                const option = currentDailyMatch.options[key];
                const button = document.createElement('button');
                button.className = 'tab-button prediction-choice-tab';
                button.dataset.key = key;
                button.textContent = option.name;
                button.title = option.description;
                button.addEventListener('click', handleDailyPrediction);
                dailyPredictionOptionsEl.appendChild(button);
            }
        }
    }

    function handleDailyPrediction(event) {
        if (dailyLoginState.pendingPrediction && dailyLoginState.pendingPrediction.dateMade === TODAY_STRING) {
            tgD.showAlert("Ви вже зробили прогноз на сьогодні!");
            return;
        }

        const predictedKey = event.currentTarget.dataset.key;
        
        dailyLoginState.pendingPrediction = {
            matchKey: currentDailyMatch.key,
            predictedOutcome: predictedKey,
            dateMade: TODAY_STRING
        };
        saveState();

        dailyPredictionResultEl.innerHTML = `<div class="info-message success">Ваш прогноз на матч ${currentDailyMatch.team1} - ${currentDailyMatch.team2} (${currentDailyMatch.options[predictedKey].description}) прийнято! Результат буде відомий пізніше.</div>`;
        dailyPredictionOptionsEl.querySelectorAll('.tab-button').forEach(btn => btn.disabled = true);
        tgD.HapticFeedback.impactOccurred('light');
    }
    
    loadState();
    const settled = settlePendingPrediction();
    displayDailyOffer();
})();