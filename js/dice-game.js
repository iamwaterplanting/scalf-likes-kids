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
    const resultPointer = document.getElementById('resultPointer');
    const sliderTrack = document.getElementById('sliderTrack');
    
    // Game state
    let isRolling = false;
    let gameHistory = [];
    let currentBetType = 'under'; // 'under' or 'over'
    
    // Initialize the game
    init();
    
    function init() {
        // Set default dice display
        updateDiceDisplay('0.00');
        
        // Position the result pointer to the start
        if (resultPointer) {
            positionResultPointer(0);
        }
        
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
                updateSliderColors();
            });
        }
        
        if (rollUnderButton) {
            rollUnderButton.addEventListener('click', () => {
                rollUnderButton.classList.add('active');
                rollOverButton.classList.remove('active');
                currentBetType = 'under';
                updatePotentialWinAndOdds();
                updateSliderColors();
            });
        }
        
        if (rollOverButton) {
            rollOverButton.addEventListener('click', () => {
                rollOverButton.classList.add('active');
                rollUnderButton.classList.remove('active');
                currentBetType = 'over';
                updatePotentialWinAndOdds();
                updateSliderColors();
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
        
        // Initial slider color update
        updateSliderColors();
        
        // Load game history
        loadGameHistory();
    }
    
    // Update the dice display
    function updateDiceDisplay(number) {
        if (!diceResult) return;
        diceResult.textContent = number;
    }
    
    // Position the result pointer
    function positionResultPointer(value) {
        if (!resultPointer) return;
        
        // Calculate percentage along the slider (0-100)
        const percent = (value / 100) * 100;
        
        // Calculate position considering slider width
        const sliderWidth = targetNumberSlider.offsetWidth;
        const pointerPosition = (percent / 100) * sliderWidth;
        
        // Set the position
        resultPointer.style.left = `${pointerPosition}px`;
        
        // If previous position was not set, no animation
        if (!resultPointer.dataset.positioned) {
            resultPointer.style.transition = 'none';
            resultPointer.dataset.positioned = 'true';
        } else {
            resultPointer.style.transition = 'left 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        }
    }
    
    // Update slider color gradient based on bet type
    function updateSliderColors() {
        if (!sliderTrack) return;
        
        const targetNumber = parseInt(targetNumberSlider.value);
        
        if (currentBetType === 'under') {
            // For roll under: Green to the left of target, red to the right
            sliderTrack.style.background = `linear-gradient(to right, 
                var(--dice-gradient-end) 0%, 
                var(--dice-gradient-end) ${targetNumber}%, 
                var(--dice-gradient-start) ${targetNumber}%, 
                var(--dice-gradient-start) 100%)`;
        } else {
            // For roll over: Red to the left of target, green to the right
            sliderTrack.style.background = `linear-gradient(to right, 
                var(--dice-gradient-start) 0%, 
                var(--dice-gradient-start) ${targetNumber}%, 
                var(--dice-gradient-end) ${targetNumber}%, 
                var(--dice-gradient-end) 100%)`;
        }
    }
    
    // Update potential win and odds display
    function updatePotentialWinAndOdds() {
        if (!winChance || !multiplier || !potentialWin || !betAmountInput || !targetNumberSlider) return;
        
        const betAmount = parseInt(betAmountInput.value) || 0;
        const targetNumber = parseInt(targetNumberSlider.value);
        
        let winChanceValue = 0;
        let multiplierValue = 0;
        
        // Automatically switch bet type based on target number
        // If target is high (>85), force "Roll Over" for fairness
        if (targetNumber > 85 && currentBetType === 'under') {
            rollOverButton.click(); // Programmatically switch to Roll Over
            return; // Function will be called again after the click event
        }
        
        // If target is low (<15), force "Roll Under" for fairness
        if (targetNumber < 15 && currentBetType === 'over') {
            rollUnderButton.click(); // Programmatically switch to Roll Under
            return; // Function will be called again after the click event
        }
        
        // Calculate win chance based on bet type
        if (currentBetType === 'under') {
            // For "Roll Under", win chance is the target number (e.g., roll under 75 = 75% chance)
            winChanceValue = targetNumber;
        } else {
            // For "Roll Over", win chance is 100 - target number (e.g., roll over 25 = 75% chance)
            winChanceValue = 100 - targetNumber;
        }
        
        // Calculate multiplier with house edge (5%)
        // Base formula: (100 / win chance) * 0.95
        
        // Calculate distance from the 50% mark (optimal fairness point)
        // As we move away from 50%, reduce the multiplier further
        const distanceFrom50 = Math.abs(50 - winChanceValue);
        
        // Additional edge based on distance from 50%
        // This creates diminishing returns as you approach very high win chances
        let additionalEdge = 0;
        
        if (distanceFrom50 > 30) {
            // Significant reduction for very high win chances (>80% or <20%)
            additionalEdge = 0.2 + (distanceFrom50 - 30) * 0.015;
        } else if (distanceFrom50 > 20) {
            // Moderate reduction for high win chances (70-80% or 20-30%)
            additionalEdge = 0.1 + (distanceFrom50 - 20) * 0.01;
        } else if (distanceFrom50 > 10) {
            // Small reduction for slightly favorable win chances (60-70% or 30-40%)
            additionalEdge = 0.05 + (distanceFrom50 - 10) * 0.005;
        }
        
        // Cap the additional edge at 0.4 (40%)
        additionalEdge = Math.min(additionalEdge, 0.4);
        
        // Apply the combined edge (base 5% + additional based on distance from 50%)
        const totalEdge = 0.05 + additionalEdge;
        multiplierValue = (100 / winChanceValue) * (1 - totalEdge);
        
        // Update UI
        winChance.textContent = winChanceValue.toFixed(2) + '%';
        multiplier.textContent = multiplierValue.toFixed(2) + 'x';
        
        // Calculate potential win
        const potentialWinAmount = Math.floor(betAmount * multiplierValue);
        potentialWin.textContent = '+' + formatCurrency(potentialWinAmount);
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
        
        // Animate the pointer during rolling
        animatePointerDuringRoll(rollDuration);
        
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
    
    // Animate the pointer during the roll
    function animatePointerDuringRoll(duration) {
        if (!resultPointer) return;
        
        // Make sure the pointer is visible
        resultPointer.style.display = 'block';
        
        // Set up fast random pointer movement
        const moveInterval = 100; // Move every 100ms
        const moveSteps = duration / moveInterval;
        let step = 0;
        
        const moveAnimation = setInterval(() => {
            // Random position along the slider
            const randomPosition = Math.random() * 100;
            positionResultPointer(randomPosition);
            
            step++;
            if (step >= moveSteps) {
                clearInterval(moveAnimation);
            }
        }, moveInterval);
    }
    
    // Finish the roll and determine result
    function finishRoll(betAmount, targetNumber) {
        // Generate the final result (0.00-99.99)
        const result = (Math.random() * 100).toFixed(2);
        const resultValue = parseFloat(result);
        
        // Update dice display with result
        updateDiceDisplay(result);
        
        // Animate pointer to final position with bouncy effect
        animatePointerToFinalPosition(resultValue);
        
        // Remove rolling class
        diceResult.classList.remove('rolling');
        
        // Add animation class to result for reveal effect
        diceResult.classList.add('result-reveal');
        setTimeout(() => {
            diceResult.classList.remove('result-reveal');
        }, 1000);
        
        // Determine if won based on bet type
        let won = false;
        
        if (currentBetType === 'under') {
            won = (resultValue < targetNumber);
        } else { // over
            won = (resultValue > targetNumber);
        }
        
        // Calculate win chance value
        let winChanceValue = 0;
        if (currentBetType === 'under') {
            winChanceValue = targetNumber;
        } else { // over
            winChanceValue = 100 - targetNumber;
        }
        
        // Calculate multiplier with adaptive house edge
        // Calculate distance from the 50% mark (optimal fairness point)
        const distanceFrom50 = Math.abs(50 - winChanceValue);
        
        // Additional edge based on distance from 50%
        let additionalEdge = 0;
        
        if (distanceFrom50 > 30) {
            // Significant reduction for very high win chances (>80% or <20%)
            additionalEdge = 0.2 + (distanceFrom50 - 30) * 0.015;
        } else if (distanceFrom50 > 20) {
            // Moderate reduction for high win chances (70-80% or 20-30%)
            additionalEdge = 0.1 + (distanceFrom50 - 20) * 0.01;
        } else if (distanceFrom50 > 10) {
            // Small reduction for slightly favorable win chances (60-70% or 30-40%)
            additionalEdge = 0.05 + (distanceFrom50 - 10) * 0.005;
        }
        
        // Cap the additional edge at 0.4 (40%)
        additionalEdge = Math.min(additionalEdge, 0.4);
        
        // Apply the combined edge (base 5% + additional based on distance from 50%)
        const totalEdge = 0.05 + additionalEdge;
        const multiplierValue = (100 / winChanceValue) * (1 - totalEdge);
        
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
    
    // Animate the pointer to the final position with a bouncy effect
    function animatePointerToFinalPosition(finalValue) {
        if (!resultPointer) return;
        
        // First, stop any ongoing animations
        resultPointer.style.transition = 'none';
        
        // Calculate slider width
        const sliderWidth = targetNumberSlider.offsetWidth;
        
        // Create bouncy animation sequence
        const animationSteps = [
            { value: finalValue - 15, duration: 300, easing: 'ease-out' },
            { value: finalValue + 10, duration: 200, easing: 'ease-in-out' },
            { value: finalValue - 5, duration: 150, easing: 'ease-in-out' },
            { value: finalValue + 2, duration: 100, easing: 'ease-in-out' },
            { value: finalValue, duration: 100, easing: 'ease-out' }
        ];
        
        // Apply each animation step in sequence
        let totalDelay = 0;
        
        animationSteps.forEach((step, index) => {
            setTimeout(() => {
                // Calculate position
                const percent = (step.value / 100) * 100;
                const pointerPosition = (percent / 100) * sliderWidth;
                
                // Apply transition for current step
                resultPointer.style.transition = `left ${step.duration}ms ${step.easing}`;
                resultPointer.style.left = `${pointerPosition}px`;
                
                // Add highlight effect for final position
                if (index === animationSteps.length - 1) {
                    resultPointer.classList.add('highlight');
                    setTimeout(() => {
                        resultPointer.classList.remove('highlight');
                    }, 1000);
                }
            }, totalDelay);
            
            totalDelay += step.duration;
        });
        
        // Highlight the result
        setTimeout(() => {
            // Add winning or losing color to the pointer
            const targetNumber = parseInt(targetNumberSlider.value);
            const won = currentBetType === 'under' ? 
                finalValue < targetNumber : 
                finalValue > targetNumber;
                
            resultPointer.style.backgroundColor = won ? '#44ff44' : '#ff4444';
            resultPointer.style.boxShadow = won ? 
                '0 0 10px rgba(68, 255, 68, 0.8)' : 
                '0 0 10px rgba(255, 68, 68, 0.8)';
            
            // Reset to white after delay
            setTimeout(() => {
                resultPointer.style.backgroundColor = '#ffffff';
                resultPointer.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.5)';
            }, 3000);
        }, totalDelay);
    }
    
    // Reset the game for a new roll
    function resetGame() {
        if (resultSection) {
            resultSection.style.display = 'none';
        }
        
        if (diceResult) {
            updateDiceDisplay('0.00');
            diceResult.style.color = '#ffffff'; // Reset color
            diceResult.style.textShadow = 'none'; // Reset shadow
        }
        
        // Reset pointer position
        if (resultPointer) {
            positionResultPointer(0);
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
            
            // Target cell
            const targetCell = document.createElement('td');
            targetCell.textContent = `${game.type} ${game.target}`;
            
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
            row.appendChild(targetCell);
            row.appendChild(resultCell);
            row.appendChild(multiplierCell);
            row.appendChild(outcomeCell);
            row.appendChild(timeCell);
            
            // Add fade-in animation
            row.classList.add('fade-in');
            
            // Append row to table
            gameHistoryBody.appendChild(row);
        });
    }
    
    // Load game history from Supabase
    async function loadGameHistory() {
        try {
            // Check if Supabase is available
            if (!window.SupabaseDB) {
                console.log('Supabase not available, using mock data for game history');
                loadMockGameHistory();
                return;
            }
            
            // Fetch history from Supabase
            const { data: history, error } = await window.SupabaseDB
                .from('game_history')
                .select('*')
                .eq('game', 'Dice')
                .order('time', { ascending: false })
                .limit(20);
            
            if (error) {
                console.error('Error loading game history:', error);
                // Fall back to mock data
                loadMockGameHistory();
                return;
            }
            
            if (history && history.length > 0) {
                // Format the history data
                gameHistory = history.map(item => ({
                    user: item.username || 'Guest',
                    bet: item.bet_amount || 0,
                    type: item.bet_type || 'Roll Under',
                    target: item.target || 50,
                    result: item.result || '0.00',
                    multiplier: item.multiplier || '2.00x',
                    outcome: item.outcome || 0,
                    time: new Date(item.time) || new Date()
                }));
                
                // Update the UI
                updateGameHistoryTable();
            } else {
                // No history data, use mock data
                loadMockGameHistory();
            }
        } catch (error) {
            console.error('Error in loadGameHistory:', error);
            loadMockGameHistory();
        }
    }
    
    // Load mock game history for new users
    function loadMockGameHistory() {
        // Create mock data
        const mockUsers = ['Player1', 'CryptoPro', 'LuckyWin', 'DiamondHands', 'MoonShot'];
        const mockHistory = [];
        
        // Generate random history entries
        for (let i = 0; i < 10; i++) {
            const user = mockUsers[Math.floor(Math.random() * mockUsers.length)];
            const bet = [10, 25, 50, 100, 200, 500][Math.floor(Math.random() * 6)];
            const betType = Math.random() > 0.5 ? 'Roll Under' : 'Roll Over';
            const target = betType === 'Roll Under' ? 
                Math.floor(Math.random() * 50) + 25 : 
                Math.floor(Math.random() * 50) + 25;
            const result = (Math.random() * 100).toFixed(2);
            const won = betType === 'Roll Under' ? 
                parseFloat(result) < target : 
                parseFloat(result) > target;
            
            // Calculate multiplier
            const winChance = betType === 'Roll Under' ? target : (100 - target);
            const multiplierValue = (100 / winChance) * 0.95;
            const multiplier = multiplierValue.toFixed(2) + 'x';
            
            // Calculate outcome
            const outcome = won ? Math.floor(bet * multiplierValue) : -bet;
            
            // Create time (random time in the last 24 hours)
            const time = new Date(Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000));
            
            mockHistory.push({
                user,
                bet,
                type: betType,
                target,
                result,
                multiplier,
                outcome,
                time
            });
        }
        
        // Sort by time (newest first)
        mockHistory.sort((a, b) => b.time - a.time);
        
        // Set game history and update UI
        gameHistory = mockHistory;
        updateGameHistoryTable();
    }
    
    // Format currency values
    function formatCurrency(amount) {
        const absAmount = Math.abs(amount);
        return absAmount.toLocaleString();
    }
    
    // Format number values
    function formatNumber(number) {
        return number.toLocaleString();
    }
    
    // Format time values
    function formatTime(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        
        if (diffSec < 60) {
            return 'just now';
        } else if (diffMin < 60) {
            return `${diffMin}m ago`;
        } else if (diffHour < 24) {
            return `${diffHour}h ago`;
        } else {
            return `${diffDay}d ago`;
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