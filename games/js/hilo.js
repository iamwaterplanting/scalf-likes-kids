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
let multiplierStep = 0.5; // Increased multiplier step for faster growth
let cardHistory = []; // Array to track card history
let maxHistoryCards = 8; // Maximum number of history cards to show
let specialAnimationThreshold = 8; // Threshold for special animation
let pageLoaded = false; // Track if page is fully loaded

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
    initializeElements();
    
    // Create a fresh deck
    createDeck();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load game stats from local storage
    loadGameStats();
    
    // Initialize potential win amount
    updatePotentialWin();
    
    // Create card history row if it doesn't exist
    createHistoryRowIfNeeded();
});

// Function to start animations after page load
function startHiLoAnimations() {
    console.log('Starting Hi-Lo animations');
    pageLoaded = true;
    
    // Add any specific animations here that should only run after loading
    setTimeout(() => {
        // Only run the card flip animation if we're not in a game
        if (!gameInProgress && currentCardElement) {
            currentCardElement.classList.add('card-reveal');
        }
    }, 100);
}

// Initialize DOM elements
function initializeElements() {
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
}

// Create card history row if it doesn't exist
function createHistoryRowIfNeeded() {
    if (!document.getElementById('cardHistoryRow')) {
        const cardHistoryContainer = document.createElement('div');
        cardHistoryContainer.className = 'card-history-container';
        
        const historyRow = document.createElement('div');
        historyRow.id = 'cardHistoryRow';
        historyRow.className = 'card-history-row';
        
        cardHistoryContainer.appendChild(historyRow);
        
        // Insert after the main card container
        const cardContainer = document.querySelector('.card-container');
        if (cardContainer && cardContainer.parentNode) {
            cardContainer.parentNode.insertBefore(cardHistoryContainer, cardContainer.nextSibling);
        }
    }
}

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
    
    // Clear card history
    cardHistory = [];
    document.getElementById('cardHistoryRow').innerHTML = '';
    
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
    
    // Add to history as start card
    addCardToHistory(currentCard, 'start');
    
    // Clear any previous animations
    currentCardElement.classList.remove('card-reveal', 'card-win', 'card-lose');
    
    // Add reveal animation to current card (only if page is loaded)
    if (pageLoaded) {
        setTimeout(() => {
            currentCardElement.classList.add('card-reveal');
        }, 100);
    }
    
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
    cashoutButton.disabled = true;
    
    // Store prediction choice for history
    let predictionChoice = 'higher';
    
    // Reveal next card with animation
    setTimeout(() => {
        revealNextCard();
        
        // Check if prediction is correct
        const currentValue = cardValues[currentCard.value];
        const nextValue = cardValues[nextCard.value];
        
        if (nextValue > currentValue) {
            // Correct prediction
            correctPrediction(predictionChoice);
        } else if (nextValue === currentValue) {
            // Push (tie) - don't lose or win
            tiePrediction(predictionChoice);
        } else {
            // Wrong prediction
            wrongPrediction(predictionChoice);
        }
    }, 1000);
}

