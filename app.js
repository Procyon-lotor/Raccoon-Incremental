document.addEventListener('DOMContentLoaded', () => {
    const scoreElement = document.getElementById('score');  // The element to display the score

    // Function to load the score from localStorage
    function loadScore() {
        const savedScore = localStorage.getItem('playerScore');
        return savedScore !== null ? parseInt(savedScore) : 0;
    }

    // Set the score in localStorage and update UI
    function saveScore(score) {
        localStorage.setItem('playerScore', score);
        scoreElement.textContent = `Score: ${score}`;  // Update UI immediately after saving
    }

    // Initialize the score from localStorage
    let score = loadScore();
    scoreElement.textContent = `Score: ${score}`;  // Display the score on page load

    // Event listener to update the score (e.g., when a button is clicked)
    const updateButton = document.getElementById('update-button');
    if (updateButton) {
        updateButton.addEventListener('click', () => {
            score += 1;  // Increment the score by 1
            saveScore(score);  // Save the updated score and update UI
        });
    }

    // You can reset the score to 0 (or any value) for testing purposes
    // Example: Reset the score when you want to test it
    // localStorage.setItem('playerScore', 0); // Uncomment this line for testing

});
