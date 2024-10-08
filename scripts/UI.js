// UI.js

class UI {
    constructor() {
        console.log('UI instance created');
        this.playerNames = {
            player1: 'You',
            player2: 'Sally',
            player3: 'Bob',
            player4: 'Charlie'
        };
        this.updatePlayerNamesUI(); // Initialize UI with default names
    }

    setPlayerNames(names) {
        Object.keys(names).forEach(playerId => {
            if (this.playerNames.hasOwnProperty(playerId)) {
                this.playerNames[playerId] = names[playerId];
            }
        });
        this.updatePlayerNamesUI(); // Update UI with new names
    }

    getPlayerName(playerId) {
        return this.playerNames[playerId] || playerId;
    }

    updatePlayerNamesUI() {
        Object.keys(this.playerNames).forEach(playerId => {
            const nameElement = document.querySelector(`#${playerId} .name`);
            if (nameElement) {
                nameElement.textContent = this.playerNames[playerId];
            } else {
                console.warn(`Name element not found for ${playerId}`);
            }
        });
    }

    updateDealerUI(dealerIndex, callback) {
        const players = ['player1', 'player2', 'player3', 'player4'];
        players.forEach((playerId, index) => {
            const deckElement = document.querySelector(`#${playerId} .deck`);
            if (deckElement) {
                if (index === dealerIndex) {
                    deckElement.style.visibility = 'visible';
                } else {
                    deckElement.style.visibility = 'hidden';
                }
            }
        });
        if (callback) callback();
    }