// Make lower prediction
function makeLowerPrediction() {
    predictionMade = true;
    higherButton.disabled = true;
    lowerButton.disabled = true;
    cashoutButton.disabled = true;
    
    // Store prediction choice for history
    let predictionChoice = 'lower';
    
    // Reveal next card with animation
    setTimeout(() => {
        revealNextCard();
        
        // Check if prediction is correct
        const currentValue = cardValues[currentCard.value];
        const nextValue = cardValues[nextCard.value];
        
        if (nextValue < currentValue) {
            // Correct prediction
            correctPrediction(predictionChoice);
        } else if (nextValue === currentValue) {
            // Push (tie) - don't lose or win
            tiePrediction(predictionChoice);
        } else {
            // Wrong prediction
            wrongPrediction(predictionChoice);
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
function correctPrediction(predictionChoice) {
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
        
        // Check if player has reached special animation threshold
        if (currentStreak === specialAnimationThreshold) {
            // Trigger special animation
            triggerSpecialAnimation();
        }
        
        // Prepare for next prediction
        setTimeout(() => {
            // Add card to history before continuing
            addCardToHistory(nextCard, predictionChoice);
            
            continueGame();
        }, 1000);
    }, 600);
}

// Trigger special animation for reaching 8+ cards
function triggerSpecialAnimation() {
    console.log("Triggering special animation for 8+ streak!");
    
    // If we're still loading, briefly delay the special animation
    if (!pageLoaded) {
        setTimeout(() => triggerSpecialAnimation(), 100);
        return;
    }
    
    // Create the special win overlay
    const specialWinOverlay = document.createElement('div');
    specialWinOverlay.className = 'special-win-overlay';
    
    // Create content for the overlay
    const specialWinContent = document.createElement('div');
    specialWinContent.className = 'special-win-content';
    
    // Add heading
    const specialWinHeading = document.createElement('h2');
    specialWinHeading.className = 'special-win-heading';
    specialWinHeading.textContent = 'LEGENDARY STREAK!';
    
    // Add description
    const specialWinDesc = document.createElement('p');
    specialWinDesc.className = 'special-win-desc';
    specialWinDesc.textContent = `You've correctly predicted ${specialAnimationThreshold} cards in a row!`;
    
    // Add multiplier info
    const specialWinMultiplier = document.createElement('div');
    specialWinMultiplier.className = 'special-win-multiplier';
    specialWinMultiplier.textContent = `Current Multiplier: ${currentMultiplier.toFixed(2)}x`;
    
    // Add bonus message
    const specialWinBonus = document.createElement('div');
    specialWinBonus.className = 'special-win-bonus';
    specialWinBonus.textContent = 'Bonus Multiplier Added!';
    
    // Add confetti effect - improved with different shapes
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        
        // Random position
        confetti.style.left = `${Math.random() * 100}%`;
        
        // Random delay
        confetti.style.animationDelay = `${Math.random() * 3}s`;
        
        // Random color
        confetti.style.backgroundColor = getRandomColor();
        
        // Random shape
        const shape = Math.floor(Math.random() * 4);
        if (shape === 0) {
            // Circle
            confetti.style.borderRadius = '50%';
        } else if (shape === 1) {
            // Rectangle
            confetti.style.width = `${5 + Math.random() * 15}px`;
            confetti.style.height = `${5 + Math.random() * 10}px`;
        } else if (shape === 2) {
            // Triangle - using clip-path
            confetti.style.clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
        } else {
            // Star shape - card suits
            confetti.innerHTML = getRandomSuit();
            confetti.style.backgroundColor = 'transparent';
            confetti.style.color = getRandomColor();
            confetti.style.fontSize = `${20 + Math.random() * 15}px`;
            confetti.style.display = 'flex';
            confetti.style.justifyContent = 'center';
            confetti.style.alignItems = 'center';
        }
        
        // Random size
        const size = 10 + Math.random() * 15;
        confetti.style.width = `${size}px`;
        confetti.style.height = `${size}px`;
        
        // Random rotation speed
        confetti.style.animation = `confetti-fall ${4 + Math.random() * 4}s linear forwards, confetti-rotate ${1 + Math.random() * 3}s linear infinite`;
        
        specialWinOverlay.appendChild(confetti);
    }
    
    // Add all elements to the content
    specialWinContent.appendChild(specialWinHeading);
    specialWinContent.appendChild(specialWinDesc);
    specialWinContent.appendChild(specialWinMultiplier);
    specialWinContent.appendChild(specialWinBonus);
    
    // Add content to overlay
    specialWinOverlay.appendChild(specialWinContent);
    
    // Add overlay to the page
    document.querySelector('.hilo-table').appendChild(specialWinOverlay);
    
    // Add additional bonus to multiplier for the achievement
    const bonusMultiplier = 2.0;
    currentMultiplier += bonusMultiplier;
    currentMultiplierElement.textContent = currentMultiplier.toFixed(2) + 'x';
    
    // Update potential win with new multiplier
    updatePotentialWin();
    
    // Show message about the bonus
    showMessage(`Legendary Streak! +${bonusMultiplier.toFixed(1)}x Bonus!`, 'special');
    
    // Play special sound
    winSound.play();
    
    // Remove overlay after animation completes
    setTimeout(() => {
        specialWinOverlay.classList.add('fade-out');
        setTimeout(() => {
            specialWinOverlay.remove();
        }, 1000);
    }, 5000);
}

// Get random color for confetti
function getRandomColor() {
    const colors = [
        '#ff5e5e', // red
        '#5e5eff', // blue
        '#5eff5e', // green
        '#ffff5e', // yellow
        '#ff5eff', // pink
        '#5effff', // cyan
        '#ff9c5e', // orange
        '#d15eff', // purple
        '#ffda6a', // gold
        '#11ff66'  // neon green
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Get random card suit symbol
function getRandomSuit() {
    const suits = ['♥', '♦', '♣', '♠'];
    return suits[Math.floor(Math.random() * suits.length)];
}

// Handle tie prediction (same card value)
function tiePrediction(predictionChoice) {
    // Add animation after card is revealed
    setTimeout(() => {
        // Show result message
        predictionResultElement.textContent = 'Push! Same Value';
        predictionResultElement.className = 'prediction-result show';
        
        // Add card to history with tie indicator
        addCardToHistory(nextCard, 'tie');
        
        // Prepare for next prediction
        setTimeout(() => {
            continueGame();
        }, 1000);
    }, 600);
}

// Handle wrong prediction
function wrongPrediction(predictionChoice) {
    // Add lose animation after card is revealed
    setTimeout(() => {
        nextCardElement.classList.add('card-lose');
        
        // Show result message
        setTimeout(() => {
            predictionResultElement.textContent = 'Wrong! Game Over';
            predictionResultElement.className = 'prediction-result show result-lose';
            loseSound.play();
        }, 300);
        
        // Add card to history with the choice that lost
        addCardToHistory(nextCard, predictionChoice);
        
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
    
    // Reset card history
    cardHistory = [];
    document.getElementById('cardHistoryRow').innerHTML = '';
    
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
    }, 3000); // Increased duration for special messages
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

// Add card to history row
function addCardToHistory(card, choice) {
    const historyRow = document.getElementById('cardHistoryRow');
    if (!historyRow) return;
    
    // Create history card element
    const historyCard = document.createElement('div');
    historyCard.className = 'history-card';
    
    // Create card content
    const cardContent = document.createElement('div');
    cardContent.className = 'history-card-content';
    
    // Card value and suit
    const cardValueEl = document.createElement('div');
    cardValueEl.className = `history-card-value ${card.suit}`;
    cardValueEl.textContent = card.value;
    
    const cardSuitEl = document.createElement('div');
    cardSuitEl.className = `history-card-suit ${card.suit}`;
    cardSuitEl.textContent = suitSymbols[card.suit];
    
    // Prediction indicator
    let choiceIndicator = '';
    let choiceClass = '';
    
    if (choice === 'higher') {
        choiceIndicator = '<span class="up-arrow">▲</span>';
        choiceClass = 'higher-choice';
    } else if (choice === 'lower') {
        choiceIndicator = '<span class="down-arrow">▼</span>';
        choiceClass = 'lower-choice';
    } else if (choice === 'tie') {
        choiceIndicator = '<span class="tie-symbol">=</span>';
        choiceClass = 'tie-choice';
    }
    
    // Multiplier value
    const multiplierEl = document.createElement('div');
    multiplierEl.className = 'history-multiplier';
    
    if (choice === 'start') {
        multiplierEl.innerHTML = 'Start Card';
    } else {
        multiplierEl.innerHTML = `${currentMultiplier.toFixed(2)}x`;
    }
    
    // Add indicator if not start card
    if (choice !== 'start') {
        const indicatorEl = document.createElement('div');
        indicatorEl.className = `choice-indicator ${choiceClass}`;
        indicatorEl.innerHTML = choiceIndicator;
        cardContent.appendChild(indicatorEl);
    }
    
    // Add elements to card
    cardContent.appendChild(cardValueEl);
    cardContent.appendChild(cardSuitEl);
    cardContent.appendChild(multiplierEl);
    historyCard.appendChild(cardContent);
    
    // Add to history row
    historyRow.appendChild(historyCard);
    
    // Store card in history array
    cardHistory.push({
        card: card,
        choice: choice,
        multiplier: currentMultiplier
    });
    
    // Limit history length
    if (cardHistory.length > maxHistoryCards) {
        // Remove oldest card from DOM
        if (historyRow.children.length > maxHistoryCards) {
            historyRow.removeChild(historyRow.children[0]);
        }
        // Remove oldest card from array
        cardHistory.shift();
    }
}

// Make the startHiLoAnimations function globally available
window.startHiLoAnimations = startHiLoAnimations; 