
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useRoleManagement = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const grantRole = async (userId: string, role: 'admin' | 'moderator' | 'user') => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('grant_user_role', {
        target_user_id: userId,
        new_role: role
      });

      if (error) throw error;

      const result = data as { success: boolean; message?: string; error?: string };
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message || `${role} role granted successfully`,
        });
        return true;
      } else {
        throw new Error(result.error || 'Failed to grant role');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const revokeRole = async (userId: string, role: 'admin' | 'moderator' | 'user') => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('revoke_user_role', {
        target_user_id: userId,
        role_to_revoke: role
      });

      if (error) throw error;

      const result = data as { success: boolean; message?: string; error?: string };
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message || `${role} role revoked successfully`,
        });
        return true;
      } else {
        throw new Error(result.error || 'Failed to revoke role');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getUserRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_user_roles_list', {
        target_user_id: userId
      });

      if (error) throw error;

      const result = data as { success: boolean; roles?: string[]; error?: string };
      
      if (result.success) {
        return result.roles || [];
      } else {
        throw new Error(result.error || 'Failed to get user roles');
      }
    } catch (error: any) {
      console.error('Error getting user roles:', error);
      return [];
    }
  };

  return {
    grantRole,
    revokeRole,
    getUserRoles,
    loading
  };
};
