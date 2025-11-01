-- Fix for Realtime channel errors
-- Run this in your Supabase SQL Editor if you're getting CHANNEL_ERROR

-- Set replica identity for real-time (this is the critical fix!)
ALTER TABLE messages REPLICA IDENTITY FULL;

-- Done! Refresh your chat page and check the console for "Subscription status: SUBSCRIBED"

