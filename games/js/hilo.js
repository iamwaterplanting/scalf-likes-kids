// Hi-Lo Game Logic
console.log('Hi-Lo game loaded');

// Game state
let deck = [];
let currentCard = null;
let nextCard = null;
let currentBet = 0;
let gameInProgress = false;
let predictionMade = false;
let currentStreak = 0;
let currentMultiplier = 1.0;
let multiplierStep = 0.2; // Amount to increase multiplier on each correct guess

// Game stats
let gamesPlayed = 0;
let gamesWon = 0;
let bestStreak = 0;
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
const cardValues = {
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    '10': 10,
    'J': 11,
    'Q': 12,
    'K': 13,
    'A': 14
};

// Sound effects
const dealSound = new Audio('../assets/sounds/card-deal.mp3');
const winSound = new Audio('../assets/sounds/win.mp3');
const loseSound = new Audio('../assets/sounds/lose.mp3');
const clickSound = new Audio('../assets/sounds/click.mp3');
const chipSound = new Audio('../assets/sounds/chip.mp3');
const flipSound = new Audio('../assets/sounds/card-flip.mp3');

// DOM Elements
let currentCardElement;
let nextCardElement;
let predictionResultElement;
let betAmountElement;
let currentStreakElement;
let currentMultiplierElement;
let potentialWinElement;
let startButton;
let higherButton;
let lowerButton;
let cashoutButton;
let newGameButton;
let placeBetButton;
let customBetInput;
let gamesPlayedElement;
let gamesWonElement;
let bestStreakElement;
let totalProfitElement;

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Hi-Lo game');
    
    // Initialize DOM elements
    currentCardElement = document.getElementById('currentCard');
    nextCardElement = document.getElementById('nextCard');
    predictionResultElement = document.getElementById('predictionResult');
    betAmountElement = document.getElementById('betAmount');
    currentStreakElement = document.getElementById('currentStreak');
    currentMultiplierElement = document.getElementById('currentMultiplier');
    potentialWinElement = document.getElementById('potentialWin');
    startButton = document.getElementById('startButton');
    higherButton = document.getElementById('higherButton');
    lowerButton = document.getElementById('lowerButton');
    cashoutButton = document.getElementById('cashoutButton');
    newGameButton = document.getElementById('newGameButton');
    customBetInput = document.getElementById('customBetInput');
    placeBetButton = document.getElementById('placeBetButton');
    gamesPlayedElement = document.getElementById('gamesPlayed');
    gamesWonElement = document.getElementById('gamesWon');
    bestStreakElement = document.getElementById('bestStreak');
    totalProfitElement = document.getElementById('totalProfit');
    
    // Create a fresh deck
    createDeck();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load game stats from local storage
    loadGameStats();
    
    // Initialize potential win amount
    updatePotentialWin();
    
    console.log('Hi-Lo game initialized');
});

// Create and shuffle a new deck
function createDeck() {
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
    
    // Custom bet input
    if (placeBetButton && customBetInput) {
        placeBetButton.addEventListener('click', () => {
            const betValue = parseInt(customBetInput.value);
            if (!isNaN(betValue) && betValue > 0) {
                const currentBalance = parseInt(document.querySelector('.balance-amount').textContent);
                if (currentBalance >= betValue) {
                    addToBet(betValue);
                    customBetInput.value = '';
                } else {
                    showMessage('Not enough balance!', 'error');
                }
            }
        });
        
        // Also handle Enter key
        customBetInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const betValue = parseInt(customBetInput.value);
                if (!isNaN(betValue) && betValue > 0) {
                    const currentBalance = parseInt(document.querySelector('.balance-amount').textContent);
                    if (currentBalance >= betValue) {
                        addToBet(betValue);
                        customBetInput.value = '';
                    } else {
                        showMessage('Not enough balance!', 'error');
                    }
                }
                e.preventDefault();
            }
        });
    }
    
    // Start button
    startButton.addEventListener('click', () => {
        if (currentBet > 0 && !gameInProgress) {
            startGame();
            clickSound.play();
        } else if (currentBet === 0) {
            showMessage('Please place a bet first!', 'error');
        }
    });
    
    // Higher button
    higherButton.addEventListener('click', () => {
        if (gameInProgress && !predictionMade) {
            makeHigherPrediction();
            clickSound.play();
        }
    });
    
    // Lower button
    lowerButton.addEventListener('click', () => {
        if (gameInProgress && !predictionMade) {
            makeLowerPrediction();
            clickSound.play();
        }
    });
    
    // Cashout button
    cashoutButton.addEventListener('click', () => {
        if (gameInProgress) {
            cashOut();
            clickSound.play();
        }
    });
    
    // New game button
    newGameButton.addEventListener('click', () => {
        resetGame();
        clickSound.play();
    });
}

