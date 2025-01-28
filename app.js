// Ensure this is running after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {

    const scoreElement = document.getElementById('score');  // The element to display the score
    const updateButton = document.getElementById('update-button');  // Button to update the score

    // Save the score to localStorage
    function saveScore(score) {
        localStorage.setItem('playerScore', score);
    }

    // Load the score from localStorage
    function loadScore() {
        const savedScore = localStorage.getItem('playerScore');
        if (savedScore !== null) {
            return parseInt(savedScore);  // Return the saved score if it exists
        } else {
            return 0;  // Return 0 if no score is saved
        }
    }

    // Load the saved score when the page is loaded
    let score = loadScore();
    scoreElement.textContent = `Score: ${score}`;  // Display the loaded score

    // Update the score when the button is clicked
    updateButton.addEventListener('click', () => {
        score += 1;  // Increment the score by 1
        scoreElement.textContent = `Score: ${score}`;  // Update the displayed score
        saveScore(score);  // Save the updated score to localStorage
    });

});
