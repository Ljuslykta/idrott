document.addEventListener("DOMContentLoaded", () => {
    // --- FIREBASE KONFIGURATION ---
    // Klistra in firebaseConfig-objektet du kopierade från Firebase Console här
const firebaseConfig = {
  apiKey: "AIzaSyCkL0jppz2oQrK6QhvBzpVw_PFtJ5Sokk8",
  authDomain: "idrott-eb871.firebaseapp.com",
  databaseURL: "https://idrott-eb871-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "idrott-eb871",
  storageBucket: "idrott-eb871.firebasestorage.app",
  messagingSenderId: "22564358683",
  appId: "1:22564358683:web:5b0e5fd0c8c49f161446be",
  measurementId: "G-H3DF8TRNDV"
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

    const updateCharacterState = (character, timeLeft) => {
        if (!character.elements.image) return;
        const durationInMs = character.state.durationDays * 24 * 60 * 60 * 1000;
        const percentage = timeLeft / durationInMs;
        let newState = (percentage < 0.25) ? 'state3' : (percentage < 0.75) ? 'state2' : 'state1';
        if (newState !== character.state.currentState) {
            character.elements.image.src = `images/${newState}.png`;
            character.state.currentState = newState;
        }
    };

    const formatTime = (character, ms) => { if (!character.elements.timer) return; const d = Math.floor(ms / (1000 * 60 * 60 * 24)).toString().padStart(2, '0'); const h = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0'); const newTimeText = `${d}:${h}`; if (newTimeText !== character.state.lastDisplayedTime) { character.elements.timer.textContent = newTimeText; character.state.lastDisplayedTime = newTimeText; } };
    const updateStreakDisplay = (character) => { if (!character.elements.streak) return; character.elements.streak.innerHTML = ''; for (let i = 0; i < character.state.streakCount; i++) { const streakBox = document.createElement('div'); streakBox.className = 'streak-box'; character.elements.streak.appendChild(streakBox); } };

    characters.forEach(character => { if (character.elements.button) { character.elements.button.addEventListener('click', () => { resetAndStartCountdown(character); }); } });
    if (settingsCog) { settingsCog.addEventListener('click', () => settingsModal.classList.remove('hidden')); }

    // --- UPPDATERAD HÄNDELSEHANTERARE FÖR SPARA-KNAPPEN ---
    if (saveSettingsButton) {
        saveSettingsButton.addEventListener('click', () => {
            characters.forEach(char => {
                const newDays = parseInt(char.elements.intervalInput.value);
                if (newDays > 0) {
                    // 1. Uppdatera antalet dagar
                    char.state.durationDays = newDays;

                    // 2. Streak-räknaren behålls (rörs ej)

                    // 3. Beräkna den nya sluttiden från och med NU
                    const durationInMs = newDays * 24 * 60 * 60 * 1000;
                    char.state.targetTime = Date.now() + durationInMs;

                    // 4. Starta om den visuella nedräkningen
                    startOrContinueCountdown(char);
                }
            });

            // 5. Spara hela det nya tillståndet till Firebase
            saveStateToFirebase();

            // 6. Göm inställningsfönstret
            settingsModal.classList.add('hidden');
        });
    }

    // --- INITIALISERING (oförändrad) ---
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