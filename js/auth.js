// BetaGames Authentication System
const LOCAL_STORAGE_KEY = 'betagames_user';

// User state
let currentUser = null;
let dropdownVisible = false; // Track if dropdown is visible

// DOM Elements
const loginButton = document.getElementById('loginButton');
const signupButton = document.getElementById('signupButton');
const userProfile = document.querySelector('.user-profile');
const usernameDisplay = document.getElementById('username');
const userAvatar = document.getElementById('userAvatar');
const logoutButton = document.getElementById('logoutButton');
const profileSettings = document.getElementById('profileSettings');
const loginModal = document.getElementById('loginModal');
const signupModal = document.getElementById('signupModal');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const closeButtons = document.querySelectorAll('.close');
const balanceAmount = document.querySelector('.balance-amount');
const dropdownMenu = document.querySelector('.dropdown-menu');

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
    if (currentUser) {
        // Hide login/signup buttons, show profile
        loginButton.style.display = 'none';
        signupButton.style.display = 'none';
        userProfile.style.display = 'flex';
        
        // Update username and avatar
        usernameDisplay.textContent = currentUser.username;
        if (currentUser.avatar) {
            userAvatar.src = currentUser.avatar;
        }
        
        // Update balance
        if (currentUser.balance) {
            balanceAmount.textContent = new Intl.NumberFormat().format(currentUser.balance);
        }
    }
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

        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user));
        currentUser = user;
        updateUIForLoggedInUser();
        return user;
    } catch (error) {
        console.error('Login error:', error);
        throw new Error('Invalid credentials');
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
            balance: 10000,
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
    
    const newBalance = currentUser.balance + amount;
    if (newBalance >= 0) {
        try {
            // Update in Supabase
            const { data: updatedUser, error } = await window.SupabaseDB
                .from('users')
                .update({ balance: newBalance })
                .eq('username', currentUser.username)
                .select()
                .single();

            if (error) throw error;

            // Update local data
            currentUser.balance = newBalance;
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentUser));
            balanceAmount.textContent = new Intl.NumberFormat().format(currentUser.balance);
            return true;
        } catch (error) {
            console.error('Error updating balance:', error);
            return false;
        }
    }
    return false;
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
    // Check auth state on page load
    checkAuthState();
    
    // Login button click
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            loginModal.style.display = 'flex';
        });
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
            
            // Check if settings modal exists, if not show an alert
            const settingsModal = document.getElementById('settingsModal');
            if (settingsModal) {
                settingsModal.style.display = 'flex';
            } else {
                alert('Profile settings will be available in a future update!');
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
    updateBalance
}; 