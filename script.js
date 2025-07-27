document.addEventListener("DOMContentLoaded", () => {
    // --- FIREBASE KONFIGURATION ---
    const firebaseConfig = {
      apiKey: "DIN_API_KEY",
      authDomain: "DITT_PROJEKT.firebaseapp.com",
      databaseURL: "https://DITT_PROJEKT-default-rtdb.europe-west1.firebasedatabase.app",
      projectId: "DITT_PROJEKT",
      storageBucket: "DITT_PROJEKT.appspot.com",
      messagingSenderId: "DIN_SENDER_ID",
      appId: "DIN_APP_ID"
    };

    const app = firebase.initializeApp(firebaseConfig);
    const database = firebase.database();

    // --- ELEMENT OCH GRUNDLÄGGANDE STRUKTUR ---
    const loader = document.getElementById('loader');
    const mainContent = document.getElementById('main-content');
    const settingsCog = document.getElementById('settings-cog');
    const settingsModal = document.getElementById('settings-modal');
    const saveSettingsButton = document.getElementById('save-settings-button');
    const intervalDaysInput1 = document.getElementById('interval-days-1');
    const intervalDaysInput2 = document.getElementById('interval-days-2');

    const characters = [
        { id: 1, elements: { image: document.getElementById('character-one'), timer: document.getElementById('timer-one'), button: document.getElementById('complete-button-one'), streak: document.getElementById('streak-counter-one'), intervalInput: intervalDaysInput1 }, state: { countdownInterval: null, targetTime: 0, streakCount: 0, lastDisplayedTime: null, currentState: null, durationDays: 3 } },
        { id: 2, elements: { image: document.getElementById('character-two'), timer: document.getElementById('timer-two'), button: document.getElementById('complete-button-two'), streak: document.getElementById('streak-counter-two'), intervalInput: intervalDaysInput2 }, state: { countdownInterval: null, targetTime: 0, streakCount: 0, lastDisplayedTime: null, currentState: null, durationDays: 4 } }
    ];

    function saveStateToFirebase() {
        const stateToSave = characters.map(char => ({
            targetTime: char.state.targetTime,
            streakCount: char.state.streakCount,
            durationDays: char.state.durationDays
        }));
        database.ref('characters').set(stateToSave);
    }

    function startOrContinueCountdown(character) {
        clearInterval(character.state.countdownInterval);
        character.state.countdownInterval = setInterval(() => {
            const timeRemaining = character.state.targetTime - Date.now();
            if (timeRemaining <= 0) {
                clearInterval(character.state.countdownInterval);
                character.elements.timer.textContent = "TIDEN UTE";
                if(character.state.streakCount > 0) {
                    character.state.streakCount = 0;
                    saveStateToFirebase();
                }
                updateStreakDisplay(character);
                updateCharacterState(character, timeRemaining);
                return;
            }
            formatTime(character, timeRemaining);
            updateCharacterState(character, timeRemaining);
        }, 1000);
    }

    function resetAndStartCountdown(character) {
        character.state.streakCount++;
        const durationInMs = character.state.durationDays * 24 * 60 * 60 * 1000;
        character.state.targetTime = Date.now() + durationInMs;
        updateStreakDisplay(character);
        startOrContinueCountdown(character);
        saveStateToFirebase();
    }

    // --- UPPDATERAD FUNKTION FÖR BILDER ---
    const updateCharacterState = (character, timeLeft) => {
        if (!character.elements.image) return;

        const durationInMs = character.state.durationDays * 24 * 60 * 60 * 1000;
        // Säkerställer att timeLeft inte är negativt
        const positiveTimeLeft = Math.max(0, timeLeft);
        // Beräkna procent av tiden som är kvar (ett värde mellan 1.0 och 0.0)
        const percentage = positiveTimeLeft / durationInMs;

        // Mappa procenten till ett bildnummer från 1 till 7.
        // När tiden går ner (percentage -> 0), går bildnumret upp (-> 7).
        // Vi multiplicerar med 6.999 för att undvika att `floor` ger fel index vid 100%.
        const imageNumber = 7 - Math.floor(percentage * 6.999);

        // Skapa det nya bildnamnet
        const newState = `kanin${imageNumber}`;

        // Uppdatera bara bilden om den har ändrats, för att undvika flimmer
        if (newState !== character.state.currentState) {
            character.elements.image.src = `images/${newState}.png`;
            character.state.currentState = newState;
        }
    };

    const formatTime = (character, ms) => { if (!character.elements.timer) return; const d = Math.floor(ms / (1000 * 60 * 60 * 24)).toString().padStart(2, '0'); const h = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0'); const newTimeText = `${d}:${h}`; if (newTimeText !== character.state.lastDisplayedTime) { character.elements.timer.textContent = newTimeText; character.state.lastDisplayedTime = newTimeText; } };
    const updateStreakDisplay = (character) => { if (!character.elements.streak) return; character.elements.streak.innerHTML = ''; for (let i = 0; i < character.state.streakCount; i++) { const streakBox = document.createElement('div'); streakBox.className = 'streak-box'; character.elements.streak.appendChild(streakBox); } };

    characters.forEach(character => { if (character.elements.button) { character.elements.button.addEventListener('click', () => { resetAndStartCountdown(character); }); } });
    if (settingsCog) { settingsCog.addEventListener('click', () => settingsModal.classList.remove('hidden')); }

    if (saveSettingsButton) {
        saveSettingsButton.addEventListener('click', () => {
            characters.forEach(char => {
                const newDays = parseInt(char.elements.intervalInput.value);
                if (newDays > 0) {
                    char.state.durationDays = newDays;
                    const durationInMs = newDays * 24 * 60 * 60 * 1000;
                    char.state.targetTime = Date.now() + durationInMs;
                    startOrContinueCountdown(char);
                }
            });
            saveStateToFirebase();
            settingsModal.classList.add('hidden');
        });
    }

    function initializeApp() {
        database.ref('characters').on('value', (snapshot) => {
            const savedChars = snapshot.val();
            if (savedChars) {
                characters.forEach((char, index) => {
                    const savedChar = savedChars[index];
                    if (savedChar) {
                        char.state.targetTime = savedChar.targetTime;
                        char.state.streakCount = savedChar.streakCount;
                        char.state.durationDays = savedChar.durationDays || char.state.durationDays;
                        char.elements.intervalInput.value = char.state.durationDays;
                    }
                });
            }

            characters.forEach(character => {
                if (!character.state.targetTime || character.state.targetTime < Date.now()) {
                    if (character.state.streakCount === 0) {
                        const durationInMs = character.state.durationDays * 24 * 60 * 60 * 1000;
                        character.state.targetTime = Date.now() + durationInMs;
                    }
                }
                updateStreakDisplay(character);
                startOrContinueCountdown(character);
            });

            loader.classList.add('hidden');
            mainContent.classList.remove('hidden');
        }, (error) => {
            console.error("Kunde inte läsa från Firebase:", error);
            loader.textContent = "Fel vid anslutning till databasen.";
        });
    }

    initializeApp();
});