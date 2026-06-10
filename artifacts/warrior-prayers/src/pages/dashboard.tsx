import { useTranslation } from "react-i18next";
import { Link, useLocation } from "wouter";
import {
  useGetMe,
  useGetDashboardSummary,
  useListMyGroups,
  getGetMeQueryKey,
  getGetDashboardSummaryQueryKey,
  getListMyGroupsQueryKey,
} from "@workspace/api-client-react";
import { Users, AlertCircle, CheckCircle2, Heart, Inbox, MapPin, Church, Bell, ChevronRight, HandCoins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";

function RoleBadge({ role }: { role: string }) {
  const { t } = useTranslation();
  const colors: Record<string, string> = {
    admin: "bg-primary/20 text-primary border-primary/30",
    moderator: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    member: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${colors[role] ?? colors.member}`}>
      {t(`role.${role}`, role.charAt(0).toUpperCase() + role.slice(1))}
    </span>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  const { data: user, isLoading: isUserLoading, isError: isUserError, refetch: refetchUser } = useGetMe({
    query: { queryKey: getGetMeQueryKey() }
  });

  const { data: summary, isLoading: isSummaryLoading, isError: isSummaryError, refetch: refetchSummary } = useGetDashboardSummary({
    query: {
      queryKey: getGetDashboardSummaryQueryKey(),
      enabled: !!user?.isProfileComplete
    }
  });

  const { data: groups, isLoading: isGroupsLoading, isError: isGroupsError, refetch: refetchGroups } = useListMyGroups({
    query: {
      queryKey: getListMyGroupsQueryKey(),
      enabled: !!user?.isProfileComplete
    }
  });

  useEffect(() => {
    if (user && !user.isProfileComplete) {
      setLocation("/complete-profile");
    }
  }, [user, setLocation]);

  if (isUserError || isSummaryError || isGroupsError) {
    return (
      <div className="p-10 flex flex-col items-center gap-4 text-center">
        <AlertCircle className="w-10 h-10 text-destructive" />
        <p className="text-muted-foreground">{t("common.failedLoad")}</p>
        <Button
          variant="outline"
          onClick={() => { void refetchUser(); void refetchSummary(); void refetchGroups(); }}
          className="rounded-full"
          data-testid="btn-retry-dashboard"
        >
          {t("common.tryAgain")}
        </Button>
      </div>
    );
  }

  if (isUserLoading || isSummaryLoading) {
    return (
      <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-10">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-5 w-48 rounded-md" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-36 rounded-3xl" />)}
        </div>
      </div>
    );
  }

  if (!user || !user.isProfileComplete || !summary) {
    return null;
  }

  const statCards = [
    { label: t("dashboard.stat.groups"), value: summary.groupCount, icon: Users },
    { label: t("dashboard.stat.activeRequests"), value: summary.activeRequestCount, icon: AlertCircle },
    { label: t("dashboard.stat.closedRequests"), value: summary.closedRequestCount, icon: CheckCircle2 },
    { label: t("dashboard.stat.answeredPrayers"), value: summary.answeredPrayerCount, icon: Inbox },
    { label: t("dashboard.stat.prayingFor"), value: summary.myPrayedCount, icon: Heart },
  ];

  const hasGroups = (groups?.length ?? 0) > 0;

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-10">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            {t("dashboard.welcome")}, {user.fullName?.split(' ')[0] || 'Warrior'}
          </h1>
          {summary.pendingInvitationCount > 0 && (
            <button
              onClick={() => setLocation("/app/invitations")}
              className="flex items-center gap-2 text-primary font-medium mt-2 hover:underline"
              data-testid="btn-pending-invitations"
            >
              <Bell className="w-4 h-4 animate-pulse" />
              {summary.pendingInvitationCount === 1
                ? t("dashboard.pendingInvitations_one", { count: 1 })
                : t("dashboard.pendingInvitations_other", { count: summary.pendingInvitationCount })}
            </button>
          )}
        </div>
        <Button asChild className="rounded-full w-full sm:w-auto h-12 px-8 font-semibold shadow-md shadow-primary/20">
          <Link href="/app/groups/create" data-testid="btn-create-group">{t("groups.create")}</Link>
        </Button>
      </header>

      {hasGroups && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {statCards.map((stat, i) => (
            <div key={i} className="bg-card border border-border rounded-3xl p-6 flex flex-col justify-between h-40 hover:border-primary/50 transition-colors shadow-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-sm font-semibold tracking-wide uppercase">{stat.label}</span>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <stat.icon className="w-4 h-4 text-primary" />
                </div>
              </div>
              <div className="text-4xl font-extrabold text-foreground">{stat.value}</div>
            </div>
          ))}
        </div>
      )}

      {!hasGroups ? (
        <div className="bg-card border border-border rounded-[2rem] p-12 sm:p-16 text-center max-w-2xl mx-auto mt-16 shadow-sm">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <Users className="w-12 h-12 text-primary" />
          </div>
          <p className="text-xl text-muted-foreground mb-10 leading-relaxed max-w-md mx-auto">
            {t("dashboard.noGroups")}
          </p>
          <Button asChild size="lg" className="rounded-full h-14 px-10 text-base font-semibold shadow-lg shadow-primary/20">
            <Link href="/app/groups/create" data-testid="btn-create-group-empty">{t("groups.create")}</Link>
          </Button>
        </div>
      ) : (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">{t("dashboard.yourGroups")}</h2>
          </div>
          {isGroupsLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-3xl" />)}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups?.map((group) => (
                <button
                  key={group.id}
                  onClick={() => setLocation(`/app/groups/${group.id}`)}
                  data-testid={`group-card-${group.id}`}
                  className="bg-card border border-border rounded-3xl p-6 text-left hover:border-primary/50 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors mt-0.5" />
                  </div>
                  <h3 className="font-bold text-foreground truncate">{group.name}</h3>
                  {group.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{group.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {group.churchName && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Church className="w-3 h-3" /> {group.churchName}
                      </span>
                    )}
                    {group.city && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" /> {group.city}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-muted-foreground">
                      {group.memberCount === 1
                        ? t("common.members_one", { count: 1 })
                        : t("common.members_other", { count: group.memberCount })}
                    </span>
                    <RoleBadge role={group.myRole} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Donation card */}
      <div className="mt-8 rounded-3xl border border-primary/30 bg-primary/5 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
          <HandCoins className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground">{t("dashboard.donate.title")}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("dashboard.donate.desc")}
          </p>
        </div>
        <a
          href="https://www.paypal.com/pool/9pW16FpIDW?sr=wccr"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shrink-0"
          data-testid="btn-donate-dashboard"
        >
          <HandCoins className="w-4 h-4" />
          {t("dashboard.donate.btn")}
        </a>
      </div>
    </div>
  );
}
