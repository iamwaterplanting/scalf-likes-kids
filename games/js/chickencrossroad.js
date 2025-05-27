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
    let maxLanes = 20;
    let multiplier = 1.0;
    let intervalId = null;
    let carIntervals = [];
    let crashPoint = null;
    let betAmount = 0;
    let lastTime = 0;
    let moveChickenTimer = 0;
    let moveChickenInterval = 2000; // Move chicken every 2 seconds
    
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
        
        // Position chicken in starting position (row 2, col 0) - matching screenshot
        const gameWidth = chickenGame.offsetWidth;
        const gameHeight = chickenGame.offsetHeight;
        const laneWidth = gameWidth / 7;
        const laneHeight = gameHeight / 5;
        chickenCharacter.style.top = `${2 * laneHeight + (laneHeight/2) - 25}px`; // Center in middle row
        chickenCharacter.style.left = `${0 * laneWidth + (laneWidth/2) - 25}px`; // Center in leftmost column
        chickenCharacter.dataset.col = '0';
        chickenCharacter.dataset.row = '2';
        
        // Generate grid
        generateRoads();
        
        // Start game loop
        lastTime = Date.now();
        intervalId = setInterval(gameLoop, 50);  // 20 fps
        
        // Update next position indicators
        updateNextPositionIndicator();
        
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
        // Increase multiplier slowly over time
        const baseIncrease = 0.001;
        
        multiplier += baseIncrease * (deltaTime / 50);
        
        // Update display - use the current position's multiplier value
        const activeMultiplier = document.querySelector('.active-multiplier');
        if (activeMultiplier) {
            const valueEl = activeMultiplier.querySelector('.multiplier-value');
            if (valueEl) {
                // Get the multiplier from the parent cell
                const cell = activeMultiplier.closest('.road-cell');
                if (cell && cell.dataset.multiplier) {
                    multiplier = parseFloat(cell.dataset.multiplier);
                }
            }
        }
        
        currentMultiplier.textContent = multiplier.toFixed(2);
        
        // Update payout display
        if (currentPayout) {
            currentPayout.textContent = (betAmount * multiplier).toFixed(2);
        }
        
        // Spawn cars at random intervals
        if (Math.random() < 0.02) {  // 2% chance per frame to spawn a car
            spawnCar();
        }
        
        // Update cars positions
        updateCars();
    }
    
    function generateRoads() {
        // Clear any existing roads
        clearRoads();
        
        // Create a grid layout like in the screenshot
        const gameWidth = chickenGame.offsetWidth;
        const gameHeight = chickenGame.offsetHeight;
        const laneWidth = gameWidth / 7; // 7 lanes horizontally
        const laneHeight = gameHeight / 5; // 5 lanes vertically
        
        // Create road background first
        for (let row = 0; row < 5; row++) {
            // Create a road lane
            const road = document.createElement('div');
            road.className = 'road-lane';
            road.style.top = `${row * laneHeight}px`;
            road.style.height = `${laneHeight}px`;
            road.dataset.row = row;
            
            // Add lane markers
            for (let i = 1; i < 7; i++) {
                const marker = document.createElement('div');
                marker.className = 'lane-marker';
                marker.style.left = `${(i * laneWidth) - 1}px`;
                road.appendChild(marker);
            }
            
            chickenGame.appendChild(road);
        }
        
        // Create clickable cells for movement
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 7; col++) {
                // Create a grid cell
                const cell = document.createElement('div');
                cell.className = 'road-cell';
                cell.style.top = `${row * laneHeight}px`;
                cell.style.left = `${col * laneWidth}px`;
                cell.style.width = `${laneWidth}px`;
                cell.style.height = `${laneHeight}px`;
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // Make cells clickable
                cell.addEventListener('click', () => handleCellClick(row, col));
                
                // Add multiplier indicators like in the screenshot
                // Only add multipliers in specific patterns matching the screenshot
                if ((row === 0 && col === 0) || 
                    (row === 0 && col === 1) || 
                    (row === 2 && col === 0) ||
                    (row === 4 && col === 1) ||
                    (row === 4 && col === 3) ||
                    (row === 4 && col === 5) ||
                    (row === 4 && col === 6)) {
                    
                    // Determine multiplier value based on position
                    let multiplierValue;
                    if (row === 0 && col === 0) multiplierValue = 0.96;
                    else if (row === 0 && col === 1) multiplierValue = 1.01;
                    else if (row === 2 && col === 0) multiplierValue = 1.05;
                    else if (row === 4 && col === 1) multiplierValue = 1.1;
                    else if (row === 4 && col === 3) multiplierValue = 1.16;
                    else if (row === 4 && col === 5) multiplierValue = 1.22;
                    else multiplierValue = 1 + (0.05 * (row + col));
                    
                    // Create multiplier hexagon
                    const multiplierHex = document.createElement('div');
                    multiplierHex.className = 'multiplier-hex';
                    
                    // Check if this should be the active multiplier
                    if ((row === 2 && col === 0) || // Current position in screenshot
                        (row === 4 && col === 1 && currentLane === 1)) { // Next position with arrow
                        multiplierHex.classList.add('active-multiplier');
                        
                        // Add arrow indicator for next position
                        if (row === 4 && col === 1) {
                            const arrow = document.createElement('div');
                            arrow.className = 'next-indicator';
                            cell.appendChild(arrow);
                        }
                    }
                    
                    // Create inner content with gem icons
                    const innerContent = `
                        <div class="gem-icons"></div>
                        <div class="multiplier-value">${multiplierValue.toFixed(2)}</div>
                        <div class="multiplier-suffix">${multiplierValue.toFixed(2)}x</div>
                    `;
                    multiplierHex.innerHTML = innerContent;
                    
                    cell.appendChild(multiplierHex);
                    cell.dataset.multiplier = multiplierValue.toFixed(2);
                }
                
                chickenGame.appendChild(cell);
            }
        }
        
        // Add road barriers like in the screenshot
        const barriers = [
            {row: 0, col: 0, type: 'barrier'},
            {row: 0, col: 1, type: 'barrier'},
            {row: 0, col: 2, type: 'barrier'},
            {row: 0, col: 4, type: 'barrier'}
        ];
        
        barriers.forEach(barrier => {
            const barrierEl = document.createElement('div');
            barrierEl.className = 'road-barrier';
            barrierEl.style.top = `${barrier.row * laneHeight + 10}px`;
            barrierEl.style.left = `${barrier.col * laneWidth + (laneWidth/2) - 20}px`;
            chickenGame.appendChild(barrierEl);
        });
    }
    
    function handleCellClick(row, col) {
        if (!gameStarted || gameEnded) return;
        
        // Only allow clicks on cells that have multipliers
        const cell = document.querySelector(`.road-cell[data-row="${row}"][data-col="${col}"]`);
        if (!cell || !cell.dataset.multiplier) return;
        
        // Get current chicken position
        const currentRow = parseInt(chickenCharacter.dataset.row || 2);
        const currentCol = parseInt(chickenCharacter.dataset.col || 0);
        
        // Valid moves determined by the multiplier positions - match screenshot interaction
        // Allow only one move at a time
        const isValidMove = Math.abs(row - currentRow) + Math.abs(col - currentCol) === 1;
        
        if (isValidMove) {
            // Valid move - update position
            moveChicken(row, col);
        }
    }
    
    function moveChicken(row, col) {
        // Calculate new position based on grid
        const gameWidth = chickenGame.offsetWidth;
        const gameHeight = chickenGame.offsetHeight;
        const laneWidth = gameWidth / 7;
        const laneHeight = gameHeight / 5;
        const newLeft = col * laneWidth + (laneWidth / 2) - 30; // Center in cell
        const newTop = row * laneHeight + (laneHeight / 2) - 30; // Center in cell
        
        // Store previous position
        const prevRow = parseInt(chickenCharacter.dataset.row || 2);
        const prevCol = parseInt(chickenCharacter.dataset.col || 0);
        
        // Update chicken position
        chickenCharacter.style.transition = 'left 0.2s ease-out, top 0.2s ease-out';
        chickenCharacter.style.left = `${newLeft}px`;
        chickenCharacter.style.top = `${newTop}px`;
        chickenCharacter.dataset.col = col;
        chickenCharacter.dataset.row = row;
        
        // Update multipliers - deactivate previous, activate new
        const prevMultiplier = document.querySelector('.active-multiplier');
        if (prevMultiplier) {
            prevMultiplier.classList.remove('active-multiplier');
        }
        
        // Find and activate new multiplier
        const cell = document.querySelector(`.road-cell[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            const multiplierHex = cell.querySelector('.multiplier-hex');
            if (multiplierHex) {
                multiplierHex.classList.add('active-multiplier');
                
                // Update current lane for game logic
                currentLane = col;
                
                // Update multiplier value based on cell
                if (cell.dataset.multiplier) {
                    multiplier = parseFloat(cell.dataset.multiplier);
                    
                    // Update displays
                    currentMultiplier.textContent = multiplier.toFixed(2);
                    if (currentPayout) {
                        currentPayout.textContent = (betAmount * multiplier).toFixed(2);
                    }
                    
                    // Add gem animation effect on the multiplier
                    const gemIcons = multiplierHex.querySelector('.gem-icons');
                    if (gemIcons) {
                        gemIcons.classList.add('gem-pulse');
                        setTimeout(() => {
                            gemIcons.classList.remove('gem-pulse');
                        }, 500);
                    }
                }
            }
        }
        
        // Update next position indicator
        updateNextPositionIndicator();
    }
    
    function updateNextPositionIndicator() {
        // Remove any existing indicators
        const existingIndicators = document.querySelectorAll('.next-indicator');
        existingIndicators.forEach(indicator => indicator.remove());
        
        // Get current position
        const currentRow = parseInt(chickenCharacter.dataset.row || 0);
        const currentCol = parseInt(chickenCharacter.dataset.col || 0);
        
        // Check adjacent positions for valid moves
        const adjacentPositions = [
            {row: currentRow-1, col: currentCol},
            {row: currentRow+1, col: currentCol},
            {row: currentRow, col: currentCol-1},
            {row: currentRow, col: currentCol+1}
        ];
        
        // Find valid next positions (cells with multipliers)
        adjacentPositions.forEach(pos => {
            if (pos.row >= 0 && pos.row < 5 && pos.col >= 0 && pos.col < 7) {
                const cell = document.querySelector(`.road-cell[data-row="${pos.row}"][data-col="${pos.col}"]`);
                if (cell && cell.dataset.multiplier) {
                    // This is a valid next position - add indicator
                    const arrow = document.createElement('div');
                    arrow.className = 'next-indicator';
                    cell.appendChild(arrow);
                }
            }
        });
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
        // Cars appear only on rows 0, 1, 2, 3 (not the bottom row)
        const visibleRows = [0, 1, 2, 3];
        
        // Pick a random road row
        const randomRowIndex = Math.floor(Math.random() * visibleRows.length);
        const rowNumber = visibleRows[randomRowIndex];
        
        // In the screenshot, cars in different rows move in different directions
        const direction = rowNumber % 2 === 0 ? 'left' : 'right';
        
        // Create a car
        const car = document.createElement('div');
        car.className = 'car';
        
        // Position car
        const gameWidth = chickenGame.offsetWidth;
        const gameHeight = chickenGame.offsetHeight;
        const laneHeight = gameHeight / 5;
        
        car.style.top = `${rowNumber * laneHeight + (laneHeight / 2) - 30}px`; // Center in lane
        
        // Choose car type to match screenshot
        let carType;
        const typeRoll = Math.random();
        
        if (typeRoll < 0.4) { // 40% chance for red sports car
            carType = 'sports-car';
            car.style.backgroundColor = '#f00';
        } else if (typeRoll < 0.7) { // 30% chance for police car
            carType = 'police-car';
        } else if (typeRoll < 0.9) { // 20% chance for green car
            carType = 'car';
            car.style.backgroundColor = '#0a5';
        } else { // 10% chance for black car
            carType = 'black-car';
            car.style.backgroundColor = '#222';
        }
        
        car.classList.add(carType);
        
        // Set speed and position based on direction
        if (direction === 'right') {
            car.style.left = '-100px';
            car.dataset.speed = (Math.random() * 2) + 4;  // 4-6 pixels per frame
            car.dataset.direction = 'right';
        } else {
            car.style.left = `${gameWidth + 100}px`;
            car.style.transform = 'scaleX(-1)'; // Flip car
            car.dataset.speed = -((Math.random() * 2) + 4);  // -4 to -6 pixels per frame
            car.dataset.direction = 'left';
        }
        
        car.dataset.row = rowNumber;
        
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
            
            // Check for fence collision
            checkFenceCollision(car);
            
            // Remove car if it's off screen or too far from chicken
            const carCol = parseInt(car.dataset.col || 0);
            if ((speed > 0 && newLeft > gameWidth + 100) || 
                (speed < 0 && newLeft < -200) || 
                (Math.abs(carCol - currentLane) > 10)) {
                car.classList.add('exiting');
                setTimeout(() => {
                    car.remove();
                }, 500);
            }
            
            // Check collision with chicken
            if (!gameEnded && isColliding(car, chickenCharacter)) {
                crashGame();
            }
        });
    }
    
    function checkFenceCollision(car) {
        // Get car position
        const carRect = car.getBoundingClientRect();
        const carRow = parseInt(car.dataset.row);
        const carCol = Math.floor((parseFloat(car.style.left) + 40) / 80); // Approximate column based on position
        const carPower = parseFloat(car.dataset.power || 0.3);
        
        // Find any fences in the path
        const fences = document.querySelectorAll(`.fence`);
        
        fences.forEach(fence => {
            const fenceRect = fence.getBoundingClientRect();
            
            // Check if car is about to hit fence
            if (!fence.classList.contains('broken') && 
                !(carRect.right < fenceRect.left || 
                  carRect.left > fenceRect.right || 
                  carRect.bottom < fenceRect.top || 
                  carRect.top > fenceRect.bottom)) {
                
                // Check if car can break fence based on power
                if (Math.random() < carPower) {
                    // Break the fence
                    fence.classList.add('broken');
                    
                    // Add breaking animation and sound
                    const breakEffect = document.createElement('div');
                    breakEffect.className = 'break-effect';
                    breakEffect.style.left = `${fenceRect.left + fenceRect.width/2}px`;
                    breakEffect.style.top = `${fenceRect.top + fenceRect.height/2}px`;
                    chickenGame.appendChild(breakEffect);
                    
                    setTimeout(() => {
                        breakEffect.remove();
                    }, 1000);
                    
                    // Play break sound
                    playSound('break');
                } else {
                    // Car hit fence but didn't break it
                    car.classList.add('bounce');
                    fence.classList.add('shake');
                    
                    // Slow down car
                    const currentSpeed = parseFloat(car.dataset.speed);
                    car.dataset.speed = (currentSpeed * 0.8).toString();
                    
                    setTimeout(() => {
                        car.classList.remove('bounce');
                        fence.classList.remove('shake');
                    }, 300);
                }
            }
        });
    }
    
    function isColliding(car, chicken) {
        // Get car and chicken positions
        const carRect = car.getBoundingClientRect();
        const chickenRect = chicken.getBoundingClientRect();
        
        // Use tighter collision box for more accurate collision
        const chickenCollisionMargin = 10; // Pixels to shrink the chicken hitbox
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
            crashEffect.style.top = `${chickenRect.top + chickenRect.height/2}px`;
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