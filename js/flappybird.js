// BetaGames Flappy Bird Implementation
let flappyBirdCanvas, flappyBirdCtx;
let flappyBirdGame = null;
let isFlappyPlaying = false;

document.addEventListener('DOMContentLoaded', () => {
    flappyBirdCanvas = document.getElementById('flappyBirdCanvas');
    if (!flappyBirdCanvas) return;
    
    flappyBirdCtx = flappyBirdCanvas.getContext('2d');
    
    // Set canvas size
    resizeFlappyCanvas();
    window.addEventListener('resize', resizeFlappyCanvas);
    
    // Initialize the game
    initFlappyBird();
    
    // Handle play button click
    const playFlappyBtn = document.getElementById('playFlappyBtn');
    if (playFlappyBtn) {
        playFlappyBtn.addEventListener('click', () => {
            startFlappyBird();
        });
    }
});

// Resize canvas to fit container
function resizeFlappyCanvas() {
    if (!flappyBirdCanvas) return;
    
    const container = flappyBirdCanvas.parentElement;
    flappyBirdCanvas.width = container.clientWidth;
    flappyBirdCanvas.height = container.clientHeight;
    
    // If game is running, update
    if (flappyBirdGame) {
        flappyBirdGame.width = flappyBirdCanvas.width;
        flappyBirdGame.height = flappyBirdCanvas.height;
    }
}

// Initialize game
function initFlappyBird() {
    // Create preview animation
    const previewAnimation = setInterval(() => {
        if (isFlappyPlaying) {
            clearInterval(previewAnimation);
            return;
        }
        
        // Draw background with gradient
        const gradient = flappyBirdCtx.createLinearGradient(0, 0, 0, flappyBirdCanvas.height);
        gradient.addColorStop(0, '#1c1f30');
        gradient.addColorStop(1, '#0c0e1a');
        flappyBirdCtx.fillStyle = gradient;
        flappyBirdCtx.fillRect(0, 0, flappyBirdCanvas.width, flappyBirdCanvas.height);
        
        // Draw some floating coins
        const time = Date.now() / 1000;
        for (let i = 0; i < 5; i++) {
            const x = flappyBirdCanvas.width * (0.2 + 0.15 * i);
            const y = flappyBirdCanvas.height * 0.5 + Math.sin(time + i) * 20;
            
            drawCoin(x, y, 15);
        }
        
        // Draw a bird that "breathes"
        const birdX = flappyBirdCanvas.width * 0.3;
        const birdY = flappyBirdCanvas.height * 0.5 + Math.sin(time * 2) * 10;
        
        drawBird(birdX, birdY, Math.sin(time * 5) * 0.2);
    }, 30);
}

// Start the actual game
function startFlappyBird() {
    if (isFlappyPlaying) return;
    isFlappyPlaying = true;
    
    // Hide the overlay
    const overlay = document.querySelector('.flappy-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
    }
    
    // Create a new game instance
    flappyBirdGame = new FlappyBirdGame();
    flappyBirdGame.start();
    
    // Add controls
    document.addEventListener('keydown', handleFlappyKeydown);
    flappyBirdCanvas.addEventListener('click', handleFlappyClick);
    flappyBirdCanvas.addEventListener('touchstart', handleFlappyTouch);
}

// Event handlers
function handleFlappyKeydown(e) {
    if (e.code === 'Space' && flappyBirdGame) {
        flappyBirdGame.flap();
    }
}

function handleFlappyClick() {
    if (flappyBirdGame) {
        flappyBirdGame.flap();
    }
}

function handleFlappyTouch(e) {
    e.preventDefault();
    if (flappyBirdGame) {
        flappyBirdGame.flap();
    }
}

