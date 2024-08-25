// UI.js

class UI {
    constructor() {
        console.log('UI instance created');
    }

    showAlert(message, callback) {
        alert(message);
        if (callback) callback();
    }

    showPlayedCard(player, card) {
        console.log(`Showing played card: ${card.rank} of ${card.suit} for ${player.id}`);
        const playedCardElement = document.querySelector(`.played-card.${player.id}`);
        if (playedCardElement) {
            playedCardElement.style.backgroundImage = `url('assets/card${card.suit}_${card.rank}.png')`;
        } else {
            console.error(`Played card element not found for ${player.id}`);
        }
    }

    updateScoreUI(playerId, score) {
        console.log(`Updating score for ${playerId} to ${score}`);
        const playerNumber = parseInt(playerId.replace('player', ''));
        const selector = `#player${playerNumber} .score`;
        console.log(`Looking for element with selector: ${selector}`);
        const scoreElement = document.querySelector(selector);
        if (scoreElement) {
            console.log(`Score element found, updating text`);
            scoreElement.textContent = `Score: ${score}`;
        } else {
            console.error(`Score element not found for ${playerId}`);
        }
    }

    initializeHandUI(player, callback) {
        const handElement = document.querySelector(`#${player.id} .hand`);
        if (handElement) {
            // Clear existing cards and slots
            handElement.innerHTML = '';
    
            // Create slots
            for (let i = 0; i < 5; i++) {
                const slotElement = document.createElement('div');
                slotElement.classList.add('slot');
                slotElement.dataset.slotIndex = i;
                handElement.appendChild(slotElement);
            }
    
            // Add cards to slots
            player.hand.forEach((card, index) => {
                if (card && card.suit && card.rank) {
                    const slotElement = handElement.querySelector(`.slot[data-slot-index="${index}"]`);
                    if (slotElement) {
                        const cardElement = document.createElement('div');
                        cardElement.classList.add('card');
                        cardElement.style.backgroundImage = `url('assets/card${card.suit}_${card.rank}.png')`;
                        cardElement.dataset.suit = card.suit;
                        cardElement.dataset.rank = card.rank;
                        slotElement.appendChild(cardElement);
                    } else {
                        console.error(`Slot element not found for index ${index} in ${player.id}'s hand`);
                    }
                } else {
                    console.warn(`Invalid card at index ${index} in ${player.id}'s hand:`, card);
                }
            });
        } else {
            console.error(`Hand element not found for ${player.id}`);
        }
        if (callback) callback();
    }

    initializeDeckUI(dealerIndex, trumpCard, callback) {
        const players = ['player1', 'player2', 'player3', 'player4'];
        players.forEach((playerId, index) => {
            const deckElement = document.querySelector(`#${playerId} .deck`);
    
            if (index === dealerIndex) {
                deckElement.style.visibility = 'visible';
                deckElement.style.backgroundImage = `url('assets/card${trumpCard.suit}_${trumpCard.rank}.png')`;
            } else {
                deckElement.style.visibility = 'hidden';
            }
        });
        // Use requestAnimationFrame to ensure the DOM has updated before calling the callback
        requestAnimationFrame(() => {
            if (callback) callback();
        });
    }

    updatePlayerHandUIAfterRob(player, discardedCardIndex, trumpCard) {
        const handElement = document.querySelector(`#${player.id} .hand`);
        if (handElement) {
            const slotElement = handElement.querySelector(`.slot[data-slot-index="${discardedCardIndex}"]`);
            if (slotElement) {
                // Remove the old card
                slotElement.querySelector('.card')?.remove();

                // Add the new trump card
                const cardElement = document.createElement('div');
                cardElement.classList.add('card');
                cardElement.style.backgroundImage = `url('assets/card${trumpCard.suit}_${trumpCard.rank}.png')`;
                cardElement.dataset.suit = trumpCard.suit;
                cardElement.dataset.rank = trumpCard.rank;
                slotElement.appendChild(cardElement);
                
                // Add animation class
                cardElement.classList.add('robbed-card');
                setTimeout(() => {
                    cardElement.classList.remove('robbed-card');
                }, 1000);
            } else {
                console.error(`Slot element at index ${discardedCardIndex} not found for ${player.id}`);
            }
        } else {
            console.error(`Hand element not found for ${player.id}`);
        }
    }


    enableCardSelection(player, callback) {
        const handElement = document.querySelector(`#${player.id} .hand`);
        const cardElements = handElement.querySelectorAll('.card');
    
        this.cardSelectionCallback = (event) => {
            const cardElement = event.target.closest('.card');
            if (cardElement) {
                const selectedCard = {
                    suit: cardElement.dataset.suit,
                    rank: cardElement.dataset.rank
                };
                callback(selectedCard);
            }
        };
    
        cardElements.forEach(card => {
            card.addEventListener('click', this.cardSelectionCallback);
            card.classList.add('selectable');
        });
    }


