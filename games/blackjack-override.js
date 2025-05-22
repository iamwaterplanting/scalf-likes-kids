// Override script to replace Coming Soon message
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the blackjack page
    if (window.location.href.includes('blackjack')) {
        // Check if there's a Coming Soon message
        const comingSoonElements = document.querySelectorAll('h1, h2, h3, p');
        comingSoonElements.forEach(el => {
            if (el.textContent.includes('Coming Soon')) {
                // Found the Coming Soon container - find its parent
                let container = el;
                while (container && !container.classList.contains('game-container')) {
                    container = container.parentElement;
                }

                if (container) {
                    console.log('Found and replacing Coming Soon message');
                    // Replace with our actual blackjack UI
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
                }
            }
        });
    }
}); 