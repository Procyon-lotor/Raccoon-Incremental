document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');

    // Elements
    const scoreElement = document.getElementById('score');
    const ppgDisplay = document.getElementById('ppg-display');
    const upgradeButtonsContainer = document.getElementById('upgrade-buttons-container'); // Ensure this ID is correct
    const autosaveSlider = document.getElementById('autosave-slider');
    const manualSaveButton = document.getElementById('manual-save-button');
    const manualSaveStatus = document.getElementById('manual-save-status');
    const hardResetButton = document.getElementById('hard-reset-button');
    const mainTabContent = document.getElementById('main-tab-content');
    const settingsTabContent = document.getElementById('settings-tab-content');
    const mainTabBtn = document.getElementById('main-tab-btn');
    const settingsTabBtn = document.getElementById('settings-tab-btn');

    // State
    let score = loadScore();
    let passivePointsPerSecond = 1; // Initial PPG should start at 1, not 2
    let autosaveInterval = parseInt(localStorage.getItem('autosaveInterval')) || 10000;
    let autosaveTimeout;

    // Setup
    mainTabContent.style.display = 'block';
    settingsTabContent.style.display = 'none';

    // Existing Upgrade Data
    const upgrades = [
        { id: 'upgrade-00', cost: 10, effect: { name: 'First Upgrade', description: 'Double your PPG.', updatePPG: (ppg) => ppg * 2 } },
        { id: 'upgrade-01', cost: 40, effect: { name: 'Second Upgrade', description: 'Increase PPG by current points^0.2.', updatePPG: (ppg) => ppg * Math.max(Math.pow(score, 0.2), 1) } }
    ];

    // Event Listeners
    mainTabBtn.addEventListener('click', () => toggleTabs('main'));
    settingsTabBtn.addEventListener('click', () => toggleTabs('settings'));
    autosaveSlider.addEventListener('input', updateAutosaveTime);
    manualSaveButton?.addEventListener('click', manualSave);
    hardResetButton?.addEventListener('click', hardReset);

    // Initial Setup
    updateDisplays();
    startAutosave();
    loadUpgradeButtons();
    loadPurchasedUpgrades();
    applyStoredEffects();
    incrementScore();

    // Functions
    function updateDisplays() {
        scoreElement.textContent = `Score: ${Math.round(score)}`;
        ppgDisplay.textContent = `Points per second: ${passivePointsPerSecond.toFixed(2)}`;
    }

    function saveScore() {
        localStorage.setItem('playerScore', score);
    }

    function loadScore() {
        return parseFloat(localStorage.getItem('playerScore')) || 0;
    }

    function loadUpgradeButtons() {
        upgrades.forEach(upgrade => {
            const button = document.getElementById(upgrade.id);
            if (button) {
                button.dataset.cost = upgrade.cost;
                button.addEventListener('click', () => handleUpgradePurchase(upgrade, button));
            }
        });
    }

    function loadPurchasedUpgrades() {
        const purchasedUpgrades = JSON.parse(localStorage.getItem('purchasedUpgrades')) || [];
        upgrades.forEach(upgrade => {
            if (purchasedUpgrades.includes(upgrade.id)) {
                const button = document.getElementById(upgrade.id);
                if (button) {
                    button.disabled = true;
                    button.style.backgroundColor = '#3fff3f'; // Green
                }
            }
        });
    }

    // Apply stored effects from previous sessions
    function applyStoredEffects() {
        // Check if Upgrade 00 was purchased, and apply its effect only once
        const purchasedUpgrades = JSON.parse(localStorage.getItem('purchasedUpgrades')) || [];
        if (purchasedUpgrades.includes('upgrade-00')) {
            // Apply the multiplier effect for Upgrade 00 after purchase (multiply by 2)
            passivePointsPerSecond *= 2; // Only apply once after purchase
        }

        // Check if Upgrade 01 was purchased, and apply its effect dynamically based on current score
        if (purchasedUpgrades.includes('upgrade-01')) {
            // Dynamically calculate PPG multiplier for Upgrade 01 based on current score
            passivePointsPerSecond *= Math.pow(score, 0.2);
        }
    }

    // Function to update PPG based on current score
    function updatePPG() {
        // Start with the base PPG (1 point per second)
        let calculatedPPG = 1; 

        // Check if Upgrade 00 is purchased (doubles the PPG)
        const purchasedUpgrades = JSON.parse(localStorage.getItem('purchasedUpgrades')) || [];
        if (purchasedUpgrades.includes('upgrade-00')) {
            calculatedPPG *= 2;  // Upgrade 00: Double the PPG
        }

        // Check if Upgrade 01 is purchased (multiplies PPG by score^0.2)
        if (purchasedUpgrades.includes('upgrade-01')) {
            calculatedPPG *= Math.pow(score, 0.2);  // Upgrade 01: Multiply by score^0.2
        }

        // Set the new passive points per second (PPG)
        passivePointsPerSecond = calculatedPPG;

        // Update the display for PPG
        updateDisplays();
    }
    
    // Function to update the multiplier in the description for Upgrade 01
    function updateUpgrade01Description() {
        const multiplierSpan = document.getElementById('multiplier-value');  // Target the <span> with the multiplier
        if (score > 0) {  // Check if the score is valid and greater than 0
        const multiplier = Math.pow(score, 0.2);  // Calculate the multiplier based on the current score
        multiplierSpan.textContent = multiplier.toFixed(2);  // Set the multiplier value dynamically
                } else {
                    multiplierSpan.textContent = "N/A";  // If score is not valid, display "N/A"
                }
            }
    
            // Update the description when the page loads
            updateUpgrade01Description();
    
            // If you need to update it again (e.g., after the score changes), call the function
            // updateUpgrade01Description(); // You can call this wherever necessary in your code
    function handleUpgradePurchase(upgrade, button) {
        const cost = parseFloat(button.dataset.cost);
        if (score >= cost) {
            // Deduct cost and update score
            score -= cost;
            saveScore();
    
            // Apply upgrade effect (e.g., increase PPG)
            passivePointsPerSecond = upgrade.effect.updatePPG(passivePointsPerSecond);
    
            // Save the upgrade status (just store that it was purchased)
            let purchasedUpgrades = JSON.parse(localStorage.getItem('purchasedUpgrades')) || [];
            if (!purchasedUpgrades.includes(upgrade.id)) {
                purchasedUpgrades.push(upgrade.id);
                localStorage.setItem('purchasedUpgrades', JSON.stringify(purchasedUpgrades));
            }
    
            // Save the purchased upgrade in localStorage (no multiplier for Upgrade 01)
            if (upgrade.id === 'upgrade-00') {
                localStorage.setItem('multiplierUpgrade00', '2');
            }
    
            // Disable the button and mark it as purchased
            button.disabled = true;
            button.style.backgroundColor = '#3fff3f'; // Green
    
            // Update the description with the new multiplier
            updateUpgradeDescription();
        } else {
            flashButtonRed(button);
        }
        updateDisplays();
    }    

    function flashButtonRed(button) {
        button.style.backgroundColor = '#ff3f3f';
        setTimeout(() => button.style.backgroundColor = '', 200);
    }

    function toggleTabs(tab) {
        mainTabContent.style.display = tab === 'main' ? 'block' : 'none';
        settingsTabContent.style.display = tab === 'settings' ? 'block' : 'none';
    }

    function updateAutosaveTime(event) {
        const times = [5000, 10000, 30000, 60000];
        autosaveInterval = times[event.target.value - 1];
        localStorage.setItem('autosaveInterval', autosaveInterval);
        document.getElementById('autosave-time').textContent = `${autosaveInterval / 1000} seconds`;
        clearInterval(autosaveTimeout);
        startAutosave();
    }

    function startAutosave() {
        console.log('Autosave started');
        autosaveTimeout = setInterval(() => {
            saveScore();
            const currentTime = new Date().toLocaleString();  // Get the current date and time
            console.log(`Game autosaved at ${currentTime}`);
        }, autosaveInterval);
    }    
    

    function manualSave() {
        saveScore();
        console.log('Game manually saved');
        manualSaveStatus.textContent = 'Game saved!';
        setTimeout(() => {
            manualSaveStatus.textContent = ''; // Hide status after 2 seconds
        }, 2000);
    }
    
    
    function hardReset() {
        if (confirm('Are you sure you want to reset the game?')) {
            localStorage.clear();
            score = 0;
            passivePointsPerSecond = 1;
            updateDisplays();
            document.querySelectorAll('.upgrade-btn').forEach(button => {
                button.disabled = false;
                button.style.backgroundColor = '';
            });
        }
    }

    // Increment score by PPG every second
    function incrementScore() {
        setInterval(() => {
            score += passivePointsPerSecond;
            saveScore();
            updateDisplays();
            updatePPG();
            updateUpgrade01Description();
        }, 1000);
    }
});
