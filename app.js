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
    let fishingAchievementElement = document.getElementById('achievement-fishing');

    // Setup
    mainTabContent.style.display = 'block';
    settingsTabContent.style.display = 'none';

    // Existing Upgrade Data
    let numUpgrades = parseInt(localStorage.getItem('numUpgrades')) || 0;
    const upgrades = [
        { id: 'upgrade-00', cost: 10, effect: { name: 'First Upgrade', description: 'Double your PPG.', updatePPG: (ppg) => ppg * 2 } },
        { id: 'upgrade-01', cost: 40, effect: { name: 'Second Upgrade', description: 'Increase PPG by current points^0.2.', updatePPG: (ppg) => ppg * Math.max(Math.pow(score, 0.2), 1) } },
        { id: 'upgrade-02', cost: 300, effect: { name: 'Third Upgrade', description: 'Increase PPG based on number of upgrades purchased in this row.', updatePPG: (ppg) => ppg * Math.pow(numUpgrades, 0.5) + 1}},
        { id: 'upgrade-03', cost: 1000, effect: { name: 'Fourth Upgrade', description: 'Increase PPG based on total achievement completion tiers.', updatePPG: (ppg) => ppg * Math.pow(1.2, achievementCompletionTier + fishingAchievementTier)}},
        { id: 'upgrade-04', cost: 2000, effect: { name: 'Fifth Upgrade', description: 'Unlocks Fishing.', unlockFishing: true }},
        { id: 'upgrade-05', cost: 10000, effect: { name: 'Sixth Upgrade', description: 'Have a 15% chance to catch double fish.'}},
        { id: 'upgrade-06', cost: 15000, effect: { name: 'Seventh Upgrade', description: 'Decrease the fishing cooldown timer based on current points.'}},
        { id: 'upgrade-07', cost: 25000, effect: { name: 'Eighth Upgrade', description: 'Improve the effect of Upgrade 01'}}
    ];

    function updateNumUpgradesDescription() {
        const numUpgradesDescription = document.getElementById('num-upgrades-description');
        
        // Update the text content of the element to show the number of upgrades purchased
        numUpgradesDescription.textContent = `You have purchased ${numUpgrades} upgrades`;
    }
    updateNumUpgradesDescription();

    // Event Listeners
    mainTabBtn.addEventListener('click', () => toggleTabs('main'));
    settingsTabBtn.addEventListener('click', () => toggleTabs('settings'));
    achievementsTabBtn.addEventListener('click', () => toggleTabs('achievements'));
    autosaveSlider.addEventListener('input', updateAutosaveTime);
    manualSaveButton?.addEventListener('click', manualSave);
    hardResetButton?.addEventListener('click', hardReset);
    
// Function to show the selected subtab
function showSubtab(subtabName) {
    // Get all subtab content elements
    var subtabs = document.querySelectorAll('.subtab-content');
    
    // Hide all subtabs
    for (var i = 0; i < subtabs.length; i++) {
        subtabs[i].style.display = 'none';
    }

    // Show the selected subtab
    var selectedSubtab = document.getElementById(subtabName + '-subtab');
    if (selectedSubtab) {
        selectedSubtab.style.display = 'block';
    }

    // Handle the Fishing tab visibility (only show if unlocked)
    var fishingUnlocked = localStorage.getItem("fishingUnlocked");
    if (fishingUnlocked !== "true" && subtabName === "fishing") {
        // If fishing is not unlocked, hide the fishing subtab and do not show it
        document.getElementById("fishing-subtab").style.display = "none";
    }
}

// Initialize default subtab visibility on page load
window.addEventListener('load', function() {
    // Hide all subtabs initially
    var subtabs = document.querySelectorAll('.subtab-content');
    for (var i = 0; i < subtabs.length; i++) {
        subtabs[i].style.display = 'none';
    }

    // Show the default subtab (Upgrades) after page refresh
    document.getElementById("upgrades-subtab").style.display = 'block';
});

