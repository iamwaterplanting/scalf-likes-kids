// BetaGames Animations and UI Effects
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all animations
    initAnimations();
    
    // Add additional glowing effects
    applyGlowEffects();
    
    // Create floating coins
    animateFloatingCoins();
    
    // Add hover effects to game cards
    enhanceGameCards();
    
    // Apply loading animations
    showLoadingAnimations();
});

// Initialize animations
function initAnimations() {
    // Add slide-in animation to elements with the class
    const slideElements = document.querySelectorAll('.slide-in');
    slideElements.forEach((element, index) => {
        // Stagger the animations
        setTimeout(() => {
            element.classList.add('animate-slide-in');
        }, index * 200);
    });
    
    // Start rotation animations
    const rotatingElements = document.querySelectorAll('.rotate-slow');
    rotatingElements.forEach(element => {
        element.classList.add('animate-rotate');
    });
    
    // Add floating animation
    const floatingElements = document.querySelectorAll('.floating');
    floatingElements.forEach((element, index) => {
        // Alternate floating directions
        element.style.animationDelay = `${index * 0.5}s`;
        element.classList.add('animate-float');
    });
    
    // Add spinning icon animation
    const spinningIcons = document.querySelectorAll('.spin-icon');
    spinningIcons.forEach(icon => {
        icon.classList.add('animate-spin');
    });
    
    // Add pulse animation
    const pulsingElements = document.querySelectorAll('.pulse-slow');
    pulsingElements.forEach((element, index) => {
        element.style.animationDelay = `${index * 0.3}s`;
        element.classList.add('animate-pulse-slow');
    });
    
    // Add bounce animation
    const bouncingElements = document.querySelectorAll('.bounce-slow');
    bouncingElements.forEach((element, index) => {
        element.style.animationDelay = `${index * 0.2}s`;
        element.classList.add('animate-bounce-slow');
    });
}

// Apply glow effects
function applyGlowEffects() {
    // Add glow to text elements
    const glowTextElements = document.querySelectorAll('.glow-text');
    glowTextElements.forEach(element => {
        element.classList.add('animate-glow-text');
    });
    
    // Add glow to boxes
    const glowBoxElements = document.querySelectorAll('.glow-box');
    glowBoxElements.forEach(element => {
        element.classList.add('animate-glow-box');
    });
    
    // Add hover glow to boxes
    const glowBoxHoverElements = document.querySelectorAll('.glow-box-hover');
    glowBoxHoverElements.forEach(element => {
        element.addEventListener('mouseenter', () => {
            element.classList.add('animate-glow-box-hover');
        });
        
        element.addEventListener('mouseleave', () => {
            element.classList.remove('animate-glow-box-hover');
        });
    });
    
    // Add glow to buttons
    const glowButtonElements = document.querySelectorAll('.glow-button');
    glowButtonElements.forEach(element => {
        element.classList.add('animate-glow-button');
    });
}

// Create and animate floating coins in the banner
function animateFloatingCoins() {
    const coinsContainer = document.querySelector('.floating-coins');
    
    if (!coinsContainer) return;
    
    // Create floating coin animation
    for (let i = 1; i <= 5; i++) {
        const coin = document.querySelector(`.coin${i}`);
        if (coin) {
            // Create inner HTML for coin
            coin.innerHTML = `
                <div class="coin-inner">
                    <div class="coin-front"></div>
                    <div class="coin-edge"></div>
                    <div class="coin-back"></div>
                </div>
            `;
            
            // Set random position and animation delay
            const randomX = Math.floor(Math.random() * 80) + 10; // 10-90%
            const randomY = Math.floor(Math.random() * 80) + 10; // 10-90%
            const randomDelay = Math.random() * 5; // 0-5s delay
            const randomDuration = 5 + Math.random() * 10; // 5-15s
            
            coin.style.left = `${randomX}%`;
            coin.style.top = `${randomY}%`;
            coin.style.animationDelay = `${randomDelay}s`;
            coin.style.animationDuration = `${randomDuration}s`;
        }
    }
}

// Enhance game cards with animations and effects
function enhanceGameCards() {
    const gameCards = document.querySelectorAll('.game-card');
    
    gameCards.forEach(card => {
        // Add parallax effect on mouse move
        card.addEventListener('mousemove', e => {
            const cardRect = card.getBoundingClientRect();
            const cardCenterX = cardRect.left + cardRect.width / 2;
            const cardCenterY = cardRect.top + cardRect.height / 2;
            
            const mouseX = e.clientX;
            const mouseY = e.clientY;
            
            // Calculate distance from center (normalized -1 to 1)
            const rotateY = ((mouseX - cardCenterX) / (cardRect.width / 2)) * 5;
            const rotateX = -((mouseY - cardCenterY) / (cardRect.height / 2)) * 5;
            
            // Apply transform
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
            
            // Add highlight based on mouse position
            const cardImage = card.querySelector('.card-image');
            if (cardImage) {
                const highlightX = ((mouseX - cardRect.left) / cardRect.width) * 100;
                const highlightY = ((mouseY - cardRect.top) / cardRect.height) * 100;
                cardImage.style.backgroundImage = `radial-gradient(circle at ${highlightX}% ${highlightY}%, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 60%)`;
            }
        });
        
        // Reset on mouse leave
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
            
            const cardImage = card.querySelector('.card-image');
            if (cardImage) {
                cardImage.style.backgroundImage = 'none';
            }
        });
        
        // Add click effect
        card.addEventListener('mousedown', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(0.98)';
        });
        
        card.addEventListener('mouseup', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1.05)';
        });
    });
}

