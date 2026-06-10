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
import { Users, AlertCircle, CheckCircle2, Heart, Inbox, MapPin, Church, Bell, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    admin: "bg-primary/20 text-primary border-primary/30",
    moderator: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    member: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${colors[role] ?? colors.member}`}>
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  const { data: user, isLoading: isUserLoading } = useGetMe({
    query: { queryKey: getGetMeQueryKey() }
  });

  const { data: summary, isLoading: isSummaryLoading } = useGetDashboardSummary({
    query: {
      queryKey: getGetDashboardSummaryQueryKey(),
      enabled: !!user?.isProfileComplete
    }
  });

  const { data: groups, isLoading: isGroupsLoading } = useListMyGroups({
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
    { label: "Groups", value: summary.groupCount, icon: Users },
    { label: "Active Requests", value: summary.activeRequestCount, icon: AlertCircle },
    { label: "Closed Requests", value: summary.closedRequestCount, icon: CheckCircle2 },
    { label: "Answered Prayers", value: summary.answeredPrayerCount, icon: Inbox },
    { label: "Praying For", value: summary.myCommittedRequestCount, icon: Heart },
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
              You have {summary.pendingInvitationCount} pending invitation{summary.pendingInvitationCount !== 1 ? 's' : ''} →
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
            <h2 className="text-xl font-bold text-foreground">Your Groups</h2>
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
                      {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                    </span>
                    <RoleBadge role={group.myRole} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
