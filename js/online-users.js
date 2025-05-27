// BetaGames Online Users Tracker
console.log('Online users tracker loaded');

// Constants
const ONLINE_USERS_KEY = 'betagames_online_users';
const PRESENCE_TIMEOUT = 60 * 1000; // 60 seconds timeout
const UPDATE_INTERVAL = 10 * 1000; // Update every 10 seconds

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const onlineCountElement = document.querySelector('.online-count');
    if (!onlineCountElement) return;
    
    // Initialize online users count
    let onlineUsers = {};
    
    // Function to update the display
    function updateOnlineDisplay() {
        // Count users who were online in the last PRESENCE_TIMEOUT milliseconds
        const now = Date.now();
        const activeUsers = Object.values(onlineUsers).filter(lastSeen => 
            now - lastSeen < PRESENCE_TIMEOUT
        ).length;
        
        // Always show at least 1 user (the current user)
        const displayCount = Math.max(1, activeUsers);
        
        // Update the display
        onlineCountElement.textContent = displayCount;
    }
    
    // Generate a unique ID for this browser session
    const sessionId = generateSessionId();
    
    // Function to update user presence
    async function updatePresence() {
        try {
            // First, mark this user as online
            onlineUsers[sessionId] = Date.now();
            
            // Check if Supabase is available
            if (window.SupabaseDB) {
                // Get the current user
                const currentUser = window.BetaAuth?.getCurrentUser();
                const userData = {
                    id: sessionId,
                    session_id: sessionId,
                    last_seen: new Date().toISOString(),
                    username: currentUser ? currentUser.username : 'Guest'
                };
                
                // Update the online_users table
                const { error } = await window.SupabaseDB
                    .from('online_users')
                    .upsert(userData);
                    
                if (error) {
                    console.error('Error updating online status:', error);
                }
                
                // Listen for presence changes
                setupPresenceChannel();
            } else {
                // If Supabase is not available, use localStorage as fallback
                const storedUsers = localStorage.getItem(ONLINE_USERS_KEY);
                if (storedUsers) {
                    try {
                        onlineUsers = JSON.parse(storedUsers);
                    } catch (e) {
                        onlineUsers = {};
                    }
                }
                
                // Add this user
                onlineUsers[sessionId] = Date.now();
                
                // Store back to localStorage
                localStorage.setItem(ONLINE_USERS_KEY, JSON.stringify(onlineUsers));
            }
            
            // Update the display
            updateOnlineDisplay();
        } catch (error) {
            console.error('Error updating presence:', error);
        }
    }
    
    // Set up Supabase presence channel
    function setupPresenceChannel() {
        if (!window.SupabaseDB) return;
        
        // Listen for presence changes
        window.SupabaseDB
            .channel('online-users')
            .on('presence', { event: 'sync' }, () => {
                // Get all online users
                window.SupabaseDB
                    .from('online_users')
                    .select('session_id, last_seen')
                    .gt('last_seen', new Date(Date.now() - PRESENCE_TIMEOUT).toISOString())
                    .then(({ data, error }) => {
                        if (error) {
                            console.error('Error fetching online users:', error);
                            return;
                        }
                        
                        // Update our local state
                        onlineUsers = {};
                        if (data) {
                            data.forEach(user => {
                                onlineUsers[user.session_id] = new Date(user.last_seen).getTime();
                            });
                        }
                        
                        // Update the display
                        updateOnlineDisplay();
                    });
            })
            .subscribe();
    }
    
    // Generate a unique session ID
    function generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
    
    // Initial update
    updatePresence();
    
    // Set up interval for regular updates
    setInterval(updatePresence, UPDATE_INTERVAL);
    
    // Update on window focus
    window.addEventListener('focus', updatePresence);
    
    // Clean up on page unload
    window.addEventListener('beforeunload', async () => {
        if (window.SupabaseDB) {
            try {
                // Mark user as offline
                await window.SupabaseDB
                    .from('online_users')
                    .delete()
                    .eq('session_id', sessionId);
            } catch (e) {
                // Ignore errors during page unload
            }
        }
    });
}); 