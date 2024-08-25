// Utils.js

/*export function compareCards(cardA, cardB, trumpSuit) {
    const redRanks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const blackRanks = ['10', '9', '8', '7', '6', '5', '4', '3', '2', 'A', 'J', 'Q', 'K'];
    const trumpRanks = ['2', '3', '4', '6', '7', '8', '9', '10', 'Q', 'K', 'A', 'J', '5'];

    // Special case: Ace of Hearts
    if (cardA.suit === 'Hearts' && cardA.rank === 'A') return 1;
    if (cardB.suit === 'Hearts' && cardB.rank === 'A') return -1;

    // If both cards are trump
    if (cardA.suit === trumpSuit && cardB.suit === trumpSuit) {
        return trumpRanks.indexOf(cardB.rank) - trumpRanks.indexOf(cardA.rank);
    }

    // If only one card is trump, it wins
    if (cardA.suit === trumpSuit) return 1;
    if (cardB.suit === trumpSuit) return -1;

    // If neither card is trump, compare ranks
    if (cardA.suit === cardB.suit) {
        const ranks = ['Hearts', 'Diamonds'].includes(cardA.suit) ? redRanks : blackRanks;
        return ranks.indexOf(cardB.rank) - ranks.indexOf(cardA.rank);
    }

    // If suits are different and neither is trump, the first card wins
    return 0;
}*/

function getCardFromElement(cardElement) {
    const backgroundImage = cardElement.style.backgroundImage;
    const match = backgroundImage.match(/card(\w+)_(\w+)\.png/);
    if (match) {
        return { suit: match[1], rank: match[2] };
    }
    console.warn("Could not extract card data from element:", cardElement);
    return null;
}

export {getCardFromElement };