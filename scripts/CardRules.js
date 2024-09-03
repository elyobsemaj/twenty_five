// CardRules.js

function canPlayCard(player, card, leadCard, leadSuit, trumpSuit) {
    // Helper functions
    const isRenegeableTrump = (c) => c && ((c.suit === trumpSuit && (c.rank === '5' || c.rank === 'J')) || (c.suit === 'Hearts' && c.rank === 'A'));
    const isRegularTrump = (c) => c && c.suit === trumpSuit && !isRenegeableTrump(c);
    const isTrump = (c) => c && (isRenegeableTrump(c) || isRegularTrump(c));

    // Problem: These functions don't handle null cards properly
    const hasOnlyRenegeableTrumps = () => player.hand.filter(isTrump).every(isRenegeableTrump);
    const hasRegularTrumps = () => player.hand.some(isRegularTrump);
    const hasTrumps = () => player.hand.some(isTrump);
    const hasLedSuit = () => player.hand.some(c => c && c.suit === leadCard.suit && !isTrump(c));

    // If we're checking the whole hand, return an array of playable cards
    if (!card) {
        return player.hand.filter(c => c !== null && canPlayCard(player, c, leadCard, trumpSuit));
    }

    // Ensure the card is valid
    if (!card || typeof card !== 'object' || !card.rank || !card.suit) {
        console.error('Invalid card:', card);
        return false;
    }

    // If no lead card, all cards are playable
    if (!leadCard) return true;

    // Ace of Hearts is always playable
    if (card.suit === 'Hearts' && card.rank === 'A') return true;

    // 5 of trump led
    if (leadCard.suit === trumpSuit && leadCard.rank === '5') {
        if (hasOnlyRenegeableTrumps()) return isRenegeableTrump(card);
        if (hasTrumps()) return isTrump(card);
        return true;
    }

    // J of trump led
    if (leadCard.suit === trumpSuit && leadCard.rank === 'J') {
        if (player.hand.some(c => c.suit === trumpSuit && c.rank === '5')) return true;
        if (hasTrumps()) return isTrump(card) && card.rank !== '5';
        return true;
    }

    // AH led
    if (leadCard.suit === 'Hearts' && leadCard.rank === 'A') {
        if (trumpSuit !== 'Hearts') {
            if (player.hand.some(c => c.suit === trumpSuit && (c.rank === '5' || c.rank === 'J'))) return true;
            if (hasRegularTrumps()) return isTrump(card);
            return true;
        } else {
            if (player.hand.some(c => c.suit === 'Hearts' && (c.rank === '5' || c.rank === 'J'))) return true;
            if (hasRegularTrumps()) return card.suit === 'Hearts';
            if (player.hand.some(c => c.suit === 'Hearts')) return card.suit === 'Hearts';
            return true;
        }
    }

    // Regular trump led
    if (leadCard.suit === trumpSuit && !isRenegeableTrump(leadCard)) {
        if (hasOnlyRenegeableTrumps()) return true;
        if (hasTrumps()) return isTrump(card);
        return true;
    }

    // Non-trump led
    if (leadCard.suit !== trumpSuit && !(leadCard.suit === 'Hearts' && leadCard.rank === 'A')) {
        if (hasLedSuit()) {
            // Can play led suit or trumps
            return card.suit === leadCard.suit || isTrump(card);
        }
        // If no led suit, can play anything
        return true;
    }

    // If we've reached this point, the card is not playable
    return false;
}

export { canPlayCard};