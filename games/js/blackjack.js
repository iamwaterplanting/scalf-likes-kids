// Blackjack Game Logic
console.log('Blackjack game loaded');

// Game state
let playerHand = [];
let dealerHand = [];
let deck = [];
let currentBet = 0;
let gameInProgress = false;
let playerStood = false;
let doubleDown = false;

// Game stats
let handsPlayed = 0;
let handsWon = 0;
let blackjacks = 0;
let totalProfit = 0;

// Card constants
const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const suitSymbols = {
    'hearts': '♥',
    'diamonds': '♦',
    'clubs': '♣',
    'spades': '♠'
};

// Sound effects
const dealSound = new Audio('../assets/sounds/card-deal.mp3');
const winSound = new Audio('../assets/sounds/win.mp3');
const loseSound = new Audio('../assets/sounds/lose.mp3');
const clickSound = new Audio('../assets/sounds/click.mp3');
const chipSound = new Audio('../assets/sounds/chip.mp3');
const flipSound = new Audio('../assets/sounds/card-flip.mp3');

// DOM Elements
let playerHandElement;
let dealerHandElement;
let playerScoreElement;
let dealerScoreElement;
let betAmountElement;
let resultMessageElement;
let betChipsElement;
let dealButton;
let hitButton;
let standButton;
let doubleButton;
let newHandButton;
let handsPlayedElement;
let handsWonElement;
let blackjacksElement;
let totalProfitElement;

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Blackjack game');
    
    // Initialize DOM elements
    playerHandElement = document.getElementById('playerHand');
    dealerHandElement = document.getElementById('dealerHand');
    playerScoreElement = document.getElementById('playerScore');
    dealerScoreElement = document.getElementById('dealerScore');
    betAmountElement = document.getElementById('betAmount');
    resultMessageElement = document.getElementById('resultMessage');
    betChipsElement = document.getElementById('betChips');
    dealButton = document.getElementById('dealButton');
    hitButton = document.getElementById('hitButton');
    standButton = document.getElementById('standButton');
    doubleButton = document.getElementById('doubleButton');
    newHandButton = document.getElementById('newHandButton');
    handsPlayedElement = document.getElementById('handsPlayed');
    handsWonElement = document.getElementById('handsWon');
    blackjacksElement = document.getElementById('blackjacks');
    totalProfitElement = document.getElementById('totalProfit');
    
    // Create a fresh deck
    createDeck();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load game stats from local storage
    loadGameStats();
    
    console.log('Blackjack game initialized');
});

// Create and shuffle a new deck
function createDeck() {
    console.log('Creating new deck');
    deck = [];
    
    for (let suit of suits) {
        for (let value of values) {
            deck.push({ suit, value });
        }
    }
    
    // Shuffle the deck
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    console.log('Deck created and shuffled', deck.length + ' cards');
}

// Set up event listeners
function setupEventListeners() {
    // Betting chips
    const chipElements = document.querySelectorAll('.chip');
    chipElements.forEach(chip => {
        chip.addEventListener('click', () => {
            if (gameInProgress) return;
            
            const chipValue = parseInt(chip.getAttribute('data-value'));
            const currentBalance = parseInt(document.querySelector('.balance-amount').textContent);
            
            if (currentBalance >= chipValue) {
                addToBet(chipValue);
                chipSound.play();
                
                // Add floating animation
                animateChip(chip);
            } else {
                showMessage('Not enough balance!', 'error');
            }
        });
    });
    
    // Deal button
    dealButton.addEventListener('click', () => {
        if (currentBet > 0 && !gameInProgress) {
            startNewHand();
            clickSound.play();
        } else if (currentBet === 0) {
            showMessage('Please place a bet first!', 'error');
        }
    });
    
    // Hit button
    hitButton.addEventListener('click', () => {
        if (gameInProgress && !playerStood) {
            playerHit();
            clickSound.play();
        }
    });
    
    // Stand button
    standButton.addEventListener('click', () => {
        if (gameInProgress && !playerStood) {
            playerStand();
            clickSound.play();
        }
    });
    
    // Double down button
    doubleButton.addEventListener('click', () => {
        if (gameInProgress && !playerStood && playerHand.length === 2) {
            playerDoubleDown();
            clickSound.play();
        }
    });
    
    // New hand button
    newHandButton.addEventListener('click', () => {
        resetGame();
        clickSound.play();
    });
}

