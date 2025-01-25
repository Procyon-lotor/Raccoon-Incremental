// Ensure this is running after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {

    const scoreElement = document.getElementById('score');  // The element to display the score
    const updateButton = document.getElementById('update-button');  // Button to update the score

    // Fetch the current score from the backend and display it
    async function getScore() {
        try {
            const response = await fetch('http://127.0.0.1:5000/get_score');
            const data = await response.json();
            if (data && data.score !== undefined) {
                scoreElement.textContent = `Score: ${data.score}`;
            } else {
                console.error("Failed to fetch score:", data);
            }
        } catch (error) {
            console.error("Error fetching score:", error);
        }
    }

    // Update the score on the backend
    async function updateScore(newScore) {
        console.log('Sending score update:', newScore);  // Debug log
        try {
            const response = await fetch('http://127.0.0.1:5000/update_score', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ score: newScore })
            });

            const data = await response.json();
            if (response.ok) {
                console.log("Score updated:", data.message);  // Success message
                getScore();  // Fetch the updated score from the backend
            } else {
                console.error("Error updating score:", data.error);  // Error from backend
            }
        } catch (error) {
            console.error("Error updating score:", error);
        }
    }

    // Initialize the score when the page loads
    getScore();

    // Event listener for the update button
    updateButton.addEventListener('click', async () => {
        let currentScore = parseInt(scoreElement.textContent.split(' ')[1]);  // Get current score
        currentScore += 1;  // Increase score by 1
        await updateScore(currentScore);  // Update score on the backend
    });
    
    // Get the modal and buttons
    document.addEventListener("DOMContentLoaded", function() {
        const changelogButton = document.getElementById('changelog-button');
        const changelogModal = document.getElementById('changelog-modal');
        const closeModalButton = document.getElementById('close-modal');
    
        // Show the changelog modal
        changelogButton.addEventListener('click', function(event) {
            event.preventDefault(); // Prevent default anchor link behavior
            changelogModal.style.display = 'block'; // Show the modal
        });
    
        // Close the changelog modal
        closeModalButton.addEventListener('click', function() {
            changelogModal.style.display = 'none'; // Hide the modal
        });
    });    
    
// Initialize the score variable
let score = 0;

// Check if scoreElement and updateButton are already defined elsewhere
if (!scoreElement) {
    const scoreElement = document.getElementById("score");
}
if (!updateButton) {
    const updateButton = document.getElementById("update-button");
}

// Update the score when the button is clicked
updateButton.addEventListener("click", () => {
    score += 1;  // Increment the score by 1
    scoreElement.textContent = `Score: ${score}`;  // Update the displayed score
});


});