// End the game
function endFlappyBird(score) {
    isFlappyPlaying = false;
    
    // Remove event listeners
    document.removeEventListener('keydown', handleFlappyKeydown);
    flappyBirdCanvas.removeEventListener('click', handleFlappyClick);
    flappyBirdCanvas.removeEventListener('touchstart', handleFlappyTouch);
    
    // Show the overlay again
    const overlay = document.querySelector('.flappy-overlay');
    if (overlay) {
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'auto';
    }
    
    // Award coins based on score
    if (score > 0 && window.BetaAuth) {
        const coinsEarned = score * 50; // 50 coins per point
        window.BetaAuth.updateBalance(coinsEarned, 'Flappy Bird');
        
        // Show reward
        alert(`You scored ${score} points and earned ${coinsEarned} coins!`);
    }
    
    // Reset the game
    flappyBirdGame = null;
    
    // Restart the preview animation
    initFlappyBird();
}

// Draw helpers
function drawCoin(x, y, radius) {
    flappyBirdCtx.beginPath();
    flappyBirdCtx.arc(x, y, radius, 0, Math.PI * 2);
    flappyBirdCtx.fillStyle = '#18e77c';
    flappyBirdCtx.fill();
    
    flappyBirdCtx.beginPath();
    flappyBirdCtx.arc(x, y, radius * 0.8, 0, Math.PI * 2);
    flappyBirdCtx.fillStyle = '#1c1f30';
    flappyBirdCtx.fill();
    
    flappyBirdCtx.beginPath();
    flappyBirdCtx.font = `${radius}px Arial`;
    flappyBirdCtx.fillStyle = '#18e77c';
    flappyBirdCtx.textAlign = 'center';
    flappyBirdCtx.textBaseline = 'middle';
    flappyBirdCtx.fillText('$', x, y);
}

function drawBird(x, y, rotation) {
    flappyBirdCtx.save();
    flappyBirdCtx.translate(x, y);
    flappyBirdCtx.rotate(rotation);
    
    // Body
    flappyBirdCtx.beginPath();
    flappyBirdCtx.arc(0, 0, 20, 0, Math.PI * 2);
    flappyBirdCtx.fillStyle = '#18e77c';
    flappyBirdCtx.fill();
    
    // Wing
    flappyBirdCtx.beginPath();
    flappyBirdCtx.ellipse(-5, 0, 10, 15, Math.PI / 3, 0, Math.PI * 2);
    flappyBirdCtx.fillStyle = '#0fa656';
    flappyBirdCtx.fill();
    
    // Eye
    flappyBirdCtx.beginPath();
    flappyBirdCtx.arc(8, -5, 5, 0, Math.PI * 2);
    flappyBirdCtx.fillStyle = 'white';
    flappyBirdCtx.fill();
    
    flappyBirdCtx.beginPath();
    flappyBirdCtx.arc(10, -5, 2, 0, Math.PI * 2);
    flappyBirdCtx.fillStyle = 'black';
    flappyBirdCtx.fill();
    
    // Beak
    flappyBirdCtx.beginPath();
    flappyBirdCtx.moveTo(15, 0);
    flappyBirdCtx.lineTo(25, -5);
    flappyBirdCtx.lineTo(25, 5);
    flappyBirdCtx.closePath();
    flappyBirdCtx.fillStyle = '#ff9900';
    flappyBirdCtx.fill();
    
    flappyBirdCtx.restore();
}

function drawPipe(x, topHeight, gapHeight) {
    const pipeWidth = 60;
    
    // Top pipe
    flappyBirdCtx.fillStyle = '#18e77c';
    flappyBirdCtx.fillRect(x, 0, pipeWidth, topHeight);
    
    // Top pipe cap
    flappyBirdCtx.fillStyle = '#0fa656';
    flappyBirdCtx.fillRect(x - 5, topHeight - 20, pipeWidth + 10, 20);
    
    // Bottom pipe
    const bottomY = topHeight + gapHeight;
    flappyBirdCtx.fillStyle = '#18e77c';
    flappyBirdCtx.fillRect(x, bottomY, pipeWidth, flappyBirdCanvas.height - bottomY);
    
    // Bottom pipe cap
    flappyBirdCtx.fillStyle = '#0fa656';
    flappyBirdCtx.fillRect(x - 5, bottomY, pipeWidth + 10, 20);
}

