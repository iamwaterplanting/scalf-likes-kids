// BetaGames Leaderboard
console.log('Leaderboard module loaded');

document.addEventListener('DOMContentLoaded', () => {
    // Initialize leaderboard
    initLeaderboard();
});

// Initialize the leaderboard
async function initLeaderboard() {
    // Check if the leaderboard element exists
    const leaderboardList = document.getElementById('leaderboardList');
    if (!leaderboardList) return;
    
    console.log('Initializing leaderboard');
    
    // Load leaderboard data
    await loadLeaderboard();
    
    // Refresh leaderboard data every 2 minutes
    setInterval(loadLeaderboard, 120000);
}

// Load leaderboard data from Supabase
async function loadLeaderboard() {
    try {
        console.log('Loading leaderboard data');
        const leaderboardList = document.getElementById('leaderboardList');
        
        // Show loading state
        leaderboardList.innerHTML = '<li class="leaderboard-loading">Loading top players...</li>';
        
        // Fetch top 10 users ordered by balance
        const { data, error } = await window.SupabaseDB
            .from('profiles')
            .select('username, balance, avatar_url')
            .order('balance', { ascending: false })
            .limit(10);
            
        if (error) throw error;
        
        console.log('Leaderboard data:', data);
        
        // If no data, show message
        if (!data || data.length === 0) {
            leaderboardList.innerHTML = '<li class="leaderboard-loading">No players found</li>';
            return;
        }
        
        // Clear the list
        leaderboardList.innerHTML = '';
        
        // Add each player to the leaderboard
        data.forEach((player, index) => {
            const rank = index + 1;
            const avatarUrl = player.avatar_url || '../assets/default-avatar.svg';
            
            // Check if user is owner
            const isOwner = window.BetaAdmin && window.BetaAdmin.isOwner && window.BetaAdmin.isOwner(player.username);
            
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <div class="player-rank rank-${rank}">${rank}</div>
                <img src="${avatarUrl}" alt="${player.username}" class="player-avatar">
                <div class="player-info">
                    <div class="player-name">
                        ${player.username}
                        ${isOwner ? '<i class="fas fa-crown" style="color: gold; margin-left: 5px; font-size: 0.8em;"></i>' : ''}
                    </div>
                    <div class="player-balance">${player.balance.toLocaleString()} coins</div>
                </div>
            `;
            
            leaderboardList.appendChild(listItem);
        });
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        
        // Show error message
        const leaderboardList = document.getElementById('leaderboardList');
        if (leaderboardList) {
            leaderboardList.innerHTML = '<li class="leaderboard-loading">Failed to load leaderboard</li>';
        }
    }
}

// Mock data for testing (will be replaced with real data from Supabase)
function loadMockLeaderboardData() {
    const leaderboardList = document.getElementById('leaderboardList');
    if (!leaderboardList) return;
    
    const mockPlayers = [
        { username: 'CasinoKing', balance: 25680, avatar_url: '../assets/default-avatar.svg' },
        { username: 'BigWinner', balance: 18450, avatar_url: '../assets/default-avatar.svg' },
        { username: 'LuckyGuy', balance: 12750, avatar_url: '../assets/default-avatar.svg' },
        { username: 'PlinkoMaster', balance: 9840, avatar_url: '../assets/default-avatar.svg' },
        { username: 'Player123', balance: 7520, avatar_url: '../assets/default-avatar.svg' },
        { username: 'GamblerPro', balance: 6320, avatar_url: '../assets/default-avatar.svg' },
        { username: 'BetaChamp', balance: 4890, avatar_url: '../assets/default-avatar.svg' },
        { username: 'RollTheNice', balance: 3750, avatar_url: '../assets/default-avatar.svg' },
        { username: 'SlotKing', balance: 2430, avatar_url: '../assets/default-avatar.svg' },
        { username: 'WinnerAlways', balance: 1280, avatar_url: '../assets/default-avatar.svg' }
    ];
    
    // Clear the list
    leaderboardList.innerHTML = '';
    
    // Add each player to the leaderboard
    mockPlayers.forEach((player, index) => {
        const rank = index + 1;
        
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <div class="player-rank rank-${rank}">${rank}</div>
            <img src="${player.avatar_url}" alt="${player.username}" class="player-avatar">
            <div class="player-info">
                <div class="player-name">${player.username}</div>
                <div class="player-balance">${player.balance.toLocaleString()} coins</div>
            </div>
        `;
        
        leaderboardList.appendChild(listItem);
    });
}

// Export functions for global access
window.BetaLeaderboard = {
    refresh: loadLeaderboard
}; 