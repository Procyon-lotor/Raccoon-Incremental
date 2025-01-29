document.addEventListener('DOMContentLoaded', () => {
    const scoreElement = document.getElementById('score');  // The element to display the score
    const updateButton = document.getElementById('update-button'); // The update button

    // Function to load the score from localStorage
    function loadScore() {
        const savedScore = localStorage.getItem('playerScore');
        return savedScore !== null ? parseInt(savedScore) : 0;
    }

    // Set the score in localStorage and update UI
    function saveScore(score) {
        localStorage.setItem('playerScore', score);
        scoreElement.textContent = `Score: ${score}`;  // Update UI immediately after saving
        console.log(`Game saved: Score is now ${score}`);
    }

    // Initialize the score from localStorage
    let score = loadScore();
    scoreElement.textContent = `Score: ${score}`;  // Display the score on page load

    // Event listener to update the score (e.g., when a button is clicked)
    if (updateButton) {
        updateButton.addEventListener('click', () => {
            score += 1;  // Increment the score by 1
            scoreElement.textContent = `Score: ${score}`;  // Just update the UI, no save here
        });
    }

    // Tab switching logic
    const mainTabContent = document.getElementById('main-tab-content');
    const settingsTabContent = document.getElementById('settings-tab-content');

    const mainTabBtn = document.getElementById('main-tab-btn');
    const settingsTabBtn = document.getElementById('settings-tab-btn');

    // Hide settings content, show main content on default
    mainTabContent.style.display = 'block';
    settingsTabContent.style.display = 'none';

    mainTabBtn.addEventListener('click', () => {
        mainTabContent.style.display = 'block';
        settingsTabContent.style.display = 'none';
        updateButton.style.display = 'block';  // Show update button on Main tab
    });

    settingsTabBtn.addEventListener('click', () => {
        mainTabContent.style.display = 'none';
        settingsTabContent.style.display = 'block';
        updateButton.style.display = 'none';  // Hide update button on Settings tab
    });

    // Initialize the autosave setting (as you already implemented in the previous steps)
    let autosaveInterval = localStorage.getItem('autosaveInterval') || 10000;  // Default to 10 seconds
    let autosaveTimeout;

    // Function to update autosave interval
    function updateAutosaveTime(value) {
        const times = [5000, 10000, 30000, 60000];  // Time in milliseconds: 5s, 10s, 30s, 60s
        autosaveInterval = times[value - 1]; // Slider value is 1 to 4
        localStorage.setItem('autosaveInterval', autosaveInterval);
        document.getElementById('autosave-time').textContent = `${times[value - 1] / 1000} seconds`;
        clearInterval(autosaveTimeout);  // Clear previous timeout
        startAutosave();  // Restart autosave with new interval
    }

    // Function to simulate saving the game (you can replace this with your actual save function)
    function saveGame() {
        console.log("Game saved at", new Date());
        saveScore(score); // Save the score during autosave
    }

    // Function to start the autosave process
    function startAutosave() {
        autosaveTimeout = setInterval(saveGame, autosaveInterval);
    }

    // Initialize autosave functionality
    startAutosave();

    // Event listener for the slider to update autosave interval
    const autosaveSlider = document.getElementById('autosave-slider');
    autosaveSlider.addEventListener('input', (event) => {
        updateAutosaveTime(event.target.value);
    });

    // Set the initial slider position based on the current interval
    const initialIndex = [5000, 10000, 30000, 60000].indexOf(parseInt(autosaveInterval));
    if (initialIndex !== -1) {
        autosaveSlider.value = initialIndex + 1; // Slider value: 1 to 4
    }

    const manualSaveButton = document.getElementById('manual-save-button');
    const manualSaveStatus = document.getElementById('manual-save-status');

    if (manualSaveButton) {
        manualSaveButton.addEventListener('click', () => {
            saveScore(score);  // Manually save the game score
            manualSaveStatus.textContent = '';  // Notify the user
        });
    }

    // Event listener for the hard reset button
    const hardResetButton = document.getElementById('hard-reset-button');
    if (hardResetButton) {
        hardResetButton.addEventListener('click', () => {
            // Prompt the player for confirmation
            if (confirm('Are you sure you want to reset the game? This will reset your score to 0 and any progress will be lost.')) {
                // Reset score and other game state
                localStorage.setItem('playerScore', 0);  // Reset score to 0
                score = 0;
                scoreElement.textContent = `Score: ${score}`;  // Update UI to reflect the reset

                // Optionally log to the console for debugging
                console.log('Game has been reset.');
            }
        });
    }
});