// Flappy Bird Game Class
class FlappyBirdGame {
    constructor() {
        this.width = flappyBirdCanvas.width;
        this.height = flappyBirdCanvas.height;
        this.bird = {
            x: this.width * 0.3,
            y: this.height * 0.5,
            velocity: 0,
            rotation: 0
        };
        this.pipes = [];
        this.coins = [];
        this.gravity = 0.5;
        this.flapStrength = -10;
        this.pipeGap = 150;
        this.pipeWidth = 60;
        this.pipeInterval = 120; // Frames between new pipes
        this.frameCount = 0;
        this.score = 0;
        this.gameOver = false;
        this.pipesPassed = [];
    }
    
    start() {
        this.gameLoop = setInterval(() => {
            this.update();
            this.draw();
            
            if (this.gameOver) {
                clearInterval(this.gameLoop);
                endFlappyBird(this.score);
            }
        }, 16); // ~60fps
    }
    
    update() {
        if (this.gameOver) return;
        
        this.frameCount++;
        
        // Update bird
        this.bird.velocity += this.gravity;
        this.bird.y += this.bird.velocity;
        this.bird.rotation = Math.min(Math.PI / 2, Math.max(-Math.PI / 4, this.bird.velocity * 0.05));
        
        // Check if bird hits ground or ceiling
        if (this.bird.y + 20 > this.height || this.bird.y - 20 < 0) {
            this.gameOver = true;
            return;
        }
        
        // Generate pipes
        if (this.frameCount % this.pipeInterval === 0) {
            const topHeight = Math.floor(Math.random() * (this.height - this.pipeGap - 100)) + 50;
            
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
            pipe.x -= 2;
            
            // Check if pipe is off screen
            if (pipe.x + this.pipeWidth < 0) {
                this.pipes.splice(i, 1);
                continue;
            }
            
            // Check if bird passes pipe
            if (!pipe.passed && pipe.x + this.pipeWidth < this.bird.x) {
                pipe.passed = true;
                this.score++;
            }
            
            // Check for collision with pipe
            if (
                this.bird.x + 20 > pipe.x && 
                this.bird.x - 20 < pipe.x + this.pipeWidth && 
                (this.bird.y - 20 < pipe.topHeight || this.bird.y + 20 > pipe.topHeight + this.pipeGap)
            ) {
                this.gameOver = true;
                return;
            }
        }
        
        // Update coins and check collection
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            coin.x -= 2;
            
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
                this.score += 2; // Extra points for coins
            }
        }
    }
    
    draw() {
        // Clear canvas
        flappyBirdCtx.clearRect(0, 0, this.width, this.height);
        
        // Draw background
        const gradient = flappyBirdCtx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#1c1f30');
        gradient.addColorStop(1, '#0c0e1a');
        flappyBirdCtx.fillStyle = gradient;
        flappyBirdCtx.fillRect(0, 0, this.width, this.height);
        
        // Draw pipes
        for (const pipe of this.pipes) {
            drawPipe(pipe.x, pipe.topHeight, this.pipeGap);
        }
        
        // Draw coins
        for (const coin of this.coins) {
            drawCoin(coin.x, coin.y, coin.radius);
        }
        
        // Draw bird
        drawBird(this.bird.x, this.bird.y, this.bird.rotation);
        
        // Draw score
        flappyBirdCtx.font = '30px Arial';
        flappyBirdCtx.fillStyle = '#18e77c';
        flappyBirdCtx.textAlign = 'center';
        flappyBirdCtx.fillText(`Score: ${this.score}`, this.width / 2, 50);
    }
    
    flap() {
        if (this.gameOver) return;
        this.bird.velocity = this.flapStrength;
    }
} 