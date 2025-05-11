// js/eotd.js
const tgE = window.Telegram.WebApp;

const expressOfTheDayData = {
    title: "Супер Експрес на Вихідні!",
    selections: [
        { description: "Манчестер Юнайтед - Перемога" },
        { description: "Барселона - ТБ 2.5" },
        { description: "Ювентус - Фора(0)" }
    ],
    totalOdds: 6.75
};

const expressTitleEl = document.getElementById('expressTitle');
const expressSelectionsEl = document.getElementById('expressSelections');
const expressTotalOddsEl = document.getElementById('expressTotalOdds');
const acceptExpressButton = document.getElementById('acceptExpressButton');
const eotdStakeOptionsEl = document.getElementById('eotdStakeOptions');
const eotdBetConfirmationEl = document.getElementById('eotdBetConfirmation');

function displayExpressOfTheDay() {
    if (!expressTitleEl) return;

    expressTitleEl.textContent = expressOfTheDayData.title;
    expressSelectionsEl.innerHTML = ''; 
    expressOfTheDayData.selections.forEach(selection => {
        const listItem = document.createElement('li');
        listItem.textContent = selection.description;
        expressSelectionsEl.appendChild(listItem);
    });
    expressTotalOddsEl.textContent = `Загальний коефіцієнт: ${expressOfTheDayData.totalOdds.toFixed(2)}`;
}

acceptExpressButton.addEventListener('click', function() {
    eotdStakeOptionsEl.classList.remove('hidden');
    eotdBetConfirmationEl.innerHTML = '';
});

document.querySelectorAll('.eotd-stake').forEach(button => {
    button.addEventListener('click', function() {
        const amount = parseInt(this.dataset.amount);
        const potentialWin = (amount * expressOfTheDayData.totalOdds).toFixed(2);
        const confirmationMessage = `Експрес дня: Вашу ставку з коеф. ${expressOfTheDayData.totalOdds.toFixed(2)} на суму ${amount} грн прийнято (MVP).<br>Можливий виграш: ${potentialWin} грн.`;
        eotdBetConfirmationEl.innerHTML = `<div class="info-message success">${confirmationMessage.replace(/\n/g, "<br>")}</div>`;
        
        tgE.HapticFeedback.notificationOccurred('success');
        if (typeof confetti === 'function') { confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, zIndex: 9999 }); }
        
        eotdStakeOptionsEl.classList.add('hidden');
    });
});

displayExpressOfTheDay();