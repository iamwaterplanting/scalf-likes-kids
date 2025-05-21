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
    const rollOverValue = document.getElementById('rollOverValue');
    const betShortcuts = document.querySelectorAll('.bet-shortcut');
    const gameHistoryBody = document.getElementById('gameHistoryBody');
    const activityList = document.getElementById('activityList');
    const activityTabs = document.querySelectorAll('.activity-tab');
    const manualModeButton = document.getElementById('manualModeButton');
    const autoModeButton = document.getElementById('autoModeButton');
    const manualControls = document.getElementById('manualControls');
    const autoControls = document.getElementById('autoControls');
    const startAutobetButton = document.getElementById('startAutobetButton');
    const numberOfBetsInput = document.getElementById('numberOfBets');
    const increaseOnWinInput = document.getElementById('increaseOnWin');
    const increaseOnLossInput = document.getElementById('increaseOnLoss');
    const resetOnWinButton = document.getElementById('resetOnWin');
    const resetOnLossButton = document.getElementById('resetOnLoss');
    const stopOnProfitInput = document.getElementById('stopOnProfit');
    const stopOnLossInput = document.getElementById('stopOnLoss');
    const betAmountValue = document.querySelector('.bet-amount-value');
    
    // Game state
    let isRolling = false;
    let gameHistory = [];
    let recentActivity = [];
    let currentBetType = 'under'; // 'under' or 'over'
    let currentTab = 'all'; // 'all', 'wins', or 'losses'
    let isAutoMode = false;
    let autoBetRunning = false;
    let autoBetCounter = 0;
    let totalProfit = 0;
    let initialBetAmount = 0;
    let currentAutoBetAmount = 0;
    
    // Initialize the game
    init();
    
    function init() {
        // Set default dice display (0.00)
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
            betAmountInput.addEventListener('input', () => {
                updatePotentialWinAndOdds();
                updateBetAmountValue();
            });
            updateBetAmountValue();
        }
        
        if (targetNumberSlider) {
            targetNumberSlider.addEventListener('input', () => {
                targetNumberDisplay.textContent = targetNumberSlider.value;
                rollOverValue.textContent = targetNumberSlider.value;
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
        
        // Manual/Auto toggle
        if (manualModeButton && autoModeButton) {
            manualModeButton.addEventListener('click', () => {
                setGameMode('manual');
            });
            
            autoModeButton.addEventListener('click', () => {
                setGameMode('auto');
            });
        }
        
        // Start autobet button
        if (startAutobetButton) {
            startAutobetButton.addEventListener('click', () => {
                if (autoBetRunning) {
                    stopAutoBet();
                } else {
                    startAutoBet();
                }
            });
        }
        
        // Activity tabs
        activityTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                activityTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentTab = tab.dataset.tab;
                updateActivityList();
            });
        });
        
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
                updateBetAmountValue();
            });
        });
        
        // Load game history and recent activity
        loadGameHistory();
        loadRecentActivity();
    }
    
    // Function to set game mode (manual or auto)
    function setGameMode(mode) {
        if (mode === 'manual') {
            isAutoMode = false;
            manualModeButton.classList.add('active');
            autoModeButton.classList.remove('active');
            manualControls.style.display = 'block';
            autoControls.style.display = 'none';
            
            // If autobet is running, stop it
            if (autoBetRunning) {
                stopAutoBet();
            }
        } else if (mode === 'auto') {
            isAutoMode = true;
            autoModeButton.classList.add('active');
            manualModeButton.classList.remove('active');
            manualControls.style.display = 'none';
            autoControls.style.display = 'block';
        }
    }
    
    // Function to start autobet
    function startAutoBet() {
        // Check if user is logged in
        const currentUser = window.BetaAuth?.getCurrentUser();
        if (!currentUser) {
            alert('Please login to play!');
            return;
        }
        
        // Get number of bets and validate
        const numberOfBets = parseInt(numberOfBetsInput.value) || 0;
        const betAmount = parseFloat(betAmountInput.value) || 0;
        
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
        
        // Set initial values
        initialBetAmount = betAmount;
        currentAutoBetAmount = betAmount;
        autoBetCounter = 0;
        totalProfit = 0;
        autoBetRunning = true;
        
        // Update button text
        startAutobetButton.textContent = 'Stop Autobet';
        startAutobetButton.style.backgroundColor = '#ff4d4d';
        
        // Start the first bet
        handleAutoBet();
    }
    
    // Function to stop autobet
    function stopAutoBet() {
        autoBetRunning = false;
        startAutobetButton.textContent = 'Start Autobet';
        startAutobetButton.style.backgroundColor = '#32cd32';
    }
    
    // Function to handle auto bet
    function handleAutoBet() {
        if (!autoBetRunning) return;
        
        // Check if number of bets limit reached
        const numberOfBets = parseInt(numberOfBetsInput.value) || 0;
        if (numberOfBets > 0 && autoBetCounter >= numberOfBets) {
            stopAutoBet();
            return;
        }
        
        // Check stop on profit/loss conditions
        const stopOnProfit = parseFloat(stopOnProfitInput.value) || 0;
        const stopOnLoss = parseFloat(stopOnLossInput.value) || 0;
        
        if (stopOnProfit > 0 && totalProfit >= stopOnProfit) {
            stopAutoBet();
            alert(`Auto bet stopped: Profit target of ${formatCurrency(stopOnProfit)} reached.`);
            return;
        }
        
        if (stopOnLoss > 0 && totalProfit <= -stopOnLoss) {
            stopAutoBet();
            alert(`Auto bet stopped: Loss limit of ${formatCurrency(stopOnLoss)} reached.`);
            return;
        }
        
        // Set bet amount to current auto bet amount
        betAmountInput.value = currentAutoBetAmount;
        updateBetAmountValue();
        
        // Execute the bet
        autoBetCounter++;
        handleRoll(true);
    }
    
    // Update the bet amount display value
    function updateBetAmountValue() {
        if (betAmountValue) {
            betAmountValue.textContent = `$${parseFloat(betAmountInput.value).toFixed(2)}`;
        }
    }
    
    // Update the dice display based on number
    function updateDiceDisplay(number) {
        if (!diceResult) return;
        diceResult.textContent = number;
    }
    
    // Update potential win and odds display
    function updatePotentialWinAndOdds() {
        if (!winChance || !multiplier || !rollOverValue || !betAmountInput || !targetNumberSlider) return;
        
        const betAmount = parseFloat(betAmountInput.value) || 0;
        const targetNumber = parseInt(targetNumberSlider.value);
        
        let chanceValue = 0;
        let multiplierValue = 0;
        
        // Calculate chance and multiplier based on bet type and target number
        if (currentBetType === 'under') {
            chanceValue = targetNumber;
            multiplierValue = 100 / chanceValue;
        } else { // over
            chanceValue = 100 - targetNumber;
            multiplierValue = 100 / chanceValue;
        }
        
        // Account for house edge (5%)
        multiplierValue = multiplierValue * 0.95;
        
        // Update displays
        winChance.textContent = chanceValue.toFixed(2) + '%';
        multiplier.textContent = multiplierValue.toFixed(2) + 'x';
        rollOverValue.textContent = targetNumber;
    }
    
    // Handle the roll button click
    function handleRoll(isAutoBet = false) {
        if (isRolling) return;
        
        // Check if user is logged in
        const currentUser = window.BetaAuth?.getCurrentUser();
        if (!currentUser) {
            alert('Please login to play!');
            if (autoBetRunning) stopAutoBet();
            return;
        }
        
        // Get bet details
        const betAmount = parseFloat(betAmountInput.value) || 0;
        const targetNumber = parseInt(targetNumberSlider.value);
        
        // Validate bet amount
        if (betAmount < 10) {
            alert('Minimum bet is 10 coins.');
            if (autoBetRunning) stopAutoBet();
            return;
        }
        
        if (betAmount > 10000) {
            alert('Maximum bet is 10,000 coins.');
            if (autoBetRunning) stopAutoBet();
            return;
        }
        
        if (betAmount > currentUser.balance) {
            alert('Not enough coins in your balance.');
            if (autoBetRunning) stopAutoBet();
            return;
        }
        
        // Start rolling animation
        isRolling = true;
        diceResult.classList.add('rolling');
        rollButton.disabled = true;
        
        // Hide result section if visible
        resultSection.style.display = 'none';
        
        // Simulate roll with animation
        const rollDuration = isAutoBet ? 500 : 2000; // Shorter animation for autobet
        const rollInterval = 50; // Change number every 50ms
        let rollTime = 0;
        
        const rollAnimation = setInterval(() => {
            // Random number between 0.00 and 99.99
            const randomNumber = (Math.random() * 100).toFixed(2);
            updateDiceDisplay(randomNumber);
            
            rollTime += rollInterval;
            
            if (rollTime >= rollDuration) {
                clearInterval(rollAnimation);
                finishRoll(betAmount, targetNumber, isAutoBet);
            }
        }, rollInterval);
    }
    
    // Finish the roll and determine result
    function finishRoll(betAmount, targetNumber, isAutoBet = false) {
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
        let chanceValue = 0;
        let multiplierValue = 0;
        
        if (currentBetType === 'under') {
            chanceValue = targetNumber;
        } else { // over
            chanceValue = 100 - targetNumber;
        }
        
        multiplierValue = (100 / chanceValue) * 0.95; // 5% house edge
        
        // Calculate outcome
        const outcomeAmount = won ? Math.floor(betAmount * multiplierValue) : -betAmount;
        
        // Update user balance
        if (window.BetaAuth) {
            window.BetaAuth.updateBalance(outcomeAmount, 'Crypto Dice Game');
        }
        
        // Show result only if not in autobet mode
        if (!isAutoBet) {
            resultNumber.textContent = result;
            resultText.textContent = won ? 'You Won!' : 'You Lost!';
            resultText.style.color = won ? 'var(--success-color)' : 'var(--danger-color)';
            resultAmount.textContent = formatCurrency(outcomeAmount);
            resultAmount.style.color = won ? 'var(--success-color)' : 'var(--danger-color)';
            resultSection.style.display = 'block';
        }
        
        // Add to game history
        const gameResult = {
            user: window.BetaAuth?.getCurrentUser()?.username || 'Guest',
            bet: betAmount,
            type: currentBetType === 'under' ? 'Roll Under' : 'Roll Over',
            target: targetNumber,
            result: result,
            multiplier: multiplierValue.toFixed(2) + 'x',
            outcome: outcomeAmount,
            time: new Date()
        };
        
        addGameToHistory(gameResult);
        addToRecentActivity(gameResult);
        
        // Track bet in main system
        if (window.BetaGames?.trackGameBet) {
            window.BetaGames.trackGameBet('Dice', betAmount, outcomeAmount);
        }
        
        // Handle autobet adjustments
        if (isAutoBet) {
            // Update total profit
            totalProfit += outcomeAmount;
            
            // Apply on-win or on-loss strategy
            if (won) {
                // On win
                const increaseOnWin = parseFloat(increaseOnWinInput.value) || 0;
                if (resetOnWinButton.classList.contains('active')) {
                    // Reset to initial bet
                    currentAutoBetAmount = initialBetAmount;
                } else if (increaseOnWin > 0) {
                    // Increase by percentage
                    currentAutoBetAmount *= (1 + increaseOnWin / 100);
                }
            } else {
                // On loss
                const increaseOnLoss = parseFloat(increaseOnLossInput.value) || 0;
                if (resetOnLossButton.classList.contains('active')) {
                    // Reset to initial bet
                    currentAutoBetAmount = initialBetAmount;
                } else if (increaseOnLoss > 0) {
                    // Increase by percentage
                    currentAutoBetAmount *= (1 + increaseOnLoss / 100);
                }
            }
            
            // Schedule next autobet with a small delay
            setTimeout(() => {
                isRolling = false;
                rollButton.disabled = false;
                
                if (autoBetRunning) {
                    handleAutoBet();
                }
            }, 300);
        } else {
            // Reset game state
            isRolling = false;
            rollButton.disabled = false;
        }
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
    
    // Add to recent activity
    function addToRecentActivity(game) {
        // Add to recent activity
        recentActivity.unshift({
            user: game.user,
            bet: game.bet,
            type: game.type,
            target: game.target,
            result: game.result,
            multiplier: game.multiplier,
            outcome: game.outcome,
            time: game.time,
            won: game.outcome > 0
        });
        
        // Keep activity list at a reasonable size
        if (recentActivity.length > 50) {
            recentActivity.pop();
        }
        
        // Update UI
        updateActivityList();
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
            
            // Type cell
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
            outcomeCell.style.color = game.outcome >= 0 ? 'var(--success-color)' : 'var(--danger-color)';
            
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
    
    // Update the activity list
    function updateActivityList() {
        if (!activityList) return;
        
        // Clear list
        activityList.innerHTML = '';
        
        // Filter activity based on current tab
        let filteredActivity = recentActivity;
        
        if (currentTab === 'wins') {
            filteredActivity = recentActivity.filter(activity => activity.won);
        } else if (currentTab === 'losses') {
            filteredActivity = recentActivity.filter(activity => !activity.won);
        }
        
        // Add items for each activity
        filteredActivity.forEach(activity => {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            
            const activityUser = document.createElement('div');
            activityUser.className = 'activity-user';
            activityUser.textContent = activity.user;
            
            const activityDetails = document.createElement('div');
            activityDetails.className = 'activity-details';
            
            const detailsText = document.createElement('div');
            detailsText.className = 'details-text';
            detailsText.innerHTML = `
                <span>${activity.type} ${activity.target}</span>
                <span>Result: ${activity.result}</span>
                <span>Multiplier: ${activity.multiplier}</span>
            `;
            
            const detailsOutcome = document.createElement('div');
            detailsOutcome.className = 'details-outcome';
            detailsOutcome.textContent = formatCurrency(activity.outcome);
            detailsOutcome.style.color = activity.outcome > 0 ? 'var(--success-color)' : 'var(--danger-color)';
            
            const activityTime = document.createElement('div');
            activityTime.className = 'activity-time';
            activityTime.textContent = formatTime(activity.time);
            
            // Assemble the activity item
            activityDetails.appendChild(detailsText);
            activityDetails.appendChild(detailsOutcome);
            
            activityItem.appendChild(activityUser);
            activityItem.appendChild(activityDetails);
            activityItem.appendChild(activityTime);
            
            // Add animation class
            activityItem.classList.add('fade-in');
            
            // Append item to list
            activityList.appendChild(activityItem);
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
            const targetNumber = betType === 'Roll Under' 
                ? Math.floor(Math.random() * 90) + 10 // 10-99 for under
                : Math.floor(Math.random() * 90) + 1; // 1-90 for over
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
            let chanceValue = 0;
            if (betType === 'Roll Under') {
                chanceValue = targetNumber;
            } else { // Roll Over
                chanceValue = 100 - targetNumber;
            }
            
            const multiplierValue = (100 / chanceValue) * 0.95; // 5% house edge
            
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
    
    // Load initial recent activity with random data
    function loadRecentActivity() {
        // Copy from game history
        recentActivity = gameHistory.map(game => ({
            user: game.user,
            bet: game.bet,
            type: game.type,
            target: game.target,
            result: game.result,
            multiplier: game.multiplier,
            outcome: game.outcome,
            time: game.time,
            won: game.outcome > 0
        }));
        
        // Update UI
        updateActivityList();
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
    // Add CSS for the dice game if not already in styles.css
    const diceCSS = `
        /* Main container styling */
        .game-container {
            background-color: #0e1622;
            border-radius: 10px;
            padding: 20px;
            position: relative;
        }
        
        .game-title {
            font-size: 1.8rem;
            margin-bottom: 20px;
            color: #fff;
        }
        
        .dice-game {
            display: flex;
            flex-direction: column;
            width: 100%;
            margin-top: 20px;
        }
        
        /* Dice result display */
        .dice-display {
            margin-bottom: 30px;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 30px 0;
            background-color: #1c2635;
            border-radius: 10px;
        }
        
        #diceResult {
            font-size: 4rem;
            font-weight: bold;
            color: #4287f5;
            transition: all 0.2s ease;
        }
        
        #diceResult.rolling {
            animation: dice-roll 0.2s linear infinite;
        }
        
        @keyframes dice-roll {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        /* Betting section */
        .betting-options {
            width: 100%;
        }
        
        .bet-section {
            background-color: #1c2635;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .bet-section h3 {
            font-size: 1.4rem;
            margin-bottom: 15px;
            color: #fff;
        }
        
        /* Bet controls */
        .bet-controls {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .bet-input {
            margin-bottom: 20px;
        }
        
        .bet-input label {
            display: block;
            margin-bottom: 8px;
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.9rem;
        }
        
        .bet-input input[type="number"] {
            width: 100%;
            padding: 12px 15px;
            background-color: #131e2c;
            border: 1px solid #2c3e50;
            border-radius: 5px;
            color: #fff;
            font-size: 1rem;
        }
        
        .bet-shortcuts {
            display: flex;
            gap: 10px;
            margin-top: 10px;
        }
        
        .bet-shortcut {
            background-color: #263445;
            border: none;
            padding: 8px 12px;
            border-radius: 5px;
            color: #fff;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .bet-shortcut:hover {
            background-color: #3a4b63;
        }
        
        /* Slider styling */
        .dice-slider-container {
            margin-top: 15px;
        }
        
        .bet-type-selection {
            margin-bottom: 20px;
        }
        
        .bet-type-buttons {
            display: flex;
            gap: 0;
            margin-top: 8px;
            background-color: #131e2c;
            border-radius: 5px;
            overflow: hidden;
        }
        
        .bet-type-button {
            flex: 1;
            padding: 12px 0;
            background-color: transparent;
            border: none;
            color: #fff;
            cursor: pointer;
            transition: all 0.2s ease;
            font-weight: bold;
        }
        
        .bet-type-button:hover {
            background-color: rgba(66, 135, 245, 0.1);
        }
        
        .bet-type-button.active {
            background-color: #4287f5;
            color: #fff;
        }
        
        .slider-container {
            margin-top: 30px;
            position: relative;
            padding: 0 10px;
        }
        
        .slider-container label {
            display: block;
            margin-bottom: 20px;
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.9rem;
        }
        
        #targetNumberDisplay {
            color: #fff;
            font-weight: bold;
        }
        
        .dice-slider {
            width: 100%;
            height: 8px;
            background: linear-gradient(to right, #ff4d4d, #ffff4d, #4dff4d);
            border-radius: 5px;
            outline: none;
            -webkit-appearance: none;
            margin: 20px 0;
        }
        
        .dice-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 26px;
            height: 26px;
            background-color: #fff;
            border: 2px solid #4287f5;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 0 10px rgba(66, 135, 245, 0.5);
        }
        
        .slider-labels {
            display: flex;
            justify-content: space-between;
            margin-top: 5px;
            color: rgba(255, 255, 255, 0.5);
            font-size: 12px;
            padding: 0 10px;
        }
        
        /* Stats display */
        .odds-display {
            margin: 30px 0;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
        }
        
        .odds-item {
            background-color: #131e2c;
            padding: 12px 15px;
            border-radius: 5px;
            text-align: center;
        }
        
        .odds-item span:first-child {
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.5);
            margin-bottom: 5px;
            display: block;
        }
        
        .odds-item span:last-child {
            font-size: 1.2rem;
            font-weight: bold;
            color: #fff;
        }
        
        /* Roll button */
        .game-button {
            width: 100%;
            padding: 15px 0;
            background-color: #4287f5;
            color: #fff;
            border: none;
            border-radius: 5px;
            font-size: 1.1rem;
            font-weight: bold;
            cursor: pointer;
            transition: background-color 0.2s;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .game-button:hover {
            background-color: #3476e3;
        }
        
        /* Result section */
        .result-section {
            background-color: #1c2635;
            border-radius: 10px;
            padding: 20px;
            margin-top: 20px;
        }
        
        .result-header h3 {
            font-size: 1.4rem;
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
            font-size: 3rem;
            font-weight: bold;
            margin-bottom: 5px;
            color: #4287f5;
        }
        
        .result-text {
            font-size: 1.2rem;
        }
        
        .result-amount {
            font-size: 2.5rem;
            font-weight: bold;
        }
        
        /* Recent Activity */
        .recent-activity {
            background-color: #1c2635;
            border-radius: 10px;
            padding: 20px;
            margin: 30px 0;
        }
        
        .activity-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .activity-header h2 {
            font-size: 1.4rem;
            color: #fff;
        }
        
        .activity-tabs {
            display: flex;
            gap: 10px;
        }
        
        .activity-tab {
            background-color: #131e2c;
            border: none;
            padding: 8px 15px;
            border-radius: 5px;
            color: #fff;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .activity-tab:hover {
            background-color: #263445;
        }
        
        .activity-tab.active {
            background-color: #4287f5;
            color: #fff;
        }
        
        .activity-list {
            max-height: 300px;
            overflow-y: auto;
        }
        
        .activity-item {
            display: flex;
            padding: 12px 15px;
            border-bottom: 1px solid #263445;
            transition: background-color 0.2s;
        }
        
        .activity-item:hover {
            background-color: #131e2c;
        }
        
        .activity-user {
            width: 120px;
            font-weight: bold;
            color: #fff;
        }
        
        .activity-details {
            flex: 1;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .details-text {
            display: flex;
            flex-direction: column;
        }
        
        .details-text span {
            margin-bottom: 3px;
            color: rgba(255, 255, 255, 0.7);
        }
        
        .details-outcome {
            font-weight: bold;
            font-size: 1.2rem;
        }
        
        .activity-time {
            width: 100px;
            text-align: right;
            color: rgba(255, 255, 255, 0.5);
        }
        
        /* Game history */
        .game-history {
            background-color: #1c2635;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 30px;
        }
        
        .game-history h2 {
            font-size: 1.4rem;
            color: #fff;
            margin-bottom: 20px;
        }
        
        .history-table {
            overflow-x: auto;
        }
        
        .history-table table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .history-table th {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #263445;
            color: rgba(255, 255, 255, 0.7);
            font-weight: normal;
        }
        
        .history-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #263445;
            color: #fff;
        }
        
        .fade-in {
            animation: fadeIn 0.5s ease-in-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        /* Additional UI elements from screenshot */
        .manual-auto-toggle {
            display: flex;
            margin-bottom: 15px;
            background-color: #131e2c;
            border-radius: 5px;
            overflow: hidden;
        }
        
        .toggle-button {
            flex: 1;
            padding: 10px 0;
            text-align: center;
            background: none;
            border: none;
            color: #fff;
            cursor: pointer;
        }
        
        .toggle-button.active {
            background-color: #263445;
        }
        
        .bet-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .bet-info-label {
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .info-icon {
            color: #4287f5;
            font-size: 0.8rem;
        }
        
        .bet-amount-wrapper {
            position: relative;
        }
        
        .currency-symbol {
            position: absolute;
            left: 10px;
            top: 50%;
            transform: translateY(-50%);
            color: rgba(255, 255, 255, 0.5);
        }
        
        .currency-select {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            color: #fff;
            background: none;
            border: none;
            cursor: pointer;
        }
        
        .autobet-option {
            margin-top: 15px;
        }
        
        .autobet-label {
            display: block;
            margin-bottom: 5px;
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.9rem;
        }
        
        .autobet-input {
            width: 100%;
            padding: 12px 15px;
            background-color: #131e2c;
            border: 1px solid #2c3e50;
            border-radius: 5px;
            color: #fff;
            font-size: 1rem;
        }
        
        .on-win-loss-section {
            margin-top: 20px;
            background-color: #131e2c;
            border-radius: 10px;
            padding: 15px;
        }
        
        .section-title {
            color: #fff;
            margin-bottom: 10px;
            font-size: 1rem;
        }
        
        .on-win-loss-controls {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
        }
        
        .on-win-loss-controls button {
            padding: 5px 10px;
            background-color: #263445;
            border: none;
            border-radius: 5px;
            color: #fff;
            cursor: pointer;
        }
        
        .stop-on-section {
            margin-top: 15px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .stop-on-label {
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.9rem;
        }
        
        .start-autobet-button {
            width: 100%;
            padding: 15px 0;
            background-color: #32cd32;
            color: #fff;
            border: none;
            border-radius: 5px;
            font-size: 1.1rem;
            font-weight: bold;
            cursor: pointer;
            margin-top: 20px;
            text-transform: uppercase;
        }
    `;
    
    // Add the CSS to the page
    const styleElement = document.createElement('style');
    styleElement.textContent = diceCSS;
    document.head.appendChild(styleElement);
}); 