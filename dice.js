// BetaGames Dice Game
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
    function handleRoll() {
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
    function finishRoll(betAmount, targetNumber, betType) {
        // Generate the final result (1-6)
        const result = Math.floor(Math.random() * 6) + 1;
        
        // Update dice display with result
        updateDiceDisplay(result);
        
        // Remove spinning class
        diceDisplay.classList.remove('spinning');
        
        // Determine if won based on bet type
        let won = false;
        
        switch(betType) {
            case 'exact':
                won = (result === targetNumber);
                break;
            case 'over':
                won = (result > targetNumber);
                break;
            case 'under':
                won = (result < targetNumber);
                break;
        }
        
        // Calculate win/loss amount
        let multiplier = 0;
        
        if (won) {
            multiplier = betType === 'exact' ? 5 : 2;
        } else {
            multiplier = -1;
        }
        
        const outcomeAmount = betAmount * multiplier;
        
        // Update user balance
        if (window.BetaAuth) {
            window.BetaAuth.updateBalance(outcomeAmount, 'Dice Game');
        }
        
        // Show result
        resultNumber.textContent = result;
        resultText.textContent = won ? 'You Won!' : 'You Lost!';
        resultText.style.color = won ? 'var(--success-color)' : 'var(--danger-color)';
        resultAmount.textContent = formatCurrency(outcomeAmount);
        resultAmount.style.color = won ? 'var(--success-color)' : 'var(--danger-color)';
        resultSection.style.display = 'block';
        
        // Add to game history
        addGameToHistory({
            user: window.BetaAuth?.getCurrentUser()?.username || 'Guest',
            bet: betAmount,
            target: `${betType} ${targetNumber}`,
            result: result,
            outcome: outcomeAmount,
            time: new Date()
        });
        
        // Track bet in main system
        if (window.BetaGames?.trackGameBet) {
            window.BetaGames.trackGameBet('Dice', betAmount, outcomeAmount);
        }
        
        // Reset game state
        isRolling = false;
        rollButton.disabled = false;
    }
    
    // Reset the game for a new roll
    function resetGame() {
        if (resultSection) {
            resultSection.style.display = 'none';
        }
        
        if (diceDisplay) {
            updateDiceDisplay(1);
        }
    }
    
    // Add a game to history
    function addGameToHistory(game) {
        // Add to local history
        gameHistory.unshift(game);
        
        // Keep history at a reasonable size
        if (gameHistory.length > 20) {
            gameHistory.pop();
        }
        
        // Update UI
        updateGameHistoryTable();
    }
    
    // Update the game history table
    function updateGameHistoryTable() {
        if (!gameHistoryBody) return;
        
        // Clear table
        gameHistoryBody.innerHTML = '';
        
        // Add rows for each game
        gameHistory.forEach(game => {
            const row = document.createElement('tr');
            
            // User cell
            const userCell = document.createElement('td');
            userCell.textContent = game.user;
            
            // Bet cell
            const betCell = document.createElement('td');
            betCell.textContent = formatCurrency(game.bet);
            
            // Target cell
            const targetCell = document.createElement('td');
            targetCell.textContent = game.target;
            
            // Result cell
            const resultCell = document.createElement('td');
            resultCell.textContent = game.result;
            
            // Outcome cell
            const outcomeCell = document.createElement('td');
            outcomeCell.textContent = formatCurrency(game.outcome);
            outcomeCell.style.color = game.outcome >= 0 ? 'var(--success-color)' : 'var(--danger-color)';
            
            // Time cell
            const timeCell = document.createElement('td');
            timeCell.textContent = formatTime(game.time);
            
            // Append cells to row
            row.appendChild(userCell);
            row.appendChild(betCell);
            row.appendChild(targetCell);
            row.appendChild(resultCell);
            row.appendChild(outcomeCell);
            row.appendChild(timeCell);
            
            // Add animation class
            row.classList.add('fade-in');
            
            // Append row to table
            gameHistoryBody.appendChild(row);
        });
    }
    
    // Load initial game history with random data
    function loadGameHistory() {
        // Add some random games to history
        const betTypes = ['exact', 'over', 'under'];
        const usernames = ['Player123', 'LuckyGuy', 'BigWinner', 'CasinoKing', 'RollTheDice', 'BetaPlayer'];
        
        // Get current user if available
        const currentUser = window.BetaAuth?.getCurrentUser();
        if (currentUser) {
            usernames.push(currentUser.username);
        }
        
        for (let i = 0; i < 10; i++) {
            const username = usernames[Math.floor(Math.random() * usernames.length)];
            const bet = Math.floor(Math.random() * 1000) + 100;
            const targetNumber = Math.floor(Math.random() * 6) + 1;
            const betType = betTypes[Math.floor(Math.random() * betTypes.length)];
            const result = Math.floor(Math.random() * 6) + 1;
            
            // Determine if won based on bet type
            let won = false;
            switch(betType) {
                case 'exact':
                    won = (result === targetNumber);
                    break;
                case 'over':
                    won = (result > targetNumber);
                    break;
                case 'under':
                    won = (result < targetNumber);
                    break;
            }
            
            // Calculate outcome
            let multiplier = 0;
            if (won) {
                multiplier = betType === 'exact' ? 5 : 2;
            } else {
                multiplier = -1;
            }
            const outcome = bet * multiplier;
            
            // Add to history
            gameHistory.push({
                user: username,
                bet: bet,
                target: `${betType} ${targetNumber}`,
                result: result,
                outcome: outcome,
                time: new Date(Date.now() - Math.floor(Math.random() * 3600000)) // Within the last hour
            });
        }
        
        // Sort by time (most recent first)
        gameHistory.sort((a, b) => b.time - a.time);
        
        // Update UI
        updateGameHistoryTable();
    }
    
    // Format currency helper
    function formatCurrency(amount) {
        if (window.BetaGames?.formatCurrency) {
            return window.BetaGames.formatCurrency(amount);
        }
        
        const formatted = new Intl.NumberFormat().format(Math.abs(Math.round(amount)));
        return amount >= 0 ? `+${formatted}` : `-${formatted}`;
    }
    
    // Format time helper
    function formatTime(date) {
        if (window.BetaGames?.formatTime) {
            return window.BetaGames.formatTime(date);
        }
        
        const now = new Date();
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        
        if (diffSec < 60) {
            return 'just now';
        } else if (diffMin < 60) {
            return `${diffMin}m ago`;
        } else {
            return `${diffHour}h ago`;
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
        
        .result-text {
            font-size: 20px;
        }
        
        .result-amount {
            font-size: 36px;
            font-weight: bold;
        }
    `;
    
    // Add the CSS to the page
    const styleElement = document.createElement('style');
    styleElement.textContent = diceCSS;
    document.head.appendChild(styleElement);
}); 