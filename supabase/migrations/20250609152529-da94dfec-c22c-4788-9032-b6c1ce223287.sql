
-- First, remove user inventory items that reference shop items we want to delete
DELETE FROM public.user_inventory_items 
WHERE shop_item_id IN (
  SELECT id FROM public.shop_items 
  WHERE item_type NOT IN ('food', 'litter_license')
);

-- Now we can safely remove all shop items except food bags and litter licenses
DELETE FROM public.shop_items 
WHERE item_type NOT IN ('food', 'litter_license');

-- Insert food bags if they don't exist
INSERT INTO public.shop_items (name, description, item_type, price_nd, price_np, image_url, is_available)
VALUES 
  ('Food Bag', 'A nutritious food bag to keep your pets well-fed', 'food', 50, NULL, '/lovable-uploads/f1ad21dc-d242-4823-9646-2b7c380bcf41.png', true)
ON CONFLICT DO NOTHING;

-- Insert litter licenses if they don't exist  
INSERT INTO public.shop_items (name, description, item_type, price_nd, price_np, image_url, is_available)
VALUES 
  ('Litter License', 'Required license to breed your pets', 'litter_license', 500, NULL, '/lovable-uploads/cbc605c8-22f6-4e4c-a5a1-e79548b517ce.png', true)
ON CONFLICT DO NOTHING;

-- Update all German Shepherd icons to use the newest image
UPDATE public.pets 
SET image_url = '/lovable-uploads/4f90cba6-3a1f-41c5-ac47-143c1bf7c185.png'
WHERE name ILIKE '%german shepherd%' OR name ILIKE '%german%shepherd%';
