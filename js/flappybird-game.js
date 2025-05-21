document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const flappyBirdCanvas = document.getElementById('flappyBirdCanvas');
    const gameSetup = document.getElementById('gameSetup');
    const gameCanvas = document.getElementById('gameCanvas');
    const resultSection = document.getElementById('resultSection');
    const slowmoOverlay = document.getElementById('slowmoOverlay');
    
    // Game inputs
    const betAmountInput = document.getElementById('betAmount');
    const multiplierCapInput = document.getElementById('multiplierCap');
    const potentialWinDisplay = document.getElementById('potentialWin');
    const currentMultiplierDisplay = document.getElementById('currentMultiplier');
    const pipeCountDisplay = document.getElementById('pipeCount');
    const potentialWinInGameDisplay = document.getElementById('potentialWinInGame');
    
    // Result displays
    const resultText = document.getElementById('resultText');
    const resultAmount = document.getElementById('resultAmount');
    const finalPipes = document.getElementById('finalPipes');
    const finalMultiplier = document.getElementById('finalMultiplier');
    
    // Buttons
    const startGameButton = document.getElementById('startGameButton');
    const cashoutButton = document.getElementById('cashoutButton');
    const playAgainButton = document.getElementById('playAgainButton');
    const continueButton = document.getElementById('continueButton');
    const stopButton = document.getElementById('stopButton');
    const betShortcuts = document.querySelectorAll('.bet-shortcut');
    const capShortcuts = document.querySelectorAll('.cap-shortcut');
    const countdown = document.getElementById('countdown');
    
    // Game history
    const gameHistoryBody = document.getElementById('gameHistoryBody');
    let gameHistory = [];
    
    // Game state
    let ctx;
    let game = null;
    let isPlaying = false;
    let betAmount = 100;
    let multiplierCap = 5;
    let currentMultiplier = 1.0;
    let pipesPassed = 0;
    let gameSpeed = 1;
    let countdownTimer = null;
    let isSlowModeActive = false;
    
    // Initialize
    init();
    
    function init() {
        if (flappyBirdCanvas) {
            ctx = flappyBirdCanvas.getContext('2d');
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);
        }
        
        // Update potential win on input change
        if (betAmountInput) {
            betAmountInput.addEventListener('input', updatePotentialWin);
        }
        
        if (multiplierCapInput) {
            multiplierCapInput.addEventListener('input', updatePotentialWin);
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
                
                updatePotentialWin();
            });
        });
        
        // Cap shortcuts
        capShortcuts.forEach(shortcut => {
            shortcut.addEventListener('click', () => {
                multiplierCapInput.value = shortcut.dataset.cap;
                updatePotentialWin();
            });
        });
        
        // Button click handlers
        if (startGameButton) {
            startGameButton.addEventListener('click', startGame);
        }
        
        if (cashoutButton) {
            cashoutButton.addEventListener('click', cashout);
        }
        
        if (playAgainButton) {
            playAgainButton.addEventListener('click', resetGame);
        }
        
        if (continueButton) {
            continueButton.addEventListener('click', continuePlaying);
        }
        
        if (stopButton) {
            stopButton.addEventListener('click', cashout);
        }
        
        // Initial update
        updatePotentialWin();
        
        // Load game history
        loadGameHistory();
    }
    
    function resizeCanvas() {
        if (!flappyBirdCanvas) return;
        
        const container = flappyBirdCanvas.parentElement;
        flappyBirdCanvas.width = container.clientWidth;
        flappyBirdCanvas.height = container.clientHeight;
        
        // If game is running, update dimensions
        if (game) {
            game.width = flappyBirdCanvas.width;
            game.height = flappyBirdCanvas.height;
        }
    }
    
    function updatePotentialWin() {
        if (!betAmountInput || !multiplierCapInput || !potentialWinDisplay) return;
        
        betAmount = parseInt(betAmountInput.value) || 100;
        multiplierCap = parseFloat(multiplierCapInput.value) || 5;
        
        // Validate inputs
        if (betAmount < 10) betAmount = 10;
        if (betAmount > 10000) betAmount = 10000;
        if (multiplierCap < 1.5) multiplierCap = 1.5;
        if (multiplierCap > 100) multiplierCap = 100;
        
        // Update inputs with validated values
        betAmountInput.value = betAmount;
        multiplierCapInput.value = multiplierCap;
        
        // Calculate potential win
        const potentialWin = betAmount * multiplierCap;
        potentialWinDisplay.textContent = formatCurrency(potentialWin);
    }
    
    function startGame() {
        // Validate user is logged in
        const currentUser = window.BetaAuth?.getCurrentUser();
        if (!currentUser) {
            alert('Please login to play!');
            return;
        }
        
        // Get and validate bet amount
        betAmount = parseInt(betAmountInput.value) || 100;
        multiplierCap = parseFloat(multiplierCapInput.value) || 5;
        
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
        
        // Switch views
        gameSetup.style.display = 'none';
        gameCanvas.style.display = 'block';
        resultSection.style.display = 'none';
        slowmoOverlay.style.display = 'none';
        
        // Add a loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'game-loading';
        loadingIndicator.innerHTML = `
            <div class="loading-spinner"></div>
            <p>Loading game...</p>
        `;
        gameCanvas.appendChild(loadingIndicator);
        
        // Reset game state
        isPlaying = false; // Don't start playing until fully loaded
        currentMultiplier = 1.0;
        pipesPassed = 0;
        gameSpeed = 1;
        isSlowModeActive = false;
        
        // Update HUD
        currentMultiplierDisplay.textContent = '1.0x';
        pipeCountDisplay.textContent = '0';
        potentialWinInGameDisplay.textContent = formatCurrency(betAmount);
        
        // Delay game creation to ensure canvas is ready
        setTimeout(() => {
            // Remove loading indicator
            loadingIndicator.remove();
            
            // Force canvas resize before creating game
            resizeCanvas();
            
            // Create game
            game = new FlappyGame(betAmount, multiplierCap);
            
            // Delay start slightly to ensure rendering is complete
            setTimeout(() => {
                isPlaying = true;
                
                // Auto-flap at the beginning to prevent instant death
                game.flap();
                
                game.start();
                
                // Add key listeners
                window.addEventListener('keydown', handleKeydown);
                flappyBirdCanvas.addEventListener('click', handleClick);
                flappyBirdCanvas.addEventListener('touchstart', handleTouch);
            }, 500);
        }, 1000);
    }
    
    function cashout() {
        if (!isPlaying || !game) return;
        
        // Stop game
        window.removeEventListener('keydown', handleKeydown);
        flappyBirdCanvas.removeEventListener('click', handleClick);
        flappyBirdCanvas.removeEventListener('touchstart', handleTouch);
        
        game.stop();
        isPlaying = false;
        
        // Calculate winnings
        const winnings = betAmount * currentMultiplier;
        
        // Update user balance
        if (window.BetaAuth) {
            window.BetaAuth.updateBalance(winnings, 'Flappy Bird');
        }
        
        // Show result
        gameCanvas.style.display = 'none';
        resultSection.style.display = 'block';
        slowmoOverlay.style.display = 'none';
        
        resultText.textContent = 'You cashed out!';
        resultText.style.color = 'var(--success-color)';
        resultAmount.textContent = formatCurrency(winnings);
        resultAmount.style.color = 'var(--success-color)';
        finalPipes.textContent = pipesPassed;
        finalMultiplier.textContent = currentMultiplier.toFixed(1) + 'x';
        
        // Add to game history
        addGameToHistory({
            user: window.BetaAuth?.getCurrentUser()?.username || 'Guest',
            bet: betAmount,
            multiplierCap: multiplierCap,
            pipesPassed: pipesPassed,
            finalMultiplier: currentMultiplier,
            outcome: winnings,
            time: new Date()
        });
        
        // Track bet in main system
        if (window.BetaGames?.trackGameBet) {
            window.BetaGames.trackGameBet('Flappy Bird', betAmount, winnings);
        }
    }
    
    function gameOver() {
        if (!isPlaying) return;
        
        // Stop game
        window.removeEventListener('keydown', handleKeydown);
        flappyBirdCanvas.removeEventListener('click', handleClick);
        flappyBirdCanvas.removeEventListener('touchstart', handleTouch);
        
        game.stop();
        isPlaying = false;
        
        // Show result
        gameCanvas.style.display = 'none';
        resultSection.style.display = 'block';
        slowmoOverlay.style.display = 'none';
        
        resultText.textContent = 'Game Over!';
        resultText.style.color = 'var(--danger-color)';
        resultAmount.textContent = formatCurrency(-betAmount);
        resultAmount.style.color = 'var(--danger-color)';
        finalPipes.textContent = pipesPassed;
        finalMultiplier.textContent = currentMultiplier.toFixed(1) + 'x';
        
        // Update user balance
        if (window.BetaAuth) {
            window.BetaAuth.updateBalance(-betAmount, 'Flappy Bird');
        }
        
        // Add to game history
        addGameToHistory({
            user: window.BetaAuth?.getCurrentUser()?.username || 'Guest',
            bet: betAmount,
            multiplierCap: multiplierCap,
            pipesPassed: pipesPassed,
            finalMultiplier: currentMultiplier,
            outcome: -betAmount,
            time: new Date()
        });
        
        // Track bet in main system
        if (window.BetaGames?.trackGameBet) {
            window.BetaGames.trackGameBet('Flappy Bird', betAmount, -betAmount);
        }
    }
    
    function resetGame() {
        // Reset views
        gameSetup.style.display = 'block';
        gameCanvas.style.display = 'none';
        resultSection.style.display = 'none';
        slowmoOverlay.style.display = 'none';
    }
    
    function handleKeydown(e) {
        if (e.code === 'Space' && game && isPlaying) {
            if (isSlowModeActive) return;
            game.flap();
        }
    }
    
    function handleClick() {
        if (game && isPlaying && !isSlowModeActive) {
            game.flap();
        }
    }
    
    function handleTouch(e) {
        e.preventDefault();
        if (game && isPlaying && !isSlowModeActive) {
            game.flap();
        }
    }
    
    function activateSlowMode() {
        if (!isPlaying || isSlowModeActive) return;
        
        isSlowModeActive = true;
        gameSpeed = 0.3; // 30% of normal speed
        
        // Show slow mode overlay
        slowmoOverlay.style.display = 'flex';
        countdown.style.display = 'none';
    }
    
    function continuePlaying() {
        if (!isPlaying || !isSlowModeActive) return;
        
        // Start countdown
        countdown.style.display = 'block';
        countdown.textContent = '3';
        
        let count = 3;
        countdownTimer = setInterval(() => {
            count--;
            countdown.textContent = count;
            
            if (count <= 0) {
                clearInterval(countdownTimer);
                exitSlowMode();
            }
        }, 1000);
    }
    
    function exitSlowMode() {
        if (!isPlaying) return;
        
        isSlowModeActive = false;
        gameSpeed = 1 + (pipesPassed * 0.02); // Return to normal speed with pipe-based acceleration
        slowmoOverlay.style.display = 'none';
    }
    
    function onPipePassed() {
        pipesPassed++;
        
        // Update multiplier (capped at the user-defined max)
        currentMultiplier = Math.min(1 + (pipesPassed * 0.1), multiplierCap);
        
        // Update HUD
        currentMultiplierDisplay.textContent = currentMultiplier.toFixed(1) + 'x';
        pipeCountDisplay.textContent = pipesPassed;
        potentialWinInGameDisplay.textContent = formatCurrency(betAmount * currentMultiplier);
        
        // Show multiplier increase animation
        showMultiplierAnimation();
        
        // Increase game speed slightly with each pipe
        if (!isSlowModeActive) {
            gameSpeed = 1 + (pipesPassed * 0.02);
        }
        
        // Check if we should activate slow mode (every 5 pipes)
        if (pipesPassed > 0 && pipesPassed % 5 === 0) {
            activateSlowMode();
        }
    }
    
    // Show multiplier increase animation
    function showMultiplierAnimation() {
        // Create animation element
        const animEl = document.createElement('div');
        animEl.className = 'floating-multiplier';
        animEl.textContent = '+0.1x';
        document.querySelector('.flappy-bird-container').appendChild(animEl);
        
        // Remove after animation completes
        setTimeout(() => {
            animEl.remove();
        }, 1500);
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
        if (gameHistory.length > 0) {
            gameHistory.forEach(game => {
                const row = document.createElement('tr');
                
                // User cell
                const userCell = document.createElement('td');
                userCell.textContent = game.user;
                
                // Bet cell
                const betCell = document.createElement('td');
                betCell.textContent = formatCurrency(game.bet);
                
                // Multiplier Cap cell
                const capCell = document.createElement('td');
                capCell.textContent = game.multiplierCap.toFixed(1) + 'x';
                
                // Pipes Passed cell
                const pipesCell = document.createElement('td');
                pipesCell.textContent = game.pipesPassed;
                
                // Final Multiplier cell
                const multiplierCell = document.createElement('td');
                multiplierCell.textContent = game.finalMultiplier.toFixed(1) + 'x';
                
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
                row.appendChild(capCell);
                row.appendChild(pipesCell);
                row.appendChild(multiplierCell);
                row.appendChild(outcomeCell);
                row.appendChild(timeCell);
                
                // Add animation class
                row.classList.add('fade-in');
                
                // Append row to table
                gameHistoryBody.appendChild(row);
            });
        } else {
            // Show empty state
            const emptyRow = document.createElement('tr');
            const emptyCell = document.createElement('td');
            emptyCell.colSpan = 7;
            emptyCell.className = 'empty-history';
            emptyCell.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <p>No game history yet. Play your first game!</p>
                </div>
            `;
            emptyRow.appendChild(emptyCell);
            gameHistoryBody.appendChild(emptyRow);
        }
    }
    
    // Load initial game history with random data
    function loadGameHistory() {
        // Clear fake data, only show real game history
        gameHistory = [];
        
        // Get current user if available
        const currentUser = window.BetaAuth?.getCurrentUser();
        
        // Update UI with empty state message
        updateGameHistoryTable();
    }
    
    // Flappy Game Class
    class FlappyGame {
        constructor(betAmount, multiplierCap) {
            this.width = flappyBirdCanvas.width;
            this.height = flappyBirdCanvas.height;
            this.betAmount = betAmount;
            this.multiplierCap = multiplierCap;
            
            this.bird = {
                x: this.width * 0.3,
                y: this.height * 0.5,
                velocity: 0,
                rotation: 0
            };
            
            this.pipes = [];
            this.coins = [];
            this.gravity = 0.35; // Reduced gravity for easier control
            this.flapStrength = -8; // Less aggressive flap
            this.pipeGap = 180; // Slightly larger gap
            this.pipeWidth = 60;
            this.pipeInterval = 180; // Longer time between pipes
            this.frameCount = 0;
            this.gameOver = false;
            this.gameLoop = null;
            this.startImmunity = true; // Immunity at start
            this.immunityFrames = 60; // 1 second immunity (60fps)
            this.pipeStartDelay = 90; // Delay first pipe generation
            this.birdTrail = [];
            this.stars = [];
            this.particles = [];
        }
        
        start() {
            this.gameLoop = setInterval(() => {
                this.update();
                this.draw();
                
                if (this.gameOver) {
                    clearInterval(this.gameLoop);
                    gameOver();
                }
                
                // Reduce immunity counter
                if (this.immunityFrames > 0) {
                    this.immunityFrames--;
                } else {
                    this.startImmunity = false;
                }
            }, 16); // ~60fps
        }
        
        stop() {
            if (this.gameLoop) {
                clearInterval(this.gameLoop);
                this.gameLoop = null;
            }
        }
        
        update() {
            // Skip updates in slow-mo overlay choice mode
            if (isSlowModeActive && !countdown.style.display) return;
            
            this.frameCount++;
            
            // Adjust for game speed
            const speedFactor = gameSpeed;
            
            // Update bird
            this.bird.velocity += this.gravity * speedFactor;
            this.bird.y += this.bird.velocity * speedFactor;
            this.bird.rotation = Math.min(Math.PI / 2, Math.max(-Math.PI / 4, this.bird.velocity * 0.05));
            
            // Check if bird hits ground or ceiling
            if (this.bird.y + 20 > this.height || this.bird.y - 20 < 0) {
                if (!this.startImmunity) {
                    this.gameOver = true;
                    return;
                } else {
                    // Bounce instead of dying during immunity
                    if (this.bird.y + 20 > this.height) {
                        this.bird.y = this.height - 20;
                        this.bird.velocity = -5;
                    } else if (this.bird.y - 20 < 0) {
                        this.bird.y = 20;
                        this.bird.velocity = 5;
                    }
                }
            }
            
            // Generate pipes after delay
            if (this.frameCount > this.pipeStartDelay && this.frameCount % Math.floor(this.pipeInterval / speedFactor) === 0) {
                const topHeight = Math.floor(Math.random() * (this.height - this.pipeGap - 150)) + 80;
                
                this.pipes.push({
                    x: this.width,
                    topHeight: topHeight,
                    passed: false
                });
                
                // Add coins in the gap
                const numCoins = Math.floor(Math.random() * 3) + 1;
                for (let i = 0; i < numCoins; i++) {
                    this.coins.push({
                        x: this.width + this.pipeWidth / 2 + i * 30,
                        y: topHeight + this.pipeGap / 2,
                        radius: 10,
                        collected: false
                    });
                }
            }
            
            // Update pipes and check collisions
            for (let i = this.pipes.length - 1; i >= 0; i--) {
                const pipe = this.pipes[i];
                pipe.x -= 2 * speedFactor;
                
                // Check if pipe is off screen
                if (pipe.x + this.pipeWidth < 0) {
                    this.pipes.splice(i, 1);
                    continue;
                }
                
                // Check if bird passes pipe
                if (!pipe.passed && pipe.x + this.pipeWidth < this.bird.x) {
                    pipe.passed = true;
                    
                    // Add pipe passed animation
                    this.addPipePassedEffect(pipe.x + this.pipeWidth/2, this.height/2);
                    
                    onPipePassed(); // Call the game state handler
                }
                
                // Check for collision with pipe
                if (
                    !this.startImmunity && 
                    this.bird.x + 18 > pipe.x && 
                    this.bird.x - 18 < pipe.x + this.pipeWidth && 
                    (this.bird.y - 18 < pipe.topHeight || this.bird.y + 18 > pipe.topHeight + this.pipeGap)
                ) {
                    this.gameOver = true;
                    return;
                }
            }
            
            // Update coins
            for (let i = this.coins.length - 1; i >= 0; i--) {
                const coin = this.coins[i];
                coin.x -= 2 * speedFactor;
                
                // Check if coin is off screen
                if (coin.x + coin.radius < 0) {
                    this.coins.splice(i, 1);
                    continue;
                }
                
                // Check if bird collects coin
                if (
                    !coin.collected &&
                    Math.sqrt(Math.pow(this.bird.x - coin.x, 2) + Math.pow(this.bird.y - coin.y, 2)) < 20 + coin.radius
                ) {
                    coin.collected = true;
                    this.coins.splice(i, 1);
                    
                    // Add collection effect
                    this.addCoinCollectEffect(coin.x, coin.y, coin.radius);
                }
            }
            
            // Update particle effects
            if (this.particles) {
                for (let i = this.particles.length - 1; i >= 0; i--) {
                    const particle = this.particles[i];
                    particle.x += particle.vx * speedFactor;
                    particle.y += particle.vy * speedFactor;
                    particle.vy += this.gravity * 0.1 * speedFactor; // Slight gravity
                    particle.age += speedFactor;
                    
                    // Remove old particles
                    if (particle.age > particle.maxAge) {
                        this.particles.splice(i, 1);
                    }
                }
            }
        }
        
        addCoinCollectEffect(x, y, radius) {
            // Initialize particles array if it doesn't exist
            if (!this.particles) this.particles = [];
            
            // Add particles
            for (let i = 0; i < 20; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 3 + 1;
                
                this.particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    radius: Math.random() * 3 + 1,
                    color: '#18e77c',
                    age: 0,
                    maxAge: 30 + Math.random() * 20
                });
            }
            
            // Play coin sound (if implemented)
            // playSound('coin');
        }
        
        addPipePassedEffect(x, y) {
            // Initialize particles array if it doesn't exist
            if (!this.particles) this.particles = [];
            
            // Add particles in a vertical line
            for (let i = 0; i < 15; i++) {
                const yPos = Math.random() * this.height;
                
                this.particles.push({
                    x: x,
                    y: yPos,
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4,
                    radius: Math.random() * 4 + 2,
                    color: 'rgba(24, 231, 124, 0.7)',
                    age: 0,
                    maxAge: 40 + Math.random() * 20
                });
            }
            
            // Play pipe passed sound (if implemented)
            // playSound('pipe');
        }
        
        draw() {
            // Clear canvas
            ctx.clearRect(0, 0, this.width, this.height);
            
            // Draw background
            const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
            gradient.addColorStop(0, '#1c1f30');
            gradient.addColorStop(1, '#0c0e1a');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, this.width, this.height);
            
            // Add stars to background
            this.drawStars();
            
            // Draw trail
            this.drawTrail();
            
            // Draw pipes
            for (const pipe of this.pipes) {
                this.drawPipe(pipe.x, pipe.topHeight, this.pipeGap);
            }
            
            // Draw coins
            for (const coin of this.coins) {
                this.drawCoin(coin.x, coin.y, coin.radius);
            }
            
            // Draw bird
            this.drawBird(this.bird.x, this.bird.y, this.bird.rotation);
            
            // Draw immunity indicator
            if (this.startImmunity) {
                ctx.beginPath();
                ctx.arc(this.bird.x, this.bird.y, 25, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255, 255, 255, ' + (this.immunityFrames / 60) + ')';
                ctx.lineWidth = 3;
                ctx.stroke();
            }
            
            // Draw particles
            this.drawParticles();
        }
        
        drawTrail() {
            // Only add to trail every few frames to avoid too many points
            if (this.frameCount % 3 === 0) {
                if (!this.birdTrail) this.birdTrail = [];
                
                // Add new point to the trail
                this.birdTrail.push({
                    x: this.bird.x,
                    y: this.bird.y,
                    age: 0
                });
                
                // Limit trail length
                if (this.birdTrail.length > 10) {
                    this.birdTrail.shift();
                }
            }
            
            // Draw trail
            if (this.birdTrail) {
                for (let i = 0; i < this.birdTrail.length; i++) {
                    const point = this.birdTrail[i];
                    point.age += 1;
                    
                    // Fade out based on age
                    const opacity = Math.max(0, 0.7 - (point.age / 30));
                    const size = Math.max(5, 20 - point.age);
                    
                    if (opacity > 0) {
                        ctx.beginPath();
                        ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(24, 231, 124, ${opacity})`;
                        ctx.fill();
                    }
                }
            }
        }
        
        drawStars() {
            // Create stars if they don't exist yet
            if (!this.stars) {
                this.stars = [];
                for (let i = 0; i < 50; i++) {
                    this.stars.push({
                        x: Math.random() * this.width,
                        y: Math.random() * this.height,
                        size: Math.random() * 2 + 1,
                        opacity: Math.random() * 0.5 + 0.2,
                        pulse: Math.random() * 0.1,
                        pulseSpeed: Math.random() * 0.02 + 0.01
                    });
                }
            }
            
            // Draw stars
            for (const star of this.stars) {
                // Update pulsating effect
                star.pulse += star.pulseSpeed;
                const opacity = star.opacity + Math.sin(star.pulse) * 0.2;
                
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
                ctx.fill();
            }
        }
        
        flap() {
            this.bird.velocity = this.flapStrength;
        }
        
        drawBird(x, y, rotation) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);
            
            // Glow effect
            ctx.shadowColor = '#18e77c';
            ctx.shadowBlur = 15;
            
            // Body
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
            gradient.addColorStop(0, '#5df5a9');
            gradient.addColorStop(1, '#18e77c');
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Wing animation based on velocity
            const wingOffset = Math.sin(this.frameCount * 0.3) * 5;
            
            // Wing
            ctx.beginPath();
            ctx.ellipse(-5, wingOffset, 10, 15, Math.PI / 3, 0, Math.PI * 2);
            ctx.fillStyle = '#0fa656';
            ctx.fill();
            
            // Reset shadow for details
            ctx.shadowBlur = 0;
            
            // Eye
            ctx.beginPath();
            ctx.arc(8, -5, 5, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(10, -5, 2, 0, Math.PI * 2);
            ctx.fillStyle = 'black';
            ctx.fill();
            
            // Beak
            ctx.beginPath();
            ctx.moveTo(15, 0);
            ctx.lineTo(25, -5);
            ctx.lineTo(25, 5);
            ctx.closePath();
            ctx.fillStyle = '#ff9900';
            ctx.fill();
            
            ctx.restore();
        }
        
        drawPipe(x, topHeight, gapHeight) {
            // Add glow effect
            ctx.shadowColor = '#18e77c';
            ctx.shadowBlur = 10;
            
            // Top pipe gradient
            const topGradient = ctx.createLinearGradient(x, 0, x + this.pipeWidth, 0);
            topGradient.addColorStop(0, '#0fa656');
            topGradient.addColorStop(0.5, '#18e77c');
            topGradient.addColorStop(1, '#0fa656');
            
            // Top pipe
            ctx.fillStyle = topGradient;
            ctx.fillRect(x, 0, this.pipeWidth, topHeight);
            
            // Top pipe cap with lighter gradient
            const topCapGradient = ctx.createLinearGradient(x - 5, topHeight - 20, x + this.pipeWidth + 5, topHeight);
            topCapGradient.addColorStop(0, '#0c8042');
            topCapGradient.addColorStop(0.5, '#18e77c');
            topCapGradient.addColorStop(1, '#0c8042');
            
            ctx.fillStyle = topCapGradient;
            // Rounded cap
            this.roundedRect(x - 5, topHeight - 20, this.pipeWidth + 10, 20, 5, true, false, false, false);
            
            // Bottom pipe
            const bottomY = topHeight + gapHeight;
            ctx.fillStyle = topGradient;
            ctx.fillRect(x, bottomY, this.pipeWidth, this.height - bottomY);
            
            // Bottom pipe cap
            ctx.fillStyle = topCapGradient;
            // Rounded cap
            this.roundedRect(x - 5, bottomY, this.pipeWidth + 10, 20, 5, false, false, true, true);
            
            // Reset shadow
            ctx.shadowBlur = 0;
            
            // Add shine effect to pipes
            const shineWidth = 10;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(x + 5, 0, shineWidth, topHeight);
            ctx.fillRect(x + 5, bottomY, shineWidth, this.height - bottomY);
        }
        
        drawCoin(x, y, radius) {
            // Save context
            ctx.save();
            
            // Add glow effect
            ctx.shadowColor = '#18e77c';
            ctx.shadowBlur = 15;
            
            // Coin rotation animation
            const angle = this.frameCount * 0.05;
            const squish = Math.abs(Math.sin(angle)) * 0.3 + 0.7; // 0.7 to 1.0
            
            // Outer circle with gradient
            ctx.beginPath();
            ctx.ellipse(x, y, radius, radius * squish, angle, 0, Math.PI * 2);
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, '#5df5a9');
            gradient.addColorStop(1, '#18e77c');
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Inner circle with darker color
            ctx.beginPath();
            ctx.ellipse(x, y, radius * 0.8, radius * 0.8 * squish, angle, 0, Math.PI * 2);
            ctx.fillStyle = '#1c1f30';
            ctx.fill();
            
            // Dollar sign
            ctx.font = `${radius}px Arial`;
            ctx.fillStyle = '#18e77c';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Add slight shadow to text
            ctx.shadowColor = '#5df5a9';
            ctx.shadowBlur = 5;
            
            // Add "glint" animation
            if (Math.sin(this.frameCount * 0.1) > 0.8) {
                ctx.fillStyle = '#ffffff';
            }
            
            ctx.fillText('$', x, y);
            
            // Restore context
            ctx.restore();
        }
        
        drawParticles() {
            if (!this.particles) return;
            
            for (const particle of this.particles) {
                const opacity = 1 - (particle.age / particle.maxAge);
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                ctx.fillStyle = particle.color.replace(')', `, ${opacity})`).replace('rgb', 'rgba');
                ctx.fill();
            }
        }
        
        // Helper function to draw rounded rectangles
        roundedRect(x, y, width, height, radius, tl, tr, bl, br) {
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            if (tr) ctx.arcTo(x + width, y, x + width, y + radius, radius);
            else ctx.lineTo(x + width, y);
            
            ctx.lineTo(x + width, y + height - radius);
            if (br) ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
            else ctx.lineTo(x + width, y + height);
            
            ctx.lineTo(x + radius, y + height);
            if (bl) ctx.arcTo(x, y + height, x, y + height - radius, radius);
            else ctx.lineTo(x, y + height);
            
            ctx.lineTo(x, y + radius);
            if (tl) ctx.arcTo(x, y, x + radius, y, radius);
            else ctx.lineTo(x, y);
            
            ctx.closePath();
            ctx.fill();
        }
    }
    
    // Add CSS for the game
    const gameCSS = `
        .flappy-game {
            position: relative;
        }
        
        .flappy-bird-container {
            width: 100%;
            height: 500px;
            position: relative;
            background-color: var(--secondary-color);
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 0 25px rgba(24, 231, 124, 0.2);
            border: 1px solid rgba(24, 231, 124, 0.2);
        }
        
        #flappyBirdCanvas {
            width: 100%;
            height: 100%;
        }
        
        .game-hud {
            position: absolute;
            top: 20px;
            left: 20px;
            right: 20px;
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            justify-content: space-between;
            z-index: 10;
        }
        
        .hud-item {
            background-color: rgba(0, 0, 0, 0.7);
            padding: 12px 15px;
            border-radius: 8px;
            font-weight: bold;
            box-shadow: 0 0 15px rgba(24, 231, 124, 0.2);
            border: 1px solid rgba(24, 231, 124, 0.5);
            backdrop-filter: blur(5px);
            animation: glow-soft 2s infinite alternate;
        }
        
        .hud-item span:first-child {
            margin-right: 5px;
            color: rgba(255, 255, 255, 0.7);
        }
        
        .hud-item span:last-child {
            color: var(--primary-color);
        }
        
        .cashout-button {
            background: linear-gradient(45deg, #16c96c, #18e77c);
            color: var(--secondary-color);
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            animation: pulse 1.5s infinite;
            box-shadow: 0 0 15px rgba(24, 231, 124, 0.4);
            transition: all 0.3s;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .cashout-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 0 20px rgba(24, 231, 124, 0.6);
        }
        
        .cashout-button:active {
            transform: translateY(1px);
        }
        
        .slowmo-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            display: none;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            z-index: 20;
            backdrop-filter: blur(5px);
            animation: fadeIn 0.3s;
        }
        
        .slowmo-content {
            padding: 30px;
            background-color: rgba(28, 31, 48, 0.95);
            border-radius: 15px;
            border: 2px solid var(--primary-color);
            max-width: 80%;
            box-shadow: 0 0 30px rgba(24, 231, 124, 0.3);
            animation: pop-in 0.5s;
            transform: scale(0.95);
            transition: transform 0.3s;
        }
        
        .slowmo-content:hover {
            transform: scale(1);
        }
        
        .slowmo-content h2 {
            color: var(--primary-color);
            margin-bottom: 15px;
            text-shadow: 0 0 10px rgba(24, 231, 124, 0.7);
            font-size: 28px;
            letter-spacing: 1px;
        }
        
        .slowmo-content p {
            font-size: 18px;
            margin-bottom: 10px;
            color: rgba(255, 255, 255, 0.9);
        }
        
        .slowmo-buttons {
            margin-top: 25px;
            display: flex;
            gap: 20px;
            justify-content: center;
        }
        
        .slowmo-buttons .game-button {
            min-width: 130px;
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 1px;
            transition: all 0.3s;
        }
        
        .slowmo-buttons .game-button:first-child {
            background: linear-gradient(45deg, #16c96c, #18e77c);
        }
        
        .slowmo-buttons .game-button:last-child {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid var(--primary-color);
        }
        
        .slowmo-buttons .game-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        }
        
        .countdown {
            font-size: 72px;
            font-weight: bold;
            margin-top: 20px;
            color: var(--primary-color);
            display: none;
            text-shadow: 0 0 20px rgba(24, 231, 124, 0.7);
            animation: pulse-fast 1s infinite;
        }
        
        .bet-section {
            background: rgba(12, 14, 26, 0.8);
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 0 20px rgba(24, 231, 124, 0.15);
            border: 1px solid rgba(24, 231, 124, 0.2);
            transition: transform 0.3s, box-shadow 0.3s;
            margin-bottom: 30px;
        }
        
        .bet-section:hover {
            box-shadow: 0 0 30px rgba(24, 231, 124, 0.25);
            transform: translateY(-2px);
        }
        
        .bet-section h3 {
            font-size: 22px;
            margin-bottom: 20px;
            color: var(--primary-color);
            text-transform: uppercase;
            letter-spacing: 1px;
            text-shadow: 0 0 10px rgba(24, 231, 124, 0.5);
        }
        
        .bet-controls {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 25px;
        }
        
        .bet-input {
            position: relative;
        }
        
        .bet-input label {
            display: block;
            margin-bottom: 10px;
            font-size: 14px;
            color: rgba(255, 255, 255, 0.8);
        }
        
        .bet-input input {
            width: 100%;
            padding: 12px 15px;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(24, 231, 124, 0.3);
            border-radius: 8px;
            color: var(--primary-color);
            font-size: 16px;
            font-weight: bold;
            transition: all 0.3s;
        }
        
        .bet-input input:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 10px rgba(24, 231, 124, 0.3);
        }
        
        .bet-shortcuts, .cap-shortcuts {
            display: flex;
            gap: 8px;
            margin-top: 10px;
        }
        
        .bet-shortcut, .cap-shortcut {
            flex: 1;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 5px;
            padding: 8px 5px;
            color: rgba(255, 255, 255, 0.9);
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s;
            text-align: center;
        }
        
        .bet-shortcut:hover, .cap-shortcut:hover {
            background: rgba(24, 231, 124, 0.2);
            border-color: rgba(24, 231, 124, 0.5);
            color: var(--primary-color);
        }
        
        .odds-display {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
            padding: 15px 20px;
            margin-bottom: 25px;
            border: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .odds-item {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .odds-item:last-child {
            border-bottom: none;
        }
        
        .odds-item span:last-child {
            color: var(--primary-color);
            font-weight: bold;
        }
        
        .game-button {
            width: 100%;
            background: linear-gradient(45deg, #16c96c, #18e77c);
            color: var(--secondary-color);
            border: none;
            border-radius: 8px;
            padding: 15px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            letter-spacing: 1px;
            position: relative;
            overflow: hidden;
            transition: all 0.3s;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
        
        .game-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 7px 20px rgba(0, 0, 0, 0.3);
        }
        
        .game-button:active {
            transform: translateY(1px);
        }
        
        .game-button::after {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(transparent, rgba(255, 255, 255, 0.1), transparent);
            transform: rotate(30deg);
            transition: transform 0.5s;
        }
        
        .game-button:hover::after {
            transform: rotate(30deg) translate(50%, 50%);
        }
        
        .result-section {
            background: rgba(12, 14, 26, 0.9);
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 0 30px rgba(24, 231, 124, 0.2);
            border: 1px solid rgba(24, 231, 124, 0.3);
            animation: pop-in 0.5s;
        }
        
        .result-header {
            background: linear-gradient(45deg, rgba(28, 31, 48, 0.9), rgba(12, 14, 26, 0.9));
            padding: 15px 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .result-header h3 {
            color: var(--primary-color);
            font-size: 20px;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 1px;
            text-shadow: 0 0 10px rgba(24, 231, 124, 0.5);
        }
        
        .result-content {
            padding: 25px;
        }
        
        .result-display {
            text-align: center;
            margin-bottom: 25px;
        }
        
        .result-text {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 15px;
            text-shadow: 0 0 10px rgba(24, 231, 124, 0.5);
        }
        
        .result-amount {
            font-size: 36px;
            font-weight: bold;
            text-align: center;
            margin: 25px 0;
            text-shadow: 0 0 15px currentColor;
        }
        
        .result-stats {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
            padding: 15px 20px;
            margin: 20px 0;
            border: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .stat-item {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .stat-item:last-child {
            border-bottom: none;
        }
        
        .stat-item span:last-child {
            color: var(--primary-color);
            font-weight: bold;
        }
        
        .game-history {
            background: rgba(12, 14, 26, 0.8);
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 0 20px rgba(24, 231, 124, 0.15);
            border: 1px solid rgba(24, 231, 124, 0.2);
            margin-top: 30px;
        }
        
        .game-history h2 {
            color: var(--primary-color);
            font-size: 22px;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 1px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .game-history h2::before {
            content: '';
            display: block;
            width: 5px;
            height: 25px;
            background: var(--primary-color);
            border-radius: 3px;
            box-shadow: 0 0 10px rgba(24, 231, 124, 0.7);
        }
        
        .history-table {
            overflow-x: auto;
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .history-table table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .history-table th {
            background: rgba(0, 0, 0, 0.3);
            color: var(--primary-color);
            padding: 15px;
            text-align: left;
            font-weight: 600;
            font-size: 14px;
            border-bottom: 2px solid rgba(24, 231, 124, 0.3);
        }
        
        .history-table td {
            padding: 12px 15px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            font-size: 14px;
        }
        
        .history-table tr:last-child td {
            border-bottom: none;
        }
        
        .history-table tr:hover td {
            background: rgba(255, 255, 255, 0.03);
        }
        
        .pulse-animation {
            animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
            0% {
                box-shadow: 0 0 0 0 rgba(24, 231, 124, 0.5);
            }
            70% {
                box-shadow: 0 0 0 10px rgba(24, 231, 124, 0);
            }
            100% {
                box-shadow: 0 0 0 0 rgba(24, 231, 124, 0);
            }
        }
        
        @keyframes pulse-fast {
            0% {
                opacity: 1;
                transform: scale(1);
            }
            50% {
                opacity: 0.7;
                transform: scale(1.1);
            }
            100% {
                opacity: 1;
                transform: scale(1);
            }
        }
        
        @keyframes glow-soft {
            0% {
                box-shadow: 0 0 5px rgba(24, 231, 124, 0.2);
            }
            100% {
                box-shadow: 0 0 15px rgba(24, 231, 124, 0.4);
            }
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes pop-in {
            0% {
                opacity: 0;
                transform: scale(0.9);
            }
            40% {
                opacity: 1;
                transform: scale(1.03);
            }
            100% {
                transform: scale(1);
            }
        }
        
        .fade-in {
            animation: fadeIn 0.5s forwards;
        }
        
        .floating-multiplier {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #18e77c;
            font-size: 32px;
            font-weight: bold;
            text-shadow: 0 0 10px rgba(24, 231, 124, 0.8);
            animation: float-up 1.5s ease-out forwards;
            pointer-events: none;
            z-index: 30;
        }
        
        @keyframes float-up {
            0% {
                opacity: 0;
                transform: translate(-50%, -50%) scale(0.8);
            }
            20% {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1.2);
            }
            100% {
                opacity: 0;
                transform: translate(-50%, -200%) scale(1);
            }
        }
        
        .empty-history {
            text-align: center;
            padding: 40px 0 !important;
        }
        
        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
            opacity: 0.7;
        }
        
        .empty-state i {
            font-size: 32px;
            color: var(--primary-color);
            opacity: 0.7;
        }
        
        .empty-state p {
            font-size: 16px;
        }
        
        .game-loading {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background: rgba(12, 14, 26, 0.8);
            z-index: 50;
            color: var(--primary-color);
        }
        
        .game-loading .loading-spinner {
            width: 50px;
            height: 50px;
            border: 4px solid rgba(24, 231, 124, 0.3);
            border-top: 4px solid var(--primary-color);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
        }
        
        .game-loading p {
            font-size: 18px;
            font-weight: bold;
            text-shadow: 0 0 10px rgba(24, 231, 124, 0.5);
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    
    // Add CSS to the page
    const styleElement = document.createElement('style');
    styleElement.textContent = gameCSS;
    document.head.appendChild(styleElement);
}); 