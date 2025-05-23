-- Chat messages table
CREATE TABLE public.chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  username TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create policy to allow all users to read messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.chat_messages
  FOR SELECT USING (true);

-- Create policy to allow users to create their own messages
CREATE POLICY "Allow users to insert their own messages" ON public.chat_messages
  FOR INSERT WITH CHECK (true); 