// Add to current bet
function addToBet(amount) {
    // Make sure we have a valid balance amount
    const balanceElement = document.querySelector('.balance-amount');
    if (!balanceElement) {
        console.error('Balance element not found');
        return;
    }
    
    // Parse as integer and handle NaN
    let currentBalance = parseInt(balanceElement.textContent.replace(/,/g, ''));
    if (isNaN(currentBalance)) {
        console.error('Invalid balance value:', balanceElement.textContent);
        currentBalance = 1000; // Set a default balance
        balanceElement.textContent = currentBalance;
    }
    
    if (currentBalance >= amount) {
        // Update bet amount
        currentBet += amount;
        betAmountElement.textContent = currentBet;
        
        // Update balance with proper formatting
        const newBalance = currentBalance - amount;
        balanceElement.textContent = newBalance.toLocaleString();
        
        // Add animation to chip
        chipSound.play();
    } else {
        showMessage('Not enough balance!', 'error');
    }
}

// Start a new hand
function startNewHand() {
    // Make sure we have a deck
    if (!deck || deck.length === 0) {
        console.log('No deck found, creating a new one');
        createDeck();
    }
    
    // Update game state
    gameInProgress = true;
    playerStood = false;
    doubleDown = false;
    
    // Clear hands
    playerHand = [];
    dealerHand = [];
    
    // Clear UI
    playerHandElement.innerHTML = '';
    dealerHandElement.innerHTML = '';
    playerScoreElement.textContent = '0';
    dealerScoreElement.textContent = '0';
    resultMessageElement.textContent = '';
    resultMessageElement.className = 'result-message';
    
    // Ensure score displays are visible
    playerScoreElement.classList.add('show');
    dealerScoreElement.classList.add('show');
    
    // Hide new hand button and show game buttons
    newHandButton.style.display = 'none';
    dealButton.disabled = true;
    hitButton.disabled = false;
    standButton.disabled = false;
    
    // Check if double down is possible
    const balanceElement = document.querySelector('.balance-amount');
    if (balanceElement) {
        const currentBalance = parseInt(balanceElement.textContent.replace(/,/g, ''));
        doubleButton.disabled = isNaN(currentBalance) || currentBalance < currentBet;
    } else {
        doubleButton.disabled = true;
    }
    
    // Create a new deck if needed
    if (deck.length < 15) {
        console.log('Deck running low, creating a new one');
        createDeck();
    }
    
    // Deal initial cards with delay
    setTimeout(() => {
        dealCard(playerHand, playerHandElement, true);
        updatePlayerScore();
    }, 300);
    
    setTimeout(() => {
        dealCard(dealerHand, dealerHandElement, false); // First dealer card face down
        updateDealerScore();
    }, 600);
    
    setTimeout(() => {
        dealCard(playerHand, playerHandElement, true);
        updatePlayerScore();
        
        // Check for player blackjack
        const playerScore = calculateHandValue(playerHand);
        if (playerScore === 21) {
            playerScoreElement.classList.add('pulse-once');
            
            // Wait a moment then stand
            setTimeout(() => {
                playerStand();
            }, 1000);
        }
    }, 900);
    
    setTimeout(() => {
        dealCard(dealerHand, dealerHandElement, true); // Second dealer card face up
        updateDealerScore();
    }, 1200);
    
    // Update stats
    handsPlayed++;
    handsPlayedElement.textContent = handsPlayed;
    saveGameStats();
}

