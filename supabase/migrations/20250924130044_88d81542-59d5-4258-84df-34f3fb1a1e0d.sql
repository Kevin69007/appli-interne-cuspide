-- One-time compensation: Grant 8 litter licenses to all current PawClub members
DO $$
DECLARE
    member_record RECORD;
    result JSON;
BEGIN
    -- Loop through all current PawClub members
    FOR member_record IN 
        SELECT id 
        FROM public.profiles 
        WHERE pawclub_member = true
    LOOP
        -- Grant 8 litter licenses to each member
        SELECT public.grant_pawclub_litter_licenses(
            member_record.id, 
            8, 
            'One-time compensation for missed months'
        ) INTO result;
        
        RAISE NOTICE 'Granted 8 litter licenses to PawClub member: %', member_record.id;
    END LOOP;
    
    RAISE NOTICE 'Completed granting compensation litter licenses to all PawClub members';
END $$;