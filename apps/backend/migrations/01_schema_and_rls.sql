-- Migration Script: Public Schemas and Strict Row Level Security (RLS)

-- 1. Create Public User Profile Metadata Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    avatar_url TEXT,
    role TEXT DEFAULT 'USER' CHECK (role IN ('USER', 'CREATOR', 'ADMIN', 'MASTER_ADMIN')),
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Public Creator Profile Table
CREATE TABLE IF NOT EXISTS public.creators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    pen_name TEXT NOT NULL CHECK (char_length(pen_name) >= 2),
    bio TEXT CHECK (char_length(bio) <= 500),
    portfolio_url TEXT,
    is_vetted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security (RLS) on both tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;

-- 4. Set up strict RLS Policies

-- Public Users Policies
-- Users can only read their own profile metadata (unless they are administrators)
CREATE POLICY "Users can view their own profile" 
ON public.users 
FOR SELECT 
USING (
    auth.uid() = id 
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('ADMIN', 'MASTER_ADMIN')
);

-- Users can only update their own profile metadata
CREATE POLICY "Users can update their own profile" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Public Creators Policies
-- Anyone can view vetted creator profiles (needed for the public web portal)
CREATE POLICY "Anyone can view vetted creator profiles" 
ON public.creators 
FOR SELECT 
USING (is_vetted = true OR user_id = auth.uid());

-- Creators can insert their own profile
CREATE POLICY "Users can create their own creator profile" 
ON public.creators 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Creators can only update their own profile
CREATE POLICY "Creators can update their own profile" 
ON public.creators 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Creators can only delete their own profile
CREATE POLICY "Creators can delete their own profile" 
ON public.creators 
FOR DELETE 
USING (user_id = auth.uid());


-- 5. Set up User Synchronization Trigger (from auth.users to public.users)

-- Trigger Function to sync metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, username, avatar_url, role)
    VALUES (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url',
        'USER'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind Trigger to auth.users (runs after auth sign-up is confirmed)
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
