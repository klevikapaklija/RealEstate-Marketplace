-- Migration: Add favorites column to users table
-- Date: 2024
-- Purpose: Enable cross-device favorites synchronization

-- Add favorites column as an array of integers (listing IDs)
ALTER TABLE users ADD COLUMN IF NOT EXISTS favorites INTEGER[] DEFAULT '{}';

-- Create index for faster favorites queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_users_favorites ON users USING GIN (favorites);

-- Update existing users to have empty favorites array if NULL
UPDATE users SET favorites = '{}' WHERE favorites IS NULL;
