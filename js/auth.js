// BetaGames Authentication System
const LOCAL_STORAGE_KEY = 'betagames_user';

// User state
let currentUser = null;
let dropdownVisible = false; // Track if dropdown is visible

// DOM Elements - Initialize as null and populate later
let loginButton = null;
let signupButton = null;
let userProfile = null;
let usernameDisplay = null;
let userAvatar = null;
let logoutButton = null;
let profileSettings = null;
let loginModal = null;
let signupModal = null;
let loginForm = null;
let signupForm = null;
let closeButtons = null;
let balanceAmount = null;
let dropdownMenu = null;

// Initialize DOM elements safely
function initializeElements() {
    console.log("Initializing auth elements");
    loginButton = document.getElementById('loginButton');
    signupButton = document.getElementById('signupButton');
    userProfile = document.querySelector('.user-profile');
    usernameDisplay = document.getElementById('username');
    userAvatar = document.getElementById('userAvatar');
    logoutButton = document.getElementById('logoutButton');
    profileSettings = document.getElementById('profileSettings');
    loginModal = document.getElementById('loginModal');
    signupModal = document.getElementById('signupModal');
    loginForm = document.getElementById('loginForm');
    signupForm = document.getElementById('signupForm');
    closeButtons = document.querySelectorAll('.close');
    balanceAmount = document.querySelector('.balance-amount');
    dropdownMenu = document.querySelector('.dropdown-menu');
    
    console.log("Auth elements initialized:", {
        loginButton: !!loginButton,
        signupButton: !!signupButton,
        userProfile: !!userProfile,
        loginModal: !!loginModal
    });
}

// Check if user is already logged in (from localStorage)
async function checkAuthState() {
    let savedUser = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!savedUser) {
        // No user in localStorage, show login/signup UI
        logout();
        return;
    }
    try {
        savedUser = JSON.parse(savedUser);
        // Always fetch the latest user data from Supabase
        const { data: user, error } = await window.SupabaseDB
            .from('users')
            .select('*')
            .eq('username', savedUser.username)
            .single();

        if (error || !user) {
            logout();
            return;
        }
        currentUser = user;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user));
        updateUIForLoggedInUser();
    } catch (error) {
        logout();
    }
}

// Update UI when user is logged in
function updateUIForLoggedInUser() {
    if (!currentUser) return;
    
    // Make sure elements are initialized
    if (!loginButton || !signupButton || !userProfile) {
        console.warn("Auth UI elements not found, re-initializing");
        initializeElements();
        // If still not found, return to prevent errors
        if (!loginButton || !signupButton || !userProfile) {
            console.error("Critical auth UI elements still missing after re-initialization");
            return;
        }
    }
    
    // Hide login/signup buttons, show profile
    loginButton.style.display = 'none';
    signupButton.style.display = 'none';
    userProfile.style.display = 'flex';
    
    // Update username and avatar
    if (usernameDisplay) {
        usernameDisplay.textContent = currentUser.username;
    }
    
    if (userAvatar && currentUser.avatar) {
        userAvatar.src = currentUser.avatar;
    }
    
    // Update balance - ensure it always shows the actual database balance
    if (balanceAmount) {
        balanceAmount.textContent = new Intl.NumberFormat().format(currentUser.balance || 0);
    }
}

// Function to refresh user UI after profile update
function refreshUserUI() {
    updateUIForLoggedInUser();
}

// Login function with Supabase
async function login(username, password) {
    try {
        const { data: user, error } = await window.SupabaseDB
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .single();

        if (error) throw error;
        if (!user) throw new Error('Invalid credentials');
        
        // Check if user is banned by admin
        if (window.BetaAdmin && window.BetaAdmin.isBanned && window.BetaAdmin.isBanned(username)) {
            throw new Error('Your account has been banned');
        }

        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user));
        currentUser = user;
        updateUIForLoggedInUser();
        return user;
    } catch (error) {
        console.error('Login error:', error);
        throw new Error(error.message || 'Invalid credentials');
    }
}

// Signup function with Supabase
async function signup(username, password) {
    try {
        // Check if username exists
        const { data: existingUser, error: checkError } = await window.SupabaseDB
            .from('users')
            .select('username')
            .eq('username', username)
            .single();

        if (checkError && checkError.code !== 'PGRST116') throw checkError;
        if (existingUser) throw new Error('Username already exists');

        const user = {
            username,
            password,
            balance: 100,
            avatar: null,
            created_at: new Date().toISOString()
        };

        // Save to Supabase
        const { data: newUser, error: insertError } = await window.SupabaseDB
            .from('users')
            .insert([user])
            .select()
            .single();

        if (insertError) throw insertError;

        // Save to localStorage
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newUser));
        currentUser = newUser;
        updateUIForLoggedInUser();
        return newUser;
    } catch (error) {
        console.error('Signup error:', error);
        throw error;
    }
}

// Logout function
function logout() {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    currentUser = null;
    
    // Reset UI
    loginButton.style.display = 'block';
    signupButton.style.display = 'block';
    userProfile.style.display = 'none';
    balanceAmount.textContent = '0';
}

