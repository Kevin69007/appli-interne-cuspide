
-- Update foreign key constraints to use CASCADE deletion
-- This will allow user deletion to automatically clean up related data

-- First, drop the existing foreign key constraint on user_inventory_items
ALTER TABLE public.user_inventory_items 
DROP CONSTRAINT IF EXISTS user_inventory_items_user_id_fkey;

-- Recreate it with CASCADE deletion
ALTER TABLE public.user_inventory_items 
ADD CONSTRAINT user_inventory_items_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Also check and fix other tables that might have similar issues
-- Update profiles table foreign key (if it doesn't already have CASCADE)
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update other user-related tables to use CASCADE deletion
ALTER TABLE public.user_pets 
DROP CONSTRAINT IF EXISTS user_pets_user_id_fkey;

ALTER TABLE public.user_pets 
ADD CONSTRAINT user_pets_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.friend_requests 
DROP CONSTRAINT IF EXISTS friend_requests_sender_id_fkey;

ALTER TABLE public.friend_requests 
ADD CONSTRAINT friend_requests_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.friend_requests 
DROP CONSTRAINT IF EXISTS friend_requests_receiver_id_fkey;

ALTER TABLE public.friend_requests 
ADD CONSTRAINT friend_requests_receiver_id_fkey 
FOREIGN KEY (receiver_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.friendships 
DROP CONSTRAINT IF EXISTS friendships_user1_id_fkey;

ALTER TABLE public.friendships 
ADD CONSTRAINT friendships_user1_id_fkey 
FOREIGN KEY (user1_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.friendships 
DROP CONSTRAINT IF EXISTS friendships_user2_id_fkey;

ALTER TABLE public.friendships 
ADD CONSTRAINT friendships_user2_id_fkey 
FOREIGN KEY (user2_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_messages 
DROP CONSTRAINT IF EXISTS user_messages_sender_id_fkey;

ALTER TABLE public.user_messages 
ADD CONSTRAINT user_messages_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_messages 
DROP CONSTRAINT IF EXISTS user_messages_receiver_id_fkey;

ALTER TABLE public.user_messages 
ADD CONSTRAINT user_messages_receiver_id_fkey 
FOREIGN KEY (receiver_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.blocked_users 
DROP CONSTRAINT IF EXISTS blocked_users_blocker_id_fkey;

ALTER TABLE public.blocked_users 
ADD CONSTRAINT blocked_users_blocker_id_fkey 
FOREIGN KEY (blocker_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.blocked_users 
DROP CONSTRAINT IF EXISTS blocked_users_blocked_id_fkey;

ALTER TABLE public.blocked_users 
ADD CONSTRAINT blocked_users_blocked_id_fkey 
FOREIGN KEY (blocked_id) REFERENCES auth.users(id) ON DELETE CASCADE;
