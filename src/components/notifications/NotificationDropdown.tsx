import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Check, Eye, EyeOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface NotificationDropdownProps {
  onClose: () => void;
  onOpenDialog: () => void;
}

export const NotificationDropdown = ({ onClose, onOpenDialog }: NotificationDropdownProps) => {
  const { notifications, markAsRead, markAsUnread, validate, loading } = useNotifications();
  const navigate = useNavigate();

  const activeNotifications = notifications
    .filter(n => n.statut === 'actif')
    .slice(0, 10);

  const handleNotificationClick = async (notification: any) => {
    if (!notification.lu) {
      await markAsRead(notification.id);
    }
    if (notification.url) {
      navigate(notification.url);
    }
    onClose();
  };

  const handleToggleRead = async (e: React.MouseEvent, notification: any) => {
    e.stopPropagation();
    if (notification.lu) {
      await markAsUnread(notification.id);
    } else {
      await markAsRead(notification.id);
    }
  };

  const handleValidate = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await validate(notificationId);
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Chargement...
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="p-3 border-b border-border">
        <h3 className="font-semibold text-foreground">Notifications</h3>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {activeNotifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>Aucune notification</p>
          </div>
        ) : (
          activeNotifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-3 border-b border-border hover:bg-accent cursor-pointer transition-colors ${
                !notification.lu ? 'bg-accent/50' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {!notification.lu && (
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    )}
                    <p className="font-medium text-sm text-foreground truncate">
                      {notification.titre}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </p>
                </div>
                
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => handleValidate(e, notification.id)}
                    title="Valider"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => handleToggleRead(e, notification)}
                    title={notification.lu ? "Marquer comme non lu" : "Marquer comme lu"}
                  >
                    {notification.lu ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {activeNotifications.length > 0 && (
        <div className="p-3 border-t border-border">
          <Button
            variant="outline"
            className="w-full"
            onClick={onOpenDialog}
          >
            Voir toutes les notifications ({notifications.filter(n => n.statut === 'actif').length})
          </Button>
        </div>
      )}
    </div>
  );
};
