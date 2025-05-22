-- Create online_users table
CREATE TABLE IF NOT EXISTS public.online_users (
  session_id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) DEFAULT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS online_users_last_seen_idx ON public.online_users (last_seen DESC);

-- Enable Row Level Security
ALTER TABLE public.online_users ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$
BEGIN
    -- Allow anyone to read the online users
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'online_users' AND policyname = 'Allow public read access to online users'
    ) THEN
        CREATE POLICY "Allow public read access to online users" ON public.online_users
            FOR SELECT USING (true);
    END IF;
    
    -- Allow authenticated users to insert their presence
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'online_users' AND policyname = 'Allow anyone to insert or update their presence'
    ) THEN
        CREATE POLICY "Allow anyone to insert or update their presence" ON public.online_users
            FOR INSERT WITH CHECK (true);
    END IF;
    
    -- Allow authenticated users to update their presence
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'online_users' AND policyname = 'Allow users to update their own presence'
    ) THEN
        CREATE POLICY "Allow users to update their own presence" ON public.online_users
            FOR UPDATE USING (true);
    END IF;
    
    -- Allow authenticated users to delete their presence
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'online_users' AND policyname = 'Allow users to delete their own presence'
    ) THEN
        CREATE POLICY "Allow users to delete their own presence" ON public.online_users
            FOR DELETE USING (true);
    END IF;
END
$$; 