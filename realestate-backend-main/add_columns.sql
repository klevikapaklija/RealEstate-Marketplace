-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS surname TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'person';