// BetaGames Dice Game
const { gameHistoryOperations } = require('./mongodb');

document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const diceDisplay = document.getElementById('diceDisplay');
    const betAmountInput = document.getElementById('betAmount');
    const targetNumberSelect = document.getElementById('targetNumber');
    const betTypeSelect = document.getElementById('betType');
    const rollButton = document.getElementById('rollButton');
    const resultSection = document.getElementById('resultSection');
    const resultNumber = document.getElementById('resultNumber');
    const resultText = document.getElementById('resultText');
    const resultAmount = document.getElementById('resultAmount');
    const playAgainButton = document.getElementById('playAgainButton');
    const potentialWin = document.getElementById('potentialWin');
    const winChance = document.getElementById('winChance');
    const betShortcuts = document.querySelectorAll('.bet-shortcut');
    const gameHistoryBody = document.getElementById('gameHistoryBody');
    
    // Game state
    let isRolling = false;
    let gameHistory = [];
    
    // Initialize the game
    init();
    
    function init() {
        // Set default dice display (1)
        updateDiceDisplay(1);
        
        // Update potential win and odds
        updatePotentialWinAndOdds();
        
        // Update balance from auth system
        updateBalanceDisplay();
        
        // Event listeners
        if (rollButton) {
            rollButton.addEventListener('click', handleRoll);
        }
        
        if (playAgainButton) {
            playAgainButton.addEventListener('click', resetGame);
        }
        
        if (betAmountInput) {
            betAmountInput.addEventListener('input', updatePotentialWinAndOdds);
        }
        
        if (targetNumberSelect) {
            targetNumberSelect.addEventListener('change', updatePotentialWinAndOdds);
        }
        
        if (betTypeSelect) {
            betTypeSelect.addEventListener('change', updatePotentialWinAndOdds);
        }
        
        // Bet shortcuts
        betShortcuts.forEach(shortcut => {
            shortcut.addEventListener('click', () => {
                const amount = shortcut.dataset.amount;
                
                if (amount === 'max') {
                    const currentUser = window.BetaAuth?.getCurrentUser();
                    if (currentUser && currentUser.balance) {
                        betAmountInput.value = Math.min(10000, currentUser.balance);
                    } else {
                        betAmountInput.value = 10000;
                    }
                } else {
                    betAmountInput.value = amount;
                }
                
                updatePotentialWinAndOdds();
            });
        });
        
        // Load game history
        loadGameHistory();
        
        // Add auth change listener to update balance when it changes
        if (window.BetaAuth) {
            window.BetaAuth.addAuthChangeListener(updateBalanceDisplay);
        }
    }
    
    // Update the dice display based on number
    function updateDiceDisplay(number) {
        if (!diceDisplay) return;
        
        // Clear existing dots
        diceDisplay.innerHTML = '';
        
        // Add new dots based on the number
        switch(number) {
            case 1:
                diceDisplay.innerHTML = '<div class="dice-dot center"></div>';
                break;
            case 2:
                diceDisplay.innerHTML = '<div class="dice-dot top-left"></div><div class="dice-dot bottom-right"></div>';
                break;
            case 3:
                diceDisplay.innerHTML = '<div class="dice-dot top-left"></div><div class="dice-dot center"></div><div class="dice-dot bottom-right"></div>';
                break;
            case 4:
                diceDisplay.innerHTML = '<div class="dice-dot top-left"></div><div class="dice-dot top-right"></div><div class="dice-dot bottom-left"></div><div class="dice-dot bottom-right"></div>';
                break;
            case 5:
                diceDisplay.innerHTML = '<div class="dice-dot top-left"></div><div class="dice-dot top-right"></div><div class="dice-dot center"></div><div class="dice-dot bottom-left"></div><div class="dice-dot bottom-right"></div>';
                break;
            case 6:
                diceDisplay.innerHTML = '<div class="dice-dot top-left"></div><div class="dice-dot top-right"></div><div class="dice-dot middle-left"></div><div class="dice-dot middle-right"></div><div class="dice-dot bottom-left"></div><div class="dice-dot bottom-right"></div>';
                break;
        }
    }
    
    // Update potential win and odds display
    function updatePotentialWinAndOdds() {
        if (!potentialWin || !winChance || !betAmountInput || !targetNumberSelect || !betTypeSelect) return;
        
        const betAmount = parseInt(betAmountInput.value) || 0;
        const targetNumber = parseInt(targetNumberSelect.value);
        const betType = betTypeSelect.value;
        
        let multiplier = 0;
        let chance = 0;
        
        // Calculate multiplier and chance based on bet type
        switch(betType) {
            case 'exact':
                multiplier = 5;
                chance = 1/6 * 100; // 16.67%
                break;
            case 'over':
                multiplier = 2;
                chance = (6 - targetNumber) / 6 * 100;
                break;
            case 'under':
                multiplier = 2;
                chance = targetNumber / 6 * 100;
                break;
        }
        
        // Update displays
        potentialWin.textContent = formatCurrency(betAmount * multiplier);
        winChance.textContent = chance.toFixed(2) + '%';
    }
    
    // Handle the roll button click
    async function handleRoll() {
        if (isRolling) return;
        
        // Check if user is logged in
        const currentUser = window.BetaAuth?.getCurrentUser();
        if (!currentUser) {
            alert('Please login to play!');
            return;
        }
        
        // Get bet details
        const betAmount = parseInt(betAmountInput.value) || 0;
        const targetNumber = parseInt(targetNumberSelect.value);
        const betType = betTypeSelect.value;
        
        // Validate bet amount
        if (betAmount < 10) {
            alert('Minimum bet is 10 coins.');
            return;
        }
        
        if (betAmount > 10000) {
            alert('Maximum bet is 10,000 coins.');
            return;
        }
        
        if (betAmount > currentUser.balance) {
            alert('Not enough coins in your balance.');
            return;
        }
        
        // Start rolling animation
        isRolling = true;
        diceDisplay.classList.add('spinning');
        rollButton.disabled = true;
        
        // Hide result section if visible
        resultSection.style.display = 'none';
        
        // Simulate roll with animation
        const rollDuration = 2000; // 2 seconds
        const rollInterval = 100; // Change dice every 100ms
        let rollTime = 0;
        
        const rollAnimation = setInterval(() => {
            // Random number between 1-6
            const randomNumber = Math.floor(Math.random() * 6) + 1;
            updateDiceDisplay(randomNumber);
            
            rollTime += rollInterval;
            
            if (rollTime >= rollDuration) {
                clearInterval(rollAnimation);
                finishRoll(betAmount, targetNumber, betType);
            }
        }, rollInterval);
    }
    
    // Finish the roll and determine result
    async function finishRoll(betAmount, targetNumber, betType) {
        // Generate final roll
        const finalRoll = Math.floor(Math.random() * 6) + 1;
        updateDiceDisplay(finalRoll);
        
        // Determine if won
        let won = false;
        let multiplier = 0;
        
        switch(betType) {
            case 'exact':
                won = finalRoll === targetNumber;
                multiplier = 5;
                break;
            case 'over':
                won = finalRoll > targetNumber;
                multiplier = 2;
                break;
            case 'under':
                won = finalRoll < targetNumber;
                multiplier = 2;
                break;
        }
        
        // Calculate winnings
        const winAmount = won ? betAmount * multiplier : -betAmount;
        
        // Update user balance
        const currentUser = window.BetaAuth?.getCurrentUser();
        if (currentUser) {
            await window.BetaAuth.updateBalance(winAmount, 'dice');
        }
        
        // Add to game history
        const gameData = {
            user: currentUser?.username || 'Guest',
            game: 'dice',
            bet: betAmount,
            target: targetNumber,
            result: finalRoll,
            outcome: winAmount,
            betType: betType
        };
        
        await gameHistoryOperations.addGameHistory(gameData);
        
        // Show result and apply styling immediately
        resultNumber.textContent = finalRoll;
        
        // Clear any existing classes first
        resultText.className = '';
        resultAmount.className = '';
        
        // Then set the appropriate classes
        if (won) {
            resultText.textContent = 'You Won!';
            resultText.classList.add('result-text', 'win');
            resultAmount.textContent = formatCurrency(winAmount);
            resultAmount.classList.add('result-amount', 'win');
        } else {
            resultText.textContent = 'You Lost!';
            resultText.classList.add('result-text', 'loss');
            resultAmount.textContent = formatCurrency(winAmount);
            resultAmount.classList.add('result-amount', 'loss');
        }
        
        // Show the result section after styles are applied
        resultSection.style.display = 'block';
        
        // Reset game state
        isRolling = false;
        diceDisplay.classList.remove('spinning');
        rollButton.disabled = false;
        
        // Reload game history
        loadGameHistory();
    }
    
    // Reset the game
    function resetGame() {
        resultSection.style.display = 'none';
        updatePotentialWinAndOdds();
    }
    
    // Load game history
    async function loadGameHistory() {
        try {
            const history = await gameHistoryOperations.getRecentHistory();
            gameHistory = history.filter(game => game.game === 'dice');
            updateGameHistoryTable();
        } catch (error) {
            console.error('Error loading game history:', error);
        }
    }
    
    // Update game history table
    function updateGameHistoryTable() {
        if (!gameHistoryBody) return;
        
        gameHistoryBody.innerHTML = '';
        
        gameHistory.forEach(game => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${game.user}</td>
                <td>${formatCurrency(game.bet)}</td>
                <td>${game.target}</td>
                <td>${game.result}</td>
                <td class="${game.outcome >= 0 ? 'win' : 'loss'}">${formatCurrency(game.outcome)}</td>
                <td>${formatTime(game.time)}</td>
            `;
            
            gameHistoryBody.appendChild(row);
        });
    }
    
    // Format currency
    function formatCurrency(amount) {
        return new Intl.NumberFormat().format(amount);
    }
    
    // Format time
    function formatTime(date) {
        return new Date(date).toLocaleString();
    }
    
    // Update balance display from auth system
    function updateBalanceDisplay() {
        const balanceElement = document.querySelector('.balance-amount');
        if (!balanceElement) return;
        
        const currentUser = window.BetaAuth?.getCurrentUser();
        if (currentUser && currentUser.balance !== undefined) {
            balanceElement.textContent = new Intl.NumberFormat().format(currentUser.balance);
        } else {
            balanceElement.textContent = '100'; // Default value if no user or balance
        }
    }
});

// Add CSS for dice
document.addEventListener('DOMContentLoaded', () => {
    // Add CSS for the dice if not already in styles.css
    const diceCSS = `
        .dice-game {
            display: flex;
            flex-wrap: wrap;
            gap: 30px;
            margin-top: 20px;
        }
        
        .dice-display {
            flex: 1;
            min-width: 200px;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        
        .dice {
            width: 150px;
            height: 150px;
            background-color: #ffffff;
            border-radius: 15px;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
            position: relative;
        }
        
        .dice.spinning {
            animation: dice-spin 0.5s linear infinite;
        }
        
        @keyframes dice-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        .dice-dot {
            position: absolute;
            width: 20px;
            height: 20px;
            background-color: #1c1f30;
            border-radius: 50%;
        }
        
        .center {
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }
        
        .top-left {
            top: 20%;
            left: 20%;
        }
        
        .top-right {
            top: 20%;
            right: 20%;
        }
        
        .middle-left {
            top: 50%;
            left: 20%;
            transform: translateY(-50%);
        }
        
        .middle-right {
            top: 50%;
            right: 20%;
            transform: translateY(-50%);
        }
        
        .bottom-left {
            bottom: 20%;
            left: 20%;
        }
        
        .bottom-right {
            bottom: 20%;
            right: 20%;
        }
        
        .win {
            color: var(--success-color) !important;
            text-shadow: 0 0 10px rgba(46, 204, 113, 0.5);
            font-weight: bold;
            transition: none !important;
            animation: none !important;
        }
        
        .loss {
            color: var(--danger-color) !important;
            text-shadow: 0 0 10px rgba(241, 90, 90, 0.5);
            font-weight: bold;
            transition: none !important;
            animation: none !important;
        }
        
        .result-text {
            font-size: 24px;
            font-weight: bold;
            margin: 10px 0;
            transition: none !important;
        }
        
        .result-amount {
            font-size: 32px;
            font-weight: bold;
            margin: 15px 0;
            text-align: center;
            transition: none !important;
        }
        
        .betting-options {
            flex: 2;
            min-width: 300px;
        }
        
        .bet-section, .result-section {
            background-color: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .bet-shortcuts {
            display: flex;
            gap: 10px;
            margin-top: 10px;
        }
        
        .bet-shortcut {
            background-color: rgba(255, 255, 255, 0.1);
            border: none;
            padding: 5px 10px;
            border-radius: 5px;
            color: var(--text-color);
            cursor: pointer;
        }
        
        .bet-shortcut:hover {
            background-color: rgba(255, 255, 255, 0.2);
        }
        
        .odds-display {
            margin: 20px 0;
            display: flex;
            gap: 20px;
        }
        
        .odds-item {
            background-color: rgba(255, 255, 255, 0.05);
            padding: 10px 15px;
            border-radius: 5px;
            flex: 1;
        }
        
        .odds-item span:first-child {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.7);
            margin-right: 5px;
        }
        
        .result-header {
            margin-bottom: 15px;
        }
        
        .result-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        
        .result-display {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .result-number {
            font-size: 48px;
            font-weight: bold;
            margin-bottom: 5px;
        }
    `;
    
    // Add the CSS to the page
    const styleElement = document.createElement('style');
    styleElement.textContent = diceCSS;
    document.head.appendChild(styleElement);
}); 