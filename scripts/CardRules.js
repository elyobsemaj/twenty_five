// CardRules.js

function canPlayCard(player, card, leadCard, leadSuit, trumpSuit) {
    console.log(`Checking playability for ${card.rank} of ${card.suit}`);
    console.log(`Lead card: ${leadCard ? leadCard.rank + ' of ' + leadCard.suit : 'None'}`);
    console.log(`Lead suit: ${leadSuit}, Trump suit: ${trumpSuit}`);

    // If no lead card, all cards are playable
    if (!leadCard) {
        console.log('No lead card, card is playable');
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

function initiateRobbing(game, players, trumpCard, callback) {
    const dealer = players.find(p => p.isDealer);
    
    if (dealer && trumpCard.rank === 'A' && !game.playersWhoHaveRobbed.has(dealer.id)) {
        handleDealerRob(game, dealer, trumpCard, callback);
    } else {
        callback();
    }
}


function checkAndHandleRobbing(game, player, trumpCard, callback) {
    console.log(`Checking robbing for ${player.id}. Has robbed: ${game.playersWhoHaveRobbed.has(player.id)}`);

    if (game.playersWhoHaveRobbed.has(player.id)) {
        console.log(`${player.id} has already robbed this hand. Skipping rob check.`);
        callback();
        return;
    }

    const aceOfTrumps = player.hand.find(card => card && card.suit === trumpCard.suit && card.rank === 'A');

    if (aceOfTrumps) {
        handlePlayerRob(game, player, trumpCard, () => {
            game.playersWhoHaveRobbed.add(player.id);
            console.log(`${player.id} has now robbed. Added to playersWhoHaveRobbed.`);
            callback();
        });
    } else {
        callback();
    }
}


function handlePlayerRob(game, player, trumpCard, callback) {
    if (player.isHuman) {
        game.ui.showAlert("You must rob. Select a card to pay for the rob.", () => {
            const enableRobSelection = () => {
                game.ui.enableCardSelectionForRob(player, trumpCard.suit, (selectedCard) => {
                    if (selectedCard.suit === trumpCard.suit && selectedCard.rank === 'A') {
                        game.ui.showAlert("You cannot use the Ace of trumps to pay for the rob. Please select another card.", enableRobSelection);
                    } else {
                        performRob(game, player, selectedCard, trumpCard);
                        game.playersWhoHaveRobbed.add(player.id);
                        console.log(`${player.id} has now robbed. Added to playersWhoHaveRobbed.`);
                        callback();
                    }
                });
            };
            enableRobSelection();
        });
    } else {
        const selectedCard = selectCardForRob(game, player, trumpCard.suit);
        performRob(game, player, selectedCard, trumpCard);
        game.playersWhoHaveRobbed.add(player.id);
        game.ui.showAlert(`Player ${player.id} is robbing.`, callback);
    }
}

async function handleDealerRob(game, dealer, trumpCard) {
    return new Promise((resolve) => {
        if (game.playersWhoHaveRobbed.has(dealer.id)) {
            console.log(`Dealer ${dealer.id} has already robbed this hand.`);
            resolve();
            return;
        }

        game.ui.showAlert(`${game.ui.getPlayerName(dealer.id)} (Dealer) is robbing.`, () => {
            if (dealer.isHuman) {
                game.ui.showAlert("You (the dealer) must rob the Ace. Select a card to pay for the rob.", () => {
                    game.ui.enableCardSelection(dealer, (selectedCard) => {
                        if (selectedCard.suit === trumpCard.suit && selectedCard.rank === 'A') {
                            game.ui.showAlert("You cannot use the Ace of trumps to pay for the rob. Please select another card.", () => {
                                game.ui.enableCardSelection(dealer, (newSelectedCard) => {
                                    performRob(game, dealer, newSelectedCard, trumpCard);
                                    game.playersWhoHaveRobbed.add(dealer.id);
                                        game.isFirstTurnAfterDeal = false;
                                        console.log("Human dealer rob completed");
                                        resolve();
                                });
                            });
                        } else {
                            performRob(game, dealer, selectedCard, trumpCard);
                            game.playersWhoHaveRobbed.add(dealer.id);
                                game.isFirstTurnAfterDeal = false;
                                console.log("Human dealer rob completed");
                                resolve();
                        }
                    });
                });
            } else {
                const selectedCard = game.selectCardForRob(dealer, trumpCard.suit);
                performRob(game, dealer, selectedCard, trumpCard);
                game.playersWhoHaveRobbed.add(dealer.id);
                game.isFirstTurnAfterDeal = false;
                console.log("AI dealer rob completed");
                resolve();
            }
        });
    });
}

function selectCardForRob(game, player, trumpSuit) {
    // Filter out the Ace of trumps and return the first valid card
    return player.hand.find(card => !(card.suit === trumpSuit && card.rank === 'A'));
}



function performRob(game, player, selectedCard, trumpCard) {
    if (!trumpCard || typeof trumpCard !== 'object') {
        console.error('Invalid trumpCard in performRob:', trumpCard);
        return;
    }
    console.log(`${player.id}'s hand before robbing:`, JSON.stringify(player.hand));
    console.log(`${player.id} is robbing. Discarding ${selectedCard.rank} of ${selectedCard.suit} and taking ${trumpCard.rank} of ${trumpCard.suit}`);

    // Check if the selected card is the Ace of trumps
    if (selectedCard.suit === trumpCard.suit && selectedCard.rank === 'A') {
        console.error("Cannot use Ace of trumps to pay for rob");
        if (player.isHuman) {
            game.ui.showAlert("You cannot use the Ace of trumps to pay for the rob. Please select another card.", () => {
                game.ui.enableCardSelectionForRob(player, trumpCard.suit, (newSelectedCard) => {
                    performRob(game, player, newSelectedCard, trumpCard);
                });
            });
        } else {
            // For AI, select a different card
            const newSelectedCard = selectCardForRob(game, player, trumpCard.suit);
            performRob(game, player, newSelectedCard, trumpCard);
        }
        return;
    }

    const initialHandSize = player.hand.length;
    const discardedCardIndex = player.hand.findIndex(card =>
        card.suit === selectedCard.suit && card.rank === selectedCard.rank
    );

    console.log(`Discarding card at index ${discardedCardIndex}`);

    // Remove the selected card
    player.hand.splice(discardedCardIndex, 1);

    console.log(`Hand after discarding:`, JSON.stringify(player.hand));

    // Add the trump card at the same index
    player.hand.splice(discardedCardIndex, 0, trumpCard);

    console.log(`Hand after adding trump card:`, JSON.stringify(player.hand));

    if (game.ui && typeof game.ui.updatePlayerHandUIAfterRob === 'function') {
        game.ui.updatePlayerHandUIAfterRob(player, discardedCardIndex, trumpCard);
    } else {
        console.error('UI method updatePlayerHandUIAfterRob is not available', game.ui);
    }

    if (game.ui && typeof game.ui.updateDeckUIAfterRob === 'function') {
        const dealerIndex = game.players.findIndex(p => p.isDealer);
        game.ui.updateDeckUIAfterRob(dealerIndex);
    } else {
        console.error('UI method updateDeckUIAfterRob is not available', game.ui);
    }

    console.log(`${player.id}'s hand after robbing:`, JSON.stringify(player.hand));

    if (player.hand.length !== initialHandSize) {
        console.error(`Error in robbing process: Hand size changed from ${initialHandSize} to ${player.hand.length}`);
    }

    game.playersWhoHaveRobbed.add(player.id);
    console.log(`${player.id} has now robbed. Added to playersWhoHaveRobbed.`);
}


export { canPlayCard, initiateRobbing, checkAndHandleRobbing , performRob, handleDealerRob, handlePlayerRob};