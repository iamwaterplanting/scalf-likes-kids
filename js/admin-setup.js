// BetaGames Admin Setup
// Run this script to set up the necessary tables for the admin panel

async function setupAdminTables() {
    console.log('Setting up admin tables...');
    
    try {
        const supabase = window.SupabaseDB;
        
        if (!supabase) {
            throw new Error('Supabase client not initialized');
        }
        
        // Check if admin_users table exists
        try {
            // This will throw an error if the table doesn't exist
            await supabase.from('admin_users').select('*').limit(1);
            console.log('admin_users table already exists');
        } catch (error) {
            console.log('Creating admin_users table...');
            
            // Create the table using SQL
            const { error: createError } = await supabase.rpc('create_admin_users_table');
            
            if (createError) {
                throw createError;
            }
            
            console.log('admin_users table created successfully!');
        }
        
        // Check if user_sessions table exists
        try {
            await supabase.from('user_sessions').select('*').limit(1);
            console.log('user_sessions table already exists');
        } catch (error) {
            console.log('Creating user_sessions table...');
            
            // Create the table using SQL
            const { error: createError } = await supabase.rpc('create_user_sessions_table');
            
            if (createError) {
                throw createError;
            }
            
            console.log('user_sessions table created successfully!');
        }
        
        // Check if settings table exists
        try {
            await supabase.from('settings').select('*').limit(1);
            console.log('settings table already exists');
        } catch (error) {
            console.log('Creating settings table...');
            
            // Create the table using SQL
            const { error: createError } = await supabase.rpc('create_settings_table');
            
            if (createError) {
                throw createError;
            }
            
            console.log('settings table created successfully!');
            
            // Insert default settings
            const { error: insertError } = await supabase
                .from('settings')
                .insert([
                    { key: 'house_edge', value: '5' },
                    { key: 'maintenance_mode', value: 'off' }
                ]);
                
            if (insertError) {
                throw insertError;
            }
            
            console.log('Default settings inserted');
        }
        
        console.log('Admin setup completed successfully!');
    } catch (error) {
        console.error('Error setting up admin tables:', error);
    }
}

// Export the setup function
window.AdminSetup = {
    setupAdminTables
}; 