// Deal a card to a hand
function dealCard(hand, handElement, faceUp = true) {
    // Get a card from the deck
    const card = deck.pop();
    card.faceUp = faceUp; // Store faceUp state in the card object
    hand.push(card);
    
    // Create card element
    const cardElement = document.createElement('div');
    cardElement.className = 'card';
    if (!faceUp) {
        cardElement.classList.add('hidden-card');
    }
    
    // Create card inner content
    const cardInner = document.createElement('div');
    cardInner.className = 'card-inner';
    
    if (faceUp) {
        // Set text color based on suit
        const color = (card.suit === 'hearts' || card.suit === 'diamonds') ? 'red' : 'black';
        
        // Card value at top left
        const valueElement = document.createElement('div');
        valueElement.className = 'card-value';
        valueElement.textContent = card.value;
        valueElement.style.color = color;
        
        // Card suit symbol
        const suitElement = document.createElement('div');
        suitElement.className = `card-suit`;
        suitElement.textContent = suitSymbols[card.suit];
        suitElement.style.color = color;
        
        cardInner.appendChild(valueElement);
        cardInner.appendChild(suitElement);
    } else {
        // Create a card back element
        const cardBack = document.createElement('div');
        cardBack.className = 'card-back';
        cardInner.appendChild(cardBack);
    }
    
    cardElement.appendChild(cardInner);
    handElement.appendChild(cardElement);
    
    // Play deal sound
    dealSound.play();
    
    // Add animation
    setTimeout(() => {
        cardElement.classList.add('dealt');
    }, 50);
    
    return card;
}

// Flip a card from face down to face up
function flipCard(cardElement, card) {
    // Play flip sound
    flipSound.play();
    
    // Add flip animation
    cardElement.classList.add('card-flip');
    
    // Update card object
    card.faceUp = true;
    
    // Wait for half of animation to switch content
    setTimeout(() => {
        cardElement.classList.remove('hidden-card');
        
        // Set text color based on suit
        const color = (card.suit === 'hearts' || card.suit === 'diamonds') ? 'red' : 'black';
        
        // Create card inner content
        const cardInner = cardElement.querySelector('.card-inner');
        cardInner.innerHTML = '';
        
        // Card value at top left
        const valueElement = document.createElement('div');
        valueElement.className = 'card-value';
        valueElement.textContent = card.value;
        valueElement.style.color = color;
        
        // Card suit symbol
        const suitElement = document.createElement('div');
        suitElement.className = 'card-suit';
        suitElement.textContent = suitSymbols[card.suit];
        suitElement.style.color = color;
        
        cardInner.appendChild(valueElement);
        cardInner.appendChild(suitElement);
    }, 250);
}

// Calculate the value of a hand
function calculateHandValue(hand) {
    let value = 0;
    let aceCount = 0;
    
    for (let card of hand) {
        if (card.value === 'A') {
            aceCount++;
            value += 11;
        } else if (['K', 'Q', 'J'].includes(card.value)) {
            value += 10;
        } else {
            value += parseInt(card.value);
        }
    }
    
    // Adjust for aces
    while (value > 21 && aceCount > 0) {
        value -= 10;
        aceCount--;
    }
    
    return value;
}

// Update the player's score display
function updatePlayerScore() {
    const score = calculateHandValue(playerHand);
    playerScoreElement.textContent = score;
    playerScoreElement.classList.add('show');
    
    // Check for bust
    if (score > 21) {
        playerBust();
    }
}

