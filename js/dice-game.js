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
            resultPointer.style.transition = 'left 0.2s ease-out';
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
        rollButton.classList.add('loading');
        
        // Hide result section if visible
        resultSection.style.display = 'none';
        
        // Generate the final result now (0.00-99.99)
        const result = (Math.random() * 100).toFixed(2);
        const resultValue = parseFloat(result);
        
        // Short delay before showing result
        const rollDuration = 200; // 0.2 seconds
        const rollInterval = 50; // Change number every 50ms
        let rollTime = 0;
        
        const rollAnimation = setInterval(() => {
            // Random number between 0.00 and 99.99 during rolling
            const randomNumber = (Math.random() * 100).toFixed(2);
            updateDiceDisplay(randomNumber);
            
            rollTime += rollInterval;
            
            if (rollTime >= rollDuration) {
                clearInterval(rollAnimation);
                
                // Show final result
                updateDiceDisplay(result);
                
                // Position pointer directly to the final position
                positionResultPointer(resultValue);
                
                // Finish the game
                setTimeout(() => {
                    finishRoll(betAmount, targetNumber, resultValue);
                }, 100);
            }
        }, rollInterval);
    }
    
    // Finish the roll and determine result
    function finishRoll(betAmount, targetNumber, resultValue) {
        // Remove rolling class
        diceResult.classList.remove('rolling');
        rollButton.classList.remove('loading');
        
        // Add animation class to result for reveal effect
        diceResult.classList.add('result-reveal');
        setTimeout(() => {
            diceResult.classList.remove('result-reveal');
        }, 800);
        
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
            window.BetaAuth.updateBalance(outcomeAmount, 'Dice Game');
        }
        
        // Apply win/loss color to main result display
        diceResult.style.color = won ? '#44ff44' : '#ff4444';
        diceResult.style.textShadow = won ? 
            '0 0 10px rgba(68, 255, 68, 0.5)' : 
            '0 0 10px rgba(255, 68, 68, 0.5)';
        
        // Apply color to result pointer
        if (resultPointer) {
            resultPointer.style.backgroundColor = won ? '#44ff44' : '#ff4444';
            resultPointer.style.boxShadow = won ? 
                '0 0 10px rgba(68, 255, 68, 0.8)' : 
                '0 0 10px rgba(255, 68, 68, 0.8)';
                
            // Reset to white after delay
            setTimeout(() => {
                resultPointer.style.backgroundColor = '#ffffff';
                resultPointer.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.5)';
            }, 2000);
        }
        
        // Show result
        resultNumber.textContent = resultValue.toFixed(2);
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
            result: resultValue.toFixed(2),
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