// Add to current bet
function addToBet(amount) {
    // Check if user is logged in
    const currentUser = window.BetaAuth?.getCurrentUser();
    if (!currentUser) {
        showMessage('Please login to play!', 'error');
        return;
    }
    
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
        
        // Update balance in UI and Supabase
        window.BetaAuth.updateBalance(-amount, 'Hi-Lo Bet');
        
        // Update potential win amount
        updatePotentialWin();
        
        // Add animation to chip
        chipSound.play();
    } else {
        showMessage('Not enough balance!', 'error');
    }
}

// Update the potential win display
function updatePotentialWin() {
    const potentialWin = Math.floor(currentBet * currentMultiplier);
    potentialWinElement.textContent = potentialWin;
}

// Start a new game
function startGame() {
    // Update game state
    gameInProgress = true;
    predictionMade = false;
    currentMultiplier = 1.0;
    currentMultiplierElement.textContent = currentMultiplier.toFixed(2) + 'x';
    
    // Hide new game button and show prediction buttons
    newGameButton.style.display = 'none';
    startButton.disabled = true;
    higherButton.disabled = false;
    lowerButton.disabled = false;
    cashoutButton.disabled = true; // Disabled until first prediction
    
    // Update potential win
    updatePotentialWin();
    
    // Reset prediction result
    predictionResultElement.textContent = '';
    predictionResultElement.className = 'prediction-result';
    
    // Create a new deck if needed
    if (deck.length < 2) {
        createDeck();
    }
    
    // Deal current card
    currentCard = deck.pop();
    displayCard(currentCardElement, currentCard);
    
    // Clear any previous animations
    currentCardElement.classList.remove('card-reveal', 'card-win', 'card-lose');
    
    // Add reveal animation to current card
    setTimeout(() => {
        currentCardElement.classList.add('card-reveal');
    }, 100);
    
    // Prepare next card (hidden)
    nextCard = deck.pop();
    nextCardElement.innerHTML = '<div class="card-inner"></div>';
    nextCardElement.classList.add('hidden');
    
    // Play deal sound
    dealSound.play();
    
    // Update stats
    gamesPlayed++;
    gamesPlayedElement.textContent = gamesPlayed;
    saveGameStats();
}

// Display a card
function displayCard(cardElement, card) {
    const cardInner = cardElement.querySelector('.card-inner');
    cardInner.innerHTML = '';
    
    // Create card contents container
    const cardContents = document.createElement('div');
    cardContents.className = 'card-contents';
    cardContents.style.width = '100%';
    cardContents.style.height = '100%';
    cardContents.style.display = 'flex';
    cardContents.style.flexDirection = 'column';
    cardContents.style.justifyContent = 'space-between';
    cardContents.style.position = 'relative';
    cardContents.style.zIndex = '5';
    
    // Card value
    const valueElement = document.createElement('div');
    valueElement.className = 'card-value';
    valueElement.textContent = card.value;
    
    // Card suit symbol
    const suitElement = document.createElement('div');
    suitElement.className = `card-suit ${card.suit}`;
    suitElement.textContent = suitSymbols[card.suit];
    
    // Add small suit icon in top left
    const smallSuitElement = document.createElement('div');
    smallSuitElement.className = `card-suit-small ${card.suit}`;
    smallSuitElement.textContent = suitSymbols[card.suit];
    smallSuitElement.style.position = 'absolute';
    smallSuitElement.style.top = '10px';
    smallSuitElement.style.left = '10px';
    smallSuitElement.style.fontSize = '14px';
    
    // Add elements to card
    cardContents.appendChild(valueElement);
    cardContents.appendChild(suitElement);
    cardContents.appendChild(smallSuitElement);
    cardInner.appendChild(cardContents);
    
    // Remove hidden class if present
    cardElement.classList.remove('hidden');
    
    // Set card color based on suit
    if (card.suit === 'hearts' || card.suit === 'diamonds') {
        valueElement.style.color = '#e61c24';
        suitElement.style.color = '#e61c24';
        smallSuitElement.style.color = '#e61c24';
    } else {
        valueElement.style.color = '#000000';
        suitElement.style.color = '#000000';
        smallSuitElement.style.color = '#000000';
    }
    
    // Log for debugging
    console.log('Card displayed:', card.value, 'of', card.suit);
}

