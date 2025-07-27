document.addEventListener("DOMContentLoaded", () => {
    // Hämta globala element
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

    const updateCharacterState = (character, timeLeft) => {
        if (!character.imageElement) return; // Säkerhetskoll
        const percentage = timeLeft / initialCountdownDuration;
        const basePath = 'images/'; // Definiera sökvägen till bilderna
        if (percentage < 0.25) {
            character.imageElement.src = `${basePath}state3.png`;
        } else if (percentage < 0.75) {
            character.imageElement.src = `${basePath}state2.png`;
        } else {
            character.imageElement.src = `${basePath}state1.png`;
        }
    };

    const startCountdown = (character) => {
        clearInterval(character.countdownInterval);
        const targetTime = Date.now() + initialCountdownDuration;

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

            if (character.timerElement) {
                formatTime(character.timerElement, timeRemaining);
            }
            updateCharacterState(character, timeRemaining);
        }, 1000);
    };

    const formatTime = (element, ms) => {
        const d = Math.floor(ms / (1000 * 60 * 60 * 24)).toString().padStart(2, '0');
        const h = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0');
        const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
        const s = Math.floor((ms % (1000 * 60)) / 1000).toString().padStart(2, '0');
        element.textContent = `${d}:${h}:${m}:${s}`;
    };

    const updateStreakDisplay = (character) => {
        if (!character.streakElement) return; // Säkerhetskoll
        character.streakElement.innerHTML = '';
        for (let i = 0; i < character.streakCount; i++) {
            const streakBox = document.createElement('div');
            streakBox.className = 'streak-box';
            character.streakElement.appendChild(streakBox);
        }
    };

    characters.forEach(character => {
        // Kontrollera att knappen finns innan du lägger till en event listener
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

    // Starta allt när sidan laddas
    characters.forEach(character => {
        // Kontrollera att vi faktiskt har en karaktär att starta
        if (character && character.timerElement) {
            startCountdown(character);
            updateStreakDisplay(character);
        } else {
            console.error(`Kunde inte initiera karaktär med id: ${character.id}. Kontrollera HTML-elementens ID:n.`);
        }
    });
});