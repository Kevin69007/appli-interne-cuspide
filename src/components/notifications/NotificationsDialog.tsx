import { useNotifications } from "@/hooks/useNotifications";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Eye, EyeOff, Trash2, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

interface NotificationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NotificationsDialog = ({ open, onOpenChange }: NotificationsDialogProps) => {
  const { notifications, markAsRead, markAsUnread, validate, deleteNotification, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("all");

  const activeNotifications = notifications.filter(n => n.statut === 'actif');
  const unreadNotifications = activeNotifications.filter(n => !n.lu);
  const validatedNotifications = notifications.filter(n => n.statut === 'valide');

  const getDisplayedNotifications = () => {
    switch (activeTab) {
      case "unread":
        return unreadNotifications;
      case "validated":
        return validatedNotifications;
      default:
        return activeNotifications;
    }
  };

  const displayedNotifications = getDisplayedNotifications();

  const handleNotificationClick = async (notification: any) => {
    if (!notification.lu) {
      await markAsRead(notification.id);
    }
    if (notification.url) {
      navigate(notification.url);
      onOpenChange(false);
    }
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
    setSelectedIds(prev => prev.filter(id => id !== notificationId));
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
    setSelectedIds(prev => prev.filter(id => id !== notificationId));
  };

  const handleSelectAll = () => {
    if (selectedIds.length === displayedNotifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayedNotifications.map(n => n.id));
    }
  };

  const handleBulkValidate = async () => {
    for (const id of selectedIds) {
      await validate(id);
    }
    setSelectedIds([]);
  };

  const handleBulkDelete = async () => {
    for (const id of selectedIds) {
      await deleteNotification(id);
    }
    setSelectedIds([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Gestion des notifications</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                Toutes ({activeNotifications.length})
              </TabsTrigger>
              <TabsTrigger value="unread">
                Non lues ({unreadNotifications.length})
              </TabsTrigger>
              <TabsTrigger value="validated">
                Validées ({validatedNotifications.length})
              </TabsTrigger>
            </TabsList>
          </div>

          {activeTab !== "validated" && activeNotifications.length > 0 && (
            <div className="px-6 py-3 border-b border-border flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedIds.length === displayedNotifications.length ? "Tout désélectionner" : "Tout sélectionner"}
              </Button>
              
              {selectedIds.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkValidate}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Valider ({selectedIds.length})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Supprimer ({selectedIds.length})
                  </Button>
                </>
              )}

              {activeTab === "all" && unreadNotifications.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                >
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Tout marquer comme lu
                </Button>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="all" className="m-0">
              <NotificationsList
                notifications={activeNotifications}
                selectedIds={selectedIds}
                onToggleSelect={(id) => {
                  setSelectedIds(prev => 
                    prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                  );
                }}
                onNotificationClick={handleNotificationClick}
                onToggleRead={handleToggleRead}
                onValidate={handleValidate}
                onDelete={handleDelete}
                showCheckbox
              />
            </TabsContent>

            <TabsContent value="unread" className="m-0">
              <NotificationsList
                notifications={unreadNotifications}
                selectedIds={selectedIds}
                onToggleSelect={(id) => {
                  setSelectedIds(prev => 
                    prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                  );
                }}
                onNotificationClick={handleNotificationClick}
                onToggleRead={handleToggleRead}
                onValidate={handleValidate}
                onDelete={handleDelete}
                showCheckbox
              />
            </TabsContent>

            <TabsContent value="validated" className="m-0">
              <NotificationsList
                notifications={validatedNotifications}
                selectedIds={[]}
                onToggleSelect={() => {}}
                onNotificationClick={handleNotificationClick}
                onToggleRead={handleToggleRead}
                onValidate={handleValidate}
                onDelete={handleDelete}
                showCheckbox={false}
              />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

interface NotificationsListProps {
  notifications: any[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onNotificationClick: (notification: any) => void;
  onToggleRead: (e: React.MouseEvent, notification: any) => void;
  onValidate: (e: React.MouseEvent, id: string) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  showCheckbox: boolean;
}

const NotificationsList = ({
  notifications,
  selectedIds,
  onToggleSelect,
  onNotificationClick,
  onToggleRead,
  onValidate,
  onDelete,
  showCheckbox,
}: NotificationsListProps) => {
  if (notifications.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Aucune notification</p>
      </div>
    );
  }

  return (
    <div>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          onClick={() => onNotificationClick(notification)}
          className={`p-4 border-b border-border hover:bg-accent cursor-pointer transition-colors ${
            !notification.lu && notification.statut === 'actif' ? 'bg-accent/50' : ''
          }`}
        >
          <div className="flex items-start gap-3">
            {showCheckbox && (
              <Checkbox
                checked={selectedIds.includes(notification.id)}
                onCheckedChange={() => onToggleSelect(notification.id)}
                onClick={(e) => e.stopPropagation()}
              />
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {!notification.lu && notification.statut === 'actif' && (
                  <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                )}
                <p className="font-medium text-foreground">
                  {notification.titre}
                </p>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
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
              {notification.statut === 'actif' && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => onValidate(e, notification.id)}
                    title="Valider"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => onToggleRead(e, notification)}
                    title={notification.lu ? "Marquer comme non lu" : "Marquer comme lu"}
                  >
                    {notification.lu ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                    onClick={(e) => onDelete(e, notification.id)}
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