// Make higher prediction
function makeHigherPrediction() {
    predictionMade = true;
    higherButton.disabled = true;
    lowerButton.disabled = true;
    
    // Reveal next card with animation
    setTimeout(() => {
        revealNextCard();
        
        // Check if prediction is correct
        const currentValue = cardValues[currentCard.value];
        const nextValue = cardValues[nextCard.value];
        
        if (nextValue > currentValue) {
            // Correct prediction
            correctPrediction();
        } else if (nextValue === currentValue) {
            // Push (tie) - don't lose or win
            tiePrediction();
        } else {
            // Wrong prediction
            wrongPrediction();
        }
    }, 1000);
}

// Make lower prediction
function makeLowerPrediction() {
    predictionMade = true;
    higherButton.disabled = true;
    lowerButton.disabled = true;
    
    // Reveal next card with animation
    setTimeout(() => {
        revealNextCard();
        
        // Check if prediction is correct
        const currentValue = cardValues[currentCard.value];
        const nextValue = cardValues[nextCard.value];
        
        if (nextValue < currentValue) {
            // Correct prediction
            correctPrediction();
        } else if (nextValue === currentValue) {
            // Push (tie) - don't lose or win
            tiePrediction();
        } else {
            // Wrong prediction
            wrongPrediction();
        }
    }, 1000);
}

// Reveal the next card
function revealNextCard() {
    // Play flip sound
    flipSound.play();
    
    // Add flip animation
    nextCardElement.classList.add('card-reveal');
    
    // Display the card
    setTimeout(() => {
        displayCard(nextCardElement, nextCard);
    }, 400); // Adjusted timing to match the animation keyframe midpoint
}

// Handle correct prediction
function correctPrediction() {
    // Update streak
    currentStreak++;
    currentStreakElement.textContent = currentStreak;
    
    if (currentStreak > bestStreak) {
        bestStreak = currentStreak;
        bestStreakElement.textContent = bestStreak;
    }
    
    // Add win animation after card is revealed
    setTimeout(() => {
        nextCardElement.classList.add('card-win');
        
        // Show result message
        setTimeout(() => {
            predictionResultElement.textContent = 'Correct!';
            predictionResultElement.className = 'prediction-result show result-win';
            winSound.play();
        }, 300);
        
        // Increase multiplier
        currentMultiplier += multiplierStep;
        currentMultiplierElement.textContent = currentMultiplier.toFixed(2) + 'x';
        currentMultiplierElement.classList.add('highlight');
        setTimeout(() => {
            currentMultiplierElement.classList.remove('highlight');
        }, 1000);
        
        // Update potential win
        updatePotentialWin();
        
        // Prepare for next prediction
        setTimeout(() => {
            continueGame();
        }, 1000);
    }, 600);
}

// Handle tie prediction (same card value)
function tiePrediction() {
    // Add animation after card is revealed
    setTimeout(() => {
        // Show result message
        predictionResultElement.textContent = 'Push! Same Value';
        predictionResultElement.className = 'prediction-result show';
        
        // Prepare for next prediction
        setTimeout(() => {
            continueGame();
        }, 1000);
    }, 600);
}

// Handle wrong prediction
function wrongPrediction() {
    // Add lose animation after card is revealed
    setTimeout(() => {
        nextCardElement.classList.add('card-lose');
        
        // Show result message
        setTimeout(() => {
            predictionResultElement.textContent = 'Wrong! Game Over';
            predictionResultElement.className = 'prediction-result show result-lose';
            loseSound.play();
        }, 300);
        
        // Reset streak
        currentStreak = 0;
        currentStreakElement.textContent = currentStreak;
        
        // Update stats
        saveGameStats();
        
        // Show new game button
        setTimeout(() => {
            newGameButton.style.display = 'block';
        }, 1000);
    }, 600);
    
    // Game is over
    gameInProgress = false;
    
    // Disable cashout
    cashoutButton.disabled = true;
}

