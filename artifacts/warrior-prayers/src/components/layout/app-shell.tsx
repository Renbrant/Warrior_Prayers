import { ReactNode, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Home, Users, Heart, Bell, User, ChevronRight, HandCoins } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  useListNotifications,
  useListMyGroups,
  useGetMe,
  getListNotificationsQueryKey,
  getListMyGroupsQueryKey,
  getGetMeQueryKey,
  type GroupSummary,
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
  const { t, i18n } = useTranslation();

  const { data: me } = useGetMe({
    query: { queryKey: getGetMeQueryKey(), staleTime: 300000 },
  });

  useEffect(() => {
    if (me?.preferredLanguage) {
      const lang = me.preferredLanguage;
      if (["en", "pt", "es"].includes(lang) && lang !== i18n.language) {
        i18n.changeLanguage(lang);
        localStorage.setItem("language", lang);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.preferredLanguage]);

  const { data: notifData } = useListNotifications({
    query: {
      queryKey: getListNotificationsQueryKey(),
      refetchInterval: 60000,
      staleTime: 30000,
    },
  });
  const unreadCount = notifData?.unreadCount ?? 0;

  const { data: myGroups = [] } = useListMyGroups({
    query: { queryKey: getListMyGroupsQueryKey(), staleTime: 60000 },
  });

  const navItems = [
    { icon: Home, label: t("nav.home"), href: "/app/dashboard", testId: "home" },
    { icon: Users, label: t("nav.groups"), href: "/app/groups", testId: "groups" },
    { icon: Heart, label: t("nav.pray"), href: "/app/pray", testId: "pray" },
    { icon: Bell, label: t("nav.notifications"), href: "/app/notifications", testId: "notifications", badge: unreadCount },
    { icon: User, label: t("nav.profile"), href: "/app/profile", testId: "profile" },
  ];

  return (
    <div className="flex min-h-[100dvh] bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card">
        <div className="p-6">
          <Link href="/app/dashboard" className="text-xl font-bold text-primary flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 14c-1.5 0-3-1.5-3-3s3-5 3-5 3 3.5 3 5-1.5 3-3 3z"/></svg>
            {t("app.name")}
          </Link>
        </div>
        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
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

          {myGroups.length > 0 && (
            <div className="pt-4">
              <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                {t("nav.myGroups")}
              </p>
              {(myGroups as GroupSummary[]).map((g) => (
                <Link
                  key={g.id}
                  href={`/app/groups/${g.id}`}
                  className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-colors text-sm ${
                    location === `/app/groups/${g.id}`
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  data-testid={`link-group-${g.id}`}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span className="truncate font-medium">{g.name}</span>
                  <ChevronRight className="w-3 h-3 ml-auto shrink-0 opacity-40" />
                </Link>
              ))}
            </div>
          )}
        </nav>
        <div className="p-4 border-t border-border space-y-2">
          <Link
            href="/app/profile"
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors font-medium"
            data-testid="link-profile-footer"
          >
            <User className="w-5 h-5" />
            <span>{t("nav.profileSettings")}</span>
          </Link>
          <a
            href="https://www.paypal.com/pool/9pW16FpIDW?sr=wccr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-colors font-medium"
            data-testid="link-donate"
          >
            <HandCoins className="w-5 h-5 shrink-0" />
            <span>{t("nav.supportProject")}</span>
          </a>
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
