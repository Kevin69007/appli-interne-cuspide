import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEmployee } from '@/contexts/EmployeeContext';
import { useToast } from '@/hooks/use-toast';

// VAPID public key - stored here as it's meant to be public
const VAPID_PUBLIC_KEY = 'BIT8KvzMKaMtPi4U_kQiPgY4Lij6whI4s7wlAFYWFWH1P66KSDbrpgvjZOW3K671BhqtbUAdW7fhmu1LLMh_OQs';

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  permission: NotificationPermission | 'default';
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}

export function usePushNotifications() {
  const { employee } = useEmployee();
  const { toast } = useToast();
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    isLoading: true,
    permission: 'default',
  });

  // Check if push notifications are supported
  const checkSupport = useCallback(() => {
    const isSupported = 
      'serviceWorker' in navigator && 
      'PushManager' in window && 
      'Notification' in window;
    
    return isSupported;
  }, []);

  // Get current subscription status
  const checkSubscription = useCallback(async () => {
    if (!checkSupport() || !employee?.id) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        // Verify subscription exists in database
        const { data } = await supabase
          .from('push_subscriptions')
          .select('id')
          .eq('employee_id', employee.id)
          .eq('endpoint', subscription.endpoint)
          .single();

        setState(prev => ({
          ...prev,
          isSupported: true,
          isSubscribed: !!data,
          isLoading: false,
          permission: Notification.permission,
        }));
      } else {
        setState(prev => ({
          ...prev,
          isSupported: true,
          isSubscribed: false,
          isLoading: false,
          permission: Notification.permission,
        }));
      }
    } catch (error) {
      console.error('Error checking push subscription:', error);
      setState(prev => ({
        ...prev,
        isSupported: checkSupport(),
        isSubscribed: false,
        isLoading: false,
        permission: Notification.permission,
      }));
    }
  }, [employee?.id, checkSupport]);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!employee?.id) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour activer les notifications",
        variant: "destructive",
      });
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        toast({
          title: "Permission refusée",
          description: "Vous avez refusé les notifications. Vous pouvez les activer dans les paramètres de votre navigateur.",
          variant: "destructive",
        });
        setState(prev => ({ ...prev, isLoading: false, permission }));
        return false;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const subscriptionJson = subscription.toJSON();
      
      // Save subscription to database
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          employee_id: employee.id,
          endpoint: subscription.endpoint,
          p256dh: subscriptionJson.keys?.p256dh || '',
          auth: subscriptionJson.keys?.auth || '',
          device_name: navigator.userAgent.substring(0, 100),
        }, {
          onConflict: 'employee_id,endpoint',
        });

      if (error) throw error;

      // Ensure notification preferences exist
      await supabase
        .from('notification_preferences')
        .upsert({
          employee_id: employee.id,
          push_enabled: true,
        }, {
          onConflict: 'employee_id',
        });

      setState(prev => ({
        ...prev,
        isSubscribed: true,
        isLoading: false,
        permission: 'granted',
      }));

      toast({
        title: "Notifications activées",
        description: "Vous recevrez maintenant des notifications push",
      });

      return true;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'activer les notifications",
        variant: "destructive",
      });
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [employee?.id, toast]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!employee?.id) return false;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remove from database
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('employee_id', employee.id)
          .eq('endpoint', subscription.endpoint);
      }

      setState(prev => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
      }));

      toast({
        title: "Notifications désactivées",
        description: "Vous ne recevrez plus de notifications push sur cet appareil",
      });

      return true;
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      toast({
        title: "Erreur",
        description: "Impossible de désactiver les notifications",
        variant: "destructive",
      });
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [employee?.id, toast]);

  // Initialize on mount
  useEffect(() => {
    const isSupported = checkSupport();
    setState(prev => ({ 
      ...prev, 
      isSupported,
      permission: isSupported ? Notification.permission : 'default',
    }));
    
    if (isSupported && employee?.id) {
      checkSubscription();
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [checkSupport, checkSubscription, employee?.id]);

  return {
    ...state,
    subscribe,
    unsubscribe,
    refresh: checkSubscription,
  };
}