// js/eotd.js
(function() {
    const eotdContent = document.getElementById('expressOfTheDayContent');
    if (!eotdContent) {
        // console.log('EOTD content not found, script will not run yet.');
        return;
    }
    // console.log('EOTD script executing.');

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

    const expressTitleEl = eotdContent.querySelector('#expressTitle');
    const expressSelectionsEl = eotdContent.querySelector('#expressSelections');
    const expressTotalOddsEl = eotdContent.querySelector('#expressTotalOdds');
    const acceptExpressButton = eotdContent.querySelector('#acceptExpressButton');
    const eotdStakeOptionsEl = eotdContent.querySelector('#eotdStakeOptions');
    const eotdBetConfirmationEl = eotdContent.querySelector('#eotdBetConfirmation');

    function displayExpressOfTheDay() {
        if (!expressTitleEl || !expressSelectionsEl || !expressTotalOddsEl) {
            console.error('EOTD DOM elements not found for display.');
            return;
        }
        expressTitleEl.textContent = expressOfTheDayData.title;
        expressSelectionsEl.innerHTML = ''; 
        expressOfTheDayData.selections.forEach(selection => {
            const listItem = document.createElement('li');
            listItem.textContent = selection.description;
            expressSelectionsEl.appendChild(listItem);
        });
        expressTotalOddsEl.textContent = `Загальний коефіцієнт: ${expressOfTheDayData.totalOdds.toFixed(2)}`;
    }

    if (acceptExpressButton) {
        acceptExpressButton.addEventListener('click', function() {
            if (eotdStakeOptionsEl) eotdStakeOptionsEl.classList.remove('hidden');
            if (eotdBetConfirmationEl) eotdBetConfirmationEl.innerHTML = '';
        });
    }

    if (eotdStakeOptionsEl) {
        eotdStakeOptionsEl.querySelectorAll('.eotd-stake').forEach(button => {
            button.addEventListener('click', function() {
                const amount = parseInt(this.dataset.amount);
                const potentialWin = (amount * expressOfTheDayData.totalOdds).toFixed(2);
                const confirmationMessage = `Експрес дня: Вашу ставку з коеф. ${expressOfTheDayData.totalOdds.toFixed(2)} на суму ${amount} грн прийнято (MVP).<br>Можливий виграш: ${potentialWin} грн.`;
                
                if (eotdBetConfirmationEl) eotdBetConfirmationEl.innerHTML = `<div class="info-message success">${confirmationMessage.replace(/\n/g, "<br>")}</div>`;
                
                tgE.HapticFeedback.notificationOccurred('success');
                if (window.confetti) { // Використовуємо window.confetti
                     window.confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, zIndex: 10000 });
                }
                
                eotdStakeOptionsEl.classList.add('hidden');
            });
        });
    }

    displayExpressOfTheDay();
})();