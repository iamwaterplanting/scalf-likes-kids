// Aggressive override script to replace Coming Soon message
console.log('Blackjack override script loaded');

// Execute immediately and also after DOM loaded
function tryFixBlackjack() {
    console.log('Attempting to fix blackjack page - Current HTML:', document.body.innerHTML);
    
    // Log all elements that might contain "Coming Soon"
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
        if (el.textContent && el.textContent.includes('Coming Soon')) {
            console.log('Found Coming Soon in element:', el);
            console.log('Element HTML:', el.outerHTML);
            console.log('Parent element:', el.parentElement);
        }
    });
    
    // Look for specific elements in the current page structure
    const crown = document.querySelector('svg.crown') || document.querySelector('.crown') || document.querySelector('img[alt="crown"]');
    if (crown) {
        console.log('Found crown element:', crown);
    }
    
    // Try to find the game container or main content area
    const gameContainer = document.querySelector('.game-container') || 
                          document.querySelector('.main-content') || 
                          document.querySelector('main');
    
    if (gameContainer) {
        console.log('Found game container:', gameContainer);
        // Replace the entire container content
        gameContainer.innerHTML = `
        <h1 class="game-title">Blackjack</h1>
        
        <div class="blackjack-table">
            <div class="dealer-area">
                <span class="area-label">Dealer</span>
                <div class="score-display" id="dealerScore">0</div>
                <div class="hand" id="dealerHand"></div>
            </div>
            
            <div class="result-message" id="resultMessage"></div>
            
            <div class="player-area">
                <span class="area-label">Player</span>
                <div class="score-display show" id="playerScore">0</div>
                <div class="hand" id="playerHand"></div>
            </div>
            
            <div class="current-bet">
                <span class="current-bet-label">Current Bet:</span>
                <span class="current-bet-amount" id="betAmount">0</span>
            </div>
            
            <div class="bet-chips" id="betChips">
                <div class="chip chip-10" data-value="10">10</div>
                <div class="chip chip-25" data-value="25">25</div>
                <div class="chip chip-50" data-value="50">50</div>
                <div class="chip chip-100" data-value="100">100</div>
                <div class="chip chip-500" data-value="500">500</div>
            </div>
            
            <div class="game-controls">
                <button id="dealButton" class="action-btn btn-deal">
                    <i class="fas fa-play"></i> Deal Cards
                </button>
                
                <button id="hitButton" class="action-btn btn-hit" disabled>
                    <i class="fas fa-plus"></i> Hit
                </button>
                
                <button id="standButton" class="action-btn btn-stand" disabled>
                    <i class="fas fa-hand"></i> Stand
                </button>
                
                <button id="doubleButton" class="action-btn btn-double" disabled>
                    <i class="fas fa-arrow-up"></i> Double
                </button>
                
                <button id="newHandButton" class="action-btn btn-new-hand" style="display: none;">
                    <i class="fas fa-redo"></i> New Hand
                </button>
            </div>
        </div>
        
        <div class="game-stats">
            <div class="stat-item">
                <span class="stat-value" id="handsPlayed">0</span>
                <span class="stat-label">Hands Played</span>
            </div>
            <div class="stat-item">
                <span class="stat-value" id="handsWon">0</span>
                <span class="stat-label">Hands Won</span>
            </div>
            <div class="stat-item">
                <span class="stat-value" id="blackjacks">0</span>
                <span class="stat-label">Blackjacks</span>
            </div>
            <div class="stat-item">
                <span class="stat-value" id="totalProfit">0</span>
                <span class="stat-label">Total Profit</span>
            </div>
        </div>`;
        
        console.log('Replaced game container content');
        
        // Try to initialize blackjack game logic
        if (typeof initBlackjack === 'function') {
            console.log('Calling initBlackjack function');
            initBlackjack();
        }
    } else {
        console.log('Could not find game container to replace');
        
        // More aggressive approach - look for any content with "Coming Soon"
        const comingSoonContent = Array.from(document.querySelectorAll('*')).find(el => 
            el.textContent && el.textContent.includes('Coming Soon') && 
            el.textContent.includes('under development')
        );
        
        if (comingSoonContent) {
            console.log('Found Coming Soon content:', comingSoonContent);
            
            // Find a suitable parent to replace
            let container = comingSoonContent;
            // Try to go up a few levels to find a good container
            for (let i = 0; i < 3; i++) {
                if (container.parentElement) {
                    container = container.parentElement;
                }
            }
            
            console.log('Will replace this container:', container);
            
            // Replace the container
            container.innerHTML = `
            <h1 class="game-title">Blackjack</h1>
            
            <div class="blackjack-table">
                <div class="dealer-area">
                    <span class="area-label">Dealer</span>
                    <div class="score-display" id="dealerScore">0</div>
                    <div class="hand" id="dealerHand"></div>
                </div>
                
                <div class="result-message" id="resultMessage"></div>
                
                <div class="player-area">
                    <span class="area-label">Player</span>
                    <div class="score-display show" id="playerScore">0</div>
                    <div class="hand" id="playerHand"></div>
                </div>
                
                <div class="current-bet">
                    <span class="current-bet-label">Current Bet:</span>
                    <span class="current-bet-amount" id="betAmount">0</span>
                </div>
                
                <div class="bet-chips" id="betChips">
                    <div class="chip chip-10" data-value="10">10</div>
                    <div class="chip chip-25" data-value="25">25</div>
                    <div class="chip chip-50" data-value="50">50</div>
                    <div class="chip chip-100" data-value="100">100</div>
                    <div class="chip chip-500" data-value="500">500</div>
                </div>
                
                <div class="game-controls">
                    <button id="dealButton" class="action-btn btn-deal">
                        <i class="fas fa-play"></i> Deal Cards
                    </button>
                    
                    <button id="hitButton" class="action-btn btn-hit" disabled>
                        <i class="fas fa-plus"></i> Hit
                    </button>
                    
                    <button id="standButton" class="action-btn btn-stand" disabled>
                        <i class="fas fa-hand"></i> Stand
                    </button>
                    
                    <button id="doubleButton" class="action-btn btn-double" disabled>
                        <i class="fas fa-arrow-up"></i> Double
                    </button>
                    
                    <button id="newHandButton" class="action-btn btn-new-hand" style="display: none;">
                        <i class="fas fa-redo"></i> New Hand
                    </button>
                </div>
            </div>
            
            <div class="game-stats">
                <div class="stat-item">
                    <span class="stat-value" id="handsPlayed">0</span>
                    <span class="stat-label">Hands Played</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value" id="handsWon">0</span>
                    <span class="stat-label">Hands Won</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value" id="blackjacks">0</span>
                    <span class="stat-label">Blackjacks</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value" id="totalProfit">0</span>
                    <span class="stat-label">Total Profit</span>
                </div>
            </div>`;
            
            console.log('Replaced container with blackjack UI');
            
            // Try to initialize blackjack game
            if (typeof initBlackjack === 'function') {
                console.log('Calling initBlackjack function');
                initBlackjack();
            }
        }
    }
}

// Run immediately
tryFixBlackjack();

// Also run after DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, trying fix again');
    tryFixBlackjack();
    
    // Also try after a short delay in case other scripts run
    setTimeout(tryFixBlackjack, 500);
    setTimeout(tryFixBlackjack, 1000);
}); 