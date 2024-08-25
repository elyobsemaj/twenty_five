// ScoreManager.js

class ScoreManager {
    constructor(players) {
        this.players = players;
    }

    updateScore(playerIndex, points) {
        this.players[playerIndex].score += points;
        return this.players[playerIndex].score;
    }

    getWinner() {
        const winningScore = 25; // Assuming 25 is the winning score
        return this.players.find(player => player.score >= winningScore);
    }

    resetScores() {
        this.players.forEach(player => player.score = 0);
    }
}

export default ScoreManager;