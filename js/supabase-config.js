// Supabase configuration
const SUPABASE_URL = 'https://vjryqofxliygwmdjjgcm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqcnlxb2Z4bGl5Z3dtZGpqZ2NtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NDU5MzAsImV4cCI6MjA2MzQyMTkzMH0.nmOr5PnN2SeDUzbCVgDebhoankYXYulmzFL_VtBL3W8';

// Initialize Supabase client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export Supabase client
window.SupabaseDB = supabaseClient; 