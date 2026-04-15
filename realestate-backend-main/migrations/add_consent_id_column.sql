"""Add consent_id column to user_consents table for anonymous consent tracking

This migration adds the consent_id column to track cookie consent for non-logged-in users.
When users later create an account, their anonymous consent will be merged with their account.
"""

# Run this SQL in your PostgreSQL database:

ALTER TABLE user_consents ADD COLUMN IF NOT EXISTS consent_id VARCHAR;
CREATE INDEX IF NOT EXISTS idx_user_consents_consent_id ON user_consents(consent_id);

# This allows:
# 1. Anonymous users to save consent with a unique consent_id
# 2. When they log in/register, their consent_id records get merged to their firebase_uid
# 3. Maintains full consent history and GDPR compliance
