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
        
        // Difficulty buttons
        const difficultyButtons = document.querySelectorAll('.difficulty-btn');
        difficultyButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons
                difficultyButtons.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                btn.classList.add('active');
                debug(`Difficulty set to: ${btn.dataset.difficulty}`);
            });
        });
        
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
        
        // Get difficulty
        const difficulty = getDifficulty();
        
        // Hide any visible popups
        hidePopups();
        
        // Reset game state
        gameStarted = true;
        gameEnded = false;
        currentLane = 0;
        multiplier = 1.0;
        
        // Clear any existing grid and cars
        clearRoads();
        
        // Generate crash point based on difficulty
        generateCrashPoint(difficulty);
        
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
        
        // Reset chicken position - center of bottom row
        const roadWidth = chickenGame.offsetWidth / 5;
        chickenCharacter.style.bottom = '20px';
        chickenCharacter.style.left = `${roadWidth * 2 + (roadWidth / 2)}px`;
        chickenCharacter.dataset.col = '2'; // Center column
        
        // Generate initial grid
        generateRoads();
        
        // Add starting point indicator
        const startCell = document.querySelector('.road-cell[data-row="0"][data-col="2"]');
        if (startCell) {
            startCell.classList.add('start-cell');
            
            // Add arrow pointing up
            const arrow = document.createElement('div');
            arrow.className = 'start-arrow';
            arrow.innerHTML = '⬆️';
            startCell.appendChild(arrow);
        }
        
        // Start game loop
        lastTime = Date.now();
        intervalId = setInterval(gameLoop, 50);  // 20 fps
        
        // Animate chicken at start
        chickenCharacter.classList.add('ready-animation');
        setTimeout(() => {
            chickenCharacter.classList.remove('ready-animation');
        }, 1000);
        
        debug(`Game started with bet: ${betAmount}, crash point: ${crashPoint}, difficulty: ${difficulty}`);
    }
    
    function getDifficulty() {
        // Check which difficulty button is active
        const difficultyButtons = document.querySelectorAll('.difficulty-btn');
        let difficulty = 'easy'; // Default
        
        difficultyButtons.forEach(btn => {
            if (btn.classList.contains('active')) {
                difficulty = btn.dataset.difficulty;
            }
        });
        
        return difficulty;
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
        // Increase multiplier slowly even when not moving
        const baseIncrease = 0.001;  // Reduced base increase
        
        multiplier += baseIncrease * (deltaTime / 50);
        
        // Update display
        currentMultiplier.textContent = multiplier.toFixed(2);
        
        // Update payout display
        if (currentPayout) {
            currentPayout.textContent = (betAmount * multiplier).toFixed(2);
        }
        
        // Don't automatically move the chicken - player will click to move
        
        // But still generate roads ahead if needed
        if (currentLane >= (maxLanes - 5)) {
            maxLanes += 5;
            generateRoads();
        }
    }
    
    function generateRoads() {
        // Clear any existing roads
        clearRoads();
        
        // Create road lanes - now they're a grid
        const roadWidth = chickenGame.offsetWidth / 5; // 5 lanes horizontally
        const laneHeight = 80;  // Height of each lane in pixels
        
        for (let row = 0; row < maxLanes; row++) {
            for (let col = 0; col < 5; col++) {
                // Create a grid cell
                const cell = document.createElement('div');
                cell.className = 'road-cell';
                cell.style.bottom = `${row * laneHeight}px`;
                cell.style.left = `${col * roadWidth}px`;
                cell.style.width = `${roadWidth}px`;
                cell.style.height = `${laneHeight}px`;
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // Make it clickable
                cell.addEventListener('click', () => handleCellClick(row, col));
                
                // Add visual elements based on row/col
                if (row === 0 && col === 2) {
                    // Starting position has chicken
                    cell.classList.add('starting-cell');
                } else if (row % 2 === 1) {
                    // Road lanes
                    cell.classList.add('road');
                    
                    // Alternate lane directions for traffic
                    cell.dataset.direction = row % 4 === 1 ? 'right' : 'left';
                } else {
                    // Grass/sidewalk
                    cell.classList.add('grass');
                }
                
                // Add multiplier indicators to cells ahead
                if (row > currentLane && row <= currentLane + 5) {
                    // Calculate multiplier for this row
                    const rowMultiplier = 1 + (row * 0.05);
                    
                    // Create multiplier indicator on random cells
                    if (Math.random() < 0.3) { // 30% chance to show multiplier
                        const multiplierIndicator = document.createElement('div');
                        multiplierIndicator.className = 'multiplier-indicator';
                        multiplierIndicator.textContent = `${rowMultiplier.toFixed(2)}x`;
                        cell.appendChild(multiplierIndicator);
                        cell.dataset.multiplier = rowMultiplier.toFixed(2);
                    }
                }
                
                chickenGame.appendChild(cell);
            }
        }
    }
    
    function handleCellClick(row, col) {
        if (!gameStarted || gameEnded) return;
        
        // Check if the cell is adjacent to current position
        const currentCol = parseInt(chickenCharacter.dataset.col || 2); // Default to middle
        const isSameRow = row === currentLane;
        const isAdjacentCol = Math.abs(col - currentCol) <= 1;
        const isRowAbove = row === currentLane + 1;
        
        if ((isSameRow && isAdjacentCol) || (isRowAbove && col === currentCol)) {
            // Valid move - update position
            moveChicken(row, col);
        }
    }
    
    function moveChicken(row, col) {
        // Calculate new position
        const roadWidth = chickenGame.offsetWidth / 5;
        const laneHeight = 80;
        const newLeft = col * roadWidth + (roadWidth / 2);
        const newBottom = row * laneHeight;
        
        // Update chicken position
        chickenCharacter.style.left = `${newLeft}px`;
        chickenCharacter.style.bottom = `${newBottom}px`;
        chickenCharacter.dataset.col = col;
        
        // Add jumping animation
        chickenCharacter.classList.add('jumping');
        setTimeout(() => {
            chickenCharacter.classList.remove('jumping');
        }, 300);
        
        // Check if moving to a new lane (row)
        if (row > currentLane) {
            // Update current lane
            currentLane = row;
            
            // Increase multiplier significantly for advancing forward
            const newMultiplier = 1 + (row * 0.05);
            multiplier = Math.max(multiplier, newMultiplier);
            
            // Check for multiplier bonus on this cell
            const cell = document.querySelector(`.road-cell[data-row="${row}"][data-col="${col}"]`);
            if (cell && cell.dataset.multiplier) {
                // Apply bonus multiplier
                multiplier = parseFloat(cell.dataset.multiplier);
                
                // Show multiplier effect
                const bonusEffect = document.createElement('div');
                bonusEffect.className = 'bonus-effect';
                bonusEffect.textContent = `${multiplier}x`;
                chickenGame.appendChild(bonusEffect);
                bonusEffect.style.left = `${newLeft}px`;
                bonusEffect.style.bottom = `${newBottom + 40}px`;
                
                setTimeout(() => {
                    bonusEffect.remove();
                }, 1000);
            }
            
            // Update display
            currentMultiplier.textContent = multiplier.toFixed(2);
            if (currentPayout) {
                currentPayout.textContent = (betAmount * multiplier).toFixed(2);
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
        // Only spawn cars on road cells that are close to the player
        const visibleRows = [];
        for (let i = Math.max(0, currentLane - 1); i <= currentLane + 5; i++) {
            if (i % 2 === 1) { // Only roads have cars (odd rows)
                visibleRows.push(i);
            }
        }
        
        if (visibleRows.length === 0) {
            return;
        }
        
        // Pick a random road row
        const randomRowIndex = Math.floor(Math.random() * visibleRows.length);
        const rowNumber = visibleRows[randomRowIndex];
        
        // Determine direction based on row number
        const direction = rowNumber % 4 === 1 ? 'right' : 'left';
        
        // Create a car
        const car = document.createElement('div');
        car.className = 'car';
        
        // Position car
        const roadWidth = chickenGame.offsetWidth;
        const laneHeight = 80;
        car.style.bottom = `${rowNumber * laneHeight + 20}px`; // Center in the lane
        
        if (direction === 'right') {
            car.style.left = '-80px';  // Start from left side
            car.dataset.speed = (Math.random() * 3) + 5;  // 5-8 pixels per frame
            car.dataset.direction = 'right';
        } else {
            car.style.left = `${roadWidth}px`;  // Start from right side
            car.classList.add('car-right');
            car.dataset.speed = -((Math.random() * 3) + 5);  // -5 to -8 pixels per frame
            car.dataset.direction = 'left';
        }
        
        car.dataset.row = rowNumber;
        
        // Choose random car type
        const carTypes = ['car', 'truck', 'police']; 
        const carType = carTypes[Math.floor(Math.random() * carTypes.length)];
        car.classList.add(carType);
        
        // Randomize car color if it's a normal car
        if (carType === 'car') {
            const colors = ['#f97316', '#3b82f6', '#ef4444', '#16a34a', '#8b5cf6'];
            car.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        }
        
        // Add car to the game
        chickenGame.appendChild(car);
        
        debug(`Spawned ${carType} in row ${rowNumber}, direction: ${direction}`);
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
            if ((speed > 0 && newLeft > gameWidth + 100) || (speed < 0 && newLeft < -200)) {
                car.remove();
            }
            
            // Check collision with chicken
            if (!gameEnded && isColliding(car, chickenCharacter)) {
                crashGame();
            }
        });
    }
    
    function isColliding(car, chicken) {
        // Get car row
        const carRow = parseInt(car.dataset.row);
        
        // Get chicken position
        const chickenRow = currentLane;
        const chickenCol = parseInt(chicken.dataset.col || 2);
        
        // Check if chicken is in this row
        if (carRow !== chickenRow) {
            return false;
        }
        
        // Get positions for horizontal check
        const carRect = car.getBoundingClientRect();
        const chickenRect = chicken.getBoundingClientRect();
        
        // Use tighter collision box for more accurate collision
        const chickenCollisionMargin = 15; // Pixels to shrink the chicken hitbox
        const adjustedChickenRect = {
            left: chickenRect.left + chickenCollisionMargin,
            right: chickenRect.right - chickenCollisionMargin,
            top: chickenRect.top + chickenCollisionMargin,
            bottom: chickenRect.bottom - chickenCollisionMargin
        };
        
        // Check collision with visual effect
        const hasCollision = !(
            carRect.right < adjustedChickenRect.left || 
            carRect.left > adjustedChickenRect.right || 
            carRect.bottom < adjustedChickenRect.top || 
            carRect.top > adjustedChickenRect.bottom
        );
        
        // If colliding, add collision effect
        if (hasCollision && !car.classList.contains('colliding')) {
            car.classList.add('colliding');
            chickenCharacter.classList.add('hit');
            
            // Create crash effect
            const crashEffect = document.createElement('div');
            crashEffect.className = 'crash-effect';
            crashEffect.style.left = `${chickenRect.left + chickenRect.width/2}px`;
            crashEffect.style.bottom = `${carRow * 80 + 40}px`;
            chickenGame.appendChild(crashEffect);
            
            setTimeout(() => {
                crashEffect.remove();
            }, 1000);
        }
        
        return hasCollision;
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
    
    function generateCrashPoint(difficulty = 'medium') {
        // Generate a random crash point based on house edge and difficulty
        let houseEdge = 0.05;  // Base 5% house edge
        let distributionFactor = 0.6; // Controls how steep the exponential curve is
        let minCrash = 1.1;  // Base minimum crash point
        let maxCrash = 30;  // Base maximum crash point
        
        // Adjust parameters based on difficulty
        switch(difficulty) {
            case 'easy':
                houseEdge = 0.03;  // Lower house edge
                minCrash = 1.2;    // Higher minimum
                maxCrash = 50;     // Higher maximum
                distributionFactor = 0.4; // Flatter curve (more high values)
                break;
            case 'medium':
                // Default values
                break;
            case 'hard':
                houseEdge = 0.07;  // Higher house edge
                minCrash = 1.05;   // Lower minimum
                maxCrash = 20;     // Lower maximum
                distributionFactor = 0.8; // Steeper curve (more low values)
                break;
            case 'extreme':
                houseEdge = 0.1;   // Highest house edge
                minCrash = 1.01;   // Lowest minimum
                maxCrash = 15;     // Lowest maximum
                distributionFactor = 1.0; // Steepest curve (many low values)
                break;
        }
        
        const randomValue = Math.random();
        
        // Use an exponential distribution (higher values are exponentially less likely)
        crashPoint = minCrash + (-Math.log(1 - randomValue) / distributionFactor);
        
        // Apply house edge
        crashPoint = crashPoint * (1 - houseEdge);
        
        // Cap maximum crash point
        crashPoint = Math.min(crashPoint, maxCrash);
        
        debug(`Generated crash point: ${crashPoint.toFixed(2)} for difficulty: ${difficulty}`);
        
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