// Update the dealer's score display
function updateDealerScore() {
    // Only show score for face-up cards
    let visibleScore = 0;
    let visibleAceCount = 0;
    
    // If player stood, show full score
    if (playerStood) {
        visibleScore = calculateHandValue(dealerHand);
    } else {
        // Only show score for visible cards (skip face down card)
        if (dealerHand.length > 1) {
            // Skip the first (face down) card
            for (let i = 1; i < dealerHand.length; i++) {
                let card = dealerHand[i];
                if (card.value === 'A') {
                    visibleAceCount++;
                    visibleScore += 11;
                } else if (['K', 'Q', 'J'].includes(card.value)) {
                    visibleScore += 10;
                } else {
                    visibleScore += parseInt(card.value);
                }
            }
            
            // Adjust for aces
            while (visibleScore > 21 && visibleAceCount > 0) {
                visibleScore -= 10;
                visibleAceCount--;
            }
        }
    }
    
    dealerScoreElement.textContent = visibleScore;
    
    // Ensure the show class is always added
    if (!dealerScoreElement.classList.contains('show')) {
        dealerScoreElement.classList.add('show');
    }
}

// Player hit (draw a card)
function playerHit() {
    dealCard(playerHand, playerHandElement, true);
    updatePlayerScore();
    
    // Disable double down after hit
    doubleButton.disabled = true;
}

// Player stand (end turn)
function playerStand() {
    playerStood = true;
    
    // Disable player action buttons
    hitButton.disabled = true;
    standButton.disabled = true;
    doubleButton.disabled = true;
    
    // Flip dealer's first card
    const firstCardElement = dealerHandElement.querySelector('.card.hidden-card');
    if (firstCardElement) {
        flipCard(firstCardElement, dealerHand[0]);
    }
    
    // Show dealer's full score
    setTimeout(() => {
        updateDealerScore();
    }, 500);
    
    // Dealer's turn
    setTimeout(() => {
        dealerPlay();
    }, 1000);
}

// Player double down
function playerDoubleDown() {
    doubleDown = true;
    
    // Double the bet
    const currentBalance = parseInt(document.querySelector('.balance-amount').textContent);
    document.querySelector('.balance-amount').textContent = currentBalance - currentBet;
    currentBet *= 2;
    betAmountElement.textContent = currentBet;
    
    // Draw one more card then stand
    setTimeout(() => {
        playerHit();
    }, 300);
    
    setTimeout(() => {
        if (calculateHandValue(playerHand) <= 21) {
            playerStand();
        }
    }, 1000);
}

// Player bust (over 21)
function playerBust() {
    playerStood = true;
    
    // Disable player action buttons
    hitButton.disabled = true;
    standButton.disabled = true;
    doubleButton.disabled = true;
    
    // Shake player's hand
    playerHandElement.classList.add('shake');
    setTimeout(() => {
        playerHandElement.classList.remove('shake');
    }, 500);
    
    // Show result message
    setTimeout(() => {
        showResult('Bust! You lose.');
    }, 800);
    
    // Update stats
    saveGameStats();
    
    // Show new hand button
    setTimeout(() => {
        newHandButton.style.display = 'block';
    }, 1500);
}

// Dealer's play logic
function dealerPlay() {
    const dealerScore = calculateHandValue(dealerHand);
    const playerScore = calculateHandValue(playerHand);
    
    // If player busted, dealer automatically wins
    if (playerScore > 21) {
        setTimeout(() => {
            showResult('Bust! You lose.');
        }, 500);
        
        // Show new hand button
        setTimeout(() => {
            newHandButton.style.display = 'block';
        }, 1500);
        
        return;
    }
    
    // Player has blackjack - check first before dealer's blackjack check
    if (playerScore === 21 && playerHand.length === 2) {
        // If dealer also has blackjack (push)
        if (dealerScore === 21 && dealerHand.length === 2) {
            setTimeout(() => {
                showResult('Both blackjack! Push.', 'push');
                returnBet();
            }, 500);
        } else {
            setTimeout(() => {
                showResult('Blackjack! You win!', 'win');
                payoutBlackjack();
                blackjacks++;
                blackjacksElement.textContent = blackjacks;
                handsWon++;
                handsWonElement.textContent = handsWon;
            }, 500);
        }
        
        // Show new hand button
        setTimeout(() => {
            newHandButton.style.display = 'block';
        }, 1500);
        
        return;
    }
    
    // If dealer has blackjack (and player doesn't)
    if (dealerScore === 21 && dealerHand.length === 2) {
        setTimeout(() => {
            showResult('Dealer blackjack! You lose.');
        }, 500);
        
        // Show new hand button
        setTimeout(() => {
            newHandButton.style.display = 'block';
        }, 1500);
        
        return;
    }
    
    // Dealer draws until 17 or higher
    let keepDrawing = dealerScore < 17;
    
    function drawDealerCard() {
        if (keepDrawing) {
            dealCard(dealerHand, dealerHandElement, true);
            updateDealerScore();
            
            const newScore = calculateHandValue(dealerHand);
            keepDrawing = newScore < 17;
            
            if (keepDrawing) {
                setTimeout(drawDealerCard, 800);
            } else {
                setTimeout(checkWinner, 800);
            }
        } else {
            setTimeout(checkWinner, 500);
        }
    }
    
    drawDealerCard();
}