// Add loading animations to simulate dynamic content loading
function showLoadingAnimations() {
    // Simulate loading data
    setTimeout(() => {
        const recentActivity = document.querySelector('.recent-activity');
        
        if (recentActivity) {
            // Add loading animation
            const loadingOverlay = document.createElement('div');
            loadingOverlay.className = 'loading-overlay';
            loadingOverlay.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>Loading latest activities...</p>
                </div>
            `;
            
            recentActivity.appendChild(loadingOverlay);
            
            // Remove loading animation after delay
            setTimeout(() => {
                loadingOverlay.classList.add('fade-out');
                
                setTimeout(() => {
                    loadingOverlay.remove();
                    
                    // Show new activity notification
                    const notification = document.createElement('div');
                    notification.className = 'new-data-notification slide-up';
                    notification.innerHTML = `
                        <i class="fas fa-bell"></i>
                        <span>New activity loaded!</span>
                    `;
                    
                    recentActivity.appendChild(notification);
                    
                    setTimeout(() => {
                        notification.classList.add('fade-out');
                        setTimeout(() => {
                            notification.remove();
                        }, 500);
                    }, 3000);
                }, 500);
            }, 1500);
        }
    }, 2000);
}

// Add CSS for advanced animations
const animationsCSS = `
    /* Slide-in animation */
    .slide-in {
        opacity: 0;
        transform: translateY(50px);
        transition: opacity 0.5s ease, transform 0.5s ease;
    }
    
    .animate-slide-in {
        opacity: 1;
        transform: translateY(0);
    }
    
    /* Rotation animation */
    .animate-rotate {
        animation: rotate 20s linear infinite;
    }
    
    @keyframes rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    
    /* Floating animation */
    .animate-float {
        animation: float 3s ease-in-out infinite alternate;
    }
    
    @keyframes float {
        from { transform: translateY(0px); }
        to { transform: translateY(-15px); }
    }
    
    /* Spinning icon animation */
    .animate-spin {
        animation: spin 8s linear infinite;
        display: inline-block;
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    
    /* Pulse animation */
    .animate-pulse-slow {
        animation: pulse-slow 2s ease-in-out infinite alternate;
    }
    
    @keyframes pulse-slow {
        from { transform: scale(1); }
        to { transform: scale(1.1); }
    }
    
    /* Bounce animation */
    .animate-bounce-slow {
        animation: bounce-slow 2s ease-in-out infinite alternate;
    }
    
    @keyframes bounce-slow {
        from { transform: translateY(0); }
        to { transform: translateY(-12px); }
    }
    
    /* Glow text animation */
    .animate-glow-text {
        text-shadow: 0 0 10px var(--primary-color), 0 0 20px var(--primary-color), 0 0 30px var(--primary-color);
        animation: glow-text 2s ease-in-out infinite alternate;
    }
    
    @keyframes glow-text {
        from { text-shadow: 0 0 5px var(--primary-color), 0 0 10px var(--primary-color); }
        to { text-shadow: 0 0 10px var(--primary-color), 0 0 20px var(--primary-color), 0 0 30px var(--primary-color); }
    }
    
    /* Glow box animation */
    .animate-glow-box {
        box-shadow: 0 0 10px rgba(24, 231, 124, 0.3);
        transition: box-shadow 0.3s ease;
    }
    
    /* Glow box hover animation */
    .animate-glow-box-hover {
        box-shadow: 0 0 15px rgba(24, 231, 124, 0.6), 0 0 30px rgba(24, 231, 124, 0.3);
        transform: translateY(-5px) scale(1.02);
    }
    
    /* Glow button animation */
    .animate-glow-button {
        position: relative;
        overflow: hidden;
        transition: all 0.3s ease;
    }
    
    .animate-glow-button:hover {
        box-shadow: 0 0 15px var(--primary-color);
    }
    
    .animate-glow-button:after {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: linear-gradient(to bottom right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%);
        transform: rotate(45deg);
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    .animate-glow-button:hover:after {
        animation: button-shine 1.5s ease;
    }
    
    @keyframes button-shine {
        0% { opacity: 0; transform: rotate(45deg) translateX(-100%); }
        50% { opacity: 0.7; }
        100% { opacity: 0; transform: rotate(45deg) translateX(100%); }
    }
    
    /* Floating coins */
    .featured-banner {
        position: relative;
        background: linear-gradient(135deg, #1c1f30 0%, #0c0e1a 100%);
        border-radius: 10px;
        padding: 40px;
        margin-bottom: 30px;
        overflow: hidden;
        min-height: 250px;
    }
    
    .banner-content {
        position: relative;
        z-index: 2;
        max-width: 600px;
    }
    
    .banner-content h2 {
        font-size: 48px;
        margin-bottom: 15px;
    }
    
    .banner-content p {
        font-size: 18px;
        margin-bottom: 25px;
        opacity: 0.8;
    }
    
    .banner-buttons {
        display: flex;
        gap: 15px;
        flex-wrap: wrap;
    }
    
    .btn-primary, .btn-secondary {
        display: inline-block;
        padding: 12px 25px;
        border-radius: 5px;
        font-weight: bold;
        text-decoration: none;
        transition: all 0.3s ease;
    }
    
    .btn-primary {
        background-color: var(--primary-color);
        color: var(--secondary-color);
    }
    
    .btn-secondary {
        background-color: transparent;
        border: 2px solid var(--primary-color);
        color: var(--primary-color);
    }
    
    .floating-coins {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1;
    }
    
    .coin {
        position: absolute;
        width: 40px;
        height: 40px;
        perspective: 700px;
        animation: coin-float 10s ease-in-out infinite alternate;
    }
    
    .coin-inner {
        position: relative;
        width: 100%;
        height: 100%;
        transform-style: preserve-3d;
        animation: coin-rotate 10s linear infinite;
    }
    
    .coin-front, .coin-back, .coin-edge {
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
    }
    
    .coin-front, .coin-back {
        background: #18e77c;
    }
    
    .coin-front {
        transform: translateZ(2px);
    }
    
    .coin-back {
        transform: translateZ(-2px);
    }
    
    .coin-edge {
        transform: rotateY(90deg);
        width: 4px;
        height: 100%;
        left: 50%;
        margin-left: -2px;
        background: linear-gradient(to right, #0fa656, #18e77c, #0fa656);
    }
    
    @keyframes coin-float {
        0% { transform: translateY(0) translateX(0); }
        50% { transform: translateY(-20px) translateX(10px); }
        100% { transform: translateY(20px) translateX(-10px); }
    }
    
    @keyframes coin-rotate {
        0% { transform: rotateY(0); }
        100% { transform: rotateY(360deg); }
    }
    
    /* Additional card styles */
    .margin-top {
        margin-top: 20px;
    }
    
    .coming-soon {
        position: relative;
        overflow: hidden;
    }
    
    .coming-soon .card-image {
        display: flex;
        justify-content: center;
        align-items: center;
    }
    
    .coming-soon .card-image i {
        font-size: 50px;
        color: var(--primary-color);
    }
    
    .coming-soon-badge {
        position: absolute;
        top: 10px;
        right: 10px;
        background-color: var(--primary-color);
        color: var(--secondary-color);
        padding: 5px 10px;
        border-radius: 3px;
        font-size: 12px;
        font-weight: bold;
    }
    
    /* Section titles */
    .section-title {
        position: relative;
        margin-bottom: 25px;
        padding-left: 15px;
        font-weight: 600;
    }
    
    .section-title:before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 5px;
        height: 100%;
        background: var(--primary-color);
        border-radius: 5px;
    }
    
    /* Loading animation */
    .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(12, 14, 26, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10;
        border-radius: 10px;
        transition: opacity 0.5s ease;
    }
    
    .loading-spinner {
        text-align: center;
    }
    
    .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid rgba(24, 231, 124, 0.3);
        border-top: 4px solid var(--primary-color);
        border-radius: 50%;
        margin: 0 auto 15px;
        animation: spin 1s linear infinite;
    }
    
    .new-data-notification {
        position: absolute;
        top: 20px;
        right: 20px;
        background-color: var(--primary-color);
        color: var(--secondary-color);
        padding: 10px 15px;
        border-radius: 5px;
        font-weight: bold;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        z-index: 10;
        transition: opacity 0.5s ease, transform 0.5s ease;
    }
    
    .slide-up {
        transform: translateY(20px);
        opacity: 0;
        animation: slide-up 0.5s ease forwards;
    }
    
    @keyframes slide-up {
        to { transform: translateY(0); opacity: 1; }
    }
    
    .fade-out {
        opacity: 0;
    }
`;

// Add the CSS to the page
const styleElement = document.createElement('style');
styleElement.textContent = animationsCSS;
document.head.appendChild(styleElement); 