
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { logRoleEscalation } from '@/utils/securityLogger';

interface AdminValidationResult {
  isAdmin: boolean;
  isModerator: boolean;
  loading: boolean;
  validateAction: (actionType: string) => Promise<boolean>;
}

export const useAdminValidation = (): AdminValidationResult => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserRoles = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsModerator(false);
        setLoading(false);
        return;
      }

      try {
        // Check if user has admin role
        const { data: adminCheck, error: adminError } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });

        if (adminError) {
          console.error('Error checking admin role:', adminError);
          setIsAdmin(false);
        } else {
          setIsAdmin(adminCheck || false);
        }

        // Check if user has moderator role
        const { data: modCheck, error: modError } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'moderator'
        });

        if (modError) {
          console.error('Error checking moderator role:', modError);
          setIsModerator(false);
        } else {
          setIsModerator(modCheck || false);
        }

      } catch (error) {
        console.error('Error in role checking:', error);
        setIsAdmin(false);
        setIsModerator(false);
      } finally {
        setLoading(false);
      }
    };

    checkUserRoles();
  }, [user]);

  const validateAction = async (actionType: string): Promise<boolean> => {
    if (!user) {
      return false;
    }

    try {
      const { data: isValid, error } = await supabase.rpc('validate_admin_action', {
        action_type: actionType
      });

      if (error) {
        console.error('Error validating admin action:', error);
        logRoleEscalation(actionType, user.id, {
          error: error.message,
          attempted_at: new Date().toISOString()
        });
        return false;
      }

      if (!isValid) {
        logRoleEscalation(actionType, user.id, {
          reason: 'Insufficient permissions',
          attempted_at: new Date().toISOString()
        });
      }

      return isValid || false;

    } catch (error) {
      console.error('Unexpected error in action validation:', error);
      logRoleEscalation(actionType, user.id, {
        error: 'Unexpected validation error',
        attempted_at: new Date().toISOString()
      });
      return false;
    }
  };

  return {
    isAdmin,
    isModerator,
    loading,
    validateAction
  };
};
