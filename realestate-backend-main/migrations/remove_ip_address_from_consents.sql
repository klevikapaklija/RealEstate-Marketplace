-- Remove IP address column from user_consents table for privacy compliance
-- This migration removes the ip_address column to stop tracking user IP addresses

ALTER TABLE user_consents DROP COLUMN IF EXISTS ip_address;

-- Confirm the change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_consents' 
ORDER BY ordinal_position;