    showAlert(message, callback) {
        // Replace both "Player X" and "Player playerX" formats with names
        Object.keys(this.playerNames).forEach(playerId => {
            const playerNumber = playerId.replace('player', '');
            const regexFormats = [
                new RegExp(`Player ${playerNumber}\\b`, 'g'),
                new RegExp(`Player ${playerId}\\b`, 'g')
            ];
            
            regexFormats.forEach(regex => {
                message = message.replace(regex, this.playerNames[playerId]);
            });
        });
        
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
                        if (player.isHuman) {
                            cardElement.style.backgroundImage = `url('assets/card${card.suit}_${card.rank}.png')`;
                        } else {
                            cardElement.style.backgroundImage = `url('assets/card_back.png')`;
                            cardElement.classList.add('face-down');
                        }
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
                // Store the trump suit on the deck element
                deckElement.dataset.trumpSuit = trumpCard.suit;
            } else {
                deckElement.style.visibility = 'hidden';
            }
        });
        // Use requestAnimationFrame to ensure the DOM has updated before calling the callback
        requestAnimationFrame(() => {
            if (callback) callback();
        });
    }

    enableCardSelection(player, callback) {
        const handElement = document.querySelector(`#${player.id} .hand`);
        const cardElements = handElement.querySelectorAll('.card');

        this.cardSelectionHandler = (event) => {
            event.preventDefault(); // Prevent default behavior for both click and touch
            const cardElement = event.target.closest('.card');
            if (cardElement && cardElement.dataset.suit && cardElement.dataset.rank) {
                const selectedCard = {
                    suit: cardElement.dataset.suit,
                    rank: cardElement.dataset.rank
                };
                callback(selectedCard);
            }
        };

        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;

        cardElements.forEach(card => {
            if (card.dataset.suit && card.dataset.rank) {
                if (isTouchDevice) {
                    card.addEventListener('touchstart', this.cardSelectionHandler);
                } else {
                    card.addEventListener('click', this.cardSelectionHandler);
                }
                card.classList.add('selectable');
            }
        });
    }

    disableCardSelection(player) {
        const handElement = document.querySelector(`#${player.id} .hand`);
        const cardElements = handElement.querySelectorAll('.card');

        cardElements.forEach(card => {
            // Remove both click and touch event listeners
            card.removeEventListener('click', this.cardSelectionHandler);
            card.removeEventListener('touchstart', this.cardSelectionHandler);
            
            // Remove all selection-related classes
            card.classList.remove('selectable', 'not-selectable');
        });

        // Clear the stored handler
        this.cardSelectionHandler = null;
    }

    enableCardSelectionForRob(player, trumpSuit, callback) {
        const handElement = document.querySelector(`#${player.id} .hand`);
        const cardElements = handElement.querySelectorAll('.card');

        this.cardSelectionHandler = (event) => {
            event.preventDefault();
            const cardElement = event.target.closest('.card');
            if (cardElement && cardElement.dataset.suit && cardElement.dataset.rank) {
                const selectedCard = {
                    suit: cardElement.dataset.suit,
                    rank: cardElement.dataset.rank
                };
                if (selectedCard.suit === trumpSuit && selectedCard.rank === 'A') {
                    this.showAlert("You cannot use the Ace of trumps to pay for the rob. Please select another card.");
                } else {
                    callback(selectedCard);
                }
            }
        };

        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;

        cardElements.forEach(card => {
            const cardData = this.getCardFromElement(card);
            if (!(cardData.suit === trumpSuit && cardData.rank === 'A')) {
                if (isTouchDevice) {
                    card.addEventListener('touchstart', this.cardSelectionHandler);
                } else {
                    card.addEventListener('click', this.cardSelectionHandler);
                }
                card.classList.add('selectable');
            } else {
                card.classList.add('not-selectable');
            }
        });
    }

    highlightPlayableCards(player, playableCards) {
        const handElement = document.querySelector(`#${player.id} .hand`);
        const cardElements = handElement.querySelectorAll('.card');

        cardElements.forEach(cardElement => {
            const card = this.getCardFromElement(cardElement);
            if (card) {
                const isPlayable = playableCards.some(pc => pc.suit === card.suit && pc.rank === card.rank);
                if (isPlayable) {
                    cardElement.classList.add('playable');
                } else {
                    cardElement.classList.remove('playable');
                }
            }
        });
    }

    updatePlayerHandUI(player, emptySlots) {
        console.log(`Updating hand UI for ${player.id}`);
        console.log(`Player's hand:`, JSON.stringify(player.hand));
        console.log(`Empty slots:`, Array.from(emptySlots));
    
        const handElement = document.querySelector(`#${player.id} .hand`);
        if (handElement) {
            const slotElements = handElement.querySelectorAll('.slot');
            slotElements.forEach((slot, index) => {
                console.log(`Processing slot ${index} for ${player.id}`);
                const card = player.hand[index];
                if (emptySlots.has(index)) {
                    console.log(`Slot ${index} is empty`);
                    slot.innerHTML = '';
                } else if (card) {
                    console.log(`Adding card to slot ${index}:`, JSON.stringify(card));
                    let cardElement = slot.querySelector('.card');
                    if (!cardElement) {
                        cardElement = document.createElement('div');
                        cardElement.classList.add('card');
                        slot.appendChild(cardElement);
                    }
    
                    if (player.isHuman) {
                        cardElement.style.backgroundImage = `url('assets/card${card.suit}_${card.rank}.png')`;
                        cardElement.classList.remove('face-down');
                    } else {
                        cardElement.style.backgroundImage = `url('assets/card_back.png')`;
                        cardElement.classList.add('face-down');
                    }
                    cardElement.dataset.suit = card.suit;
                    cardElement.dataset.rank = card.rank;
                }
            });
            console.log(`Finished updating hand UI for ${player.id}`);
        } else {
            console.error(`Hand element not found for ${player.id}`);
        }
    }

    updateDeckUIAfterRob(dealerIndex) {
        const deckElement = document.querySelector(`#player${dealerIndex + 1} .deck`);
        if (deckElement) {
            const trumpSuit = deckElement.dataset.trumpSuit;
            // Change the top card of the deck to show the trump suit card
            deckElement.style.backgroundImage = `url('assets/card${trumpSuit}.png')`;
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

    updatePlayerHandUIAfterRob(player, discardedCardIndex, trumpCard) {
        const handElement = document.querySelector(`#${player.id} .hand`);
        if (handElement) {
            const slotElements = handElement.querySelectorAll('.slot');
            slotElements.forEach((slot, index) => {
                const card = player.hand[index];
                if (index === discardedCardIndex) {
                    // Remove the old card
                    slot.innerHTML = '';
                    
                    // Add the new trump card
                    const cardElement = document.createElement('div');
                    cardElement.classList.add('card');
                    cardElement.style.backgroundImage = `url('assets/card${trumpCard.suit}_${trumpCard.rank}.png')`;
                    cardElement.dataset.suit = trumpCard.suit;
                    cardElement.dataset.rank = trumpCard.rank;
                    slot.appendChild(cardElement);
                    
                    // Add animation class
                    cardElement.classList.add('robbed-card');
                    setTimeout(() => {
                        cardElement.classList.remove('robbed-card');
                    }, 1000);
                } else if (card) {
                    // Update other cards if needed
                    const cardElement = slot.querySelector('.card');
                    if (cardElement) {
                        if (player.isHuman) {
                            cardElement.style.backgroundImage = `url('assets/card${card.suit}_${card.rank}.png')`;
                        } else {
                            cardElement.style.backgroundImage = `url('assets/card_back.png')`;
                        }
                        cardElement.dataset.suit = card.suit;
                        cardElement.dataset.rank = card.rank;
                    }
                }
            });
        } else {
            console.error(`Hand element not found for ${player.id}`);
        }
    }

}



console.log('UI instance methods:', Object.getOwnPropertyNames(UI.prototype));
const ui = new UI();
export default ui;