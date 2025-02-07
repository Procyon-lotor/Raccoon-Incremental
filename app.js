document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');

    // Elements
    const scoreElement = document.getElementById('score');
    const ppgDisplay = document.getElementById('ppg-display');
    const upgradeButtonsContainer = document.getElementById('upgrade-buttons-container');
    const autosaveSlider = document.getElementById('autosave-slider');
    const manualSaveButton = document.getElementById('manual-save-button');
    const manualSaveStatus = document.getElementById('manual-save-status');
    const hardResetButton = document.getElementById('hard-reset-button');
    const mainTabContent = document.getElementById('main-tab-content');
    const settingsTabContent = document.getElementById('settings-tab-content');
    const mainTabBtn = document.getElementById('main-tab-btn');
    const settingsTabBtn = document.getElementById('settings-tab-btn');
    const achievementsTabBtn = document.getElementById('achievements-tab-btn');
    const achievementsTabContent = document.getElementById('achievements-tab-content');
    const xpText = document.getElementById('achievement-xp-text');
    const xpFill = document.getElementById('achievement-xp-fill');
    const achievementTier = document.getElementById('achievement-score-tier');
    const requirementText = document.getElementById('achievement-score-requirement');
    const rewardText = document.getElementById('achievement-score-reward');
    const claimButton = document.getElementById('claim-reward-btn');

    // State
    let score = loadScore();
    let passivePointsPerSecond = 1;
    let autosaveInterval = parseInt(localStorage.getItem('autosaveInterval')) || 10000;
    let autosaveTimeout;

    // Initialize achievement state
    let achievementXP = parseInt(localStorage.getItem('achievementXP')) || 0;
    let achievementCompletionTier = parseInt(localStorage.getItem('achievementCompletionTier')) || 0;
    const scoreThresholds = [100, 200, 300, 400, 500];

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
    achievementsTabBtn.addEventListener('click', () => toggleTabs('achievements'));
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
    updateUI();
    updateScoreAchievement();
    
    // Functions
    function updateDisplays() {
        scoreElement.textContent = `Score: ${Math.round(score)}`;
        ppgDisplay.textContent = `Points per second: ${passivePointsPerSecond.toFixed(2)}`;
        updateUpgrade01Description();
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
                    button.style.backgroundColor = '#3fbf3f'; // Green
                }
            }
        });
    }

    function applyStoredEffects() {
        const purchasedUpgrades = JSON.parse(localStorage.getItem('purchasedUpgrades')) || [];
        if (purchasedUpgrades.includes('upgrade-00')) {
            passivePointsPerSecond *= 2; // Apply Upgrade 00 effect
        }

        if (purchasedUpgrades.includes('upgrade-01')) {
            passivePointsPerSecond *= Math.pow(score, 0.2); // Apply Upgrade 01 effect
        }
    }

    function updatePPG() {
        let calculatedPPG = 1;
        const purchasedUpgrades = JSON.parse(localStorage.getItem('purchasedUpgrades')) || [];
        if (purchasedUpgrades.includes('upgrade-00')) {
            calculatedPPG *= 2;
        }
        if (purchasedUpgrades.includes('upgrade-01')) {
            calculatedPPG *= Math.pow(score, 0.2);
        }
        calculatedPPG *= Math.pow(1.5, achievementCompletionTier);
        passivePointsPerSecond = calculatedPPG;
        updateDisplays();
    }

    function updateUpgrade01Description() {
        const multiplierElement = document.getElementById('multiplier-value');
        if (multiplierElement) {
            let multiplier = Math.max(Math.pow(score, 0.2), 1).toFixed(2);
            multiplierElement.textContent = `${multiplier}`;
        }
    }

    function handleUpgradePurchase(upgrade, button) {
        const cost = parseFloat(button.dataset.cost);
        if (score >= cost) {
            score -= cost;
            saveScore();
            passivePointsPerSecond = upgrade.effect.updatePPG(passivePointsPerSecond);

            let purchasedUpgrades = JSON.parse(localStorage.getItem('purchasedUpgrades')) || [];
            if (!purchasedUpgrades.includes(upgrade.id)) {
                purchasedUpgrades.push(upgrade.id);
                localStorage.setItem('purchasedUpgrades', JSON.stringify(purchasedUpgrades));
            }

            if (upgrade.id === 'upgrade-00') {
                localStorage.setItem('multiplierUpgrade00', '2');
            }

            button.disabled = true;
            button.style.backgroundColor = '#3fbf3f'; // Green
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
        achievementsTabContent.style.display = tab === 'achievements' ? 'block' : 'none';
    }

    function showPopup(message, color = 'yellow') {  // Default to yellow
        const popupContainer = document.getElementById('popup-container');
        const popup = document.createElement('div');
        popup.classList.add('popup-message');
        popup.textContent = message;
        
        // Set the color dynamically based on the parameter
        popup.style.backgroundColor = color;
    
        // Remove popup when clicked
        popup.addEventListener('click', () => {
            popup.style.opacity = '0';
            setTimeout(() => popup.remove(), 300);
        });
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            popup.style.opacity = '0';
            setTimeout(() => popup.remove(), 300);
        }, 5000);
        
        popupContainer.appendChild(popup);
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
            const currentTime = new Date().toLocaleString();
            console.log(`Game autosaved at ${currentTime}`);
        }, autosaveInterval);
    }

    function manualSave() {
        saveScore();
        console.log('Game manually saved');
        manualSaveStatus.textContent = '';
        showPopup('Game saved!', '#6f9fbf'); // Pass the color for the manual save pop-up
        setTimeout(() => {
            manualSaveStatus.textContent = ''; // Hide status after 2 seconds
        }, 2000);
    }
    

    function hardReset() {
        if (confirm('Are you sure you want to reset the game?')) {
            localStorage.clear();
            score = 0;
            passivePointsPerSecond = 1;
            achievementXP = 0; // Reset achievement XP
            achievementCompletionTier = 0; // Reset achievement tier
            updateDisplays();
            document.querySelectorAll('.upgrade-btn').forEach(button => {
                button.disabled = false;
                button.style.backgroundColor = '';
            xpText.textContent = `${achievementXP} / 100 XP`;
            xpFill.style.width = '0%';
            achievementTier.textContent = `${achievementCompletionTier} / 5`;
            requirementText.textContent = `$${Math.round(score)} / ${scoreThresholds[achievementCompletionTier - 1] || 500}`;
        
            // Reset claim button state
            claimButton.disabled = true;
            });
        }
    }

    function updateUI() {
        console.log(`XP Percentage: ${(achievementXP / 100) * 100}%`);
        xpText.textContent = `${achievementXP} / 100 XP`;
        xpFill.style.width = `${(achievementXP / 100) * 100}%`; // Dynamically adjust the width based on XP progress
        achievementTier.textContent = `${achievementCompletionTier} / 5`;
        
        const requirement = scoreThresholds[achievementCompletionTier - 1] || 500;
        requirementText.textContent = `${Math.round(score)} / ${requirement}`;
        
        checkClaimReward();
    }
    
    function updateScoreAchievement() {
        xpText.textContent = `${achievementXP} / 100 XP`;
        xpFill.style.width = `${(achievementXP / 100) * 100}%`; // Dynamically adjust the width based on XP progress
        achievementTier.textContent = `${achievementCompletionTier} / 5`; // Display current tier
        requirementText.textContent = `${Math.round(score)} / ${scoreThresholds[achievementCompletionTier] || 500}`;
        rewardText.textContent = `${Math.pow(1.5, achievementCompletionTier).toFixed(2)}x Points)`;
        checkClaimReward();
    }

    function checkClaimReward() {
        console.log(`Achievement XP: ${achievementXP}, Required XP: ${scoreThresholds[achievementCompletionTier - 1]}, Tier: ${achievementCompletionTier}`);
    
        // Get the last shown tier from localStorage or default to an empty object
        let shownTiers = JSON.parse(localStorage.getItem('shownTiers')) || {};
    
        if (achievementCompletionTier >= 5) {
            claimButton.disabled = true;
        } else {
            if (score >= scoreThresholds[achievementCompletionTier]) {
                claimButton.disabled = false;
    
                // Check if the pop-up has been shown for this tier
                if (!shownTiers[achievementCompletionTier]) {
                    showPopup(`Achievement Completed! Score Master: Tier ${achievementCompletionTier + 1}`);
                    // Mark the pop-up as shown for this tier
                    shownTiers[achievementCompletionTier] = true;
                    // Save the updated state to localStorage
                    localStorage.setItem('shownTiers', JSON.stringify(shownTiers));
                }
            } else {
                claimButton.disabled = true;
            }
        }
    }
    
    function claimReward() {
        if (achievementCompletionTier < 5) {
            achievementCompletionTier++; // Increment tier on button click
            localStorage.setItem('achievementCompletionTier', achievementCompletionTier); // Save to local storage
            achievementXP += 10; // Award XP
            localStorage.setItem('achievementXP', achievementXP); // Save XP
            updateScoreAchievement(); // Update the UI to show new tier
            updateUI(); // Update the XP bar after XP is awarded
        }
    }
    
    claimButton.addEventListener('click', claimReward);
    updateScoreAchievement(); // Ensure it's called on DOM load
    updateUI(); // Ensure it's called on DOM load
    
    // Increment score by PPG every second
    function incrementScore() {
        setInterval(() => {
            score += passivePointsPerSecond;
            saveScore();
            updateDisplays();
            updatePPG();
            updateScoreAchievement(); // Ensure it’s updated when score changes
        }, 1000);
    }
});    