// Update fishing achievement immediately after page loads
window.addEventListener('DOMContentLoaded', () => {
    // Load any required saved data from localStorage
    fishingAchievementTier = Number(localStorage.getItem('fishingAchievementTier')) || 0;
    fishCounts = JSON.parse(localStorage.getItem('fishCounts')) || [0, 0, 0, 0, 0]; // Or initialize to your default counts
    fishCatchRequirements = [10, 10, 10, 10, 10]; // or whatever your catch requirements are

    // Make sure the display is updated on page load
    updateFishingAchievement();
    claimFishingReward();
    updateFishLists();
    updateTotalFishMultiplier()
});

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
        updateUpgrade06Description();
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
        let fishingAchievementTier = parseInt(localStorage.getItem('fishingAchievementTier')) || 0;
        const purchasedUpgrades = JSON.parse(localStorage.getItem('purchasedUpgrades')) || [];
        
        // Apply upgrade effects
        if (purchasedUpgrades.includes('upgrade-00')) {
            passivePointsPerSecond *= 2; // Apply Upgrade 00 effect
        }
        
        if (purchasedUpgrades.includes('upgrade-01')) {
            if (purchasedUpgrades.includes('upgrade-07')) {
                passivePointsPerSecond *= Math.pow(score, 0.25); // Apply Upgrade 01 effect with Upgrade 07
            } else {
                passivePointsPerSecond *= Math.pow(score, 0.2); // Apply Upgrade 01 effect without Upgrade 07
            }
        }
        
        if (purchasedUpgrades.includes('upgrade-02')) {
            passivePointsPerSecond *= Math.pow(numUpgrades, 0.5) + 1;
        }
        
        if (purchasedUpgrades.includes('upgrade-03')) {
            passivePointsPerSecond *= Math.pow(1.2, achievementCompletionTier + fishingAchievementTier);
        }
        
        // Check if Fishing should be unlocked based on localStorage
        const fishingSubtab = document.getElementById('fishing-subtab');
        const fishingAchievementElement = document.getElementById('achievement-fishing');
        if (localStorage.getItem('fishingUnlocked') === 'true') {
            fishingSubtab.style.display = 'block';  // Show Fishing subtab
        } else {
            fishingSubtab.style.display = 'none';  // Hide Fishing subtab
        }
        
        if (localStorage.getItem('fishingUnlocked') === 'true') {
            fishingAchievementElement.style.display = 'block';
        } else {
            fishingAchievementElement.style.display = 'none';
        }
    }    

    function updatePPG() {
        let calculatedPPG = 1;
        const purchasedUpgrades = JSON.parse(localStorage.getItem('purchasedUpgrades')) || [];
        
        if (purchasedUpgrades.includes('upgrade-00')) {
            calculatedPPG *= 2;
        }
        
        if (purchasedUpgrades.includes('upgrade-01')) {
            if (purchasedUpgrades.includes('upgrade-07')) {
                calculatedPPG *= Math.pow(score, 0.25); // Apply Upgrade 01 effect with Upgrade 07
            } else {
                calculatedPPG *= Math.pow(score, 0.2); // Apply Upgrade 01 effect without Upgrade 07
            }
        }
        updateUpgrade01Description();
        
        if (purchasedUpgrades.includes('upgrade-02')) {
            calculatedPPG *= Math.pow(numUpgrades, 0.5) + 1;
        }
        
        if (purchasedUpgrades.includes('upgrade-03')) {
            calculatedPPG *= Math.pow(1.2, achievementCompletionTier + fishingAchievementTier);
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
        const purchasedUpgrades = JSON.parse(localStorage.getItem('purchasedUpgrades')) || [];
        
        let multiplier;
    
        // Check if Upgrade 07 (id: 'upgrade-07') is purchased and update the multiplier accordingly
        if (purchasedUpgrades.includes('upgrade-07')) {
            multiplier = Math.pow(score, 0.25);  // Apply the new multiplier formula (points ^ 0.25)
        } else {
            multiplier = Math.pow(score, 0.2);  // Default multiplier formula (points ^ 0.2)
        }
    
        // Update the displayed multiplier in the description dynamically
        if (multiplierElement) {
            multiplierElement.textContent = `${Math.max(multiplier, 1).toFixed(2)}`;
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
        let fishingAchievementTier = parseInt(localStorage.getItem('fishingAchievementTier')) || 0;
        const multiplierElement03 = document.getElementById('multiplier-value-03');
        if (multiplierElement03) {
            let multiplier03 = (Math.pow(1.2, achievementCompletionTier + fishingAchievementTier)).toFixed(2);
            multiplierElement03.textContent = `${multiplier03}`;
        }
    }

    function updateUpgrade06Description() {
        const timerElement06 = document.getElementById('timer-value-06');
        if (timerElement06) {
            let timer06 = (30 - Math.min(100 / Math.log10(Math.max(score, 2)), 30)).toFixed(2);
            timerElement06.textContent = `${timer06}`;
        }
    }

    function checkFishingTabButtonVisibility() {
        // Find the button with the text 'Fishing'
        const fishingTabButton = Array.from(document.getElementsByClassName('subtab-button')).find(button => button.textContent === 'Fishing');
        
        if (fishingTabButton) {
            // Show or hide the button based on whether fishing is unlocked
            if (localStorage.getItem('fishingUnlocked') === 'true') {
                fishingTabButton.style.display = 'inline-block';  // Show the button
            } else {
                fishingTabButton.style.display = 'none';  // Hide the button
            }
        }
    } 
    
    // Ensure to call this function when the page loads and when an upgrade is purchased:
    window.addEventListener('DOMContentLoaded', () => {
        checkFishingTabButtonVisibility();  // Update the visibility of the Fishing tab button on page load
    });
    
    function handleUpgradePurchase(upgrade, button) {
        const cost = parseFloat(button.dataset.cost);
        if (score >= cost) {
            score -= cost;
            saveScore();
            
            // Handle upgrades with updatePPG function
            if (upgrade.effect.updatePPG) {
                passivePointsPerSecond = upgrade.effect.updatePPG(passivePointsPerSecond);
            }
    
            // If upgrade-04 (Fishing) is purchased, unlock Fishing tab button
            if (upgrade.id === 'upgrade-04') {
                localStorage.setItem('fishingUnlocked', 'true');  // Store the unlock state
                document.querySelector('.subtab-button[onclick="showSubtab(\'fishing\')"]').style.display = 'inline-block';  // Show Fishing tab button
                fishingAchievementElement.style.display = 'block';
                updateFishLists();
            }
    
            // Update number of upgrades and store purchased upgrades
            numUpgrades = (parseInt(localStorage.getItem('numUpgrades')) || 0) + 1;
            localStorage.setItem('numUpgrades', numUpgrades);
    
            let purchasedUpgrades = JSON.parse(localStorage.getItem('purchasedUpgrades')) || [];
            if (!purchasedUpgrades.includes(upgrade.id)) {
                purchasedUpgrades.push(upgrade.id);
                localStorage.setItem('purchasedUpgrades', JSON.stringify(purchasedUpgrades));
            }
    
            // Change button color and disable it after purchase
            button.disabled = true;
            button.style.backgroundColor = '#3fbf3f'; // Green
        } else {
            flashButtonRed(button);
        }
        updateDisplays();
        updateNumUpgradesDescription();
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
            
            // Hide Fishing subtab and show Upgrades subtab
            const fishingButton = document.querySelector('.subtab-button:nth-child(2)');
            fishingButton.style.display = 'none';
            const upgradesButton = document.querySelector('.subtab-button:nth-child(1)');
            upgradesButton.click(); // Switch to Upgrades subtab
            updateFishingAchievement();
            fishingAchievementElement.style.display = 'none';
            updateNumUpgradesDescription();
        }
    }    
    
    function updateUI() {
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
    
        // Check if all tiers are completed
        if (achievementCompletionTier >= 5) {
            requirementText.textContent = "Completed!"; // Display "Completed!" when all tiers are completed
        } else {
            requirementText.textContent = `${Math.round(score)} / ${scoreThresholds[achievementCompletionTier] || 500} points`;
        }
    
        rewardText.textContent = `${Math.pow(1.5, achievementCompletionTier).toFixed(2)}x Points)`;
        checkClaimReward();
    }    

    function checkClaimReward() {
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

    document.getElementById("claim-reward-btn").addEventListener("click", claimReward);
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
    
// Initialize fish types and their data
const fishTypes = [
    { name: "Red Snapper", multiplier: 0.1 },
    { name: "Orange Tang", multiplier: 0.2 },
    { name: "Yellow Perch", multiplier: 0.3 },
    { name: "Green Bass", multiplier: 0.5 },
    { name: "Blue Drop", multiplier: 1.0 }
];

let fishProbabilities = [1, 0, 0, 0, 0]; // Unlock fish probabilities
let fishCounts = JSON.parse(localStorage.getItem('fishCounts')) || [0, 0, 0, 0, 0]; // Fish counts per type
let fishingAchievementTier = parseInt(localStorage.getItem('fishingAchievementTier')) || 0; // Fishing achievement progress

let fishCatchRequirements = [10, 10, 10, 10, 10]; // Catch requirements per tier

// DOM elements for UI updates
const fishingClaimButton = document.getElementById('claim-fishing-reward-btn');
const fishingTierText = document.getElementById('achievement-fishing-tier');
const fishingRequirementText = document.getElementById('achievement-fishing-requirement');
const fishingRewardText = "Reward: Unlocks new fish types per tier, final tier doubles all fish multipliers."
const fishResultText = document.getElementById('fish-result');

// Function to save fish data to localStorage
function saveFishData() {
    localStorage.setItem('fishData', JSON.stringify({ fishCounts, fishProbabilities }));
}

// Function to load fish data from localStorage
function loadFishData() {
    const savedFishData = JSON.parse(localStorage.getItem('fishData'));
    if (savedFishData) {
        fishCounts = savedFishData.fishCounts || [0, 0, 0, 0, 0];
        fishProbabilities = savedFishData.fishProbabilities || [1, 0, 0, 0, 0];
        updateFishLists();
        updateFishingAchievement();
        updateTotalFishMultiplier();
    }
}

// Function to update the fishing achievement UI dynamically
function updateFishingAchievement() {
    // Update the completion tier text
    document.getElementById("achievement-fishing-tier").textContent = `${fishingAchievementTier} / 5`;

    if (fishingAchievementTier < 5) {
        // Update the current requirement text dynamically
        document.getElementById("achievement-fishing-requirement").textContent = 
    `${fishCounts[fishingAchievementTier]} / ${fishCatchRequirements[fishingAchievementTier]} ${fishTypes[fishingAchievementTier].name} fish`;

        // Update the reward text dynamically
        document.getElementById("achievement-fishing-reward").textContent = 
        (fishingAchievementTier < 4) 
            ? `Unlock ${fishTypes[fishingAchievementTier + 1].name} fish`
            : (fishingAchievementTier === 4) 
                ? "Doubles all fish multipliers!" 
                : "All rewards unlocked!";    
    } else {
        // Completion message when all tiers are completed
        document.getElementById("achievement-fishing-requirement").textContent = "Completed!";
        document.getElementById("achievement-fishing-reward").textContent = "All rewards unlocked!";
    }

    // Update the Claim Reward button state
    checkFishingClaimReward();
}


// Function to check if the fishing reward can be claimed
function checkFishingClaimReward() {
    fishingClaimButton.disabled = !(fishingAchievementTier < 5 && fishCounts[fishingAchievementTier] >= fishCatchRequirements[fishingAchievementTier]);
}

// Function to claim the fishing reward and update the achievement
function checkFishingAchievements() {
    let shownFishTiers = JSON.parse(localStorage.getItem('shownFishTiers')) || {};

    // Check if the player has reached the requirement for each fishing achievement tier
    for (let tier = 0; tier < 5; tier++) {
        if (fishCounts[tier] >= fishCatchRequirements[tier] && !shownFishTiers[tier]) {
            // If the player hasn't seen the popup for this tier, show it
            showPopup(`Achievement Completed! Pro Angler: Tier ${tier + 1}`);
            // Mark this popup as shown for the current tier
            shownFishTiers[tier] = true;
            // Save the updated shownFishTiers object to localStorage
            localStorage.setItem('shownFishTiers', JSON.stringify(shownFishTiers));
        }
    }
}

function claimFishingReward() {
    let shownFishTiers = JSON.parse(localStorage.getItem('shownFishTiers')) || {};

    if (fishingAchievementTier < 5 && fishCounts[fishingAchievementTier] >= fishCatchRequirements[fishingAchievementTier]) {
        // Increment the tier and update the achievement
        fishingAchievementTier++;
        localStorage.setItem('fishingAchievementTier', fishingAchievementTier);

        // Award XP
        achievementXP += 15;
        localStorage.setItem('achievementXP', achievementXP);

        // Unlock next fish type or apply reward for the last tier
        if (fishingAchievementTier === 1) {
            // After unlocking orange fish, set probabilities
            fishProbabilities = [0.8, 0.2, 0, 0, 0];
        } else if (fishingAchievementTier === 2) {
            // After unlocking yellow fish, set probabilities
            fishProbabilities = [0.63, 0.25, 0.12, 0, 0];    
        } else if (fishingAchievementTier === 3) {
            // After unlocking green fish, set probabilities
            fishProbabilities = [0.58, 0.23, 0.12, 0.07, 0]; 
        } else if (fishingAchievementTier === 4) {
            // After unlocking blue fish, set probabilities
            fishProbabilities = [0.55, 0.23, 0.12, 0.07, 0.03];
        } else if (fishingAchievementTier === 5) {
            // Tier 5: Double all fish multipliers
            fishTypes.forEach(fish => {
                fish.multiplier *= 2; // Double each fish multiplier
            });
        }

        // Save updated data and refresh the UI
        saveFishData(); // Save changes
        updateUI(); // Refresh the UI
        updateFishingAchievement(); // Update the Fishing achievement UI
        updateFishLists(); // Update the fish statistics list
        updateTotalFishMultiplier();
    }
}

// Event listener for claim button
fishingClaimButton.addEventListener('click', claimFishingReward);

// Function to update the fish lists on the UI
function updateFishLists() {
    let lists = {
        counts: document.getElementById("fish-counts-list"),
        multipliers: document.getElementById("fish-multipliers-list"),
        rarities: document.getElementById("fish-rarities-list"),
    };

    // Clear lists
    Object.values(lists).forEach(list => list.innerHTML = "");

    const fishColors = ["#FF3F3F", "#FF9F3F", "#FFFF3F", "#3FFF3F", "#3FBFFF"]; // Red, Orange, Yellow, Green, Blue

    fishTypes.forEach((fish, index) => {
        let locked = fishProbabilities[index] === 0;
        let count = fishCounts[index] || 0; // Default to 0
        let multiplier = (1 + count * fish.multiplier).toFixed(2);
        let rarity = (fishProbabilities[index] * 100).toFixed(2) + "%";

        let lockedText = locked ? `<span class="locked-bar">Locked</span> ` : "";

        // Always display all fish, even if count is 0
        lists.counts.innerHTML += `<li class="fish-list-item" style="color:${fishColors[index]}">${lockedText}${fish.name}: ${count}</li>`;
        lists.multipliers.innerHTML += `<li class="fish-list-item" style="color:${fishColors[index]}">${lockedText}${fish.name}: ${multiplier}x</li>`;
        lists.rarities.innerHTML += `<li class="fish-list-item" style="color:${fishColors[index]}">${lockedText}${fish.name}: ${rarity} chance</li>`;
    });
}

// Fishing mechanism
document.getElementById("fish-button").addEventListener("click", catchFish);

let CatchMultiplier = 1;

// Catch fish logic
function catchFish() {
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
    
    // Determine the number of fish caught
    let fishCaught = CatchMultiplier;

    // Check if Upgrade 06 (id: upgrade-05) is purchased for a 15% chance to double fish caught
    if (JSON.parse(localStorage.getItem("purchasedUpgrades") || "[]").includes("upgrade-05") && Math.random() < 0.15) {
        fishCaught *= 2; // Double the fish caught
    }    

    fishCounts[chosenFishIndex] += fishCaught;
    saveFishData();
    updateFishingAchievement();
    checkFishingAchievements();

    const fishColors = ["#FF3F3F", "#FF9F3F", "#FFFF3F", "#3FFF3F", "#3FBFFF"];
    const fishResultText = `You caught a <span style="color: ${fishColors[chosenFishIndex]};">${chosenFish.name}</span>! It provides a +${chosenFish.multiplier}x multiplier to point gain.`;
    document.getElementById("fish-result").innerHTML = fishResultText;

    updateFishLists();
    updatePPG();
    updateTotalFishMultiplier();

    // Determine the cooldown time based on Upgrade 07 (id: upgrade-06)
    let baseCooldown = 30;
    if (JSON.parse(localStorage.getItem("purchasedUpgrades") || "[]").includes("upgrade-06")) {
        let newCooldown = 100 / Math.log10(Math.max(score, 2)); // Prevent log(0) or log(1) issues
        baseCooldown = Math.min(newCooldown, 30); // Ensure maximum of 30s cooldown
    }

    // Set cooldown time and save to localStorage
    let timeLeft = baseCooldown;
    localStorage.setItem('timeLeft', timeLeft);

    let fishButton = document.getElementById("fish-button");
    fishButton.disabled = true;
    fishButton.textContent = `No fish yet... (${Math.ceil(timeLeft)}s)`; // Round to avoid decimals in UI

    // Start the countdown for the cooldown timer
    let timer = setInterval(() => {
        timeLeft--;
        localStorage.setItem('timeLeft', timeLeft);
        fishButton.textContent = `No fish yet... (${Math.ceil(timeLeft)}s)`;

        if (timeLeft <= 0) {
            clearInterval(timer);
            fishButton.disabled = false;
            fishButton.textContent = "Catch Fish! 🐟";
            localStorage.setItem('timeLeft', 0);
        }
    }, 1000);
}

// Load the cooldown state when the page loads
    let timeLeft = parseInt(localStorage.getItem('timeLeft')) || 0;
    const fishButton = document.getElementById("fish-button");

    // Check if the timeLeft from localStorage is still greater than 0
    if (timeLeft > 0) {
        fishButton.disabled = true;  // Disable the button
        fishButton.textContent = `No fish yet... (${timeLeft}s)`;  // Show the remaining time
        let timer = setInterval(() => {
            timeLeft--;
            localStorage.setItem('timeLeft', timeLeft);  // Save the remaining time

            if (timeLeft <= 0) {
                clearInterval(timer);
                fishButton.disabled = false;  // Enable the button
                fishButton.textContent = "Catch Fish! 🐟";  // Reset button text
                localStorage.setItem('timeLeft', 0);  // Reset timeLeft in localStorage when cooldown ends
            } else {
                fishButton.textContent = `No fish yet... (${timeLeft}s)`;  // Update button text with remaining time
            }
        }, 1000);
    } else {
        fishButton.disabled = false;  // Enable the button if timeLeft is 0
        fishButton.textContent = "Catch Fish! 🐟";  // Reset button text
    }

function calculateMultipliers() {
    let totalMultiplier = 1; // Start with a base multiplier of 1

    // Loop through each fish type
    fishTypes.forEach((fish, index) => {
        if (fishProbabilities[index] > 0) {
            // Add the multiplier effect from each fish
            totalMultiplier *= (1 + (fishCounts[index] * fish.multiplier));
        }
    });
    return totalMultiplier;
}

function updateTotalFishMultiplier() {
    // Initialize the total multiplier
    let totalMultiplier = 1;

    // Create an array to hold the individual multipliers for display
    let multiplierList = [];

    // Iterate through fishTypes and calculate the total multiplier
    fishTypes.forEach((fish, index) => {
        // Get the count for the current fish type (assuming it's in fishCounts)
        let count = fishCounts[index] || 0;
        // Calculate the multiplier for this fish type
        let multiplier = (1 + count * fish.multiplier);
        // Add the multiplier with the corresponding color to the list
        multiplierList.push(`<span style="color: ${getFishColor(index)}">${multiplier.toFixed(2)}</span>`);
        // Multiply it to the total multiplier
        totalMultiplier *= multiplier;
    });

    // Update the display with the total fish multiplier
    document.getElementById("total-fish-multiplier").innerHTML = 
        `Total Fish Multiplier to Points: ${multiplierList.join(" x ")} = ${totalMultiplier.toFixed(2)}`;
}

// Helper function to get the color for each fish based on its index
function getFishColor(index) {
    const fishColors = [
        "#FF3F3F",   // Red Snapper
        "#FF9F3F", // Orange Tang
        "#FFFF3F", // Yellow Perch
        "#3FFF3F",  // Green Bass
        "#3FBFFF"    // Blue Drop
    ];
    return fishColors[index] || "black"; // Default to black if index is out of range
}

window.onload = function () {
    loadFishData();
};

    function updateFishingVisibility() {
        if (localStorage.getItem('fishingUnlocked') === 'true') {
            document.getElementById('fishing-subtab').style.display = 'block';
        } else {
            document.getElementById('fishing-subtab').style.display = 'none';
        }
    }
    
    // Call this function after loading the game state
    updateFishingVisibility();    
    
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