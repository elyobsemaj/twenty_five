// CardRules.js

function canPlayCard(player, card, leadCard, leadSuit, trumpSuit) {
    // Ensure the card is valid before logging its properties
    if (!player || !Array.isArray(player.hand)) {
        console.error('Invalid player or player hand', player);
        return [];
    }
    console.log(`Checking playability for ${card.rank} of ${card.suit}`);
    console.log(`Lead card: ${leadCard ? leadCard.rank + ' of ' + leadCard.suit : 'None'}`);
    console.log(`Lead suit: ${leadSuit}, Trump suit: ${trumpSuit}`);

    // If we're checking the whole hand, return an array of playable cards
    if (!card) {
        return player.hand.filter(c => c !== null && canPlayCard(player, c, leadCard, leadSuit, trumpSuit));
    }

    // Ensure the card is valid
    if (!card || typeof card !== 'object' || !card.rank || !card.suit) {
        console.error('Invalid card:', card);
        return false;
    }

    // If no lead card, all cards are playable
    if (!leadCard) {
        console.log('No lead card, all cards are playable');
        return true;
    }

    const hasLeadSuit = player.hand.some(c => c !== null && c.suit === leadSuit && !(c.suit === 'Hearts' && c.rank === 'A'));
    const hasTrump = player.hand.some(c => c !== null && (c.suit === trumpSuit || (c.suit === 'Hearts' && c.rank === 'A')));
    const hasAceOfHearts = player.hand.some(c => c !== null && c.suit === 'Hearts' && c.rank === 'A');
    const hasJackOfTrump = player.hand.some(c => c !== null && c.suit === trumpSuit && c.rank === 'J');
    const has5OfTrump = player.hand.some(c => c !== null && c.suit === trumpSuit && c.rank === '5');
    const hasOtherTrump = player.hand.some(c =>
        c !== null &&
        ((c.suit === trumpSuit && !(c.rank === 'J' || c.rank === '5')) ||
        (c.suit === 'Hearts' && c.rank === 'A'))
    );

    console.log(`Has lead suit: ${hasLeadSuit}, Has trump: ${hasTrump}`);
    console.log(`Has Ace of Hearts: ${hasAceOfHearts}, Has Jack of Trump: ${hasJackOfTrump}, Has 5 of Trump: ${has5OfTrump}`);
    
    //Check if the card is 5 of trumps
    if (card.suit === trumpSuit && card.rank === '5') {
        console.log('Card is 5 of trumps, can always be reneged');
        return true;
    }
    //If player only has 5 of trumps as their trump/lead suit card, treat as if they have no trump/lead suit
    if ((hasLeadSuit || hasTrump) && has5OfTrump && !hasOtherTrump && card.suit !== trumpSuit) {
        console.log('Player only has 5 of trumps, can play any card');
        return true;
    }

    // Ace of Hearts, Jack of trump, and 5 of trump are always playable
    if ((card.suit === 'Hearts' && card.rank === 'A') ||
        (card.suit === trumpSuit && (card.rank === 'J' || card.rank === '5'))) {
        console.log('Special card (A♥, J♠, or 5♠) is always playable');
        return true;
    }

    // Player can play lead suit or trump
    if (card.suit === leadSuit || card.suit === trumpSuit) {
        console.log('Card is lead suit or trump, it is playable');
        return true;
    }

    // If player has the lead suit, they must play it
    if (hasLeadSuit) {
        const isLeadSuit = card.suit === leadSuit && !(card.suit === 'Hearts' && card.rank === 'A');
        console.log(`Player has lead suit. Card ${isLeadSuit ? 'is' : 'is not'} lead suit`);
        return isLeadSuit;
    }

    // If player doesn't have the lead suit, they can play any card
    if (!hasLeadSuit) {
        console.log('Player does not have lead suit, can play any card');
        return true;
    }

    // Special cases for when trump is led
    if (leadCard.suit === trumpSuit || (leadCard.suit === 'Hearts' && leadCard.rank === 'A')) {
        console.log('Trump was led');
        // If 5 of trumps is led
        if (leadCard.rank === '5' && !hasOtherTrump) {
            console.log('5 of trumps was led and player has no other trump');
            if (hasJackOfTrump && hasAceOfHearts) {
                const result = (card.suit === trumpSuit && card.rank === 'J') || (card.suit === 'Hearts' && card.rank === 'A');
                console.log(`Player has J♠ and A♥. Card ${result ? 'is' : 'is not'} J♠ or A♥`);
                return result;
            }
            if (hasJackOfTrump) {
                const result = card.suit === trumpSuit && card.rank === 'J';
                console.log(`Player has J♠. Card ${result ? 'is' : 'is not'} J♠`);
                return result;
            }
            if (hasAceOfHearts) {
                const result = card.suit === 'Hearts' && card.rank === 'A';
                console.log(`Player has A♥. Card ${result ? 'is' : 'is not'} A♥`);
                return result;
            }
        }
        // If Jack of trumps is led
        if (leadCard.rank === 'J' && !hasOtherTrump) {
            console.log('J♠ was led and player has no other trump');
            if (hasAceOfHearts) {
                const result = card.suit === 'Hearts' && card.rank === 'A';
                console.log(`Player has A♥. Card ${result ? 'is' : 'is not'} A♥`);
                return result;
            }
        }
        // For other trump leads
        if (hasTrump) {
            const result = card.suit === trumpSuit || (card.suit === 'Hearts' && card.rank === 'A');
            console.log(`Player has trump. Card ${result ? 'is' : 'is not'} trump or A♥`);
            return result;
        }
    }

    // If Ace of Hearts is led, but hearts is not trump
    if (leadCard.suit === 'Hearts' && leadCard.rank === 'A' && trumpSuit !== 'Hearts') {
        console.log('A♥ was led but Hearts is not trump');
        if (!hasTrump) {
            const result = card.suit === 'Hearts' || !player.hand.some(c => c !== null && c.suit === 'Hearts');
            console.log(`Player has no trump. Card ${result ? 'is' : 'is not'} Hearts or player has no Hearts`);
            return result;
        }
    }

    // If none of the above conditions are met, the card is playable
    console.log('No special conditions met, card is playable');
    return true;
}

export { canPlayCard};