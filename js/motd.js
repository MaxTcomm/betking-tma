const tgM = window.Telegram.WebApp;

tgM.ready();
tgM.expand();

// Ініціалізація змінних
let matchData = null;
let selectedPrediction = null;
let predictionMade = false;

document.addEventListener('DOMContentLoaded', async () => {
    const motdDate = document.getElementById('motdDate');
    const motdTeams = document.getElementById('motdTeams');
    const motdLeague = document.getElementById('motdLeague');
    const motdDateTime = document.getElementById('motdDateTime');
    const oddTeam1Value = document.getElementById('oddTeam1Value');
    const oddDrawValue = document.getElementById('oddDrawValue');
    const oddTeam2Value = document.getElementById('oddTeam2Value');
    const oddTeam1Coefficient = document.getElementById('oddTeam1Coefficient');
    const oddDrawCoefficient = document.getElementById('oddDrawCoefficient');
    const oddTeam2Coefficient = document.getElementById('oddTeam2Coefficient');
    const predictTeam1 = document.getElementById('predictTeam1');
    const predictDraw = document.getElementById('predictDraw');
    const predictTeam2 = document.getElementById('predictTeam2');
    const placePredictionButton = document.getElementById('placePredictionButton');
    const motdPredictionResult = document.getElementById('motdPredictionResult');

    // Завантаження даних Матчу дня через API
    async function loadMatchData() {
        try {
            const response = await fetch('https://your-server-url/match-of-the-day.json'); // Замініть на ваш URL сервера
            matchData = await response.json();
        } catch (error) {
            console.error('Помилка завантаження даних Матчу дня:', error);
            matchData = null;
        }
    }

    // Відображення даних Матчу дня
    function displayMatchData() {
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
                document.getElementById('oddDraw').style.display = 'none';
                predictDraw.style.display = 'none';
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
        }
    }

    // Вибір прогнозу
    predictTeam1.addEventListener('click', () => {
        if (!predictionMade) {
            predictTeam1.classList.add('active');
            predictDraw.classList.remove('active');
            predictTeam2.classList.remove('active');
            selectedPrediction = 'team1';
        }
    });

    predictDraw.addEventListener('click', () => {
        if (!predictionMade) {
            predictTeam1.classList.remove('active');
            predictDraw.classList.add('active');
            predictTeam2.classList.remove('active');
            selectedPrediction = 'draw';
        }
    });

    predictTeam2.addEventListener('click', () => {
        if (!predictionMade) {
            predictTeam1.classList.remove('active');
            predictDraw.classList.remove('active');
            predictTeam2.classList.add('active');
            selectedPrediction = 'team2';
        }
    });

    // Підтвердження прогнозу
    placePredictionButton.addEventListener('click', () => {
        if (!selectedPrediction) {
            tgM.showAlert('Спочатку виберіть результат матчу!');
            return;
        }

        if (predictionMade) {
            tgM.showAlert('Ви вже зробили прогноз на цей матч!');
            return;
        }

        // Імітація результату матчу (для демо)
        const possibleResults = matchData.odds.draw === "0%" ? ['team1', 'team2'] : ['team1', 'draw', 'team2'];
        const actualResult = possibleResults[Math.floor(Math.random() * possibleResults.length)];

        if (selectedPrediction === actualResult) {
            motdPredictionResult.innerHTML = '<div class="info-message success">Вітаємо! Ви вгадали результат матчу!</div>';
        } else {
            motdPredictionResult.innerHTML = '<div class="info-message error">На жаль, ви не вгадали результат. Спробуйте ще раз завтра!</div>';
        }

        predictionMade = true;
        predictTeam1.disabled = true;
        predictDraw.disabled = true;
        predictTeam2.disabled = true;
        placePredictionButton.disabled = true;
    });

    // Ініціалізація
    await loadMatchData();
    displayMatchData();
});