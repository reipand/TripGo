-- TripGo Users Table Setup for Supabase
-- Run this in your Supabase SQL Editor

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_code TEXT,
    verification_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_verification_code ON public.users(verification_code);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON public.users(email_verified);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Users can only see and update their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Allow inserting new users (for registration)
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, first_name, last_name, phone, email_verified)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name',
        NEW.raw_user_meta_data->>'phone',
        COALESCE(NEW.email_confirmed_at IS NOT NULL, FALSE)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile when auth.users is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to generate verification code
CREATE OR REPLACE FUNCTION public.generate_verification_code()
RETURNS TEXT AS $$
BEGIN
    RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to send verification email (placeholder - integrate with your email service)
CREATE OR REPLACE FUNCTION public.send_verification_email(
    user_email TEXT,
    verification_code TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    -- This is a placeholder function
    -- In production, integrate with your email service (SendGrid, AWS SES, etc.)
    -- For now, we'll just log the code
    RAISE NOTICE 'Verification code for %: %', user_email, verification_code;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to verify email with code
CREATE OR REPLACE FUNCTION public.verify_email_with_code(
    user_email TEXT,
    input_code TEXT
)
RETURNS JSON AS $$
DECLARE
    user_record RECORD;
    result JSON;
BEGIN
    -- Get user record
    SELECT * INTO user_record 
    FROM public.users 
    WHERE email = user_email;
    
    -- Check if user exists
    IF user_record IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'User not found');
    END IF;
    
    -- Check if already verified
    IF user_record.email_verified THEN
        RETURN json_build_object('success', false, 'message', 'Email already verified');
    END IF;
    
    -- Check if verification code matches and is not expired
    IF user_record.verification_code = input_code 
       AND user_record.verification_expires_at > NOW() THEN
        
        -- Update user as verified
        UPDATE public.users 
        SET email_verified = TRUE,
            verification_code = NULL,
            verification_expires_at = NULL,
            updated_at = NOW()
        WHERE id = user_record.id;
        
        -- Update auth.users email_confirmed_at
        UPDATE auth.users 
        SET email_confirmed_at = NOW()
        WHERE id = user_record.id;
        
        RETURN json_build_object('success', true, 'message', 'Email verified successfully');
    ELSE
        RETURN json_build_object('success', false, 'message', 'Invalid or expired verification code');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to resend verification code
CREATE OR REPLACE FUNCTION public.resend_verification_code(
    user_email TEXT
)
RETURNS JSON AS $$
DECLARE
    user_record RECORD;
    new_code TEXT;
BEGIN
    -- Get user record
    SELECT * INTO user_record 
    FROM public.users 
    WHERE email = user_email;
    
    -- Check if user exists
    IF user_record IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'User not found');
    END IF;
    
    -- Check if already verified
    IF user_record.email_verified THEN
        RETURN json_build_object('success', false, 'message', 'Email already verified');
    END IF;
    
    -- Generate new verification code
    new_code := public.generate_verification_code();
    
    -- Update user with new verification code
    UPDATE public.users 
    SET verification_code = new_code,
        verification_expires_at = NOW() + INTERVAL '5 minutes',
        updated_at = NOW()
    WHERE id = user_record.id;
    
    -- Send verification email (placeholder)
    PERFORM public.send_verification_email(user_email, new_code);
    
    RETURN json_build_object('success', true, 'message', 'Verification code sent');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_email_with_code(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resend_verification_code(TEXT) TO anon, authenticated;
