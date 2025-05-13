const tgM = window.Telegram.WebApp;

tgM.ready();
tgM.expand();

// Ініціалізація змінних
let matchData = null;
let selectedPrediction = null;
let selectedStake = null;
let predictionMade = false;
let userBalance = 1000; // Імітація балансу користувача для MVP (1000 грн)

document.addEventListener('DOMContentLoaded', async () => {
    const motdDate = document.getElementById('motdDate');
    const motdTeams = document.getElementById('motdTeams');
    const motdLeague = document.getElementById('motdLeague');
    const motdDateTime = document.getElementById('motdDateTime');
    const oddTeam1 = document.getElementById('oddTeam1');
    const oddDraw = document.getElementById('oddDraw');
    const oddTeam2 = document.getElementById('oddTeam2');
    const oddTeam1Value = document.getElementById('oddTeam1Value');
    const oddDrawValue = document.getElementById('oddDrawValue');
    const oddTeam2Value = document.getElementById('oddTeam2Value');
    const oddTeam1Coefficient = document.getElementById('oddTeam1Coefficient');
    const oddDrawCoefficient = document.getElementById('oddDrawCoefficient');
    const oddTeam2Coefficient = document.getElementById('oddTeam2Coefficient');
    const stake100 = document.getElementById('stake100');
    const stake200 = document.getElementById('stake200');
    const stake500 = document.getElementById('stake500');
    const stakeFreeBet = document.getElementById('stakeFreeBet');
    const placePredictionButton = document.getElementById('placePredictionButton');
    const motdPredictionResult = document.getElementById('motdPredictionResult');

    // Завантаження даних Матчу дня через API
    async function loadMatchData() {
        try {
            console.log('Завантаження даних Матчу дня...');
            // Використовуємо ваш новий ngrok URL для локального сервера
            const response = await fetch('https://da71-178-54-3-28.ngrok-free.app/match-of-the-day.json');
            if (!response.ok) {
                throw new Error(`HTTP помилка: ${response.status}`);
            }
            matchData = await response.json();
            console.log('Дані успішно завантажено:', matchData);
        } catch (error) {
            console.error('Помилка завантаження даних Матчу дня:', error);
            matchData = null;
        }
    }

    // Відображення даних Матчу дня
    function displayMatchData() {
        console.log('Відображення даних Матчу дня...');
        if (matchData) {
            motdDate.textContent = new Date(matchData.lastUpdated).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });
            motdTeams.textContent = matchData.teams;
            motdLeague.textContent = matchData.league;
            motdDateTime.textContent = matchData.dateTime;
            oddTeam1Value.textContent = matchData.odds.team1;
            oddDrawValue.textContent = matchData.odds.draw;
            oddTeam2Value.textContent = matchData.odds.team2;
            oddTeam1Coefficient.textContent = `Коеф: ${matchData.coefficients.team1}`;
            oddDrawCoefficient.textContent = `Коеф: ${matchData.coefficients.draw}`;
            oddTeam2Coefficient.textContent = `Коеф: ${matchData.coefficients.team2}`;

            // Приховуємо кнопку "Нічия", якщо матч із кіберспорту (без нічиєї)
            if (matchData.odds.draw === "0%") {
                oddDraw.style.display = 'none';
            }
        } else {
            motdTeams.textContent = "Дані недоступні";
            motdLeague.textContent = "";
            motdDateTime.textContent = "";
            oddTeam1Value.textContent = "";
            oddDrawValue.textContent = "";
            oddTeam2Value.textContent = "";
            oddTeam1Coefficient.textContent = "";
            oddDrawCoefficient.textContent = "";
            oddTeam2Coefficient.textContent = "";
            oddTeam1.disabled = true;
            oddDraw.disabled = true;
            oddTeam2.disabled = true;
            stake100.disabled = true;
            stake200.disabled = true;
            stake500.disabled = true;
            stakeFreeBet.disabled = true;
            placePredictionButton.disabled = true;
        }
    }

    // Вибір коефіцієнта
    oddTeam1.addEventListener('click', () => {
        if (!predictionMade && matchData) {
            oddTeam1.classList.add('active');
            oddDraw.classList.remove('active');
            oddTeam2.classList.remove('active');
            selectedPrediction = 'team1';
            console.log('Вибрано коефіцієнт: Перемога 1');
        }
    });

    oddDraw.addEventListener('click', () => {
        if (!predictionMade && matchData) {
            oddTeam1.classList.remove('active');
            oddDraw.classList.add('active');
            oddTeam2.classList.remove('active');
            selectedPrediction = 'draw';
            console.log('Вибрано коефіцієнт: Нічия');
        }
    });

    oddTeam2.addEventListener('click', () => {
        if (!predictionMade && matchData) {
            oddTeam1.classList.remove('active');
            oddDraw.classList.remove('active');
            oddTeam2.classList.add('active');
            selectedPrediction = 'team2';
            console.log('Вибрано коефіцієнт: Перемога 2');
        }
    });

    // Вибір суми ставки
    stake100.addEventListener('click', () => {
        if (!predictionMade && matchData) {
            stake100.classList.add('active');
            stake200.classList.remove('active');
            stake500.classList.remove('active');
            stakeFreeBet.classList.remove('active');
            selectedStake = 100;
            console.log('Вибрано суму ставки: 100 грн');
        }
    });

    stake200.addEventListener('click', () => {
        if (!predictionMade && matchData) {
            stake100.classList.remove('active');
            stake200.classList.add('active');
            stake500.classList.remove('active');
            stakeFreeBet.classList.remove('active');
            selectedStake = 200;
            console.log('Вибрано суму ставки: 200 грн');
        }
    });

    stake500.addEventListener('click', () => {
        if (!predictionMade && matchData) {
            stake100.classList.remove('active');
            stake200.classList.remove('active');
            stake500.classList.add('active');
            stakeFreeBet.classList.remove('active');
            selectedStake = 500;
            console.log('Вибрано суму ставки: 500 грн');
        }
    });

    stakeFreeBet.addEventListener('click', () => {
        if (!predictionMade && matchData) {
            stake100.classList.remove('active');
            stake200.classList.remove('active');
            stake500.classList.remove('active');
            stakeFreeBet.classList.add('active');
            selectedStake = 'freebet';
            console.log('Вибрано суму ставки: FreeBet');
        }
    });

    // Підтвердження прогнозу
    placePredictionButton.addEventListener('click', () => {
        if (!selectedPrediction) {
            tgM.showAlert('Спочатку виберіть результат матчу!');
            return;
        }

        if (!selectedStake) {
            tgM.showAlert('Спочатку виберіть суму ставки!');
            return;
        }

        if (predictionMade) {
            tgM.showAlert('Ви вже зробили прогноз на цей матч!');
            return;
        }

        // Імітація списання з балансу
        if (selectedStake !== 'freebet') {
            if (userBalance >= selectedStake) {
                userBalance -= selectedStake;
                motdPredictionResult.innerHTML = `<div class="info-message success">Прогноз успішно зроблено! З вашого балансу списано ${selectedStake} грн. Новий баланс: ${userBalance} грн.</div>`;
                console.log(`Баланс оновлено: ${userBalance} грн`);
            } else {
                motdPredictionResult.innerHTML = `<div class="info-message error">Недостатньо коштів на балансі! Ваш баланс: ${userBalance} грн.</div>`;
                console.log('Недостатньо коштів на балансі');
                return;
            }
        } else {
            motdPredictionResult.innerHTML = '<div class="info-message success">Прогноз успішно зроблено з використанням FreeBet!</div>';
            console.log('Прогноз зроблено з FreeBet');
        }

        // Імітація результату матчу (для демо)
        const possibleResults = matchData.odds.draw === "0%" ? ['team1', 'team2'] : ['team1', 'draw', 'team2'];
        const actualResult = possibleResults[Math.floor(Math.random() * possibleResults.length)];

        if (selectedPrediction === actualResult) {
            setTimeout(() => {
                motdPredictionResult.innerHTML += '<div class="info-message success">Вітаємо! Ви вгадали результат матчу!</div>';
                console.log('Користувач вгадав результат');
            }, 1000);
        } else {
            setTimeout(() => {
                motdPredictionResult.innerHTML += '<div class="info-message error">На жаль, ви не вгадали результат. Спробуйте ще раз завтра!</div>';
                console.log('Користувач не вгадав результат');
            }, 1000);
        }

        predictionMade = true;
        oddTeam1.disabled = true;
        oddDraw.disabled = true;
        oddTeam2.disabled = true;
        stake100.disabled = true;
        stake200.disabled = true;
        stake500.disabled = true;
        stakeFreeBet.disabled = true;
        placePredictionButton.disabled = true;
    });

    // Ініціалізація
    await loadMatchData();
    displayMatchData();
});