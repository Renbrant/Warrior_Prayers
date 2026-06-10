import { useQueryClient } from "@tanstack/react-query";
import {
  useListNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  getListNotificationsQueryKey,
} from "@workspace/api-client-react";
import { Bell, Check, CheckCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

const TYPE_ICONS: Record<string, string> = {
  group_invitation: "📨",
  removed_from_group: "🚪",
  new_prayer_request: "🙏",
  request_answered: "✨",
  new_comment: "💬",
  new_update: "📝",
};

export default function Notifications() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, isError, refetch } = useListNotifications({
    query: { queryKey: getListNotificationsQueryKey() },
  });

  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const handleMarkRead = (id: string) => {
    markRead.mutate(
      { notificationId: id },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        },
        onError: () => toast({ title: "Failed to mark as read", variant: "destructive" }),
      },
    );
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate(undefined, {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        toast({ title: "All notifications marked as read" });
      },
      onError: () => toast({ title: "Failed to mark all as read", variant: "destructive" }),
    });
  };

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto space-y-6">
      <header className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/app/dashboard")}
          className="rounded-full"
          data-testid="btn-back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" /> Notifications
            {unreadCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">Your activity feed</p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markAllRead.isPending}
            className="rounded-full gap-1.5 text-muted-foreground hover:text-foreground"
            data-testid="btn-mark-all-read"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </Button>
        )}
      </header>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="bg-card border border-border rounded-3xl p-16 text-center space-y-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
            <Bell className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">Could not load notifications</p>
          <p className="text-sm text-muted-foreground">Check your connection and try again.</p>
          <Button
            variant="outline"
            onClick={() => void refetch()}
            className="rounded-full"
            data-testid="btn-retry"
          >
            Try Again
          </Button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-card border border-border rounded-3xl p-16 text-center space-y-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
            <Bell className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">No notifications yet</p>
          <p className="text-sm text-muted-foreground">
            You'll be notified about group invitations, new prayer requests, and more.
          </p>
          <Button
            variant="ghost"
            onClick={() => setLocation("/app/dashboard")}
            className="rounded-full"
          >
            Back to Dashboard
          </Button>
        </div>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => {
            const isUnread = !n.readAt;
            const icon = TYPE_ICONS[n.type] ?? "🔔";
            return (
              <li
                key={n.id}
                className={cn(
                  "bg-card border rounded-2xl p-4 flex items-start gap-4 transition-colors",
                  isUnread
                    ? "border-primary/30 bg-primary/5"
                    : "border-border",
                )}
                data-testid={`notification-${n.id}`}
              >
                <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center shrink-0 text-lg">
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("font-semibold text-sm", isUnread ? "text-foreground" : "text-muted-foreground")}>
                      {n.title}
                    </p>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                </div>
                {isUnread && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 w-8 h-8 rounded-full text-muted-foreground hover:text-primary"
                    onClick={() => handleMarkRead(n.id)}
                    disabled={markRead.isPending}
                    data-testid={`btn-mark-read-${n.id}`}
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
