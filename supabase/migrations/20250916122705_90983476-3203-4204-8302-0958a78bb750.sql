-- Convert pet 1649 to oddstat with triple duplicate pattern (playfulness, loyalty, curiosity)
UPDATE public.user_pets 
SET 
  is_odd_stat = true,
  extra_stats = jsonb_build_object(
    'duplicate_pattern', 'triple_duplicate',
    'playfulness_alt', floor(random() * 71 + 20)::integer,  -- Random 20-90
    'loyalty_alt', floor(random() * 71 + 20)::integer,       -- Random 20-90
    'curiosity_alt', floor(random() * 71 + 20)::integer      -- Random 20-90
  )
WHERE pet_number = 1649;