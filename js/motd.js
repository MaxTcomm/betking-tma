// js/motd.js
(function() { // IIFE для ізоляції області видимості
    // Перевірка, чи завантажено DOM для цієї сторінки
    const motdContent = document.getElementById('matchOfTheDayContent');
    if (!motdContent) {
        // console.log('MOTD content not found, script will not run yet.');
        return; 
    }
    // console.log('MOTD script executing.');

    const tgM = window.Telegram.WebApp;

    const matchOfTheDayData = {
        team1: "Динамо Київ",
        team2: "Шахтар Донецьк",
        date: "12 Травня 2025, 19:00",
        odds: {
            p1: { name: "П1", value: 2.50, description: "Перемога Динамо Київ" },
            x:  { name: "X", value: 3.20, description: "Нічия" },
            p2: { name: "П2", value: 2.80, description: "Перемога Шахтар Донецьк" }
        }
    };
    let motdSelectedOdd = null;

    const matchTeamsEl = motdContent.querySelector('#matchTeams');
    const matchDateEl = motdContent.querySelector('#matchDate');
    const oddsContainerEl = motdContent.querySelector('#oddsContainer');
    const motdStakeOptionsEl = motdContent.querySelector('#motdStakeOptions');
    const motdBetConfirmationEl = motdContent.querySelector('#motdBetConfirmation');

    function displayMatchOfTheDay() {
        if (!matchTeamsEl || !matchDateEl || !oddsContainerEl) {
            console.error('MOTD DOM elements not found for display.');
            return;
        }
        matchTeamsEl.textContent = `${matchOfTheDayData.team1} - ${matchOfTheDayData.team2}`;
        matchDateEl.textContent = matchOfTheDayData.date;
        oddsContainerEl.innerHTML = ''; // Очищення перед додаванням нових
        for (const key in matchOfTheDayData.odds) {
            const odd = matchOfTheDayData.odds[key];
            const button = document.createElement('button');
            button.className = 'odds-button';
            button.dataset.key = key;
            button.innerHTML = `${odd.name}<br>${odd.value.toFixed(2)}`;
            button.addEventListener('click', handleMotdOddSelection);
            oddsContainerEl.appendChild(button);
        }
    }

    function handleMotdOddSelection(event) {
        oddsContainerEl.querySelectorAll('.odds-button').forEach(btn => btn.classList.remove('selected'));
        const selectedButton = event.currentTarget;
        selectedButton.classList.add('selected');
        const oddKey = selectedButton.dataset.key;
        motdSelectedOdd = matchOfTheDayData.odds[oddKey];
        
        if (motdStakeOptionsEl) motdStakeOptionsEl.classList.remove('hidden');
        if (motdBetConfirmationEl) motdBetConfirmationEl.innerHTML = '';
    }

    if (motdStakeOptionsEl) { // Перевірка, чи елемент існує перед додаванням обробників
        motdStakeOptionsEl.querySelectorAll('.motd-stake').forEach(button => {
            button.addEventListener('click', function() {
                if (!motdSelectedOdd) {
                    tgM.showAlert('Будь ласка, спочатку оберіть результат матчу дня!');
                    return;
                }
                const amount = parseInt(this.dataset.amount);
                const potentialWin = (amount * motdSelectedOdd.value).toFixed(2);
                const confirmationMessage = `Матч дня: Вашу ставку на "${motdSelectedOdd.description}" (${motdSelectedOdd.name} @${motdSelectedOdd.value.toFixed(2)}) на суму ${amount} грн прийнято (MVP).<br>Можливий виграш: ${potentialWin} грн.`;
                
                if (motdBetConfirmationEl) motdBetConfirmationEl.innerHTML = `<div class="info-message success">${confirmationMessage.replace(/\n/g, "<br>")}</div>`;
                
                tgM.HapticFeedback.notificationOccurred('success');
                if (window.confetti) { // Використовуємо window.confetti
                    window.confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, zIndex: 10000 });
                }
                
                motdStakeOptionsEl.classList.add('hidden');
                if (oddsContainerEl) oddsContainerEl.querySelectorAll('.odds-button').forEach(btn => btn.classList.remove('selected'));
                motdSelectedOdd = null;
            });
        });
    }
    
    displayMatchOfTheDay();
})();