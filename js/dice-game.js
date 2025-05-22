// BetaGames Crypto Dice Game
document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const diceResult = document.getElementById('diceResult');
    const betAmountInput = document.getElementById('betAmount');
    const targetNumberSlider = document.getElementById('targetNumber');
    const targetNumberDisplay = document.getElementById('targetNumberDisplay');
    const rollUnderButton = document.getElementById('rollUnderButton');
    const rollOverButton = document.getElementById('rollOverButton');
    const rollButton = document.getElementById('rollButton');
    const resultSection = document.getElementById('resultSection');
    const resultNumber = document.getElementById('resultNumber');
    const resultText = document.getElementById('resultText');
    const resultAmount = document.getElementById('resultAmount');
    const playAgainButton = document.getElementById('playAgainButton');
    const winChance = document.getElementById('winChance');
    const multiplier = document.getElementById('multiplier');
    const potentialWin = document.getElementById('potentialWin');
    const betShortcuts = document.querySelectorAll('.bet-shortcut');
    const gameHistoryBody = document.getElementById('gameHistoryBody');
    
    // Game state
    let isRolling = false;
    let gameHistory = [];
    let currentBetType = 'under'; // 'under' or 'over'
    
    // Initialize the game
    init();
    
    function init() {
        // Set default dice display
        updateDiceDisplay('0.00');
        
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
        
        if (targetNumberSlider) {
            targetNumberSlider.addEventListener('input', () => {
                targetNumberDisplay.textContent = targetNumberSlider.value;
                updatePotentialWinAndOdds();
            });
        }
        
        if (rollUnderButton) {
            rollUnderButton.addEventListener('click', () => {
                rollUnderButton.classList.add('active');
                rollOverButton.classList.remove('active');
                currentBetType = 'under';
                updatePotentialWinAndOdds();
            });
        }
        
        if (rollOverButton) {
            rollOverButton.addEventListener('click', () => {
                rollOverButton.classList.add('active');
                rollUnderButton.classList.remove('active');
                currentBetType = 'over';
                updatePotentialWinAndOdds();
            });
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
                        betAmountInput.value = 100;
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
    
    // Update the dice display
    function updateDiceDisplay(number) {
        if (!diceResult) return;
        diceResult.textContent = number;
    }
    
    // Update potential win and odds display
    function updatePotentialWinAndOdds() {
        if (!winChance || !multiplier || !potentialWin || !betAmountInput || !targetNumberSlider) return;
        
        const betAmount = parseInt(betAmountInput.value) || 0;
        const targetNumber = parseInt(targetNumberSlider.value);
        
        let winChanceValue = 0;
        let multiplierValue = 0;
        
        // Calculate win chance and multiplier based on bet type
        if (currentBetType === 'under') {
            // For "Roll Under", win chance is the target number (e.g., roll under 75 = 75% chance)
            winChanceValue = targetNumber;
            
            // Special case: when target is very high (95+), dramatically reduce multiplier
            if (targetNumber >= 95) {
                // Make multiplier diminish exponentially as it approaches 99
                const adjustmentFactor = Math.pow(1.8, targetNumber - 94);
                winChanceValue = Math.min(99.9, targetNumber * adjustmentFactor);
            }
        } else {
            // For "Roll Over", win chance is 100 - target number (e.g., roll over 25 = 75% chance)
            winChanceValue = 100 - targetNumber;
            
            // Special case: when target is very low (5-), dramatically reduce multiplier
            if (targetNumber <= 5) {
                // Make multiplier diminish exponentially as it approaches 1
                const adjustmentFactor = Math.pow(1.8, 6 - targetNumber);
                winChanceValue = Math.min(99.9, winChanceValue * adjustmentFactor);
            }
            
            // Ensure win chance is never 0 (which would cause division by zero)
            if (winChanceValue <= 0) {
                winChanceValue = 0.1;
            }
        }
        
        // Calculate multiplier with house edge (5%)
        // Formula: (100 / win chance) * 0.95
        multiplierValue = (100 / winChanceValue) * 0.95;
        
        // Cap multiplier at a reasonable value
        multiplierValue = Math.min(multiplierValue, 950);
        
        // Update UI
        winChance.textContent = winChanceValue.toFixed(2) + '%';
        multiplier.textContent = multiplierValue.toFixed(2) + 'x';
        
        // Calculate potential win
        const potentialWinAmount = Math.floor(betAmount * multiplierValue);
        potentialWin.textContent = formatCurrency(potentialWinAmount);
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
        const targetNumber = parseInt(targetNumberSlider.value);
        
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
        diceResult.classList.add('rolling');
        rollButton.disabled = true;
        
        // Hide result section if visible
        resultSection.style.display = 'none';
        
        // Simulate roll with animation
        const rollDuration = 2000; // 2 seconds
        const rollInterval = 50; // Change number every 50ms
        let rollTime = 0;
        
        const rollAnimation = setInterval(() => {
            // Random number between 0.00 and 99.99
            const randomNumber = (Math.random() * 100).toFixed(2);
            updateDiceDisplay(randomNumber);
            
            rollTime += rollInterval;
            
            if (rollTime >= rollDuration) {
                clearInterval(rollAnimation);
                finishRoll(betAmount, targetNumber);
            }
        }, rollInterval);
    }
    
    // Finish the roll and determine result
    function finishRoll(betAmount, targetNumber) {
        // Generate the final result (0.00-99.99)
        const result = (Math.random() * 100).toFixed(2);
        const resultValue = parseFloat(result);
        
        // Update dice display with result
        updateDiceDisplay(result);
        
        // Remove rolling class
        diceResult.classList.remove('rolling');
        
        // Determine if won based on bet type
        let won = false;
        
        if (currentBetType === 'under') {
            won = (resultValue < targetNumber);
        } else { // over
            won = (resultValue > targetNumber);
        }
        
        // Calculate multiplier and win/loss amount
        let winChanceValue = 0;
        let multiplierValue = 0;
        
        if (currentBetType === 'under') {
            winChanceValue = targetNumber;
            
            // Special case: when target is very high (95+), dramatically reduce multiplier
            if (targetNumber >= 95) {
                // Make multiplier diminish exponentially as it approaches 99
                const adjustmentFactor = Math.pow(1.8, targetNumber - 94);
                winChanceValue = Math.min(99.9, targetNumber * adjustmentFactor);
            }
        } else { // over
            winChanceValue = 100 - targetNumber;
            
            // Special case: when target is very low (5-), dramatically reduce multiplier
            if (targetNumber <= 5) {
                // Make multiplier diminish exponentially as it approaches 1
                const adjustmentFactor = Math.pow(1.8, 6 - targetNumber);
                winChanceValue = Math.min(99.9, winChanceValue * adjustmentFactor);
            }
            
            // Ensure win chance is never 0 (which would cause division by zero)
            if (winChanceValue <= 0) {
                winChanceValue = 0.1;
            }
        }
        
        multiplierValue = (100 / winChanceValue) * 0.95; // 5% house edge
        
        // Cap multiplier at a reasonable value
        multiplierValue = Math.min(multiplierValue, 950);
        
        // Calculate outcome
        const outcomeAmount = won ? Math.floor(betAmount * multiplierValue) : -betAmount;
        
        // Update user balance
        if (window.BetaAuth) {
            window.BetaAuth.updateBalance(outcomeAmount, 'Crypto Dice Game');
        }
        
        // Apply win/loss color to main result display
        diceResult.style.color = won ? '#44ff44' : '#ff4444';
        diceResult.style.textShadow = won ? 
            '0 0 10px rgba(68, 255, 68, 0.5)' : 
            '0 0 10px rgba(255, 68, 68, 0.5)';
        
        // Show result
        resultNumber.textContent = result;
        resultText.textContent = won ? 'You Won!' : 'You Lost!';
        resultText.style.color = won ? '#44ff44' : '#ff4444';
        resultAmount.textContent = formatCurrency(outcomeAmount);
        resultAmount.style.color = won ? '#44ff44' : '#ff4444';
        resultSection.style.display = 'block';
        
        // Add to game history
        addGameToHistory({
            user: window.BetaAuth?.getCurrentUser()?.username || 'Guest',
            bet: betAmount,
            type: currentBetType === 'under' ? 'Roll Under' : 'Roll Over',
            target: targetNumber,
            result: result,
            multiplier: multiplierValue.toFixed(2) + 'x',
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
        
        if (diceResult) {
            updateDiceDisplay('0.00');
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
            betCell.textContent = formatNumber(game.bet);
            
            // Type and target cell
            const typeCell = document.createElement('td');
            typeCell.textContent = game.type;
            
            // Target cell
            const targetCell = document.createElement('td');
            targetCell.textContent = game.target;
            
            // Result cell
            const resultCell = document.createElement('td');
            resultCell.textContent = game.result;
            
            // Multiplier cell
            const multiplierCell = document.createElement('td');
            multiplierCell.textContent = game.multiplier;
            
            // Outcome cell
            const outcomeCell = document.createElement('td');
            outcomeCell.textContent = formatCurrency(game.outcome);
            outcomeCell.style.color = game.outcome >= 0 ? '#44ff44' : '#ff4444';
            
            // Time cell
            const timeCell = document.createElement('td');
            timeCell.textContent = formatTime(game.time);
            
            // Append cells to row
            row.appendChild(userCell);
            row.appendChild(betCell);
            row.appendChild(typeCell);
            row.appendChild(targetCell);
            row.appendChild(resultCell);
            row.appendChild(multiplierCell);
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
        const betTypes = ['Roll Under', 'Roll Over'];
        const usernames = ['Player123', 'LuckyGuy', 'BigWinner', 'CasinoKing', 'RollTheDice', 'BetaPlayer'];
        
        // Get current user if available
        const currentUser = window.BetaAuth?.getCurrentUser();
        if (currentUser) {
            usernames.push(currentUser.username);
        }
        
        for (let i = 0; i < 10; i++) {
            const username = usernames[Math.floor(Math.random() * usernames.length)];
            const bet = Math.floor(Math.random() * 1000) + 100;
            const betType = betTypes[Math.floor(Math.random() * betTypes.length)];
            const targetNumber = Math.floor(Math.random() * 98) + 1; // 1-99
            const result = (Math.random() * 100).toFixed(2);
            const resultValue = parseFloat(result);
            
            // Determine if won based on bet type
            let won = false;
            if (betType === 'Roll Under') {
                won = (resultValue < targetNumber);
            } else { // Roll Over
                won = (resultValue > targetNumber);
            }
            
            // Calculate multiplier
            let winChanceValue = 0;
            if (betType === 'Roll Under') {
                winChanceValue = targetNumber;
            } else { // Roll Over
                winChanceValue = 100 - targetNumber;
            }
            
            const multiplierValue = (100 / winChanceValue) * 0.95; // 5% house edge
            
            // Calculate outcome
            const outcome = won ? Math.floor(bet * multiplierValue) : -bet;
            
            // Add to history
            gameHistory.push({
                user: username,
                bet: bet,
                type: betType,
                target: targetNumber,
                result: result,
                multiplier: multiplierValue.toFixed(2) + 'x',
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
    
    // Format number helper
    function formatNumber(number) {
        return new Intl.NumberFormat().format(number);
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
        .game-container {
            background-color: #141b2d;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .game-title {
            font-size: 28px;
            margin-bottom: 10px;
            color: #fff;
        }
        
        .dice-game {
            display: flex;
            flex-direction: column;
            gap: 20px;
            margin-top: 20px;
        }
        
        .dice-display {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px 0;
            margin-bottom: 20px;
        }
        
        .dice {
            width: 100px;
            height: 100px;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
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
            width: 16px;
            height: 16px;
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
            width: 100%;
        }
        
        .bet-section h3 {
            font-size: 18px;
            margin-bottom: 15px;
            color: #fff;
        }
        
        .bet-controls {
            display: grid;
            grid-template-columns: 1fr;
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .bet-input {
            margin-bottom: 15px;
        }
        
        .bet-input label {
            display: block;
            margin-bottom: 8px;
            color: #fff;
            font-size: 16px;
        }
        
        .bet-input input[type="number"] {
            width: 100%;
            padding: 10px;
            background-color: #1c2639;
            border: 1px solid #2c3e50;
            border-radius: 4px;
            color: #fff;
            font-size: 16px;
        }
        
        .bet-input select {
            width: 100%;
            padding: 10px;
            background-color: #1c2639;
            border: 1px solid #2c3e50;
            border-radius: 4px;
            color: #fff;
            font-size: 16px;
            appearance: auto;
        }
        
        .bet-shortcuts {
            display: flex;
            gap: 10px;
            margin-top: 10px;
        }
        
        .bet-shortcut {
            background-color: #1c2639;
            border: 1px solid #2c3e50;
            padding: 5px 10px;
            border-radius: 4px;
            color: #fff;
            cursor: pointer;
        }
        
        .bet-shortcut:hover {
            background-color: #263752;
        }
        
        .odds-display {
            margin: 20px 0;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .odds-item {
            display: flex;
            font-size: 16px;
            color: #fff;
        }
        
        .odds-item span:first-child {
            margin-right: 10px;
        }
        
        #potentialWin, #winChance {
            font-weight: bold;
        }
        
        .game-button {
            width: 100%;
            padding: 12px 0;
            background-color: #00c851;
            color: #fff;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            text-transform: uppercase;
            margin-top: 10px;
        }
        
        .game-button:hover {
            background-color: #00a844;
        }
        
        .result-section {
            background-color: #1c2639;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .result-header h3 {
            font-size: 18px;
            margin-bottom: 15px;
            color: #fff;
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
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 5px;
            color: #fff;
        }
        
        .result-text {
            font-size: 18px;
        }
        
        .result-amount {
            font-size: 24px;
            font-weight: bold;
        }
        
        .game-history {
            background-color: #141b2d;
            border-radius: 8px;
            padding: 20px;
        }
        
        .game-history h2 {
            font-size: 20px;
            margin-bottom: 15px;
            color: #fff;
        }
        
        .history-table {
            overflow-x: auto;
        }
        
        .history-table table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .history-table th,
        .history-table td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #2c3e50;
            color: #fff;
        }
        
        .history-table th {
            font-weight: normal;
            color: rgba(255, 255, 255, 0.7);
        }
        
        .fade-in {
            animation: fadeIn 0.5s ease-in-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        /* Color classes */
        .var(--success-color) {
            color: #00c851;
        }
        
        .var(--danger-color) {
            color: #ff4444;
        }
    `;
    
    // Add the CSS to the page
    const styleElement = document.createElement('style');
    styleElement.textContent = diceCSS;
    document.head.appendChild(styleElement);
}); 