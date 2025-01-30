// I'm not entirely sure this file is even doing anything, but it's not breaking my code so I'm not removing it.

// Function to handle upgrade purchasing
function buyUpgrade(upgradeId, cost, effect, button) {
    if (score >= cost) {
        score -= cost;
        saveScore(score);

        // Apply the effect based on the upgrade purchased
        if (upgradeId === 'upgrade-00') {
            saveUpgradeStatus(upgradeId, true); // Save upgrade as purchased
            multiplierUpgrade00 = 2; // Apply 2x multiplier for Upgrade 00
            localStorage.setItem('multiplierUpgrade00', '2'); // Save multiplier for Upgrade 00
            applyUpgradeEffects(); // Ensure changes happen immediately
        }
        if (upgradeId === 'upgrade-01') {
            saveUpgradeStatus(upgradeId, true); // Save upgrade as purchased
            localStorage.setItem('multiplierUpgrade01', '1'); // Initialize multiplier for Upgrade 01 (based on score)
        }

        button.disabled = true;  // Disable button after purchase
        button.style.backgroundColor = '#3fff3f';  // Indicate that the upgrade has been purchased
    } else {
        button.style.backgroundColor = '#ff3f3f';  // Indicate insufficient funds
        setTimeout(() => {
            button.style.backgroundColor = '';  // Reset the color after a short time
        }, 200);
    }
}

// Apply upgrade effects immediately after purchasing an upgrade
function applyUpgradeEffects() {
    if (loadUpgradeStatus('upgrade-00')) {
        multiplierUpgrade00 = 2; // Apply Upgrade 00 effect
    }
}

// Load upgrade status (this should be implemented for loading upgrade states from localStorage or another method)
function loadUpgradeStatus(upgradeId) {
    return localStorage.getItem(upgradeId) === 'true';
}

// Save upgrade status (this should be implemented for saving upgrade states to localStorage or another method)
function saveUpgradeStatus(upgradeId, status) {
    localStorage.setItem(upgradeId, status);
}
