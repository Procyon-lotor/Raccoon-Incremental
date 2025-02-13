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
    let numUpgrades = parseInt(localStorage.getItem('numUpgrades')) || 0;
    const upgrades = [
        { id: 'upgrade-00', cost: 10, effect: { name: 'First Upgrade', description: 'Double your PPG.', updatePPG: (ppg) => ppg * 2 } },
        { id: 'upgrade-01', cost: 40, effect: { name: 'Second Upgrade', description: 'Increase PPG by current points^0.2.', updatePPG: (ppg) => ppg * Math.max(Math.pow(score, 0.2), 1) } },
        { id: 'upgrade-02', cost: 300, effect: { name: 'Third Upgrade', description: 'Increase PPG based on number of upgrades purchased in this row.', updatePPG: (ppg) => ppg * Math.pow(numUpgrades, 0.5) + 1}},
        { id: 'upgrade-03', cost: 1000, effect: { name: 'Fourth Upgrade', description: 'Increase PPG based on total achievement completion tiers.', updatePPG: (ppg) => ppg * Math.pow(1.2, achievementCompletionTier)}}
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
        updateUpgrade02Description();
        updateUpgrade03Description();
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

        if (purchasedUpgrades.includes('upgrade-02')) {
            passivePointsPerSecond *= Math.pow(numUpgrades, 0.5) + 1;
        }

        if (purchasedUpgrades.includes('upgrade-03')) {
            passivePointsPerSecond *= Math.pow(1.2, achievementCompletionTier);
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
        if (purchasedUpgrades.includes('upgrade-02')) {
            calculatedPPG *= Math.pow(numUpgrades, 0.5) + 1;
        }
        if (purchasedUpgrades.includes('upgrade-03')) {
            calculatedPPG *= Math.pow(1.2, achievementCompletionTier);
        }
        calculatedPPG *= Math.pow(1.5, achievementCompletionTier);
    
        // Get the total multiplier from the fish types
        const fishMultiplier = calculateMultipliers();  // This is now a single value
    
        // Apply the fish multiplier
        calculatedPPG *= fishMultiplier;
    
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

    function updateUpgrade02Description() {
        const multiplierElement02 = document.getElementById('multiplier-value-02');
        if (multiplierElement02) {
            let multiplier02 = (Math.pow(numUpgrades, 0.5) + 1).toFixed(2);
            multiplierElement02.textContent = `${multiplier02}`;
        }
    }

    function updateUpgrade03Description() {
        const multiplierElement03 = document.getElementById('multiplier-value-03');
        if (multiplierElement03) {
            let multiplier03 = (Math.pow(1.2, achievementCompletionTier)).toFixed(2);
            multiplierElement03.textContent = `${multiplier03}`;
        }
    }
    function handleUpgradePurchase(upgrade, button) {
        const cost = parseFloat(button.dataset.cost);
        if (score >= cost) {
            score -= cost;
            saveScore();
            passivePointsPerSecond = upgrade.effect.updatePPG(passivePointsPerSecond);
            numUpgrades = (parseInt(localStorage.getItem('numUpgrades')) || 0) + 1;
            localStorage.setItem('numUpgrades', numUpgrades);

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

    function showSubtab(subtabId) {
        // Hide all subtabs
        document.querySelectorAll('.subtab-content').forEach(subtab => {
            subtab.style.display = 'none';
        });
    
        // Show the selected subtab
        document.getElementById(subtabId + '-subtab').style.display = 'block';
    }    
    window.showSubtab = showSubtab;

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
            
            // Reset upgrades
            document.querySelectorAll('.upgrade-btn').forEach(button => {
                button.disabled = false;
                button.style.backgroundColor = '';
            });
    
            xpText.textContent = `${achievementXP} / 100 XP`;
            xpFill.style.width = '0%';
            achievementTier.textContent = `${achievementCompletionTier} / 5`;
            requirementText.textContent = `$${Math.round(score)} / ${scoreThresholds[achievementCompletionTier - 1] || 500}`;
            numUpgrades = 0;
        
            // Reset claim button state
            claimButton.disabled = true;
    
            // Reset fish-related data to initial state
            fishCounts = [0, 0, 0, 0, 0]; // Starting counts for all fish
            fishProbabilities = [1, 0, 0, 0, 0]; // Starting probabilities (only red fish available)
            fishingTimer = 0; // Reset the fishing cooldown timer
    
            // Update the UI to reflect the reset state
            updateFishLists();
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

    // Define fish types
    const fishTypes = [
        { name: "Red Snapper", multiplier: 0.1 },
        { name: "Orange Tang", multiplier: 0.2 },
        { name: "Yellow Perch", multiplier: 0.3 },
        { name: "Green Bass", multiplier: 0.5 },
        { name: "Blue Drop", multiplier: 1.0 }
    ];

    // Initial probabilities (only red fish is available)
    let fishProbabilities = [1, 0, 0, 0, 0];

    // Player's fish counts
    let fishCounts = [0, 0, 0, 0, 0];

    // Calculate fish multipliers (each fish's count * its multiplier)
    function calculateMultipliers() {
        let totalMultiplier = 1; // Start with a base multiplier of 1 (no multiplier initially)

        // Calculate the multiplier for each fish type
        fishCounts.forEach((count, index) => {
        if (count > 0) {
            // Only multiply if there are fish of that type
            totalMultiplier *= (1 + (count * fishTypes[index].multiplier));
        }
    });
    return totalMultiplier;
}

function catchFish() {
    // Choose a fish based on probabilities
    let random = Math.random();
    let cumulative = 0;
    let chosenFishIndex = 0;

    for (let i = 0; i < fishProbabilities.length; i++) {
        cumulative += fishProbabilities[i];
        if (random < cumulative) {
            chosenFishIndex = i;
            break;
        }
    }

    let chosenFish = fishTypes[chosenFishIndex];
    
    // Update fish count
    fishCounts[chosenFishIndex]++;
    saveFishData(); // Save the updated fish data

    // Get the color of the fish based on its type
    const fishColors = ["#FF3F3F", "#FF9F3F", "#FFFF3F", "#3FFF3F", "#3FBFFF"];
    const fishColor = fishColors[chosenFishIndex]; // Get color based on chosen fish type

    // Display result with colored fish name
    const fishResultText = `You caught a <span style="color: ${fishColor};">${chosenFish.name}</span>! It provides a +${chosenFish.multiplier}x multiplier to point gain.`;
    document.getElementById("fish-result").innerHTML = fishResultText;

    // Update fish multipliers and PPG
    updateFishLists();
    updatePPG();

    // Disable button for 30 seconds
    let fishButton = document.getElementById("fish-button");
    fishButton.disabled = true;
    fishButton.textContent = "No fish yet... (30s)";

    let timeLeft = 30;
    let timer = setInterval(() => {
        timeLeft--;
        fishButton.textContent = `No fish yet... (${timeLeft}s)`;

        // Save the timer state to localStorage every second
        localStorage.setItem('fishTimerState', JSON.stringify({ timeLeft: timeLeft, isDisabled: true }));

        if (timeLeft <= 0) {
            clearInterval(timer);
            fishButton.disabled = false;
            fishButton.textContent = "Catch Fish! 🐟";

            // Reset the timer state once it's finished
            localStorage.setItem('fishTimerState', JSON.stringify({ timeLeft: 0, isDisabled: false }));
        }
    }, 1000);

    // Save the initial state
    localStorage.setItem('fishTimerState', JSON.stringify({ timeLeft: timeLeft, isDisabled: true }));
}
    
    window.catchFish = catchFish;

    function updateFishLists() {
        let countsList = document.getElementById("fish-counts-list");
        let multipliersList = document.getElementById("fish-multipliers-list");
        let raritiesList = document.getElementById("fish-rarities-list");
    
        countsList.innerHTML = "";
        multipliersList.innerHTML = "";
        raritiesList.innerHTML = "";
    
        // Define colors for each fish type
        const fishColors = ["#FF3F3F", "#FF9F3F", "#FFFF3F", "#3FFF3F", "#3FBFFF"]; // Red, Orange, Yellow, Green, Blue
    
        fishTypes.forEach((fish, index) => {
            // Check if the fish is locked (probability is 0)
            let locked = fishProbabilities[index] === 0;
            
            // Fish count
            let countItem = document.createElement("li");
            countItem.classList.add("fish-list-item");
            if (locked) {
                countItem.innerHTML = `<div class="locked-bar">Locked</div>${fish.name}: ${fishCounts[index]}`;
            } else {
                countItem.innerHTML = `${fish.name}: ${fishCounts[index]}`;
            }
            countItem.style.color = fishColors[index]; // Set color based on fish type
            countsList.appendChild(countItem);
    
            // Multiplier
            let multiplierItem = document.createElement("li");
            multiplierItem.classList.add("fish-list-item");
            let totalMultiplier = 1 + (fishCounts[index] * fish.multiplier);
            if (locked) {
                multiplierItem.innerHTML = `<div class="locked-bar">Locked</div>${fish.name}: ${totalMultiplier.toFixed(2)}x`;
            } else {
                multiplierItem.innerHTML = `${fish.name}: ${totalMultiplier.toFixed(2)}x`;
            }
            multiplierItem.style.color = fishColors[index]; // Set color based on fish type
            multipliersList.appendChild(multiplierItem);
    
            // Rarity
            let rarityItem = document.createElement("li");
            rarityItem.classList.add("fish-list-item");
            let percentage = (fishProbabilities[index] * 100).toFixed(2);
            if (locked) {
                rarityItem.innerHTML = `<div class="locked-bar">Locked</div>${fish.name}: ${percentage}% chance`;
            } else {
                rarityItem.innerHTML = `${fish.name}: ${percentage}% chance`;
            }
            rarityItem.style.color = fishColors[index]; // Set color based on fish type
            raritiesList.appendChild(rarityItem);
        });
    }
    
    // Call update function initially to populate lists
    updateFishLists();
    
// Save fish data to localStorage whenever the fish count is updated
function saveFishData() {
    const fishData = {
        fishCounts: fishCounts,
        fishProbabilities: fishProbabilities // Save probabilities too, in case they're updated
    };
    localStorage.setItem('fishData', JSON.stringify(fishData));
}


// Load fish data from localStorage on page load
function loadFishData() {
    const savedFishData = JSON.parse(localStorage.getItem('fishData'));
    if (savedFishData) {
        fishCounts = savedFishData.fishCounts || [0, 0, 0, 0, 0]; // Default to 0 if no data exists
        fishProbabilities = savedFishData.fishProbabilities || [1, 0, 0, 0, 0]; // Default probabilities (Red fish only)
        updateFishLists();  // Update fish count, multipliers, and rarities lists
    }
}
    
    // Call loadFishData on page load
    window.onload = function() {
        // Load fish data
        loadFishData();
    
        // Restore the timer state if it exists
        const timerState = JSON.parse(localStorage.getItem('fishTimerState'));
    
        if (timerState && timerState.isDisabled) {
            let fishButton = document.getElementById("fish-button");
            fishButton.disabled = true;
            let timeLeft = timerState.timeLeft;
            fishButton.textContent = `No fish yet... (${timeLeft}s)`;
    
            let timer = setInterval(() => {
                timeLeft--;
                fishButton.textContent = `No fish yet... (${timeLeft}s)`;
    
                // Update the timer state as it counts down
                localStorage.setItem('fishTimerState', JSON.stringify({ timeLeft: timeLeft, isDisabled: true }));
    
                if (timeLeft <= 0) {
                    clearInterval(timer);
                    fishButton.disabled = false;
                    fishButton.textContent = "Catch Fish! 🐟";
                    localStorage.setItem('fishTimerState', JSON.stringify({ timeLeft: 0, isDisabled: false }));
                }
            }, 1000);
        }
    };
    
    
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