// Function to update user profile
async function updateProfile(profileData) {
    if (!currentUser) return;
    
    try {
        // Update in Supabase
        const { data: updatedUser, error } = await window.SupabaseDB
            .from('users')
            .update(profileData)
            .eq('username', currentUser.username)
            .select()
            .single();

        if (error) throw error;

        // Update local data
        currentUser = { ...currentUser, ...updatedUser };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentUser));
        updateUIForLoggedInUser();
    } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
}

// Function to update user balance
async function updateBalance(amount, reason = 'game') {
    if (!currentUser) return false;
    
    // Calculate new balance
    const newBalance = currentUser.balance + amount;
    
    // Don't allow negative balances
    if (newBalance < 0 && reason !== 'redeem_camil') {
        return false;
    }
    
    try {
        // Update in Supabase
        const { data: updatedUser, error } = await window.SupabaseDB
            .from('users')
            .update({ balance: Math.max(0, newBalance) }) // Ensure we never store negative balance
            .eq('username', currentUser.username)
            .select()
            .single();

        if (error) throw error;

        // Update local data
        currentUser.balance = updatedUser.balance;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentUser));
        
        // Update UI
        if (balanceAmount) {
            balanceAmount.textContent = new Intl.NumberFormat().format(currentUser.balance);
        }
        return true;
    } catch (error) {
        console.error('Error updating balance:', error);
        return false;
    }
}

// Function to toggle dropdown visibility
function toggleDropdown(e) {
    e.stopPropagation(); // Prevent click from immediately closing dropdown
    
    dropdownVisible = !dropdownVisible;
    if (dropdownVisible) {
        dropdownMenu.classList.add('show-dropdown');
    } else {
        dropdownMenu.classList.remove('show-dropdown');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM elements
    initializeElements();
    
    // Check auth state on page load
    checkAuthState();
    
    // Login button click
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            if (loginModal) {
                loginModal.style.display = 'flex';
            } else {
                console.error("Login modal not found");
            }
        });
    } else {
        console.error("Login button not found");
    }
    
    // Signup button click
    if (signupButton) {
        signupButton.addEventListener('click', () => {
            signupModal.style.display = 'flex';
        });
    }
    
    // User profile click for dropdown
    if (userProfile) {
        userProfile.addEventListener('click', toggleDropdown);
    }
    
    // Logout button click
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent event from bubbling up
            logout();
            dropdownVisible = false;
            dropdownMenu?.classList.remove('show-dropdown');
        });
    }
    
    // Settings button click
    if (profileSettings) {
        profileSettings.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent event from bubbling up
            
            // First, try to load the settings.js module if it's not already loaded
            if (!window.BetaSettings) {
                // Check if the script is already in the document
                let settingsScript = document.querySelector('script[src*="settings.js"]');
                
                if (!settingsScript) {
                    // Load the settings.js script dynamically
                    settingsScript = document.createElement('script');
                    settingsScript.src = '/js/settings.js';
                    document.body.appendChild(settingsScript);
                    
                    // Wait for the script to load before showing the modal
                    settingsScript.onload = function() {
                        showSettingsModal();
                    };
                } else {
                    showSettingsModal();
                }
            } else {
                showSettingsModal();
            }
        });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (dropdownVisible && !userProfile.contains(e.target)) {
            dropdownVisible = false;
            dropdownMenu?.classList.remove('show-dropdown');
        }
    });
    
    // Close modal buttons
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            loginModal.style.display = 'none';
            signupModal.style.display = 'none';
            
            // Close settings modal if exists
            const settingsModal = document.getElementById('settingsModal');
            if (settingsModal) {
                settingsModal.style.display = 'none';
            }
            
            // Close change password modal if exists
            const changePasswordModal = document.getElementById('changePasswordModal');
            if (changePasswordModal) {
                changePasswordModal.style.display = 'none';
            }
        });
    });
    
    // Login form submit
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            
            try {
                await login(username, password);
                loginModal.style.display = 'none';
                loginForm.reset();
            } catch (error) {
                alert(error.message);
            }
        });
    }
    
    // Signup form submit
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('signupUsername').value;
            const password = document.getElementById('signupPassword').value;
            const confirmPassword = document.getElementById('signupConfirmPassword').value;
            
            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }
            
            try {
                await signup(username, password);
                signupModal.style.display = 'none';
                signupForm.reset();
            } catch (error) {
                alert(error.message);
            }
        });
    }
});

// Export functions for use in other scripts
window.BetaAuth = {
    getCurrentUser: () => currentUser,
    login,
    signup,
    logout,
    updateProfile,
    updateBalance,
    refreshUserUI,
    onAuthStateChange: (callback) => {
        // Simple auth state change listener
        // For a real implementation, you would use a more robust event system
        window._authStateChangeCallback = callback;
    },
    logToDiscord: (message) => {
        console.log(`[Discord Log] ${message}`);
    }
};

// Helper function to show settings modal
function showSettingsModal() {
    // Check if settings modal exists, if not show an alert
    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal) {
        // If BetaSettings exists, use it to load user data
        if (window.BetaSettings && window.BetaSettings.loadUserData) {
            window.BetaSettings.loadUserData();
        }
        settingsModal.style.display = 'flex';
    } else {
        alert('Settings will be available soon. Please try again later!');
    }
} 