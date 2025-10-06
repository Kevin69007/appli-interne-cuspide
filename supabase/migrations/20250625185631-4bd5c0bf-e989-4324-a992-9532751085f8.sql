
-- Add Creative forum for users to sell creative services
INSERT INTO public.forums (name, description, order_position)
VALUES (
  'Creative Services',
  'Showcase and commission custom profile pictures, graphics, and other creative works for Paw Dollars or Paw Points',
  3
);

-- Update order positions to make room for the new forum
-- Move existing forums down by 1 if they have order_position >= 3
UPDATE public.forums 
SET order_position = order_position + 1
WHERE order_position >= 3 AND name != 'Creative Services';
