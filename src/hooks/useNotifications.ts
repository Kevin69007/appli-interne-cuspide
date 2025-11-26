import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Notification {
  id: string;
  employee_id: string;
  type: string;
  titre: string;
  message: string;
  lu: boolean;
  statut: 'actif' | 'valide' | 'supprime';
  url: string | null;
  created_at: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async (statut?: 'actif' | 'valide') => {
    if (!user) return;

    try {
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!employee) return;

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('employee_id', employee.id)
        .order('created_at', { ascending: false });

      if (statut) {
        query = query.eq('statut', statut);
      } else {
        query = query.in('statut', ['actif', 'valide']);
      }

      const { data, error } = await query;

      if (error) throw error;

      setNotifications((data as Notification[]) || []);
      
      // Calculate unread count only for active notifications
      const unread = (data || []).filter(n => !n.lu && n.statut === 'actif').length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ lu: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, lu: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
      toast({
        title: "Erreur",
        description: "Impossible de marquer comme lu",
        variant: "destructive",
      });
    }
  };

  const markAsUnread = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ lu: false })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, lu: false } : n)
      );
      setUnreadCount(prev => prev + 1);
    } catch (error) {
      console.error('Error marking as unread:', error);
      toast({
        title: "Erreur",
        description: "Impossible de marquer comme non lu",
        variant: "destructive",
      });
    }
  };

  const validate = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ statut: 'valide', lu: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, statut: 'valide', lu: true } : n)
      );
      setUnreadCount(prev => {
        const notification = notifications.find(n => n.id === notificationId);
        return notification && !notification.lu ? Math.max(0, prev - 1) : prev;
      });
    } catch (error) {
      console.error('Error validating notification:', error);
      toast({
        title: "Erreur",
        description: "Impossible de valider la notification",
        variant: "destructive",
      });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ statut: 'supprime' })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => {
        const notification = notifications.find(n => n.id === notificationId);
        return notification && !notification.lu ? Math.max(0, prev - 1) : prev;
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la notification",
        variant: "destructive",
      });
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!employee) return;

      const { error } = await supabase
        .from('notifications')
        .update({ lu: true })
        .eq('employee_id', employee.id)
        .eq('statut', 'actif');

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
      setUnreadCount(0);

      toast({
        title: "Succès",
        description: "Toutes les notifications ont été marquées comme lues",
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast({
        title: "Erreur",
        description: "Impossible de marquer toutes les notifications comme lues",
        variant: "destructive",
      });
    }
  };

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    // Subscribe to new notifications
    const getEmployeeAndSubscribe = async () => {
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!employee) return;

      const channel = supabase
        .channel('notifications-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `employee_id=eq.${employee.id}`,
          },
          (payload) => {
            const newNotification = payload.new as Notification;
            setNotifications(prev => [newNotification, ...prev]);
            if (!newNotification.lu && newNotification.statut === 'actif') {
              setUnreadCount(prev => prev + 1);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `employee_id=eq.${employee.id}`,
          },
          (payload) => {
            const updated = payload.new as Notification;
            setNotifications(prev => 
              prev.map(n => n.id === updated.id ? updated : n)
            );
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    getEmployeeAndSubscribe();
  }, [user]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAsUnread,
    validate,
    deleteNotification,
    markAllAsRead,
    refresh: fetchNotifications,
  };
};