// Check who won the hand
function checkWinner() {
    const dealerScore = calculateHandValue(dealerHand);
    const playerScore = calculateHandValue(playerHand);
    
    // Dealer busts
    if (dealerScore > 21) {
        showResult('Dealer busts! You win!', 'win');
        payoutWin();
        handsWon++;
        handsWonElement.textContent = handsWon;
    }
    // Push (tie)
    else if (dealerScore === playerScore) {
        showResult('Push!', 'push');
        returnBet();
    }
    // Dealer wins
    else if (dealerScore > playerScore) {
        showResult('Dealer wins!');
    }
    // Player wins
    else {
        showResult('You win!', 'win');
        payoutWin();
        handsWon++;
        handsWonElement.textContent = handsWon;
    }
    
    // Update stats
    saveGameStats();
    
    // Show new hand button
    setTimeout(() => {
        newHandButton.style.display = 'block';
    }, 1000);
}

// Show result message
function showResult(message, type = 'lose') {
    resultMessageElement.textContent = message;
    resultMessageElement.className = 'result-message show';
    
    if (type === 'win') {
        resultMessageElement.classList.add('result-win');
        winSound.play();
    } else if (type === 'lose') {
        resultMessageElement.classList.add('result-lose');
        loseSound.play();
    } else if (type === 'push') {
        resultMessageElement.classList.add('result-push');
    }
    
    gameInProgress = false;
}

// Payout for regular win (1:1)
function payoutWin() {
    const winAmount = currentBet * 2; // Return bet + win same amount
    
    // Get balance element
    const balanceElement = document.querySelector('.balance-amount');
    if (!balanceElement) {
        console.error('Balance element not found');
        return;
    }
    
    // Parse current balance and handle formatting
    let currentBalance = parseInt(balanceElement.textContent.replace(/,/g, ''));
    if (isNaN(currentBalance)) {
        console.error('Invalid balance value:', balanceElement.textContent);
        currentBalance = winAmount; // Set the win amount as the balance
    } else {
        currentBalance += winAmount;
    }
    
    // Update balance with proper formatting
    balanceElement.textContent = currentBalance.toLocaleString();
    balanceElement.classList.add('win-animation');
    setTimeout(() => {
        balanceElement.classList.remove('win-animation');
    }, 1000);
    
    // Update total profit
    totalProfit += currentBet;
    totalProfitElement.textContent = totalProfit.toLocaleString();
    
    // Animate chips
    animateWinningChips();
}

