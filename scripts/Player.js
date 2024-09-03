// Player.js

class Player {
    constructor(id, isHuman) {
        this.id = id;
        this.isHuman = isHuman;
        this.hand = [];
        this.isDealer = false;
        this.score = 0;
    }

    addToHand(card) {
        this.hand.push(card);
    }

    removeFromHand(card) {
        this.hand = this.hand.filter(c => !(c.suit === card.suit && c.rank === card.rank));
    }

    removeCard(card) {
        this.hand = this.hand.filter(c => c.suit !== card.suit || c.rank !== card.rank);
    }

    setDealer(isDealer) {
        this.isDealer = isDealer;
    }

    updateScore(points) {
        this.score += points;
    }
}

class AIPlayer extends Player {
    constructor(id) {
        super(id, false);
    }

    selectCard(leadCard, trumpSuit) {
        const playableCards = getPlayableCards(this, leadCard, trumpSuit);
        return playableCards[Math.floor(Math.random() * playableCards.length)];
    }
}

export default Player;
export { Player, AIPlayer };