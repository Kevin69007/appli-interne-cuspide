
-- Clean up orphaned data before applying CASCADE constraints

-- First, remove orphaned pet_transactions records
DELETE FROM public.pet_transactions 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Remove orphaned item_sales records
DELETE FROM public.item_sales 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Remove orphaned pet_sales records
DELETE FROM public.pet_sales 
WHERE seller_id NOT IN (SELECT id FROM auth.users);

-- Remove orphaned shelter_pets records
DELETE FROM public.shelter_pets 
WHERE seller_id NOT IN (SELECT id FROM auth.users);

-- Remove orphaned trade_items records
DELETE FROM public.trade_items 
WHERE owner_id NOT IN (SELECT id FROM auth.users);

-- Remove orphaned trade_pets records
DELETE FROM public.trade_pets 
WHERE owner_id NOT IN (SELECT id FROM auth.users);

-- Remove orphaned trades records (both initiator and recipient)
DELETE FROM public.trades 
WHERE initiator_id NOT IN (SELECT id FROM auth.users) 
   OR recipient_id NOT IN (SELECT id FROM auth.users);

-- Remove orphaned user_inventory records
DELETE FROM public.user_inventory 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Remove orphaned virtual_scenes records
DELETE FROM public.virtual_scenes 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Remove orphaned forum_posts records
DELETE FROM public.forum_posts 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Remove orphaned forum_replies records
DELETE FROM public.forum_replies 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Remove orphaned post_likes records
DELETE FROM public.post_likes 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Remove orphaned pet_activities records (these reference user_pets, so clean those up too)
DELETE FROM public.pet_activities 
WHERE user_pet_id NOT IN (SELECT id FROM public.user_pets);

-- Now apply the CASCADE constraints
-- Add CASCADE deletion for litter_babies table (this is blocking breeding_pairs deletion)
ALTER TABLE public.litter_babies 
DROP CONSTRAINT IF EXISTS litter_babies_breeding_pair_id_fkey;

ALTER TABLE public.litter_babies 
ADD CONSTRAINT litter_babies_breeding_pair_id_fkey 
FOREIGN KEY (breeding_pair_id) REFERENCES public.breeding_pairs(id) ON DELETE CASCADE;

-- Add CASCADE deletion for item_sales table
ALTER TABLE public.item_sales 
DROP CONSTRAINT IF EXISTS item_sales_user_id_fkey;

ALTER TABLE public.item_sales 
ADD CONSTRAINT item_sales_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add CASCADE deletion for pet_sales table
ALTER TABLE public.pet_sales 
DROP CONSTRAINT IF EXISTS pet_sales_seller_id_fkey;

ALTER TABLE public.pet_sales 
ADD CONSTRAINT pet_sales_seller_id_fkey 
FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add CASCADE deletion for pet_transactions table
ALTER TABLE public.pet_transactions 
DROP CONSTRAINT IF EXISTS pet_transactions_user_id_fkey;

ALTER TABLE public.pet_transactions 
ADD CONSTRAINT pet_transactions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add CASCADE deletion for shelter_pets table
ALTER TABLE public.shelter_pets 
DROP CONSTRAINT IF EXISTS shelter_pets_seller_id_fkey;

ALTER TABLE public.shelter_pets 
ADD CONSTRAINT shelter_pets_seller_id_fkey 
FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add CASCADE deletion for trade_items table
ALTER TABLE public.trade_items 
DROP CONSTRAINT IF EXISTS trade_items_owner_id_fkey;

ALTER TABLE public.trade_items 
ADD CONSTRAINT trade_items_owner_id_fkey 
FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add CASCADE deletion for trade_pets table
ALTER TABLE public.trade_pets 
DROP CONSTRAINT IF EXISTS trade_pets_owner_id_fkey;

ALTER TABLE public.trade_pets 
ADD CONSTRAINT trade_pets_owner_id_fkey 
FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add CASCADE deletion for trades table (initiator and recipient)
ALTER TABLE public.trades 
DROP CONSTRAINT IF EXISTS trades_initiator_id_fkey;

ALTER TABLE public.trades 
ADD CONSTRAINT trades_initiator_id_fkey 
FOREIGN KEY (initiator_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.trades 
DROP CONSTRAINT IF EXISTS trades_recipient_id_fkey;

ALTER TABLE public.trades 
ADD CONSTRAINT trades_recipient_id_fkey 
FOREIGN KEY (recipient_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add CASCADE deletion for user_inventory table
ALTER TABLE public.user_inventory 
DROP CONSTRAINT IF EXISTS user_inventory_user_id_fkey;

ALTER TABLE public.user_inventory 
ADD CONSTRAINT user_inventory_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add CASCADE deletion for virtual_scenes table
ALTER TABLE public.virtual_scenes 
DROP CONSTRAINT IF EXISTS virtual_scenes_user_id_fkey;

ALTER TABLE public.virtual_scenes 
ADD CONSTRAINT virtual_scenes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add CASCADE deletion for forum_posts table
ALTER TABLE public.forum_posts 
DROP CONSTRAINT IF EXISTS forum_posts_user_id_fkey;

ALTER TABLE public.forum_posts 
ADD CONSTRAINT forum_posts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add CASCADE deletion for forum_replies table
ALTER TABLE public.forum_replies 
DROP CONSTRAINT IF EXISTS forum_replies_user_id_fkey;

ALTER TABLE public.forum_replies 
ADD CONSTRAINT forum_replies_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add CASCADE deletion for post_likes table
ALTER TABLE public.post_likes 
DROP CONSTRAINT IF EXISTS post_likes_user_id_fkey;

ALTER TABLE public.post_likes 
ADD CONSTRAINT post_likes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add CASCADE deletion for pet_activities table
ALTER TABLE public.pet_activities 
DROP CONSTRAINT IF EXISTS pet_activities_user_pet_id_fkey;

ALTER TABLE public.pet_activities 
ADD CONSTRAINT pet_activities_user_pet_id_fkey 
FOREIGN KEY (user_pet_id) REFERENCES public.user_pets(id) ON DELETE CASCADE;
