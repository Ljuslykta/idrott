document.addEventListener("DOMContentLoaded", () => {

    // Hämta alla nödvändiga element från HTML
    const timerDisplay = document.getElementById('timer-display');
    const completeButton = document.getElementById('complete-button');
    const characterOne = document.getElementById('character-one');
    const characterTwo = document.getElementById('character-two');
    const streakCounter = document.getElementById('streak-counter');
    const settingsCog = document.getElementById('settings-cog');
    const settingsModal = document.getElementById('settings-modal');
    const saveSettingsButton = document.getElementById('save-settings-button');
    const intervalDaysInput = document.getElementById('interval-days');

    let countdownInterval;
    let countdownDuration = parseInt(intervalDaysInput.value) * 24 * 60 * 60 * 1000;
    let streakCount = 0;

    // Funktion för att uppdatera karaktärernas bilder
    const updateCharacterState = (timeLeft) => {
        const percentage = timeLeft / countdownDuration;
        // Byt bilder baserat på hur mycket tid som återstår
        // Du behöver skapa dessa bilder: state1.png, state2.png, state3.png
        if (percentage < 0.25) {
            characterOne.src = 'images/state3.png';
            characterTwo.src = 'images/state3.png';
        } else if (percentage < 0.75) {
            characterOne.src = 'images/state2.png';
            characterTwo.src = 'images/state2.png';
        } else {
            characterOne.src = 'images/state1.png';
            characterTwo.src = 'images/state1.png';
        }
    };

    // Funktion som startar och hanterar nedräkningen
    const startCountdown = () => {
        clearInterval(countdownInterval); // Rensa eventuell gammal timer
        const targetTime = Date.now() + countdownDuration;

        countdownInterval = setInterval(() => {
            const timeRemaining = targetTime - Date.now();

            if (timeRemaining <= 0) {
                clearInterval(countdownInterval);
                timerDisplay.textContent = "TIDEN UTE";
                streakCount = 0; // Nollställ streak
                updateStreakDisplay();
                updateCharacterState(0);
                return;
            }

            // Uppdatera timer-display och karaktärer
            formatTime(timeRemaining);
            updateCharacterState(timeRemaining);

        }, 1000);
    };

    // Formatera millisekunder till DD:HH:MM:SS
    const formatTime = (ms) => {
        const days = Math.floor(ms / (1000 * 60 * 60 * 24)).toString().padStart(2, '0');
        const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0');
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
        const seconds = Math.floor((ms % (1000 * 60)) / 1000).toString().padStart(2, '0');
        timerDisplay.textContent = `${days}:${hours}:${minutes}:${seconds}`;
    };

    // Uppdatera visningen av streak-kuber
    const updateStreakDisplay = () => {
        streakCounter.innerHTML = '';
        for (let i = 0; i < streakCount; i++) {
            const streakBox = document.createElement('div');
            streakBox.className = 'streak-box';
            streakCounter.appendChild(streakBox);
        }
    };

    // Händelse för "Pass Slutfört"-knappen
    completeButton.addEventListener('click', () => {
        streakCount++;
        updateStreakDisplay();
        startCountdown(); // Starta om timern för nästa intervall
    });

    // Händelser för inställningsfönstret
    settingsCog.addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
    });

    saveSettingsButton.addEventListener('click', () => {
        const days = parseInt(intervalDaysInput.value);
        if (days > 0) {
            countdownDuration = days * 24 * 60 * 60 * 1000;
            settingsModal.classList.add('hidden');
            streakCount = 0; // Nollställ streak vid ändring av inställning
            updateStreakDisplay();
            startCountdown();
        }
    });

    // Kör igång allt
    startCountdown();
    updateStreakDisplay();
});