// Chicken Crossroad Game - Core Logic
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const chickenContainer = document.getElementById('chickenContainer');
    const chickenGame = document.getElementById('chickenGame');
    const chickenCharacter = document.getElementById('chickenCharacter');
    const chickenSidebar = document.getElementById('chickenSidebar');
    const betButton = document.getElementById('betButton');
    const cashoutBtn = document.getElementById('cashoutBtn');
    const gameOverPopup = document.getElementById('gameOverPopup');
    const winPopup = document.getElementById('winPopup');
    const newGameBtn = document.getElementById('newGameBtn');
    const newGameWinBtn = document.getElementById('newGameWinBtn');
    const gameOverMessage = document.getElementById('gameOverMessage');
    const winMessage = document.getElementById('winMessage');
    const winAmount = document.getElementById('winAmount');
    const currentMultiplier = document.getElementById('currentMultiplier');
    const currentPayout = document.getElementById('currentPayout');
    const currentBet = document.getElementById('currentBet');
    
    // Game elements
    const gamePlayingElements = document.querySelectorAll('.game-playing-content');
    const gameSetupElements = document.querySelectorAll('.game-setup-content');
    
    // Game state
    let gameStarted = false;
    let gameEnded = false;
    let currentLane = 0;
    let maxLanes = 10;
    let multiplier = 1.0;
    let intervalId = null;
    let carIntervals = [];
    let crashPoint = null;
    let betAmount = 0;
    let lastTime = 0;
    
    // Debug mode - set to false in production
    const DEBUG = false;
    
    function debug(message) {
        if (DEBUG) {
            console.log(`[CHICKEN DEBUG] ${message}`);
        }
    }
    
    // Initialize UI
    initUI();
    
    function initUI() {
        // Set up event listeners
        setupEventListeners();
        
        // Update stats from localStorage if available
        updateGameStats();
        
        debug("Game initialized");
    }
    
    function setupEventListeners() {
        // Bet button starts the game
        betButton.addEventListener('click', startGame);
        
        // Cashout button ends the game
        if (cashoutBtn) {
            cashoutBtn.addEventListener('click', () => cashOut());
        }
        
        // New game buttons in popups
        if (newGameBtn) {
            newGameBtn.addEventListener('click', () => {
                hidePopups();
                resetGame();
            });
        }
        
        if (newGameWinBtn) {
            newGameWinBtn.addEventListener('click', () => {
                hidePopups();
                resetGame();
            });
        }
        
        // Bet amount shortcuts
        const betShortcuts = document.querySelectorAll('.bet-btn');
        betShortcuts.forEach(btn => {
            btn.addEventListener('click', () => {
                const betInput = document.getElementById('betAmount');
                const currentBalance = getCurrentBalance();
                
                if (btn.dataset.amount === '1/2') {
                    betInput.value = Math.floor(parseInt(betInput.value) / 2);
                } else if (btn.dataset.amount === '2x') {
                    betInput.value = Math.min(parseInt(betInput.value) * 2, currentBalance);
                } else if (btn.dataset.amount === 'max') {
                    betInput.value = currentBalance;
                }
            });
        });
        
        debug("Event listeners set up");
    }
    
    function startGame() {
        // Check if user is logged in
        if (!isUserLoggedIn()) {
            showMessage('Please login to play!');
            return;
        }
        
        // Get bet amount
        betAmount = getBetAmount();
        if (!validateBet(betAmount)) {
            return;
        }
        
        // Hide any visible popups
        hidePopups();
        
        // Reset game state
        gameStarted = true;
        gameEnded = false;
        currentLane = 0;
        multiplier = 1.0;
        
        // Clear any existing lanes and cars
        clearRoads();
        
        // Generate crash point (when the chicken will get hit if player doesn't cash out)
        generateCrashPoint();
        
        // Deduct bet from balance
        updateBalance(-betAmount);
        
        // Update UI
        chickenContainer.classList.remove('game-not-started');
        chickenContainer.classList.add('game-started');
        
        // Show game playing elements and hide setup elements
        gamePlayingElements.forEach(el => {
            el.style.display = 'flex';
        });
        
        gameSetupElements.forEach(el => {
            el.style.display = 'none';
        });
        
        // Update game stats display
        updateGameDisplay();
        
        // Reset chicken position
        chickenCharacter.style.bottom = '20px';
        
        // Generate initial roads
        generateRoads();
        
        // Start game loop
        lastTime = Date.now();
        intervalId = setInterval(gameLoop, 50);  // 20 fps
        
        debug(`Game started with bet: ${betAmount}, crash point: ${crashPoint}`);
    }
    
    function gameLoop() {
        const now = Date.now();
        const deltaTime = now - lastTime;
        lastTime = now;
        
        if (gameEnded) {
            clearInterval(intervalId);
            return;
        }
        
        // Update multiplier based on elapsed time
        updateMultiplier(deltaTime);
        
        // Check for crash
        if (multiplier >= crashPoint) {
            crashGame();
        }
        
        // Spawn cars randomly
        if (Math.random() < 0.02) {  // 2% chance per frame to spawn a car
            spawnCar();
        }
        
        // Update cars positions
        updateCars();
    }
    
    function updateMultiplier(deltaTime) {
        // Increase multiplier non-linearly over time
        // The longer you stay in game, the faster the multiplier rises
        const baseIncrease = 0.004;  // Base multiplier increase per 50ms
        const timeFactor = Math.sqrt(multiplier) * 0.002;  // Increase acceleration over time
        
        multiplier += (baseIncrease + timeFactor) * (deltaTime / 50);
        
        // Update display
        currentMultiplier.textContent = multiplier.toFixed(2);
        
        // Update payout display
        if (currentPayout) {
            currentPayout.textContent = (betAmount * multiplier).toFixed(2);
        }
        
        // Update chicken position - move up as multiplier increases
        const laneHeight = 80;  // Height of each lane in pixels
        const newLane = Math.floor((multiplier - 1) / 0.5);  // New lane every 0.5x multiplier
        
        if (newLane > currentLane) {
            // Chicken needs to jump to next lane
            currentLane = newLane;
            const newBottom = 20 + (currentLane * laneHeight);
            
            // Add jumping animation
            chickenCharacter.classList.add('jumping');
            setTimeout(() => {
                chickenCharacter.classList.remove('jumping');
            }, 300);
            
            // Move chicken up
            chickenCharacter.style.bottom = `${newBottom}px`;
            
            // Generate new road if needed
            if (currentLane >= (maxLanes - 3)) {
                // We're getting close to the top, add more roads
                maxLanes += 3;
                generateRoads();
            }
            
            debug(`Moved to lane ${currentLane}, multiplier: ${multiplier.toFixed(2)}`);
        }
    }
    
    function generateRoads() {
        // Clear any existing roads
        clearRoads();
        
        // Create road lanes
        for (let i = 0; i < maxLanes; i++) {
            const laneHeight = 80;  // Height of each lane in pixels
            
            // Create a road lane every second lane, others are grass
            if (i % 2 === 1) {
                const road = document.createElement('div');
                road.className = 'road-lane';
                road.style.bottom = `${i * laneHeight}px`;
                road.dataset.lane = i;
                
                // Alternate lane directions
                road.dataset.direction = i % 4 === 1 ? 'right' : 'left';
                
                chickenGame.appendChild(road);
            }
        }
    }
    
    function clearRoads() {
        // Remove all road lanes
        const roads = document.querySelectorAll('.road-lane');
        roads.forEach(road => road.remove());
        
        // Clear all car intervals
        carIntervals.forEach(interval => clearInterval(interval));
        carIntervals = [];
        
        // Remove all cars
        const cars = document.querySelectorAll('.car');
        cars.forEach(car => car.remove());
    }
    
    function spawnCar() {
        // Only spawn cars on roads that are visible on screen
        const visibleLanes = document.querySelectorAll('.road-lane');
        
        if (visibleLanes.length === 0) {
            return;
        }
        
        // Pick a random road lane
        const randomIndex = Math.floor(Math.random() * visibleLanes.length);
        const lane = visibleLanes[randomIndex];
        
        // Create a car
        const car = document.createElement('div');
        car.className = 'car';
        
        // Set direction
        const direction = lane.dataset.direction;
        const laneNumber = parseInt(lane.dataset.lane);
        
        // Position car
        if (direction === 'right') {
            car.style.left = '-80px';  // Start from left side
            car.dataset.speed = (Math.random() * 3) + 5;  // 5-8 pixels per frame
        } else {
            car.style.left = '100%';  // Start from right side
            car.classList.add('car-right');
            car.dataset.speed = -((Math.random() * 3) + 5);  // -5 to -8 pixels per frame
        }
        
        car.dataset.lane = laneNumber;
        
        // Randomize car color
        const colors = ['#f97316', '#3b82f6', '#ef4444', '#16a34a', '#8b5cf6'];
        car.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        
        // Add car to the lane
        lane.appendChild(car);
        
        debug(`Spawned car in lane ${laneNumber}, direction: ${direction}`);
    }
    
    function updateCars() {
        const cars = document.querySelectorAll('.car');
        const gameWidth = chickenGame.offsetWidth;
        
        cars.forEach(car => {
            // Move car based on speed
            const speed = parseFloat(car.dataset.speed);
            const currentLeft = car.style.left ? parseFloat(car.style.left) : 0;
            const newLeft = currentLeft + speed;
            car.style.left = `${newLeft}px`;
            
            // Remove car if it's off screen
            if ((speed > 0 && newLeft > gameWidth) || (speed < 0 && newLeft < -100)) {
                car.remove();
            }
            
            // Check collision with chicken
            if (!gameEnded && isColliding(car, chickenCharacter)) {
                crashGame();
            }
        });
    }
    
    function isColliding(car, chicken) {
        // Get car lane
        const carLane = parseInt(car.dataset.lane);
        
        // Check if chicken is in this lane
        if (carLane !== currentLane) {
            return false;
        }
        
        // Get positions
        const carRect = car.getBoundingClientRect();
        const chickenRect = chicken.getBoundingClientRect();
        
        // Check collision
        return !(
            carRect.right < chickenRect.left || 
            carRect.left > chickenRect.right || 
            carRect.bottom < chickenRect.top || 
            carRect.top > chickenRect.bottom
        );
    }
    
    function crashGame() {
        if (gameEnded) return;
        
        debug(`Game crashed at multiplier: ${multiplier.toFixed(2)}`);
        
        // Set game ended flag
        gameEnded = true;
        
        // Show chicken getting hit animation
        chickenCharacter.classList.add('hit');
        
        // Play crash sound
        playSound('crash');
        
        // Show game over popup
        gameOverPopup.classList.add('show');
        
        // Update stats (loss)
        updateStats(false, -betAmount);
        
        // Add to history
        addToHistory(false);
    }
    
    function cashOut() {
        if (gameEnded || !gameStarted) return;
        
        // Calculate winnings
        const winnings = Math.floor(betAmount * multiplier);
        
        debug(`Cashed out at multiplier: ${multiplier.toFixed(2)}, winnings: ${winnings}`);
        
        // Set game ended flag
        gameEnded = true;
        
        // Add win amount to balance
        updateBalance(winnings);
        
        // Show win popup
        if (winAmount) {
            winAmount.textContent = winnings.toFixed(2);
        }
        winPopup.classList.add('show');
        
        // Play win sound
        playSound('win');
        
        // Update stats (win)
        updateStats(true, winnings - betAmount);
        
        // Add to history
        addToHistory(true);
        
        // Clear game intervals
        clearInterval(intervalId);
    }
    
    function addToHistory(isWin) {
        // Get history table body
        const historyTable = document.getElementById('historyTableBody');
        if (!historyTable) return;
        
        // Create a new row
        const row = document.createElement('tr');
        
        // Generate random game ID
        const gameId = Math.floor(Math.random() * 1000000);
        
        // Format current time
        const now = new Date();
        const timeFormatted = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        // Calculate payout
        const payout = isWin ? Math.floor(betAmount * multiplier) : 0;
        
        // Set row HTML
        row.innerHTML = `
            <td>#${gameId}</td>
            <td>${timeFormatted}</td>
            <td>${betAmount}</td>
            <td style="color: ${isWin ? '#16a34a' : '#dc2626'}">
                ${multiplier.toFixed(2)}x
            </td>
            <td style="color: ${isWin ? '#16a34a' : '#dc2626'}">
                ${isWin ? '+' : '-'}${isWin ? payout : betAmount}
            </td>
        `;
        
        // Add row to table
        historyTable.prepend(row);
        
        // Limit to 10 rows
        while (historyTable.children.length > 10) {
            historyTable.removeChild(historyTable.lastChild);
        }
    }
    
    function resetGame() {
        // Reset game state
        gameStarted = false;
        gameEnded = false;
        currentLane = 0;
        multiplier = 1.0;
        
        // Clear intervals
        clearInterval(intervalId);
        clearRoads();
        
        // Reset chicken position and animation
        chickenCharacter.style.bottom = '20px';
        chickenCharacter.classList.remove('hit', 'jumping');
        
        // Update UI
        chickenContainer.classList.add('game-not-started');
        chickenContainer.classList.remove('game-started');
        
        // Reset multiplier display
        currentMultiplier.textContent = '1.00';
        
        // Hide game playing elements and show setup elements
        gamePlayingElements.forEach(el => {
            el.style.display = 'none';
        });
        
        gameSetupElements.forEach(el => {
            el.style.display = 'flex';
        });
        
        // Update stats display
        updateGameStats();
        
        debug("Game reset");
    }
    
    function hidePopups() {
        // Hide any visible popups
        gameOverPopup.classList.remove('show');
        winPopup.classList.remove('show');
    }
    
    function generateCrashPoint() {
        // Generate a random crash point based on house edge
        const houseEdge = 0.05;  // 5% house edge
        
        // Use a distribution that makes crashes more likely at lower values
        // but still allows for occasional high multipliers
        const minCrash = 1.1;  // Minimum crash point
        const randomValue = Math.random();
        
        // Use an exponential distribution (higher values are exponentially less likely)
        crashPoint = minCrash + (-Math.log(1 - randomValue) / 0.6);
        
        // Apply house edge (higher house edge = lower average crash points)
        crashPoint = crashPoint * (1 - houseEdge);
        
        // Cap maximum crash point for fairness (adjust as needed)
        crashPoint = Math.min(crashPoint, 30);
        
        debug(`Generated crash point: ${crashPoint.toFixed(2)}`);
        
        return crashPoint;
    }
    
    function updateGameDisplay() {
        // Update bet amount display
        if (currentBet) {
            currentBet.textContent = betAmount.toFixed(2);
        }
        
        // Reset multiplier display
        if (currentMultiplier) {
            currentMultiplier.textContent = '1.00';
        }
        
        // Set initial payout display
        if (currentPayout) {
            currentPayout.textContent = betAmount.toFixed(2);
        }
    }
    
    function updateGameStats() {
        // Update game stats from localStorage or default values
        const stats = getGameStats();
        
        const gamesPlayedElement = document.getElementById('gamesPlayed');
        const totalProfitElement = document.getElementById('totalProfit');
        const winRateElement = document.getElementById('winRate');
        
        if (gamesPlayedElement) {
            gamesPlayedElement.textContent = stats.gamesPlayed;
        }
        
        if (totalProfitElement) {
            totalProfitElement.textContent = stats.totalProfit;
        }
        
        if (winRateElement) {
            winRateElement.textContent = stats.gamesPlayed > 0 
                ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) + '%'
                : '0%';
        }
    }
    
    function updateStats(isWin, profit) {
        // Get current stats
        const stats = getGameStats();
        
        // Update stats
        stats.gamesPlayed++;
        if (isWin) {
            stats.gamesWon++;
        }
        stats.totalProfit += profit;
        
        // Save updated stats
        localStorage.setItem('chickenGameStats', JSON.stringify(stats));
    }
    
    function getGameStats() {
        // Get game stats from localStorage or use defaults
        const defaultStats = {
            gamesPlayed: 0,
            gamesWon: 0,
            totalProfit: 0
        };
        
        try {
            const savedStats = localStorage.getItem('chickenGameStats');
            return savedStats ? JSON.parse(savedStats) : defaultStats;
        } catch (e) {
            return defaultStats;
        }
    }
    
    // Helper functions
    function getCurrentBalance() {
        const user = window.BetaAuth?.getCurrentUser();
        return user ? user.balance : 1000;
    }
    
    function isUserLoggedIn() {
        return window.BetaAuth?.getCurrentUser() !== null;
    }
    
    function getBetAmount() {
        const betInput = document.getElementById('betAmount');
        return parseInt(betInput.value) || 0;
    }
    
    function validateBet(amount) {
        const balance = getCurrentBalance();
        
        if (amount < 10) {
            showMessage('Minimum bet is 10 coins.');
            return false;
        }
        
        if (amount > 10000) {
            showMessage('Maximum bet is 10,000 coins.');
            return false;
        }
        
        if (amount > balance) {
            showMessage('Not enough coins in your balance.');
            return false;
        }
        
        return true;
    }
    
    function updateBalance(amount) {
        // Use BetaAuth to update balance
        if (window.BetaAuth) {
            debug(`Updating balance by ${amount} coins`);
            window.BetaAuth.updateBalance(amount, 'Chicken Crossroad Game');
            
            // Also update the UI display if available
            const balanceAmount = document.querySelector('.balance-amount');
            if (balanceAmount) {
                // Get current user
                const user = window.BetaAuth.getCurrentUser();
                if (user) {
                    balanceAmount.textContent = user.balance.toFixed(2);
                    debug(`Updated balance display to ${user.balance.toFixed(2)}`);
                }
            }
        } else {
            debug('BetaAuth not available, could not update balance');
        }
    }
    
    function showMessage(message) {
        alert(message);
    }
    
    function playSound(soundType) {
        // Play sound effect (placeholder)
        debug(`Playing ${soundType} sound`);
    }
}); 