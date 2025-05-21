// BetaGames Admin Panel
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const adminContent = document.getElementById('adminContent');
    const accessDenied = document.getElementById('accessDenied');
    const adminCode = document.getElementById('adminCode');
    const redeemAdminBtn = document.getElementById('redeemAdminBtn');
    const adminUsername = document.getElementById('adminUsername');
    const adminTabs = document.querySelectorAll('.admin-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // User management elements
    const userSearchInput = document.getElementById('userSearchInput');
    const searchUserBtn = document.getElementById('searchUserBtn');
    const refreshUsersBtn = document.getElementById('refreshUsersBtn');
    const usersList = document.getElementById('usersList');
    const balanceUsername = document.getElementById('balanceUsername');
    const balanceAmount = document.getElementById('balanceAmount');
    const addBalanceBtn = document.getElementById('addBalanceBtn');
    
    // Bet history elements
    const betSearchInput = document.getElementById('betSearchInput');
    const gameFilter = document.getElementById('gameFilter');
    const resultFilter = document.getElementById('resultFilter');
    const filterBetsBtn = document.getElementById('filterBetsBtn');
    const refreshBetsBtn = document.getElementById('refreshBetsBtn');
    const betHistoryBody = document.getElementById('betHistoryBody');
    
    // Dashboard elements
    const totalUsers = document.getElementById('totalUsers');
    const onlineUsers = document.getElementById('onlineUsers');
    const totalBets = document.getElementById('totalBets');
    const houseProfit = document.getElementById('houseProfit');
    const refreshActivityBtn = document.getElementById('refreshActivityBtn');
    const recentActivityBody = document.getElementById('recentActivityBody');
    
    // Settings elements
    const addAdminUsername = document.getElementById('addAdminUsername');
    const addAdminBtn = document.getElementById('addAdminBtn');
    const houseEdge = document.getElementById('houseEdge');
    const updateEdgeBtn = document.getElementById('updateEdgeBtn');
    const maintenanceMode = document.getElementById('maintenanceMode');
    const updateMaintenanceBtn = document.getElementById('updateMaintenanceBtn');
    
    // Edit user modal elements
    const editUserModal = document.getElementById('editUserModal');
    const editUsername = document.getElementById('editUsername');
    const editBalance = document.getElementById('editBalance');
    const editStatus = document.getElementById('editStatus');
    const editUserForm = document.getElementById('editUserForm');
    
    // Local state
    let isAdmin = false;
    let allUsers = [];
    let allBets = [];
    
    // Check if user is admin
    function checkAdminStatus() {
        const currentUser = window.BetaAuth?.getCurrentUser();
        if (!currentUser) {
            showAccessDenied();
            return;
        }
        
        getAdminRights(currentUser.username)
            .then(isUserAdmin => {
                if (isUserAdmin) {
                    isAdmin = true;
                    showAdminPanel(currentUser.username);
                    loadDashboard();
                } else {
                    showAccessDenied();
                }
            })
            .catch(error => {
                console.error('Error checking admin status:', error);
                showAccessDenied();
            });
    }
    
    // Show admin panel
    function showAdminPanel(username) {
        if (accessDenied) accessDenied.style.display = 'none';
        if (adminContent) {
            adminContent.style.display = 'block';
            if (adminUsername) adminUsername.textContent = username;
        }
    }
    
    // Show access denied
    function showAccessDenied() {
        if (adminContent) adminContent.style.display = 'none';
        if (accessDenied) accessDenied.style.display = 'block';
    }
    
    // Check if user has admin rights
    async function getAdminRights(username) {
        try {
            const { data, error } = await window.SupabaseDB
                .from('admin_users')
                .select('*')
                .eq('username', username)
                .single();
                
            if (error && error.code !== 'PGRST116') throw error;
            
            return !!data;
        } catch (error) {
            console.error('Error checking admin rights:', error);
            return false;
        }
    }
    
    // Grant admin rights to a user
    async function grantAdminRights(username) {
        try {
            const { data, error } = await window.SupabaseDB
                .from('admin_users')
                .insert([{ username, granted_at: new Date().toISOString() }]);
                
            if (error) throw error;
            
            return true;
        } catch (error) {
            console.error('Error granting admin rights:', error);
            return false;
        }
    }
    
    // Load dashboard data
    async function loadDashboard() {
        // Load users count
        try {
            const { count: userCount, error: userError } = await window.SupabaseDB
                .from('users')
                .select('*', { count: 'exact', head: true });
                
            if (userError) throw userError;
            
            totalUsers.textContent = userCount || 0;
        } catch (error) {
            console.error('Error loading users count:', error);
        }
        
        // Load online users count
        try {
            // Consider users who were active in the last 10 minutes
            const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
            const { count: onlineCount, error: onlineError } = await window.SupabaseDB
                .from('user_sessions')
                .select('*', { count: 'exact', head: true })
                .gt('last_active', tenMinutesAgo);
                
            if (onlineError) throw onlineError;
            
            onlineUsers.textContent = onlineCount || 0;
        } catch (error) {
            console.error('Error loading online users count:', error);
        }
        
        // Load bets count
        try {
            const { count: betCount, error: betError } = await window.SupabaseDB
                .from('game_history')
                .select('*', { count: 'exact', head: true });
                
            if (betError) throw betError;
            
            totalBets.textContent = betCount || 0;
        } catch (error) {
            console.error('Error loading bets count:', error);
        }
        
        // Calculate house profit
        try {
            const { data: bets, error: betError } = await window.SupabaseDB
                .from('game_history')
                .select('bet, result');
                
            if (betError) throw betError;
            
            const profit = bets.reduce((sum, bet) => {
                return sum + bet.bet - bet.result;
            }, 0);
            
            houseProfit.textContent = new Intl.NumberFormat().format(profit);
        } catch (error) {
            console.error('Error calculating house profit:', error);
        }
        
        // Load recent activity
        loadRecentActivity();
    }
    
    // Load recent activity
    async function loadRecentActivity() {
        try {
            const { data: activities, error } = await window.SupabaseDB
                .from('game_history')
                .select('*')
                .order('time', { ascending: false })
                .limit(10);
                
            if (error) throw error;
            
            updateActivityTable(activities, recentActivityBody);
        } catch (error) {
            console.error('Error loading recent activity:', error);
        }
    }
    
    // Update activity table
    function updateActivityTable(activities, tableBody) {
        if (!tableBody) return;
        
        // Clear existing rows
        tableBody.innerHTML = '';
        
        if (!activities || activities.length === 0) {
            const emptyRow = document.createElement('tr');
            const emptyCell = document.createElement('td');
            emptyCell.colSpan = 5;
            emptyCell.textContent = 'No activity found';
            emptyCell.style.textAlign = 'center';
            emptyRow.appendChild(emptyCell);
            tableBody.appendChild(emptyRow);
            return;
        }
        
        // Add rows
        activities.forEach(activity => {
            const row = document.createElement('tr');
            
            // User cell
            const userCell = document.createElement('td');
            userCell.textContent = activity.user;
            
            // Game cell
            const gameCell = document.createElement('td');
            gameCell.textContent = activity.game;
            
            // Bet cell
            const betCell = document.createElement('td');
            betCell.textContent = formatCurrency(activity.bet);
            
            // Result cell
            const resultCell = document.createElement('td');
            resultCell.textContent = formatCurrency(activity.result);
            resultCell.style.color = activity.result >= activity.bet ? 'var(--success-color)' : 'var(--danger-color)';
            
            // Time cell
            const timeCell = document.createElement('td');
            timeCell.textContent = formatTime(new Date(activity.time));
            
            // Append cells to row
            row.appendChild(userCell);
            row.appendChild(gameCell);
            row.appendChild(betCell);
            row.appendChild(resultCell);
            row.appendChild(timeCell);
            
            // Add actions cell if it's the bet history table
            if (tableBody === betHistoryBody) {
                const actionsCell = document.createElement('td');
                const viewBtn = document.createElement('button');
                viewBtn.innerHTML = '<i class="fas fa-eye"></i>';
                viewBtn.title = 'View Details';
                viewBtn.addEventListener('click', () => {
                    alert(`Bet Details:\nUser: ${activity.user}\nGame: ${activity.game}\nBet: ${activity.bet}\nResult: ${activity.result}\nTime: ${new Date(activity.time).toLocaleString()}`);
                });
                actionsCell.appendChild(viewBtn);
                row.appendChild(actionsCell);
            }
            
            // Append row to table
            tableBody.appendChild(row);
        });
    }
    
    // Load users list
    async function loadUsers(searchTerm = '') {
        try {
            let query = window.SupabaseDB
                .from('users')
                .select('*');
                
            if (searchTerm) {
                query = query.ilike('username', `%${searchTerm}%`);
            }
            
            const { data: users, error } = await query;
            
            if (error) throw error;
            
            allUsers = users;
            updateUsersList(users);
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }
    
    // Update users list
    function updateUsersList(users) {
        if (!usersList) return;
        
        // Clear existing list
        usersList.innerHTML = '';
        
        if (!users || users.length === 0) {
            usersList.innerHTML = '<p style="text-align: center;">No users found</p>';
            return;
        }
        
        // Add user cards
        users.forEach(user => {
            const userCard = document.createElement('div');
            userCard.className = 'user-card';
            
            const userInfo = document.createElement('div');
            userInfo.className = 'user-info';
            userInfo.innerHTML = `
                <h3>${user.username}</h3>
                <p>Balance: ${formatCurrency(user.balance)}</p>
                <p>Created: ${formatTime(new Date(user.created_at))}</p>
            `;
            
            const userActions = document.createElement('div');
            userActions.className = 'user-actions';
            
            const editBtn = document.createElement('button');
            editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
            editBtn.addEventListener('click', () => {
                showEditUserModal(user);
            });
            
            userActions.appendChild(editBtn);
            userCard.appendChild(userInfo);
            userCard.appendChild(userActions);
            usersList.appendChild(userCard);
        });
    }
    
    // Show edit user modal
    function showEditUserModal(user) {
        if (!editUserModal) return;
        
        editUsername.value = user.username;
        editBalance.value = user.balance;
        editStatus.value = user.status || 'active';
        
        editUserModal.style.display = 'flex';
    }
    
    // Add balance to user
    async function addBalance(username, amount) {
        try {
            // Get current user
            const { data: user, error: userError } = await window.SupabaseDB
                .from('users')
                .select('balance')
                .eq('username', username)
                .single();
                
            if (userError) throw userError;
            
            // Calculate new balance
            const newBalance = user.balance + amount;
            
            // Update balance
            const { data: updatedUser, error: updateError } = await window.SupabaseDB
                .from('users')
                .update({ balance: newBalance })
                .eq('username', username)
                .select()
                .single();
                
            if (updateError) throw updateError;
            
            alert(`Added ${amount} coins to ${username}. New balance: ${newBalance}`);
            return true;
        } catch (error) {
            console.error('Error adding balance:', error);
            alert(`Error adding balance: ${error.message}`);
            return false;
        }
    }
    
    // Load bet history
    async function loadBetHistory(filter = {}) {
        try {
            let query = window.SupabaseDB
                .from('game_history')
                .select('*')
                .order('time', { ascending: false });
                
            // Apply filters
            if (filter.username) {
                query = query.ilike('user', `%${filter.username}%`);
            }
            
            if (filter.game) {
                query = query.eq('game', filter.game);
            }
            
            if (filter.result === 'win') {
                query = query.gt('result', 0);
            } else if (filter.result === 'loss') {
                query = query.lt('result', 0);
            }
            
            const { data: bets, error } = await query;
            
            if (error) throw error;
            
            allBets = bets;
            updateActivityTable(bets, betHistoryBody);
        } catch (error) {
            console.error('Error loading bet history:', error);
        }
    }
    
    // Add new admin user
    async function addAdmin(username) {
        try {
            // Check if user exists
            const { data: user, error: userError } = await window.SupabaseDB
                .from('users')
                .select('username')
                .eq('username', username)
                .single();
                
            if (userError) {
                alert(`User ${username} not found`);
                return false;
            }
            
            // Add admin rights
            const granted = await grantAdminRights(username);
            
            if (granted) {
                alert(`Admin rights granted to ${username}`);
                return true;
            } else {
                alert('Error granting admin rights');
                return false;
            }
        } catch (error) {
            console.error('Error adding admin:', error);
            alert(`Error adding admin: ${error.message}`);
            return false;
        }
    }
    
    // Format currency helper
    function formatCurrency(amount) {
        return new Intl.NumberFormat().format(amount);
    }
    
    // Format time helper
    function formatTime(date) {
        // If within last 24 hours, show relative time
        const now = new Date();
        const diffMs = now - date;
        const diffHr = diffMs / (1000 * 60 * 60);
        
        if (diffHr < 24) {
            const diffMin = Math.floor(diffMs / (1000 * 60));
            
            if (diffMin < 60) {
                return `${diffMin}m ago`;
            } else {
                const hours = Math.floor(diffMin / 60);
                return `${hours}h ago`;
            }
        } else {
            // Otherwise show date
            return date.toLocaleDateString();
        }
    }
    
    // Create admin_users table if not exists
    async function ensureAdminTable() {
        try {
            // Check if table exists by trying to select from it
            await window.SupabaseDB.from('admin_users').select('*').limit(1);
        } catch (error) {
            // If table doesn't exist, we need to create it
            // However, this requires RLS permissions so we'll use a function approach
            console.error('Admin users table may not exist:', error);
        }
    }
    
    // Redeem admin code
    async function redeemAdminCode(code) {
        if (code === '$$ADMIN$$') {
            const currentUser = window.BetaAuth?.getCurrentUser();
            if (!currentUser) {
                alert('You need to be logged in to redeem admin code');
                return false;
            }
            
            // Grant admin rights to current user
            const granted = await grantAdminRights(currentUser.username);
            
            if (granted) {
                alert('Admin access granted!');
                isAdmin = true;
                showAdminPanel(currentUser.username);
                loadDashboard();
                return true;
            } else {
                alert('Error granting admin rights');
                return false;
            }
        } else {
            alert('Invalid admin code');
            return false;
        }
    }
    
    // Update house edge
    async function updateHouseEdgeValue(edgeValue) {
        try {
            // Store in settings table
            const { data, error } = await window.SupabaseDB
                .from('settings')
                .upsert([
                    { key: 'house_edge', value: edgeValue.toString() }
                ]);
                
            if (error) throw error;
            
            alert(`House edge updated to ${edgeValue}%`);
            return true;
        } catch (error) {
            console.error('Error updating house edge:', error);
            alert(`Error updating house edge: ${error.message}`);
            return false;
        }
    }
    
    // Update maintenance mode
    async function updateMaintenanceModeValue(mode) {
        try {
            // Store in settings table
            const { data, error } = await window.SupabaseDB
                .from('settings')
                .upsert([
                    { key: 'maintenance_mode', value: mode }
                ]);
                
            if (error) throw error;
            
            alert(`Maintenance mode ${mode === 'on' ? 'enabled' : 'disabled'}`);
            return true;
        } catch (error) {
            console.error('Error updating maintenance mode:', error);
            alert(`Error updating maintenance mode: ${error.message}`);
            return false;
        }
    }
    
    // Event Listeners
    
    // Redeem admin code button
    if (redeemAdminBtn) {
        redeemAdminBtn.addEventListener('click', () => {
            const code = adminCode.value.trim();
            if (code) {
                redeemAdminCode(code);
                adminCode.value = '';
            }
        });
    }
    
    // Tab switching
    adminTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            adminTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Hide all tab contents
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Show selected tab content
            const tabId = tab.dataset.tab;
            document.getElementById(tabId).classList.add('active');
            
            // Load tab-specific data
            if (tabId === 'dashboard') {
                loadDashboard();
            } else if (tabId === 'users') {
                loadUsers();
            } else if (tabId === 'bets') {
                loadBetHistory();
            }
        });
    });
    
    // Search users
    if (searchUserBtn) {
        searchUserBtn.addEventListener('click', () => {
            const searchTerm = userSearchInput.value.trim();
            loadUsers(searchTerm);
        });
    }
    
    // Refresh users
    if (refreshUsersBtn) {
        refreshUsersBtn.addEventListener('click', () => {
            loadUsers();
        });
    }
    
    // Add balance
    if (addBalanceBtn) {
        addBalanceBtn.addEventListener('click', () => {
            const username = balanceUsername.value.trim();
            const amount = parseInt(balanceAmount.value);
            
            if (!username) {
                alert('Please enter a username');
                return;
            }
            
            if (!amount || amount < 1) {
                alert('Please enter a valid amount');
                return;
            }
            
            addBalance(username, amount);
        });
    }
    
    // Filter bets
    if (filterBetsBtn) {
        filterBetsBtn.addEventListener('click', () => {
            const username = betSearchInput.value.trim();
            const game = gameFilter.value;
            const result = resultFilter.value;
            
            loadBetHistory({
                username,
                game,
                result
            });
        });
    }
    
    // Refresh bets
    if (refreshBetsBtn) {
        refreshBetsBtn.addEventListener('click', () => {
            loadBetHistory();
        });
    }
    
    // Refresh activity
    if (refreshActivityBtn) {
        refreshActivityBtn.addEventListener('click', () => {
            loadRecentActivity();
        });
    }
    
    // Add admin
    if (addAdminBtn) {
        addAdminBtn.addEventListener('click', () => {
            const username = addAdminUsername.value.trim();
            
            if (!username) {
                alert('Please enter a username');
                return;
            }
            
            addAdmin(username);
        });
    }
    
    // Update house edge
    if (updateEdgeBtn) {
        updateEdgeBtn.addEventListener('click', () => {
            const edge = parseInt(houseEdge.value);
            
            if (!edge || edge < 1 || edge > 10) {
                alert('Please enter a valid house edge (1-10%)');
                return;
            }
            
            updateHouseEdgeValue(edge);
        });
    }
    
    // Update maintenance mode
    if (updateMaintenanceBtn) {
        updateMaintenanceBtn.addEventListener('click', () => {
            const mode = maintenanceMode.value;
            updateMaintenanceModeValue(mode);
        });
    }
    
    // Edit user form
    if (editUserForm) {
        editUserForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = editUsername.value;
            const balance = parseInt(editBalance.value);
            const status = editStatus.value;
            
            try {
                const { data, error } = await window.SupabaseDB
                    .from('users')
                    .update({
                        balance,
                        status
                    })
                    .eq('username', username)
                    .select();
                    
                if (error) throw error;
                
                alert(`User ${username} updated successfully`);
                editUserModal.style.display = 'none';
                
                // Refresh users list
                loadUsers();
            } catch (error) {
                console.error('Error updating user:', error);
                alert(`Error updating user: ${error.message}`);
            }
        });
    }
    
    // Close edit user modal
    const editUserModalClose = editUserModal?.querySelector('.close');
    if (editUserModalClose) {
        editUserModalClose.addEventListener('click', () => {
            editUserModal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === editUserModal) {
            editUserModal.style.display = 'none';
        }
    });
    
    // Initialize admin panel
    ensureAdminTable();
    checkAdminStatus();
}); 