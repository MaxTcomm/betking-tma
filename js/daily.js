const tgD = window.Telegram.WebApp;

tgD.ready();
tgD.expand();

// Ініціалізація змінних
let streak = 4; // Для демо: користувач уже має 4 успішних прогнози
let dailyBetUsed = false;
let extraBetPurchased = false;
let friendInvited = false;
let selectedMatchId = null;
let selectedOption = null;

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
    const progressBarFill = document.getElementById('progressBarFill');
    const progressText = document.getElementById('progressText');
    const matchList = document.getElementById('matchList');
    const extraBetButton = document.getElementById('extraBetButton');
    const shareButton = document.getElementById('shareButton');
    const rewardMessage = document.getElementById('rewardMessage');

    // Завантаження стану
    loadState();

    // Відображення прогресу (прогрес-бар)
    function displayProgress() {
        const progressPercentage = (streak / 10) * 100;
        progressBarFill.style.width = `${progressPercentage}%`;
        progressText.textContent = `Прогрес: ${streak}/10 успішних прогнозів`;
    }

    // Відображення списку матчів
    function displayMatches() {
        matchList.innerHTML = '';
        matches.forEach(match => {
            const matchItem = document.createElement('div');
            matchItem.className = 'match-item';
            let optionsHtml = `
                <button ${match.predicted ? 'disabled' : ''} onclick="selectOption(${match.id}, '${match.teams[0]}', this)">${match.teams[0]}</button>
                ${match.type === 'sport' ? `<button ${match.predicted ? 'disabled' : ''} onclick="selectOption(${match.id}, 'Нічия', this)">Нічия</button>` : ''}
                <button ${match.predicted ? 'disabled' : ''} onclick="selectOption(${match.id}, '${match.teams[1]}', this)">${match.teams[1]}</button>
            `;
            let confirmButtonHtml = match.predicted ? '' : `<button class="confirm-button" onclick="confirmPrediction(${match.id})" id="confirmButton-${match.id}" disabled>Підтвердити прогноз</button>`;
            matchItem.innerHTML = `
                <h3>${match.teams[0]} vs ${match.teams[1]}</h3>
                <div class="options" id="options-${match.id}">
                    ${optionsHtml}
                </div>
                ${confirmButtonHtml}
            `;
            matchList.appendChild(matchItem);
        });
    }

    // Вибір опції для прогнозу
    window.selectOption = (matchId, option, button) => {
        if (dailyBetUsed && !extraBetPurchased && !friendInvited) {
            tgD.showAlert('Ви вже зробили безкоштовний прогноз сьогодні! Додатковий прогноз коштує від 50 грн або запросіть друга.');
            return;
        }

        const match = matches.find(m => m.id === matchId);
        if (match.predicted) {
            tgD.showAlert('Ви вже зробили прогноз для цього матчу!');
            return;
        }

        // Знімаємо виділення з усіх кнопок
        const buttons = document.querySelectorAll(`#options-${matchId} button`);
        buttons.forEach(btn => btn.classList.remove('selected'));

        // Виділяємо вибрану кнопку
        button.classList.add('selected');

        // Зберігаємо вибір
        selectedMatchId = matchId;
        selectedOption = option;

        // Активуємо кнопку "Підтвердити прогноз"
        const confirmButton = document.getElementById(`confirmButton-${matchId}`);
        if (confirmButton) {
            confirmButton.disabled = false;
        }
    };

    // Підтвердження прогнозу
    window.confirmPrediction = (matchId) => {
        if (!selectedMatchId || !selectedOption) {
            tgD.showAlert('Спочатку виберіть результат матчу!');
            return;
        }

        const match = matches.find(m => m.id === matchId);
        if (match.predicted) {
            tgD.showAlert('Ви вже зробили прогноз для цього матчу!');
            return;
        }

        match.result = selectedOption;
        match.predicted = true;

        // Імітація результату матчу (для демо)
        const correctResult = match.type === 'sport' ? (Math.random() > 0.66 ? match.teams[0] : Math.random() > 0.33 ? 'Нічия' : match.teams[1]) : (Math.random() > 0.5 ? match.teams[0] : match.teams[1]);
        
        if (selectedOption === correctResult) {
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
        selectedMatchId = null;
        selectedOption = null;

        saveState();
        displayProgress();
        displayMatches();
    };

    // Додатковий прогноз за гроші (з пресетами)
    extraBetButton.addEventListener('click', () => {
        if (dailyBetUsed && !extraBetPurchased) {
            tgD.showPopup({
                title: "Додатковий прогноз",
                message: "Виберіть суму для додаткового прогнозу (FreeBet не можна використовувати):",
                buttons: [
                    { id: "50", type: "default", text: "50 грн" },
                    { id: "100", type: "default", text: "100 грн" },
                    { id: "200", type: "default", text: "200 грн" }
                ]
            }, (buttonId) => {
                if (buttonId) {
                    const amount = parseInt(buttonId);
                    tgD.showAlert(`Імітація оплати ${amount} грн... (для MVP). Додатковий прогноз активовано!`);
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
            const shareText = "Привіт! Приєднуйся до BetKing — роби прогнози на матчі та отримуй FreeBets! 🚀 Це лише MVP-версія, тому ми ще не записуємо дані — основний функціонал у розробці!";
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