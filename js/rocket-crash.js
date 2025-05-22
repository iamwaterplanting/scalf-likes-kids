// BetaGames Rocket Crash Game Implementation
document.addEventListener('DOMContentLoaded', () => {
    // Game elements
    const canvas = document.getElementById('rocketCanvas');
    const ctx = canvas.getContext('2d');
    const betAmountInput = document.getElementById('betAmount');
    const autoCashoutInput = document.getElementById('autoCashout');
    const betButton = document.getElementById('betButton');
    const cashoutButton = document.getElementById('cashoutButton');
    const multiplierDisplay = document.getElementById('multiplierDisplay');
    const activeBetsList = document.getElementById('activeBetsList');
    const gameHistoryBody = document.getElementById('gameHistoryBody');
    const rocketBoard = document.querySelector('.rocket-board');
    
    // Game state
    let gameState = {
        isPlaying: false,
        gameActive: false,
        currentMultiplier: 1.00,
        gameHistory: [],
        activeBets: [],
        rocket: {
            x: 0,
            y: 0,
            width: 50,
            height: 100,
            angle: 0,
            scale: 1
        },
        particles: [],
        stars: [],
        crashChance: 0.005, // Initial chance of crashing per frame (increases over time)
        maxMultiplier: 100, // Maximum possible multiplier
        updateInterval: null,
        houseEdge: 0.04 // 4% house edge
    };
    
    // Initialize the game
    initGame();
    
    function initGame() {
        // Setup canvas size
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        // Setup event listeners
        betButton.addEventListener('click', handleBet);
        cashoutButton.addEventListener('click', handleCashout);
        
        // Setup bet amount shortcuts
        setupBetShortcuts();
        
        // Initialize stars
        initStars();
        
        // Draw initial state
        draw();
        
        // Load game history with some sample data
        loadGameHistory();
        
        // Start game loop
        startGameLoop();
    }
    
    function resizeCanvas() {
        if (rocketBoard) {
            const containerWidth = rocketBoard.clientWidth;
            const containerHeight = rocketBoard.clientHeight;
            
            // Make canvas fill the container
            canvas.width = containerWidth;
            canvas.height = containerHeight;
            
            // Position rocket in the bottom center
            gameState.rocket.x = containerWidth / 2;
            gameState.rocket.y = containerHeight - 120;
        }
    }
    
    function setupBetShortcuts() {
        const shortcuts = document.querySelectorAll('.bet-shortcut');
        shortcuts.forEach(shortcut => {
            shortcut.addEventListener('click', () => {
                const value = shortcut.dataset.value;
                const currentUser = window.BetaAuth?.getCurrentUser();
                
                if (value === 'max' && currentUser) {
                    betAmountInput.value = currentUser.balance || 100;
                } else if (value === '½') {
                    betAmountInput.value = (parseFloat(betAmountInput.value) / 2).toFixed(2);
                } else {
                    betAmountInput.value = value;
                }
            });
        });
    }
    
    function initStars() {
        // Create background stars
        gameState.stars = [];
        const starCount = 100;
        
        for (let i = 0; i < starCount; i++) {
            gameState.stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 0.5 + 0.1,
                opacity: Math.random() * 0.8 + 0.2
            });
        }
    }
    
    function startGameLoop() {
        // Start a new game every 5 seconds if not already active
        setInterval(() => {
            if (!gameState.gameActive) {
                startNewGame();
            }
        }, 5000);
    }
    
    function startNewGame() {
        gameState.gameActive = true;
        gameState.currentMultiplier = 1.00;
        gameState.particles = [];
        
        // Reset rocket position
        gameState.rocket.y = canvas.height - 120;
        gameState.rocket.scale = 1;
        gameState.rocket.angle = 0;
        
        // Update UI
        updateMultiplierDisplay();
        
        // Enable bet button, disable cashout
        betButton.disabled = false;
        cashoutButton.style.display = 'none';
        
        // Determine crash point based on house edge
        // We use a realistic approach where the expected value with house edge
        const crashPoint = generateCrashPoint();
        
        // Start multiplier update loop
        let lastTimestamp = performance.now();
        const updateMultiplier = (timestamp) => {
            // Calculate delta time for smooth animation
            const deltaTime = timestamp - lastTimestamp;
            lastTimestamp = timestamp;
            
            // Increase multiplier with delta time to maintain consistent speed
            // We use exponential growth for the multiplier to make it more exciting
            const growthRate = 0.5; // Adjust for speed
            const increment = (deltaTime / 1000) * growthRate * gameState.currentMultiplier;
            gameState.currentMultiplier += increment;
            
            // Limit to max multiplier
            if (gameState.currentMultiplier > gameState.maxMultiplier) {
                gameState.currentMultiplier = gameState.maxMultiplier;
            }
            
            // Check if we've reached the crash point
            if (gameState.currentMultiplier >= crashPoint) {
                handleCrash();
                return;
            }
            
            // Update rocket position and scale
            updateRocket(deltaTime);
            
            // Update UI
            updateMultiplierDisplay();
            
            // Check auto cashouts
            checkAutoCashouts();
            
            // Create particles
            createRocketParticles();
            
            // Draw game
            draw();
            
            // Continue animation if game is still active
            if (gameState.gameActive) {
                gameState.animationFrame = requestAnimationFrame(updateMultiplier);
            }
        };
        
        // Start the animation
        gameState.animationFrame = requestAnimationFrame(updateMultiplier);
    }
    
    function generateCrashPoint() {
        // Generate a crash point with a house edge
        // The formula ensures the expected value is (1 - houseEdge)
        const houseEdge = gameState.houseEdge;
        const r = Math.random();
        
        if (r < houseEdge) {
            // Force early crash for house edge percentage of games
            return 1.00; // Instant crash
        }
        
        // Generate using a distribution that gives an expected value of 1
        // We use an exponential distribution
        const lambda = Math.log(1 / (1 - houseEdge));
        const result = Math.exp(r * lambda) / (1 - houseEdge);
        
        // Round to 2 decimal places
        return Math.floor(result * 100) / 100;
    }
    
    function updateRocket(deltaTime) {
        // Update rocket y position
        const speedFactor = 0.05;
        gameState.rocket.y -= speedFactor * deltaTime * (1 + Math.log10(gameState.currentMultiplier));
        
        // Add slight rotation based on multiplier
        gameState.rocket.angle = Math.sin(gameState.currentMultiplier * 0.05) * 0.1;
        
        // Scale rocket based on distance from bottom
        const distanceFromBottom = canvas.height - gameState.rocket.y;
        const scaleFactor = 1 - distanceFromBottom / canvas.height * 0.5;
        gameState.rocket.scale = Math.max(0.5, scaleFactor);
    }
    
    function createRocketParticles() {
        // Add new particles
        if (Math.random() < 0.3) {
            const rocketBottomX = gameState.rocket.x;
            const rocketBottomY = gameState.rocket.y + gameState.rocket.height * 0.5 * gameState.rocket.scale;
            
            gameState.particles.push({
                x: rocketBottomX + (Math.random() - 0.5) * 20 * gameState.rocket.scale,
                y: rocketBottomY,
                radius: Math.random() * 5 + 2,
                color: Math.random() < 0.7 ? '#ff4b2b' : '#ff9d00',
                alpha: 1,
                vx: (Math.random() - 0.5) * 2,
                vy: Math.random() * 2 + 1,
                life: Math.random() * 40 + 20
            });
        }
        
        // Update existing particles
        for (let i = 0; i < gameState.particles.length; i++) {
            const particle = gameState.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.alpha -= 0.02;
            particle.life--;
            
            // Remove dead particles
            if (particle.life <= 0 || particle.alpha <= 0) {
                gameState.particles.splice(i, 1);
                i--;
            }
        }
    }
    
    function updateMultiplierDisplay() {
        multiplierDisplay.textContent = gameState.currentMultiplier.toFixed(2) + 'x';
    }
    
    function checkAutoCashouts() {
        // Check if any active bets should auto cashout
        for (let i = 0; i < gameState.activeBets.length; i++) {
            const bet = gameState.activeBets[i];
            
            if (!bet.cashedOut && bet.autoCashout <= gameState.currentMultiplier) {
                cashoutBet(bet, true);
            }
        }
    }
    
    function handleBet() {
        // Validate user is logged in
        const currentUser = window.BetaAuth?.getCurrentUser();
        if (!currentUser) {
            alert('Please login to play!');
            return;
        }
        
        // Get bet amount
        const betAmount = parseFloat(betAmountInput.value);
        const autoCashout = parseFloat(autoCashoutInput.value);
        
        // Validate bet amount
        if (isNaN(betAmount) || betAmount <= 0) {
            alert('Please enter a valid bet amount.');
            return;
        }
        
        if (betAmount > currentUser.balance) {
            alert('Not enough coins in your balance.');
            return;
        }
        
        // Validate auto cashout
        if (isNaN(autoCashout) || autoCashout < 1.01) {
            alert('Auto cashout must be at least 1.01x.');
            return;
        }
        
        // Deduct bet amount from balance
        window.BetaAuth.updateBalance(-betAmount, 'Rocket Crash Bet');
        
        // Create bet object
        const bet = {
            user: currentUser.username,
            amount: betAmount,
            autoCashout: autoCashout,
            cashedOut: false,
            cashoutMultiplier: null,
            profit: null,
            timestamp: new Date()
        };
        
        // Add to active bets
        gameState.activeBets.push(bet);
        
        // Update UI
        updateActiveBetsList();
        
        // Disable bet button, enable cashout
        betButton.disabled = true;
        cashoutButton.style.display = 'block';
    }
    
    function handleCashout() {
        // Find the user's active bet
        const currentUser = window.BetaAuth?.getCurrentUser();
        if (!currentUser) return;
        
        const userBet = gameState.activeBets.find(bet => 
            bet.user === currentUser.username && !bet.cashedOut
        );
        
        if (userBet) {
            cashoutBet(userBet, false);
        }
    }
    
    function cashoutBet(bet, isAuto) {
        // Mark bet as cashed out
        bet.cashedOut = true;
        bet.cashoutMultiplier = gameState.currentMultiplier;
        
        // Calculate profit
        const payout = bet.amount * bet.cashoutMultiplier;
        bet.profit = payout - bet.amount;
        
        // Update user balance
        window.BetaAuth?.updateBalance(payout, 'Rocket Crash Win');
        
        // Add to history
        gameState.gameHistory.unshift({
            user: bet.user,
            betAmount: bet.amount,
            multiplier: bet.cashoutMultiplier,
            payout: bet.profit,
            time: new Date()
        });
        
        // Keep history at a reasonable size
        if (gameState.gameHistory.length > 20) {
            gameState.gameHistory.pop();
        }
        
        // Update history table
        updateHistoryTable();
        
        // Update UI
        updateActiveBetsList();
        
        // Reset UI for current user
        const currentUser = window.BetaAuth?.getCurrentUser();
        if (currentUser && bet.user === currentUser.username) {
            betButton.disabled = false;
            cashoutButton.style.display = 'none';
        }
        
        // Display cashout notification
        showCashoutNotification(bet);
    }
    
    function handleCrash() {
        // Game crashed
        gameState.gameActive = false;
        
        // Cancel animation
        if (gameState.animationFrame) {
            cancelAnimationFrame(gameState.animationFrame);
            gameState.animationFrame = null;
        }
        
        // Mark all remaining bets as crashed
        for (const bet of gameState.activeBets) {
            if (!bet.cashedOut) {
                bet.cashedOut = true;
                bet.cashoutMultiplier = 0;
                bet.profit = -bet.amount;
                
                // Add to history
                gameState.gameHistory.unshift({
                    user: bet.user,
                    betAmount: bet.amount,
                    multiplier: 0,
                    payout: -bet.amount,
                    time: new Date()
                });
            }
        }
        
        // Update history table
        updateHistoryTable();
        
        // Show crash animation
        showCrashAnimation();
        
        // Reset active bets
        gameState.activeBets = [];
        updateActiveBetsList();
        
        // Reset UI for current user
        betButton.disabled = false;
        cashoutButton.style.display = 'none';
    }
    
    function showCrashAnimation() {
        // Add explosion particles
        const explosionCount = 50;
        const rocketX = gameState.rocket.x;
        const rocketY = gameState.rocket.y;
        
        for (let i = 0; i < explosionCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            
            gameState.particles.push({
                x: rocketX + (Math.random() - 0.5) * 30,
                y: rocketY + (Math.random() - 0.5) * 30,
                radius: Math.random() * 8 + 3,
                color: Math.random() < 0.6 ? '#ff4b2b' : '#ff9d00',
                alpha: 1,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: Math.random() * 60 + 20
            });
        }
        
        // Explosion animation
        const animateExplosion = () => {
            // Update particles
            for (let i = 0; i < gameState.particles.length; i++) {
                const particle = gameState.particles[i];
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.alpha -= 0.01;
                particle.life--;
                
                // Apply gravity to particles
                particle.vy += 0.05;
                
                // Remove dead particles
                if (particle.life <= 0 || particle.alpha <= 0) {
                    gameState.particles.splice(i, 1);
                    i--;
                }
            }
            
            // Draw explosion
            draw();
            
            // Continue animation if particles still exist
            if (gameState.particles.length > 0) {
                requestAnimationFrame(animateExplosion);
            }
        };
        
        // Start explosion animation
        animateExplosion();
        
        // Show crash multiplier
        multiplierDisplay.textContent = 'CRASH @ ' + gameState.currentMultiplier.toFixed(2) + 'x';
        multiplierDisplay.style.color = '#ff4b2b';
        
        // Reset display after a delay
        setTimeout(() => {
            multiplierDisplay.style.color = '#fff';
        }, 3000);
    }
    
    function showCashoutNotification(bet) {
        // Create notification
        const notification = document.createElement('div');
        notification.className = 'cashout-notification';
        notification.innerHTML = `
            <strong>${bet.user}</strong> cashed out at <strong>${bet.cashoutMultiplier.toFixed(2)}x</strong>
            <span class="profit">+${bet.profit.toFixed(2)}</span>
        `;
        
        // Style notification
        notification.style.position = 'absolute';
        notification.style.left = '20px';
        notification.style.top = '20%';
        notification.style.background = 'rgba(24, 231, 124, 0.8)';
        notification.style.padding = '10px 15px';
        notification.style.borderRadius = '5px';
        notification.style.color = '#fff';
        notification.style.fontWeight = 'bold';
        notification.style.zIndex = '10';
        notification.style.opacity = '0';
        notification.style.transition = 'all 0.3s ease';
        
        // Add to board
        rocketBoard.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(10px)';
        }, 10);
        
        // Remove after delay
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(0)';
            
            setTimeout(() => {
                rocketBoard.removeChild(notification);
            }, 300);
        }, 2000);
    }
    
    function updateActiveBetsList() {
        activeBetsList.innerHTML = '';
        
        if (gameState.activeBets.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-bets-message';
            emptyMessage.textContent = 'No active bets';
            emptyMessage.style.color = 'rgba(255, 255, 255, 0.5)';
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.fontStyle = 'italic';
            emptyMessage.style.padding = '20px 0';
            activeBetsList.appendChild(emptyMessage);
            return;
        }
        
        for (const bet of gameState.activeBets) {
            const betItem = document.createElement('div');
            betItem.className = 'active-bet-item';
            
            const userInfo = document.createElement('div');
            userInfo.className = 'user-info';
            userInfo.textContent = bet.user;
            
            const betInfo = document.createElement('div');
            betInfo.className = 'bet-info';
            
            const betAmount = document.createElement('div');
            betAmount.className = 'bet-amount';
            betAmount.textContent = bet.amount.toFixed(2);
            
            const autoCashout = document.createElement('div');
            autoCashout.className = 'auto-cashout';
            autoCashout.textContent = 'Auto: ' + bet.autoCashout.toFixed(2) + 'x';
            autoCashout.style.fontSize = '12px';
            autoCashout.style.color = 'rgba(255, 255, 255, 0.7)';
            
            betInfo.appendChild(betAmount);
            betInfo.appendChild(autoCashout);
            
            betItem.appendChild(userInfo);
            betItem.appendChild(betInfo);
            
            if (bet.cashedOut) {
                betItem.style.opacity = '0.5';
                
                const cashoutInfo = document.createElement('div');
                cashoutInfo.className = 'cashout-info';
                cashoutInfo.textContent = bet.cashoutMultiplier.toFixed(2) + 'x';
                cashoutInfo.style.color = '#18e77c';
                cashoutInfo.style.fontWeight = 'bold';
                
                betItem.appendChild(cashoutInfo);
            }
            
            activeBetsList.appendChild(betItem);
        }
    }
    
    function updateHistoryTable() {
        gameHistoryBody.innerHTML = '';
        
        for (const item of gameState.gameHistory) {
            const row = document.createElement('tr');
            
            // User cell
            const userCell = document.createElement('td');
            userCell.textContent = item.user;
            
            // Bet amount cell
            const betCell = document.createElement('td');
            betCell.textContent = item.betAmount.toFixed(2);
            
            // Multiplier cell
            const multiplierCell = document.createElement('td');
            multiplierCell.textContent = item.multiplier.toFixed(2) + 'x';
            
            // Payout cell
            const payoutCell = document.createElement('td');
            payoutCell.textContent = (item.payout >= 0 ? '+' : '') + item.payout.toFixed(2);
            payoutCell.className = item.payout >= 0 ? 'win' : 'loss';
            
            // Time cell
            const timeCell = document.createElement('td');
            timeCell.textContent = formatTime(item.time);
            
            // Add cells to row
            row.appendChild(userCell);
            row.appendChild(betCell);
            row.appendChild(multiplierCell);
            row.appendChild(payoutCell);
            row.appendChild(timeCell);
            
            // Add row to table
            gameHistoryBody.appendChild(row);
        }
    }
    
    // Format time as relative string (e.g., "2m ago")
    function formatTime(date) {
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
    
    function loadGameHistory() {
        // Generate random history data
        const usernames = ['Player123', 'LuckyGuy', 'RocketMan', 'CrashKing', 'MoonShot'];
        
        // Get current user if available
        const currentUser = window.BetaAuth?.getCurrentUser();
        if (currentUser) {
            usernames.push(currentUser.username);
        }
        
        // Generate random history
        for (let i = 0; i < 10; i++) {
            const username = usernames[Math.floor(Math.random() * usernames.length)];
            const betAmount = Math.random() * 100 + 10;
            const multiplier = Math.random() < 0.3 ? 0 : (Math.random() * 10 + 1.01);
            const payout = multiplier === 0 ? -betAmount : betAmount * (multiplier - 1);
            
            gameState.gameHistory.push({
                user: username,
                betAmount,
                multiplier,
                payout,
                time: new Date(Date.now() - Math.random() * 3600000)
            });
        }
        
        // Sort by time (most recent first)
        gameState.gameHistory.sort((a, b) => b.time - a.time);
        
        // Update history table
        updateHistoryTable();
    }
    
    function draw() {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw background
        drawBackground();
        
        // Draw stars
        drawStars();
        
        // Draw particles
        drawParticles();
        
        // Draw rocket
        drawRocket();
    }
    
    function drawBackground() {
        // Draw gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#0d1321');
        gradient.addColorStop(1, '#1c2639');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    function drawStars() {
        // Update star positions
        for (const star of gameState.stars) {
            star.y += star.speed;
            
            // Reset stars that go off screen
            if (star.y > canvas.height) {
                star.y = 0;
                star.x = Math.random() * canvas.width;
            }
            
            // Draw star
            ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    function drawParticles() {
        // Draw all particles
        for (const particle of gameState.particles) {
            ctx.fillStyle = particle.color + Math.floor(particle.alpha * 255).toString(16).padStart(2, '0');
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    function drawRocket() {
        // Save current context
        ctx.save();
        
        // Translate to rocket position
        ctx.translate(gameState.rocket.x, gameState.rocket.y);
        
        // Rotate rocket
        ctx.rotate(gameState.rocket.angle);
        
        // Scale rocket
        ctx.scale(gameState.rocket.scale, gameState.rocket.scale);
        
        // Draw rocket body
        ctx.fillStyle = '#ff4b2b';
        ctx.beginPath();
        ctx.moveTo(0, -gameState.rocket.height / 2);
        ctx.lineTo(gameState.rocket.width / 2, gameState.rocket.height / 2);
        ctx.lineTo(-gameState.rocket.width / 2, gameState.rocket.height / 2);
        ctx.closePath();
        ctx.fill();
        
        // Draw rocket window
        ctx.fillStyle = '#1c2639';
        ctx.beginPath();
        ctx.arc(0, 0, gameState.rocket.width / 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw rocket fins
        ctx.fillStyle = '#ff9d00';
        
        // Left fin
        ctx.beginPath();
        ctx.moveTo(-gameState.rocket.width / 2, gameState.rocket.height / 3);
        ctx.lineTo(-gameState.rocket.width, gameState.rocket.height / 2);
        ctx.lineTo(-gameState.rocket.width / 2, gameState.rocket.height / 2);
        ctx.closePath();
        ctx.fill();
        
        // Right fin
        ctx.beginPath();
        ctx.moveTo(gameState.rocket.width / 2, gameState.rocket.height / 3);
        ctx.lineTo(gameState.rocket.width, gameState.rocket.height / 2);
        ctx.lineTo(gameState.rocket.width / 2, gameState.rocket.height / 2);
        ctx.closePath();
        ctx.fill();
        
        // Restore context
        ctx.restore();
    }
}); 