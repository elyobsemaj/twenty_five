// Deck.js

class Deck {
    constructor() {
        this.cards = this.createDeck();
    }

    createDeck() {
        const suits = ['Hearts', 'Diamonds', 'Spades', 'Clubs'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        return suits.flatMap(suit => ranks.map(rank => ({ suit, rank })));
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    deal(numCards) {
        return this.cards.splice(0, numCards);
    }

    reset() {
        this.cards = this.createDeck();
        this.shuffle();
    }
}

export default Deck;