// Payout for blackjack (3:2)
function payoutBlackjack() {
    const blackjackPayout = Math.floor(currentBet * 1.5); // Blackjack pays 3:2
    const totalReturn = currentBet + blackjackPayout; // Return original bet + blackjack payout
    
    // Get balance element
    const balanceElement = document.querySelector('.balance-amount');
    if (!balanceElement) {
        console.error('Balance element not found');
        return;
    }
    
    // Parse current balance and handle formatting
    let currentBalance = parseInt(balanceElement.textContent.replace(/,/g, ''));
    if (isNaN(currentBalance)) {
        console.error('Invalid balance value:', balanceElement.textContent);
        currentBalance = totalReturn; // Set the win amount as the balance
    } else {
        currentBalance += totalReturn;
    }
    
    // Update balance with proper formatting
    balanceElement.textContent = currentBalance.toLocaleString();
    balanceElement.classList.add('win-animation');
    setTimeout(() => {
        balanceElement.classList.remove('win-animation');
    }, 1000);
    
    // Update total profit
    totalProfit += blackjackPayout;
    totalProfitElement.textContent = totalProfit.toLocaleString();
    
    // Animate chips
    animateWinningChips();
}

// Return bet on push
function returnBet() {
    // Get balance element
    const balanceElement = document.querySelector('.balance-amount');
    if (!balanceElement) {
        console.error('Balance element not found');
        return;
    }
    
    // Parse current balance and handle formatting
    let currentBalance = parseInt(balanceElement.textContent.replace(/,/g, ''));
    if (isNaN(currentBalance)) {
        console.error('Invalid balance value:', balanceElement.textContent);
        currentBalance = currentBet; // Return the bet as the balance
    } else {
        currentBalance += currentBet;
    }
    
    // Update balance with proper formatting
    balanceElement.textContent = currentBalance.toLocaleString();
}

// Reset game for next hand
function resetGame() {
    // Update game state
    gameInProgress = false;
    playerStood = false;
    doubleDown = false;
    
    // Store the current bet for the next hand
    const savedBet = currentBet;
    currentBet = 0;
    
    // Clear hands
    playerHand = [];
    dealerHand = [];
    
    // Clear UI
    playerHandElement.innerHTML = '';
    dealerHandElement.innerHTML = '';
    playerScoreElement.textContent = '0';
    dealerScoreElement.textContent = '0';
    betAmountElement.textContent = '0';
    resultMessageElement.textContent = '';
    resultMessageElement.className = 'result-message';
    
    // Reset buttons
    newHandButton.style.display = 'none';
    dealButton.disabled = false;
    hitButton.disabled = true;
    standButton.disabled = true;
    doubleButton.disabled = true;
    
    // Create a new deck if needed
    if (deck.length < 15) {
        createDeck();
    }
    
    // Allow user to place the same bet again with one click
    const placeSameBetButton = document.createElement('button');
    placeSameBetButton.innerText = `Place Same Bet (${savedBet})`;
    placeSameBetButton.className = 'action-btn same-bet-btn';
    placeSameBetButton.style.background = 'linear-gradient(135deg, #ff9800, #e65100)';
    placeSameBetButton.style.color = 'white';
    placeSameBetButton.style.padding = '10px 20px';
    placeSameBetButton.style.borderRadius = '5px';
    placeSameBetButton.style.margin = '10px auto';
    placeSameBetButton.style.display = 'block';
    placeSameBetButton.style.cursor = 'pointer';
    
    if (savedBet > 0) {
        // Only show the button if there was a previous bet
        document.querySelector('.current-bet').appendChild(placeSameBetButton);
        
        placeSameBetButton.addEventListener('click', function() {
            // Check if the user has enough balance
            const currentBalance = parseInt(document.querySelector('.balance-amount').textContent);
            if (currentBalance >= savedBet) {
                addToBet(savedBet);
                chipSound.play();
                this.remove(); // Remove the button after it's clicked
            } else {
                showMessage('Not enough balance!', 'error');
            }
        });
        
        // Remove the button after 10 seconds
        setTimeout(() => {
            if (placeSameBetButton.parentNode) {
                placeSameBetButton.remove();
            }
        }, 10000);
    }
}

