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

    // Initiera Firebase
    const app = firebase.initializeApp(firebaseConfig);
    const database = firebase.database();

    // --- ELEMENT OCH GRUNDLÄGGANDE STRUKTUR ---
    const loader = document.getElementById('loader');
    const mainContent = document.getElementById('main-content');
    const settingsCog = document.getElementById('settings-cog');
    const settingsModal = document.getElementById('settings-modal');
    const saveSettingsButton = document.getElementById('save-settings-button');
    const intervalDaysInput = document.getElementById('interval-days');

    // Samma struktur som förut
    const characters = [
        { id: 1, elements: { image: document.getElementById('character-one'), timer: document.getElementById('timer-one'), button: document.getElementById('complete-button-one'), streak: document.getElementById('streak-counter-one') }, state: { countdownInterval: null, targetTime: 0, streakCount: 0, lastDisplayedTime: null, currentState: null } },
        { id: 2, elements: { image: document.getElementById('character-two'), timer: document.getElementById('timer-two'), button: document.getElementById('complete-button-two'), streak: document.getElementById('streak-counter-two') }, state: { countdownInterval: null, targetTime: 0, streakCount: 0, lastDisplayedTime: null, currentState: null } }
    ];
    let countdownDuration = parseInt(intervalDaysInput.value) * 24 * 60 * 60 * 1000;

    // --- FUNKTION FÖR ATT SPARA DATA TILL FIREBASE ---
    function saveStateToFirebase() {
        const stateToSave = characters.map(char => ({
            targetTime: char.state.targetTime,
            streakCount: char.state.streakCount
        }));
        // Spara karaktärsdata under "sökvägen" /characters
        database.ref('characters').set(stateToSave);
    }

    // --- UPPDATERADE KÄRNFUNKTIONER ---
    function startOrContinueCountdown(character) {
        clearInterval(character.state.countdownInterval);
        character.state.countdownInterval = setInterval(() => {
            const timeRemaining = character.state.targetTime - Date.now();
            if (timeRemaining <= 0) {
                clearInterval(character.state.countdownInterval);
                character.elements.timer.textContent = "TIDEN UTE";
                if(character.state.streakCount > 0) { // Nollställ bara om den inte redan är noll
                    character.state.streakCount = 0;
                    saveStateToFirebase(); // Spara ändringen
                }
                updateStreakDisplay(character);
                updateCharacterState(character, 0);
                return;
            }
            formatTime(character, timeRemaining);
            updateCharacterState(character, timeRemaining);
        }, 1000);
    }

    function resetAndStartCountdown(character) {
        character.state.streakCount++;
        character.state.targetTime = Date.now() + countdownDuration;
        updateStreakDisplay(character);
        startOrContinueCountdown(character);
        saveStateToFirebase();
    }

    // Funktionerna nedan är oförändrade...
    const updateCharacterState = (character, timeLeft) => { if (!character.elements.image) return; const percentage = timeLeft / countdownDuration; let newState = (percentage < 0.25) ? 'state3' : (percentage < 0.75) ? 'state2' : 'state1'; if (newState !== character.state.currentState) { character.elements.image.src = `images/${newState}.png`; character.state.currentState = newState; } };
    const formatTime = (character, ms) => { if (!character.elements.timer) return; const d = Math.floor(ms / (1000 * 60 * 60 * 24)).toString().padStart(2, '0'); const h = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0'); const newTimeText = `${d}:${h}`; if (newTimeText !== character.state.lastDisplayedTime) { character.elements.timer.textContent = newTimeText; character.state.lastDisplayedTime = newTimeText; } };
    const updateStreakDisplay = (character) => { if (!character.elements.streak) return; character.elements.streak.innerHTML = ''; for (let i = 0; i < character.state.streakCount; i++) { const streakBox = document.createElement('div'); streakBox.className = 'streak-box'; character.elements.streak.appendChild(streakBox); } };

    // --- HÄNDELSEHANTERARE (nästan oförändrade) ---
    characters.forEach(character => { if (character.elements.button) { character.elements.button.addEventListener('click', () => { resetAndStartCountdown(character); }); } });
    if (settingsCog) { settingsCog.addEventListener('click', () => settingsModal.classList.remove('hidden')); }
    if (saveSettingsButton) {
        saveSettingsButton.addEventListener('click', () => {
            const days = parseInt(intervalDaysInput.value);
            if (days > 0) {
                // Spara inställningen till databasen
                database.ref('settings/countdownDurationDays').set(days);
                settingsModal.classList.add('hidden');
            }
        });
    }

    // --- INITIALISERING VID SIDLADDNING ---
    function initializeApp() {
        // Lyssna på ändringar i databasen i realtid
        database.ref().on('value', (snapshot) => {
            const data = snapshot.val();

            // Om det finns data i databasen
            if (data) {
                // Hämta sparade inställningar
                if (data.settings && data.settings.countdownDurationDays) {
                    const savedDays = data.settings.countdownDurationDays;
                    intervalDaysInput.value = savedDays;
                    countdownDuration = parseInt(savedDays) * 24 * 60 * 60 * 1000;
                }

                // Hämta sparad karaktärsdata
                if(data.characters) {
                    characters.forEach((char, index) => {
                        const savedChar = data.characters[index];
                        if (savedChar) {
                            char.state.targetTime = savedChar.targetTime;
                            char.state.streakCount = savedChar.streakCount;
                        }
                    });
                }
            }

            // Starta eller fortsätt timers baserat på datan vi nu har
            characters.forEach(character => {
                if (!character.state.targetTime || character.state.targetTime < Date.now()) {
                    if (character.state.streakCount === 0) { // Starta bara en helt ny om den inte har någon aktiv timer
                        character.state.targetTime = Date.now() + countdownDuration;
                    }
                }
                updateStreakDisplay(character);
                startOrContinueCountdown(character);
            });

            // Datan har laddats, visa huvudinnehållet och dölj laddaren
            loader.classList.add('hidden');
            mainContent.classList.remove('hidden');
        });
    }

    initializeApp();
});