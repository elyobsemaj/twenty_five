// CardRules.js

function canPlayCard(player, card, leadCard, leadSuit, trumpSuit) {
    // If there's no lead card, this is the first play of the trick
    if (!leadCard) {
        return true;
    }

    const hasLeadSuit = player.hand.some(c => c !== null && c.suit === leadSuit && !(c.suit === 'Hearts' && c.rank === 'A'));
    const hasTrump = player.hand.some(c => c !== null && (c.suit === trumpSuit || (c.suit === 'Hearts' && c.rank === 'A')));
    const hasAceOfHearts = player.hand.some(c => c !== null && c.suit === 'Hearts' && c.rank === 'A');
    const hasOtherTrump = player.hand.some(c =>
        c !== null &&
        ((c.suit === trumpSuit && !(c.suit === card.suit && c.rank === card.rank)) ||
        (c.suit === 'Hearts' && c.rank === 'A' && !(c.suit === card.suit && c.rank === card.rank)))
    );
    const hasHeart = player.hand.some(c => c !== null && c.suit === 'Hearts');

    // Special handling for Ace of Hearts (always considered a trump)
    if (card.suit === 'Hearts' && card.rank === 'A') {
        // Ace of Hearts must be played if 5 or J of trumps is led and no other trump
        if (leadCard.suit === trumpSuit && (leadCard.rank === '5' || leadCard.rank === 'J') &&
            !player.hand.some(c => c !== null && c.suit === trumpSuit && c.rank !== 'A')) {
            return true; // Must play Ace of Hearts
        }
        // Otherwise, it can be reneged
        return true;
    }

    // Handling for 5 of trumps
    if (card.suit === trumpSuit && card.rank === '5') {
        return true; // 5 of trumps can always be reneged
    }

    // Handling for J of trumps
    if (card.suit === trumpSuit && card.rank === 'J') {
        if (leadCard.suit === trumpSuit && leadCard.rank === '5' && !hasOtherTrump) {
            return true; // Must play J of trumps if 5 of trumps led and no other trump
        }
        return true; // Can be reneged in other cases
    }

    // New case: Ace of Hearts led, but player has no trump
    if (leadCard.suit === 'Hearts' && leadCard.rank === 'A' && !hasTrump) {
        return card.suit === 'Hearts' || !hasHeart;
    }

    // If trump is led
    if (leadCard.suit === trumpSuit || (leadCard.suit === 'Hearts' && leadCard.rank === 'A')) {
        if (hasTrump) {
            // Must play Ace of Hearts if Jack of trumps is led and it's the only trump
            if (leadCard.rank === 'J' && hasAceOfHearts && !hasOtherTrump) {
                return card.suit === 'Hearts' && card.rank === 'A';
            }
            // Allow playing any card if the only trump is Ace of Hearts
            if (player.hand.filter(c => c !== null && (c.suit === trumpSuit || (c.suit === 'Hearts' && c.rank === 'A'))).length === 1 &&
                player.hand.some(c => c !== null && c.suit === 'Hearts' && c.rank === 'A')) {
                return true;
            }
            return card.suit === trumpSuit || (card.suit === 'Hearts' && card.rank === 'A');
        }
        return true; // Can play any card if no trump
    }

    // If Hearts is led and player only has Ace of Hearts, they can play any card
    if (leadSuit === 'Hearts' && !hasLeadSuit && hasAceOfHearts) {
        return true;
    }

    // If player has the lead suit, they must follow suit or can play trump
    if (hasLeadSuit) {
        return card.suit === leadSuit || card.suit === trumpSuit || (card.suit === 'Hearts' && card.rank === 'A');
    }

    // If player doesn't have the lead suit, they can play any card
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