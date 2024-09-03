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
    const isCardTrump = card.suit === trumpSuit || (card.suit === 'Hearts' && card.rank === 'A');
    const hasLeadSuit = player.hand.some(c => c !== null && c.suit === leadSuit);
    const hasTrump = player.hand.some(c => c !== null && (c.suit === trumpSuit || (c.suit === 'Hearts' && c.rank === 'A')));
    const hasOnlySpecialTrumps = hasTrump && player.hand.every(c => 
        c === null || 
        (c.suit !== trumpSuit && c.suit !== 'Hearts') || 
        (c.suit === trumpSuit && c.rank === '5') || 
        (c.suit === 'Hearts' && c.rank === 'A')
    );
    const hasAceOfHearts = player.hand.some(c => c !== null && c.suit === 'Hearts' && c.rank === 'A');
    const has5OfTrump = player.hand.some(c => c !== null && c.suit === trumpSuit && c.rank === '5');
    const hasJackOfTrump = player.hand.some(c => c !== null && c.suit === trumpSuit && c.rank === 'J');
 
    // New rule: If a trump is led (not 5 or J), and player only has special trumps, all cards are playable
    if (leadCard && leadCard.suit === trumpSuit && leadCard.rank !== '5' && leadCard.rank !== 'J' && hasOnlySpecialTrumps) {
        console.log('Trump led, player only has special trumps, all cards are playable');
        return true;
    }

    // All trumps are always playable
    if (isCardTrump) {
        console.log('Card is trump, always playable');
        return true;
    }

    // All cards that match the led suit are always playable
    if (card.suit === leadSuit) {
        console.log('Card matches led suit, always playable');
        return true;
    }

    // If 5 of trumps led and player has no other trumps than the J of trump or Ace of hearts
    if (leadCard && leadCard.suit === trumpSuit && leadCard.rank === '5' && hasOnlySpecialTrumps) {
        console.log('5 of trumps led, player only has special trumps');
        return (card.suit === trumpSuit && card.rank === 'J') || (card.suit === 'Hearts' && card.rank === 'A');
    }

    // If J of trumps led and player has no other trumps than the Ace of Hearts
    if (leadCard && leadCard.suit === trumpSuit && leadCard.rank === 'J' && hasOnlySpecialTrumps) {
        console.log('J of trumps led, player only has Ace of Hearts');
        return card.suit === 'Hearts' && card.rank === 'A';
    }

    // If player does not have any card that matches the led suit, all their cards are playable
    if (!hasLeadSuit) {
        console.log('Player does not have led suit, all cards playable');
        return true;
    }

    // If Ace of Hearts is led (and it's not trump)
    if (leadCard && leadCard.suit === 'Hearts' && leadCard.rank === 'A' && trumpSuit !== 'Hearts') {
        if (hasTrump) {
            console.log('Ace of Hearts led, player has trump');
            return isCardTrump;
        } else if (player.hand.some(c => c !== null && c.suit === 'Hearts')) {
            console.log('Ace of Hearts led, player has Hearts');
            return card.suit === 'Hearts';
        } else {
            console.log('Ace of Hearts led, player has no trump or Hearts');
            return true;
        }
    }

    // If none of the above conditions are met, the card is not playable
    console.log('Card is not playable');
    return false;
}

export { canPlayCard};