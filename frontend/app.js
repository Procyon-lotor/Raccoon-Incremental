// Basic variables
let score = 0;
const scoreElement = document.getElementById('score');
const startButton = document.getElementById('startButton');

// Event listener for the button
startButton.addEventListener('click', () => {
  score += 1;  // Increase score
  scoreElement.textContent = `Score: ${score}`;  // Update score display
});

// Fetch the current score from the backend
async function getScore() {
    const response = await fetch('http://127.0.0.1:5000/get_score');
    const data = await response.json();
    document.getElementById('score').textContent = `Score: ${data.score}`;
  }
  
  // Update the score on the backend
  async function updateScore(newScore) {
    console.log('Sending score update:', newScore);  // Debug log
    const response = await fetch('http://127.0.0.1:5000/update_score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ score: newScore }),
    });
    const data = await response.json();
    console.log(data.message);  // Log success message
  }

  // Event listener for the button
  document.getElementById('startButton').addEventListener('click', async () => {
    let score = parseInt(document.getElementById('score').textContent.split(' ')[1]);
    score += 1;  // Increase score
    await updateScore(score);  // Update score in the backend
    getScore();  // Fetch updated score from backend
  });
  