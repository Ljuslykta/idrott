document.addEventListener("DOMContentLoaded", () => {
    // Hämta globala element
    const settingsCog = document.getElementById('settings-cog');
    const settingsModal = document.getElementById('settings-modal');
    const saveSettingsButton = document.getElementById('save-settings-button');
    const intervalDaysInput = document.getElementById('interval-days');

    // Skapa en array för att hantera flera karaktärer.
    // Detta gör koden skalbar om du skulle vilja ha fler i framtiden.
    const characters = [
        {
            id: 1,
            imageElement: document.getElementById('character-one'),
            timerElement: document.getElementById('timer-one'),
            buttonElement: document.getElementById('complete-button-one'),
            streakElement: document.getElementById('streak-counter-one'),
            countdownInterval: null,
            streakCount: 0,
        },
        {
            id: 2,
            imageElement: document.getElementById('character-two'),
            timerElement: document.getElementById('timer-two'),
            buttonElement: document.getElementById('complete-button-two'),
            streakElement: document.getElementById('streak-counter-two'),
            countdownInterval: null,
            streakCount: 0,
        }
    ];

    let initialCountdownDuration = parseInt(intervalDaysInput.value) * 24 * 60 * 60 * 1000;

    // Generisk funktion för att uppdatera en karaktärs bild
    const updateCharacterState = (character, timeLeft) => {
        const percentage = timeLeft / initialCountdownDuration;
        if (percentage < 0.25) {
            character.imageElement.src = 'images/state3.png';
        } else if (percentage < 0.75) {
            character.imageElement.src = 'images/state2.png';
        } else {
            character.imageElement.src = 'images/state1.png';
        }
    };

    // Generisk funktion för att starta en nedräkning för en specifik karaktär
    const startCountdown = (character) => {
        clearInterval(character.countdownInterval);
        const targetTime = Date.now() + initialCountdownDuration;

        character.countdownInterval = setInterval(() => {
            const timeRemaining = targetTime - Date.now();

            if (timeRemaining <= 0) {
                clearInterval(character.countdownInterval);
                character.timerElement.textContent = "TIDEN UTE";
                character.streakCount = 0; // Nollställ streak för denna karaktär
                updateStreakDisplay(character);
                updateCharacterState(character, 0);
                return;
            }

            formatTime(character.timerElement, timeRemaining);
            updateCharacterState(character, timeRemaining);
        }, 1000);
    };

    // Generisk funktion för att formatera tid
    const formatTime = (element, ms) => {
        const d = Math.floor(ms / (1000 * 60 * 60 * 24)).toString().padStart(2, '0');
        const h = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0');
        const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
        const s = Math.floor((ms % (1000 * 60)) / 1000).toString().padStart(2, '0');
        element.textContent = `${d}:${h}:${m}:${s}`;
    };

    // Generisk funktion för att uppdatera en karaktärs streak-visning
    const updateStreakDisplay = (character) => {
        character.streakElement.innerHTML = '';
        for (let i = 0; i < character.streakCount; i++) {
            const streakBox = document.createElement('div');
            streakBox.className = 'streak-box';
            character.streakElement.appendChild(streakBox);
        }
    };

    // Koppla händelser till varje karaktär
    characters.forEach(character => {
        character.buttonElement.addEventListener('click', () => {
            character.streakCount++;
            updateStreakDisplay(character);
            startCountdown(character); // Starta om timern för just denna karaktär
        });
    });

    // Händelser för inställningsfönstret
    settingsCog.addEventListener('click', () => settingsModal.classList.remove('hidden'));

    saveSettingsButton.addEventListener('click', () => {
        const days = parseInt(intervalDaysInput.value);
        if (days > 0) {
            initialCountdownDuration = days * 24 * 60 * 60 * 1000;
            settingsModal.classList.add('hidden');
            // Starta om alla timers med de nya inställningarna
            characters.forEach(character => {
                character.streakCount = 0; // Nollställ streaks vid ändring
                updateStreakDisplay(character);
                startCountdown(character);
            });
        }
    });

    // Starta alla timers när sidan laddas
    characters.forEach(character => {
        startCountdown(character);
        updateStreakDisplay(character);
    });
});