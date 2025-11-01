-- Setup for Push Notifications
-- Run this in your Supabase SQL Editor

-- Add notifications_enabled column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT FALSE;

-- Done! Users can now enable/disable push notifications in their profile.

