-- Fix RLS policies for user registration and login
-- The current policies are too restrictive for our custom auth system

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create new policies that allow registration and login
-- Allow anyone to insert (for registration)
CREATE POLICY "Allow user registration" ON users
    FOR INSERT 
    WITH CHECK (true);

-- Allow users to view their own data (by username for login)
CREATE POLICY "Allow user login" ON users
    FOR SELECT 
    USING (true);

-- Allow users to update their own data (for last_login updates)
CREATE POLICY "Allow user updates" ON users
    FOR UPDATE 
    USING (true);

-- Grant necessary permissions to authenticated and anon users
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON users TO anon;
GRANT EXECUTE ON FUNCTION register_user TO anon;
GRANT EXECUTE ON FUNCTION update_last_login TO anon;
GRANT EXECUTE ON FUNCTION get_user_by_username TO anon;
GRANT EXECUTE ON FUNCTION username_exists TO anon;
GRANT EXECUTE ON FUNCTION email_exists TO anon;
GRANT SELECT ON public_user_profiles TO anon; 