// Continue the game after a correct prediction
function continueGame() {
    // Reset for next prediction
    predictionMade = false;
    
    // Enable cashout now that player has at least one correct prediction
    cashoutButton.disabled = false;
    
    // Move next card to current card position
    currentCard = nextCard;
    currentCardElement.innerHTML = nextCardElement.innerHTML;
    
    // Reset animations
    currentCardElement.classList.remove('card-reveal', 'card-win', 'card-lose');
    nextCardElement.classList.remove('card-reveal', 'card-win', 'card-lose');
    
    // Clear prediction result
    predictionResultElement.textContent = '';
    predictionResultElement.className = 'prediction-result';
    
    // Create a new deck if needed
    if (deck.length < 1) {
        createDeck();
    }
    
    // Get new next card
    nextCard = deck.pop();
    nextCardElement.innerHTML = '<div class="card-inner"></div>';
    nextCardElement.classList.add('hidden');
    
    // Enable prediction buttons
    higherButton.disabled = false;
    lowerButton.disabled = false;
}

// Cash out and take winnings
function cashOut() {
    // Calculate winnings
    const winAmount = Math.floor(currentBet * currentMultiplier);
    
    // Get current user
    const currentUser = window.BetaAuth?.getCurrentUser();
    if (!currentUser) {
        console.error('User not logged in');
        return;
    }
    
    // Update balance in UI and Supabase
    window.BetaAuth.updateBalance(winAmount, 'Hi-Lo Cashout');
    
    // Update total profit
    const profit = winAmount - currentBet;
    totalProfit += profit;
    totalProfitElement.textContent = totalProfit.toLocaleString();
    
    // Show success message
    showMessage(`Cashed out ${winAmount} coins!`, 'success');
    
    // Play win sound
    winSound.play();
    
    // Update stats
    gamesWon++;
    gamesWonElement.textContent = gamesWon;
    saveGameStats();
    
    // Animate winning
    animateWinningChips();
    
    // Game is over
    gameInProgress = false;
    
    // Show new game button
    newGameButton.style.display = 'block';
    
    // Disable prediction buttons and cashout
    higherButton.disabled = true;
    lowerButton.disabled = true;
    cashoutButton.disabled = true;
}

// Reset game for next round
function resetGame() {
    // Update game state
    gameInProgress = false;
    predictionMade = false;
    currentBet = 0;
    currentMultiplier = 1.0;
    currentMultiplierElement.textContent = currentMultiplier.toFixed(2) + 'x';
    
    // Reset UI
    currentCardElement.innerHTML = '<div class="card-inner"></div>';
    nextCardElement.innerHTML = '<div class="card-inner"></div>';
    nextCardElement.classList.add('hidden');
    
    // Clear animation classes
    nextCardElement.classList.remove('card-reveal', 'card-win', 'card-lose');
    currentCardElement.classList.remove('card-reveal', 'card-win', 'card-lose');
    
    betAmountElement.textContent = '0';
    potentialWinElement.textContent = '0';
    predictionResultElement.textContent = '';
    predictionResultElement.className = 'prediction-result';
    
    // Reset buttons
    newGameButton.style.display = 'none';
    startButton.disabled = false;
    higherButton.disabled = true;
    lowerButton.disabled = true;
    cashoutButton.disabled = true;
    
    // Create a new deck if needed
    if (deck.length < 5) {
        createDeck();
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
    for (let i = 0; i < 8; i++) {
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
        document.querySelector('.balance').classList.add('win-animation');
        setTimeout(() => {
            document.querySelector('.balance').classList.remove('win-animation');
        }, 1000);
    }, 600);
}

// Save game stats to local storage
function saveGameStats() {
    const stats = {
        gamesPlayed,
        gamesWon,
        bestStreak,
        totalProfit
    };
    
    localStorage.setItem('hiloStats', JSON.stringify(stats));
}

// Load game stats from local storage
function loadGameStats() {
    const statsJson = localStorage.getItem('hiloStats');
    
    if (statsJson) {
        const stats = JSON.parse(statsJson);
        
        gamesPlayed = stats.gamesPlayed || 0;
        gamesWon = stats.gamesWon || 0;
        bestStreak = stats.bestStreak || 0;
        totalProfit = stats.totalProfit || 0;
        
        gamesPlayedElement.textContent = gamesPlayed;
        gamesWonElement.textContent = gamesWon;
        bestStreakElement.textContent = bestStreak;
        totalProfitElement.textContent = totalProfit.toLocaleString();
    }
} 