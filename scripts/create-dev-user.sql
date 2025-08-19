-- Create a mock user for development mode
-- This allows testing transaction functionality without authentication

-- Insert mock user into auth.users (Supabase's auth table)
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  'dev-user-123',
  'dev@example.com',
  '$2a$10$mockhashedpassword', -- Mock hashed password
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Dev User"}',
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Insert corresponding user profile if user_profiles table exists
INSERT INTO user_profiles (
  id,
  email,
  full_name,
  created_at,
  updated_at
) VALUES (
  'dev-user-123',
  'dev@example.com',
  'Development User',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create a mock project for the dev user
INSERT INTO projects (
  id,
  name,
  description,
  user_id,
  created_at,
  updated_at
) VALUES (
  'dev-project-123',
  'Development Project',
  'Mock project for development and testing',
  'dev-user-123',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;
