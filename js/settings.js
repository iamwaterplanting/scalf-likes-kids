// Settings Module
console.log('Settings module loaded');

document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing settings module');
    
    // DOM Elements
    const settingsModal = document.getElementById('settingsModal');
    const profileSettings = document.getElementById('profileSettings');
    const closeButtons = document.querySelectorAll('#settingsModal .close');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const uploadPicBtn = document.getElementById('uploadPicBtn');
    const profilePicInput = document.getElementById('profilePicInput');
    const profilePreview = document.getElementById('profilePreview');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const displayNameInput = document.getElementById('displayName');
    const changePasswordForm = document.getElementById('changePasswordForm');
    
    // Show settings modal
    profileSettings.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Load current user data
        loadUserData();
        
        // Show modal
        settingsModal.style.display = 'flex';
    });
    
    // Close settings modal
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            settingsModal.style.display = 'none';
        });
    });
    
    // Tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Get tab content to show
            const tabId = button.getAttribute('data-tab');
            
            // Hide all tab contents
            tabContents.forEach(content => {
                content.style.display = 'none';
            });
            
            // Show selected tab content
            document.getElementById(tabId + 'Tab').style.display = 'block';
        });
    });
    
    // Trigger profile picture input when upload button is clicked
    uploadPicBtn.addEventListener('click', () => {
        profilePicInput.click();
    });
    
    // Preview selected profile picture
    profilePicInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // Check file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                alert('File size should be less than 2MB');
                e.target.value = '';
                return;
            }
            
            // Preview the image
            const reader = new FileReader();
            reader.onload = (event) => {
                profilePreview.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Save profile changes
    saveProfileBtn.addEventListener('click', async () => {
        try {
            const displayName = displayNameInput.value.trim();
            const profilePic = profilePicInput.files[0];
            
            await saveUserProfile(displayName, profilePic);
            
            alert('Profile updated successfully!');
            settingsModal.style.display = 'none';
            
            // Refresh user data in UI
            if (window.BetaAuth && window.BetaAuth.refreshUserUI) {
                window.BetaAuth.refreshUserUI();
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Failed to update profile. Please try again.');
        }
    });
    
    // Change password form
    changePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;
        
        // Validate passwords
        if (newPassword !== confirmPassword) {
            alert('New passwords do not match');
            return;
        }
        
        if (newPassword.length < 6) {
            alert('Password must be at least 6 characters long');
            return;
        }
        
        try {
            await changePassword(currentPassword, newPassword);
            
            alert('Password changed successfully!');
            changePasswordForm.reset();
            settingsModal.style.display = 'none';
        } catch (error) {
            console.error('Error changing password:', error);
            alert('Failed to change password: ' + error.message);
        }
    });
});

// Load user data into form
async function loadUserData() {
    try {
        const currentUser = window.BetaAuth?.getCurrentUser();
        if (!currentUser) {
            throw new Error('No user logged in');
        }
        
        console.log('Loading user data for:', currentUser.username);
        
        // Set display name
        document.getElementById('displayName').value = currentUser.username;
        
        // Set profile picture
        const userAvatar = document.getElementById('profilePreview');
        
        // First check if user has avatar in local data
        if (currentUser.avatar) {
            userAvatar.src = currentUser.avatar;
            return;
        }
        
        // Otherwise try to get user profile picture from Supabase
        const { data, error } = await window.SupabaseDB
            .from('users')
            .select('avatar')
            .eq('username', currentUser.username)
            .single();
            
        if (error) throw error;
        
        // Check avatar field
        if (data && data.avatar) {
            const avatarUrl = data.avatar;
            userAvatar.src = avatarUrl;
            
            // Update local user data if different
            if (currentUser.avatar !== avatarUrl && window.BetaAuth && window.BetaAuth.updateProfile) {
                await window.BetaAuth.updateProfile({ avatar: avatarUrl });
            }
        } else {
            userAvatar.src = 'assets/default-avatar.svg';
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Save user profile to Supabase
async function saveUserProfile(displayName, profilePic) {
    const currentUser = window.BetaAuth?.getCurrentUser();
    if (!currentUser) {
        throw new Error('No user logged in');
    }
    
    // Start with empty update data
    const updateData = {};
    
    // Update display name if changed
    if (displayName && displayName !== currentUser.username) {
        // This would require a more complex update since username is likely primary key
        // For now, let's assume we're not changing the username itself
        console.log('Display name updates not supported at this time');
    }
    
    // Upload and update profile picture if provided
    if (profilePic) {
        console.log('Uploading profile picture...');
        
        try {
            // Generate unique file name
            const fileName = `avatar_${currentUser.username}_${Date.now()}.${profilePic.name.split('.').pop()}`;
            
            // Try to create the avatars bucket if it doesn't exist
            try {
                await window.SupabaseDB
                    .storage
                    .createBucket('avatars', { public: true });
                console.log('Created avatars bucket');
            } catch (bucketError) {
                // If error is not "bucket already exists", rethrow it
                if (!bucketError.message.includes('already exists')) {
                    console.warn('Bucket creation warning:', bucketError);
                }
            }
            
            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await window.SupabaseDB
                .storage
                .from('avatars')
                .upload(fileName, profilePic);
                
            if (uploadError) throw uploadError;
            
            // Get public URL
            const { data: publicURLData } = window.SupabaseDB
                .storage
                .from('avatars')
                .getPublicUrl(fileName);
                
            const avatarUrl = publicURLData.publicUrl;
            
            // Update avatar URL in user profile - only use 'avatar' field
            updateData.avatar = avatarUrl;
            
            // Update user avatar in UI
            document.getElementById('userAvatar').src = avatarUrl;
        } catch (error) {
            console.error('Error uploading avatar:', error);
            throw new Error('Failed to upload avatar: ' + error.message);
        }
    }
    
    // Only update if we have data to update
    if (Object.keys(updateData).length > 0) {
        const { error } = await window.SupabaseDB
            .from('users')
            .update(updateData)
            .eq('username', currentUser.username);
            
        if (error) throw error;
        
        // Update local user data via BetaAuth
        if (window.BetaAuth && window.BetaAuth.updateProfile) {
            await window.BetaAuth.updateProfile(updateData);
        }
    }
    
    return true;
}

// Change user password
async function changePassword(currentPassword, newPassword) {
    // Verify current password and update to new password
    try {
        const currentUser = window.BetaAuth?.getCurrentUser();
        if (!currentUser) {
            throw new Error('No user logged in');
        }
        
        // Verify current password
        const { data, error: verifyError } = await window.SupabaseDB
            .from('users')
            .select('username')
            .eq('username', currentUser.username)
            .eq('password', currentPassword)
            .single();
            
        if (verifyError || !data) {
            throw new Error('Current password is incorrect');
        }
        
        // Update password in database
        const { error: updateError } = await window.SupabaseDB
            .from('users')
            .update({ password: newPassword })
            .eq('username', currentUser.username);
            
        if (updateError) throw updateError;
        
        // Log action
        console.log('Password changed successfully');
        
        return true;
    } catch (error) {
        console.error('Error changing password:', error);
        throw error;
    }
}

// Export settings functions
window.BetaSettings = {
    loadUserData,
    saveUserProfile,
    changePassword
}; 