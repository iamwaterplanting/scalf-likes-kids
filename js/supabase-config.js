// Supabase configuration
const SUPABASE_URL = 'https://dunggdgkvbhfalymheiq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1bmdnZGdrdmJoZmFseW1oZWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MTc0MjYsImV4cCI6MjA2MzQ5MzQyNn0.3RZOpw-nYFmc962zvKKrYLP6swv2qgODoqXt-rvxrL0';

// Initialize Supabase client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export Supabase client
window.SupabaseDB = supabaseClient; 