    enableCardSelectionForRob(player, trumpSuit, callback) {
        const handElement = document.querySelector(`#${player.id} .hand`);
        const cardElements = handElement.querySelectorAll('.card');
    
        this.cardSelectionCallback = (event) => {
            const selectedCard = this.getCardFromElement(event.target);
            if (selectedCard.suit === trumpSuit && selectedCard.rank === 'A') {
                this.showAlert("You cannot use the Ace of trumps to pay for the rob. Please select another card.");
            } else {
                callback(selectedCard);
            }
        };
    
        cardElements.forEach(card => {
            const cardData = this.getCardFromElement(card);
            if (!(cardData.suit === trumpSuit && cardData.rank === 'A')) {
                card.addEventListener('click', this.cardSelectionCallback);
                card.classList.add('selectable');
            } else {
                card.classList.add('not-selectable');
            }
        });
    }

    disableCardSelection(player) {
        const handElement = document.querySelector(`#${player.id} .hand`);
        const cardElements = handElement.querySelectorAll('.card');

        cardElements.forEach(card => {
            card.removeEventListener('click', this.cardSelectionCallback);
            card.classList.remove('selectable');
        });
    }


    highlightPlayableCards(player, playableCards) {
        const handElement = document.querySelector(`#${player.id} .hand`);
        const cardElements = handElement.querySelectorAll('.card');

        cardElements.forEach(cardElement => {
            const card = this.getCardFromElement(cardElement);
            if (playableCards.some(pc => pc.suit === card.suit && pc.rank === card.rank)) {
                cardElement.classList.add('playable');
            } else {
                cardElement.classList.remove('playable');
            }
        });
    }

    updatePlayerHandUI(player, emptySlots) {
        const handElement = document.querySelector(`#${player.id} .hand`);
        if (handElement) {
            const slotElements = handElement.querySelectorAll('.slot');
            slotElements.forEach((slot, index) => {
                if (emptySlots.has(index)) {
                    slot.innerHTML = '';
                } else {
                    const card = player.hand[index - Array.from(emptySlots).filter(i => i < index).length];
                    if (card) {
                        slot.innerHTML = '';
                        const cardElement = document.createElement('div');
                        cardElement.classList.add('card');
                        cardElement.style.backgroundImage = `url('assets/card${card.suit}_${card.rank}.png')`;
                        cardElement.dataset.suit = card.suit;
                        cardElement.dataset.rank = card.rank;
                        slot.appendChild(cardElement);
                    }
                }
            });
        } else {
            console.error(`Hand element not found for ${player.id}`);
        }
    }

    updateDeckUIAfterRob(dealerIndex) {
        const deckElement = document.querySelector(`#player${dealerIndex + 1} .deck`);
        if (deckElement) {
            // Change the top card of the deck to show the card back
            deckElement.style.backgroundImage = `url('assets/card_back.png')`;
        } else {
            console.error('Deck element not found');
        }
    }

    getCardFromElement(cardElement) {
        const backgroundImage = cardElement.style.backgroundImage;
        const match = backgroundImage.match(/card(\w+)_(\w+)\.png/);
        if (match) {
            return { suit: match[1], rank: match[2] };
        }
        console.warn("Could not extract card data from element:", cardElement);
        return null;
    }

    clearPlayedCard(playerId) {
        const playedCardElement = document.querySelector(`.played-card.${playerId}`);
        if (playedCardElement) {
            playedCardElement.style.backgroundImage = '';
        } else {
            console.warn(`Played card element not found for ${playerId}`);
        }
    }
    
    clearAllPlayedCards() {
        const playedCardElements = document.querySelectorAll('.played-card');
        playedCardElements.forEach(element => {
            element.style.backgroundImage = '';
        });
    }

    resetGameUI() {
        this.clearAllPlayedCards();
        const players = ['player1', 'player2', 'player3', 'player4'];
        players.forEach(playerId => {
            const handElement = document.querySelector(`#${playerId} .hand`);
            if (handElement) {
                handElement.innerHTML = '';
            }
            this.updateScoreUI(playerId, 0);
            const deckElement = document.querySelector(`#${playerId} .deck`);
            if (deckElement) {
                deckElement.style.visibility = 'hidden';
            }
        });
    }
}

console.log('UI instance methods:', Object.getOwnPropertyNames(UI.prototype));
const ui = new UI();
export default ui;