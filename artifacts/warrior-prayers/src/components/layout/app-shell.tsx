import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Home, Users, Heart, Bell, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  useListNotifications,
  getListNotificationsQueryKey,
} from "@workspace/api-client-react";

function NotificationBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center leading-none">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { t } = useTranslation();

  const { data: notifData } = useListNotifications({
    query: {
      queryKey: getListNotificationsQueryKey(),
      refetchInterval: 60000,
      staleTime: 30000,
    },
  });
  const unreadCount = notifData?.unreadCount ?? 0;

  const navItems = [
    { icon: Home, label: "Home", href: "/app/dashboard", testId: "home" },
    { icon: Users, label: "Groups", href: "/app/groups", testId: "groups" },
    { icon: Heart, label: "Pray", href: "/app/pray", testId: "pray" },
    { icon: Bell, label: "Notifications", href: "/app/notifications", testId: "notifications", badge: unreadCount },
    { icon: User, label: "Profile", href: "/app/profile", testId: "profile" },
  ];

  return (
    <div className="flex min-h-[100dvh] bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card">
        <div className="p-6">
          <Link href="/app/dashboard" className="text-xl font-bold text-primary flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 14c-1.5 0-3-1.5-3-3s3-5 3-5 3 3.5 3 5-1.5 3-3 3z"/></svg>
            Warrior Prayers
          </Link>
        </div>
        <nav className="flex-1 px-4 space-y-1 mt-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                location.startsWith(item.href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              data-testid={`link-${item.testId}`}
            >
              <span className="relative">
                <item.icon className="w-5 h-5" />
                {item.badge != null && <NotificationBadge count={item.badge} />}
              </span>
              <span className="font-medium">{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span className="ml-auto min-w-[22px] h-[22px] px-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <Link
            href="/app/profile"
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors font-medium"
            data-testid="link-profile-footer"
          >
            <User className="w-5 h-5" />
            <span>{t("profile.title", "Profile & Settings")}</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-0 overflow-y-auto">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card flex justify-around p-2 z-50">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center p-2 rounded-xl min-w-[60px] ${
              location.startsWith(item.href)
                ? "text-primary"
                : "text-muted-foreground"
            }`}
            data-testid={`mobile-link-${item.testId}`}
          >
            <span className="relative">
              <item.icon className="w-6 h-6 mb-1" />
              {item.badge != null && <NotificationBadge count={item.badge} />}
            </span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
