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

function getPlayableCards(player, leadCard, trumpSuit) {
    if (!leadCard) {
        return player.hand;
    }

    const hasLeadSuit = player.hand.some(card => card.suit === leadCard.suit);
    const hasTrump = player.hand.some(card => card.suit === trumpSuit || (card.suit === 'Hearts' && card.rank === 'A'));

    if (hasLeadSuit) {
        return player.hand.filter(card => card.suit === leadCard.suit);
    } else if (hasTrump) {
        return player.hand.filter(card => card.suit === trumpSuit || (card.suit === 'Hearts' && card.rank === 'A'));
    } else {
        return player.hand;
    }

    

}

export default Player;
export { Player, AIPlayer };