document.addEventListener("DOMContentLoaded", () => {
    const settingsCog = document.getElementById('settings-cog');
    const settingsModal = document.getElementById('settings-modal');
    const saveSettingsButton = document.getElementById('save-settings-button');
    const intervalDaysInput = document.getElementById('interval-days');

    const characters = [
        {
            id: 1,
            imageElement: document.getElementById('character-one'),
            timerElement: document.getElementById('timer-one'),
            buttonElement: document.getElementById('complete-button-one'),
            streakElement: document.getElementById('streak-counter-one'),
            countdownInterval: null,
            streakCount: 0,
            lastDisplayedTime: null,
            currentState: null // <<< NY EGENSKAP
        },
        {
            id: 2,
            imageElement: document.getElementById('character-two'),
            timerElement: document.getElementById('timer-two'),
            buttonElement: document.getElementById('complete-button-two'),
            streakElement: document.getElementById('streak-counter-two'),
            countdownInterval: null,
            streakCount: 0,
            lastDisplayedTime: null,
            currentState: null // <<< NY EGENSKAP
        }
    ];

    let initialCountdownDuration = parseInt(intervalDaysInput.value) * 24 * 60 * 60 * 1000;

    // --- HELT OMARBETAD FUNKTION ---
    // Denna funktion uppdaterar nu bara bilden om tillståndet ändras
    const updateCharacterState = (character, timeLeft) => {
        if (!character.imageElement) return;

        const percentage = timeLeft / initialCountdownDuration;
        let newState;

        // 1. Räkna ut vilket tillstånd som borde gälla
        if (percentage < 0.25) {
            newState = 'state3';
        } else if (percentage < 0.75) {
            newState = 'state2';
        } else {
            newState = 'state1';
        }

        // 2. Jämför med nuvarande tillstånd. Uppdatera BARA om det är en ändring.
        if (newState !== character.currentState) {
            const basePath = 'images/';
            character.imageElement.src = `${basePath}${newState}.png`;
            character.currentState = newState; // Kom ihåg det nya tillståndet
            // console.log(`Karaktär ${character.id} ändrade tillstånd till: ${newState}`); // För felsökning
        }
    };

    const startCountdown = (character) => {
        clearInterval(character.countdownInterval);
        const targetTime = Date.now() + initialCountdownDuration;
        character.lastDisplayedTime = null; // Nollställ vid omstart
        character.currentState = null; // Nollställ vid omstart

        character.countdownInterval = setInterval(() => {
            const timeRemaining = targetTime - Date.now();

            if (timeRemaining <= 0) {
                clearInterval(character.countdownInterval);
                if (character.timerElement) {
                    character.timerElement.textContent = "TIDEN UTE";
                }
                character.streakCount = 0;
                updateStreakDisplay(character);
                updateCharacterState(character, 0);
                return;
            }

            formatTime(character, timeRemaining);
            updateCharacterState(character, timeRemaining); // Denna är nu säker att kalla varje sekund
        }, 1000);
    };

    const formatTime = (character, ms) => {
        if (!character.timerElement) return;
        const d = Math.floor(ms / (1000 * 60 * 60 * 24)).toString().padStart(2, '0');
        const h = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0');
        const newTimeText = `${d}:${h}`;

        if (newTimeText !== character.lastDisplayedTime) {
            character.timerElement.textContent = newTimeText;
            character.lastDisplayedTime = newTimeText;
        }
    };

    const updateStreakDisplay = (character) => {
        if (!character.streakElement) return;
        character.streakElement.innerHTML = '';
        for (let i = 0; i < character.streakCount; i++) {
            const streakBox = document.createElement('div');
            streakBox.className = 'streak-box';
            character.streakElement.appendChild(streakBox);
        }
    };

    characters.forEach(character => {
        if (character.buttonElement) {
            character.buttonElement.addEventListener('click', () => {
                character.streakCount++;
                updateStreakDisplay(character);
                startCountdown(character);
            });
        }
    });

    if (settingsCog && settingsModal) {
        settingsCog.addEventListener('click', () => settingsModal.classList.remove('hidden'));
    }

    if (saveSettingsButton && settingsModal) {
        saveSettingsButton.addEventListener('click', () => {
            const days = parseInt(intervalDaysInput.value);
            if (days > 0) {
                initialCountdownDuration = days * 24 * 60 * 60 * 1000;
                settingsModal.classList.add('hidden');
                characters.forEach(character => {
                    character.streakCount = 0;
                    updateStreakDisplay(character);
                    startCountdown(character);
                });
            }
        });
    }

    characters.forEach(character => {
        if (character && character.timerElement) {
            startCountdown(character);
            updateStreakDisplay(character);
        } else {
            console.error(`Kunde inte initiera karaktär med id: ${character.id}. Kontrollera HTML-elementens ID:n.`);
        }
    });
});