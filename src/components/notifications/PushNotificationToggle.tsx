import { Bell, BellOff, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useTranslation } from 'react-i18next';

interface PushNotificationToggleProps {
  variant?: 'button' | 'switch';
  showLabel?: boolean;
  className?: string;
}

export function PushNotificationToggle({ 
  variant = 'switch', 
  showLabel = true,
  className = '' 
}: PushNotificationToggleProps) {
  const { t } = useTranslation('common');
  const { 
    isSupported, 
    isSubscribed, 
    isLoading, 
    permission,
    needsInstallation,
    isIOS,
    subscribe, 
    unsubscribe 
  } = usePushNotifications();

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  // Show iOS installation guide
  if (needsInstallation && isIOS) {
    return (
      <div className={`flex items-center gap-2 text-xs text-muted-foreground ${className}`}>
        <Download className="h-4 w-4" />
        <span>Installez l'app (Safari → Partager → Sur l'écran d'accueil)</span>
      </div>
    );
  }

  // Not supported
  if (!isSupported) {
    return null;
  }

  // Permission denied
  if (permission === 'denied') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {showLabel && (
          <div className="flex items-center gap-2">
            <BellOff className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{t('notifications.push')}</span>
          </div>
        )}
        <span className="text-xs text-muted-foreground">
          {t('notifications.blocked')}
        </span>
      </div>
    );
  }

  if (variant === 'button') {
    return (
      <Button
        variant={isSubscribed ? "outline" : "default"}
        size="sm"
        onClick={handleToggle}
        disabled={isLoading}
        className={className}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : isSubscribed ? (
          <BellOff className="h-4 w-4 mr-2" />
        ) : (
          <Bell className="h-4 w-4 mr-2" />
        )}
        {isSubscribed ? t('notifications.disable') : t('notifications.enable')}
      </Button>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showLabel && (
        <div className="flex items-center gap-2">
          {isSubscribed ? (
            <Bell className="h-4 w-4 text-primary" />
          ) : (
            <BellOff className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm">
            {t('notifications.push')}
          </span>
        </div>
      )}
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Switch
          checked={isSubscribed}
          onCheckedChange={handleToggle}
          disabled={isLoading}
        />
      )}
    </div>
  );
}