// Show a temporary message
function showMessage(message, type = 'info') {
    const messageElement = document.createElement('div');
    messageElement.className = `game-message ${type}`;
    messageElement.textContent = message;
    
    document.querySelector('.game-container').appendChild(messageElement);
    
    setTimeout(() => {
        messageElement.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        messageElement.classList.remove('show');
        setTimeout(() => {
            messageElement.remove();
        }, 500);
    }, 2000);
}

// Animate chip when selected
function animateChip(chipElement) {
    const rect = chipElement.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    // Create floating chip
    const floatingChip = document.createElement('div');
    floatingChip.className = 'chips-float ' + chipElement.className;
    floatingChip.textContent = chipElement.textContent;
    floatingChip.style.position = 'fixed';
    floatingChip.style.left = x + 'px';
    floatingChip.style.top = y + 'px';
    floatingChip.style.transform = 'translate(-50%, -50%)';
    
    document.body.appendChild(floatingChip);
    
    // Animate to bet amount
    const betRect = betAmountElement.getBoundingClientRect();
    const targetX = betRect.left + betRect.width / 2;
    const targetY = betRect.top + betRect.height / 2;
    
    floatingChip.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    setTimeout(() => {
        floatingChip.style.left = targetX + 'px';
        floatingChip.style.top = targetY + 'px';
        floatingChip.style.opacity = '0';
    }, 50);
    
    // Remove after animation
    setTimeout(() => {
        floatingChip.remove();
    }, 600);
}

// Animate winning chips
function animateWinningChips() {
    const betRect = betAmountElement.getBoundingClientRect();
    const balanceRect = document.querySelector('.balance-amount').getBoundingClientRect();
    
    // Create multiple chips
    for (let i = 0; i < 5; i++) {
        const floatingChip = document.createElement('div');
        floatingChip.className = 'chips-float chip';
        floatingChip.textContent = '💰';
        floatingChip.style.position = 'fixed';
        floatingChip.style.left = betRect.left + betRect.width / 2 + 'px';
        floatingChip.style.top = betRect.top + betRect.height / 2 + 'px';
        floatingChip.style.transform = 'translate(-50%, -50%)';
        
        document.body.appendChild(floatingChip);
        
        // Add small random offset for each chip
        const randomX = Math.random() * 40 - 20;
        const randomY = Math.random() * 40 - 20;
        const randomDelay = Math.random() * 300;
        
        // Animate to balance
        floatingChip.style.transition = `all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${randomDelay}ms`;
        setTimeout(() => {
            floatingChip.style.left = balanceRect.left + balanceRect.width / 2 + randomX + 'px';
            floatingChip.style.top = balanceRect.top + balanceRect.height / 2 + randomY + 'px';
            floatingChip.style.opacity = '0';
        }, 50);
        
        // Remove after animation
        setTimeout(() => {
            floatingChip.remove();
        }, 1000 + randomDelay);
    }
    
    // Pulse balance
    setTimeout(() => {
        document.querySelector('.balance').classList.add('pulse-once');
        setTimeout(() => {
            document.querySelector('.balance').classList.remove('pulse-once');
        }, 500);
    }, 600);
}

// Save game stats to local storage
function saveGameStats() {
    const stats = {
        handsPlayed,
        handsWon,
        blackjacks,
        totalProfit
    };
    
    localStorage.setItem('blackjackStats', JSON.stringify(stats));
}

// Load game stats from local storage
function loadGameStats() {
    const statsJson = localStorage.getItem('blackjackStats');
    
    if (statsJson) {
        const stats = JSON.parse(statsJson);
        
        handsPlayed = stats.handsPlayed || 0;
        handsWon = stats.handsWon || 0;
        blackjacks = stats.blackjacks || 0;
        totalProfit = stats.totalProfit || 0;
        
        handsPlayedElement.textContent = handsPlayed;
        handsWonElement.textContent = handsWon;
        blackjacksElement.textContent = blackjacks;
        totalProfitElement.textContent = totalProfit;
    }
} 