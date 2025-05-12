const tgD = window.Telegram.WebApp;

tgD.ready();
tgD.expand();

// Ініціалізація змінних
let streak = 4; // Для демо: користувач уже має 4 успішних прогнози
let dailyBetUsed = false;
let extraBetPurchased = false;
let friendInvited = false;
let matches = [
    { id: 1, teams: ["Team A", "Team B"], type: "esport", result: null, predicted: false },
    { id: 2, teams: ["Team C", "Team D"], type: "sport", result: null, predicted: false },
    { id: 3, teams: ["Team E", "Team F"], type: "esport", result: null, predicted: false },
    { id: 4, teams: ["Team G", "Team H"], type: "sport", result: null, predicted: false },
    { id: 5, teams: ["Team I", "Team J"], type: "esport", result: null, predicted: false }
];

// Зберігання стану через localStorage
function saveState() {
    localStorage.setItem('streak', streak);
    localStorage.setItem('dailyBetUsed', dailyBetUsed);
    localStorage.setItem('extraBetPurchased', extraBetPurchased);
    localStorage.setItem('friendInvited', friendInvited);
    localStorage.setItem('matches', JSON.stringify(matches));
    localStorage.setItem('lastLoginDate', new Date().toISOString().split('T')[0]);
}

function loadState() {
    const lastLogin = localStorage.getItem('lastLoginDate');
    const today = new Date().toISOString().split('T')[0];
    if (lastLogin !== today) {
        // Скидаємо щоденні параметри при новому дні
        dailyBetUsed = false;
        extraBetPurchased = false;
        friendInvited = false;
        matches.forEach(match => {
            match.result = null;
            match.predicted = false;
        });
    } else {
        streak = parseInt(localStorage.getItem('streak')) || 4; // Для демо
        dailyBetUsed = localStorage.getItem('dailyBetUsed') === 'true';
        extraBetPurchased = localStorage.getItem('extraBetPurchased') === 'true';
        friendInvited = localStorage.getItem('friendInvited') === 'true';
        matches = JSON.parse(localStorage.getItem('matches')) || matches;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const progressCircles = document.getElementById('progressCircles');
    const progressText = document.getElementById('progressText');
    const matchList = document.getElementById('matchList');
    const extraBetButton = document.getElementById('extraBetButton');
    const shareButton = document.getElementById('shareButton');
    const rewardMessage = document.getElementById('rewardMessage');

    // Завантаження стану
    loadState();

    // Відображення прогресу (10 кружків)
    function displayProgress() {
        progressCircles.innerHTML = '';
        for (let i = 0; i < 10; i++) {
            const circle = document.createElement('div');
            circle.className = 'progress-circle' + (i < streak ? ' filled' : '');
            progressCircles.appendChild(circle);
        }
        progressText.textContent = `Прогрес: ${streak}/10 успішних прогнозів`;
    }

    // Відображення списку матчів
    function displayMatches() {
        matchList.innerHTML = '';
        matches.forEach(match => {
            const matchItem = document.createElement('div');
            matchItem.className = 'match-item';
            let optionsHtml = `
                <button ${match.predicted ? 'disabled' : ''} onclick="selectOption(${match.id}, '${match.teams[0]}')">${match.teams[0]}</button>
                ${match.type === 'sport' ? `<button ${match.predicted ? 'disabled' : ''} onclick="selectOption(${match.id}, 'Нічия')">Нічия</button>` : ''}
                <button ${match.predicted ? 'disabled' : ''} onclick="selectOption(${match.id}, '${match.teams[1]}')">${match.teams[1]}</button>
            `;
            matchItem.innerHTML = `
                <h3>${match.teams[0]} vs ${match.teams[1]}</h3>
                <div class="options" id="options-${match.id}">
                    ${optionsHtml}
                </div>
            `;
            matchList.appendChild(matchItem);
        });
    }

    // Вибір опції для прогнозу
    window.selectOption = (matchId, option) => {
        if (dailyBetUsed && !extraBetPurchased && !friendInvited) {
            tgD.showAlert('Ви вже зробили безкоштовний прогноз сьогодні! Додатковий прогноз коштує 50 грн або запросіть друга.');
            return;
        }

        const match = matches.find(m => m.id === matchId);
        if (match.predicted) {
            tgD.showAlert('Ви вже зробили прогноз для цього матчу!');
            return;
        }

        match.result = option;
        match.predicted = true;

        // Імітація результату матчу (для демо)
        const correctResult = match.type === 'sport' ? (Math.random() > 0.66 ? match.teams[0] : Math.random() > 0.33 ? 'Нічия' : match.teams[1]) : (Math.random() > 0.5 ? match.teams[0] : match.teams[1]);
        
        if (option === correctResult) {
            streak++;
            tgD.showAlert(`Вітаємо! Ви вгадали переможця! Ваш стрік: ${streak}`);
            if (streak === 3) {
                rewardMessage.textContent = 'Вітаємо! Ви отримали приз за 3 успішних прогнози!';
            } else if (streak === 7) {
                rewardMessage.textContent = 'Чудово! Ви отримали приз за 7 успішних прогнозів!';
            } else if (streak === 10) {
                rewardMessage.textContent = 'Вітаємо! Ви отримали FreeBet на 250 грн за 10 успішних прогнозів!';
                streak = 0; // Скидання стріка
            }
        } else {
            streak = 0;
            tgD.showAlert('На жаль, ви не вгадали переможця. Спробуйте ще раз завтра!');
        }

        dailyBetUsed = true;
        extraBetPurchased = false; // Скидаємо після прогнозу
        friendInvited = false; // Скидаємо після прогнозу
        saveState();
        displayProgress();
        displayMatches();
    };

    // Додатковий прогноз за 50 грн
    extraBetButton.addEventListener('click', () => {
        if (dailyBetUsed && !extraBetPurchased) {
            tgD.showConfirm("Додатковий прогноз коштує 50 грн. Продовжити?", (confirmed) => {
                if (confirmed) {
                    tgD.showAlert("Імітація оплати 50 грн... (для MVP). Додатковий прогноз активовано!");
                    extraBetPurchased = true;
                    saveState();
                }
            });
        } else if (extraBetPurchased) {
            tgD.showAlert("Ви вже використали додатковий прогноз за гроші!");
        } else {
            tgD.showAlert("Ви ще не використали свій безкоштовний прогноз!");
        }
    });

    // Запрошення друга
    shareButton.addEventListener('click', () => {
        if (dailyBetUsed && !friendInvited) {
            const shareText = "Привіт! Приєднуйся до BetKing — роби прогнози на матчі та отримуй FreeBets! 🚀 Це MVP, реєстрація не потрібна.";
            tgD.showPopup({
                title: "Запросити друга",
                message: "Відправити запрошення через Telegram?",
                buttons: [{ id: "share", type: "default", text: "Відправити" }]
            }, (buttonId) => {
                if (buttonId === "share") {
                    tgD.sendData(JSON.stringify({ action: "share", text: shareText }));
                    tgD.showAlert("Запрошення відправлено! Ви та ваш друг отримали додатковий безкоштовний прогноз!");
                    friendInvited = true;
                    saveState();
                }
            });
        } else if (friendInvited) {
            tgD.showAlert("Ви вже запросили друга сьогодні!");
        } else {
            tgD.showAlert("Ви ще не використали свій безкоштовний прогноз!");
        }
    });

    // Ініціалізація
    displayProgress();
    displayMatches();
});