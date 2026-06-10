import { useTranslation } from "react-i18next";
import { Link, useLocation } from "wouter";
import { useGetMe, useGetDashboardSummary, getGetMeQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Users, AlertCircle, CheckCircle2, Heart, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";

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
    return null; // redirecting
  }

  const statCards = [
    { label: "Groups", value: summary.groupCount, icon: Users },
    { label: "Active Requests", value: summary.activeRequestCount, icon: AlertCircle },
    { label: "Closed Requests", value: summary.closedRequestCount, icon: CheckCircle2 },
    { label: "Answered Prayers", value: summary.answeredPrayerCount, icon: Inbox },
    { label: "Praying For", value: summary.myCommittedRequestCount, icon: Heart },
  ];

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-10">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            {t("dashboard.welcome")}, {user.fullName?.split(' ')[0] || 'Warrior'}
          </h1>
          {summary.pendingInvitationCount > 0 && (
            <p className="text-primary font-medium flex items-center gap-2 mt-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              You have {summary.pendingInvitationCount} pending invitation{summary.pendingInvitationCount !== 1 ? 's' : ''}.
            </p>
          )}
        </div>
        <Button asChild className="rounded-full w-full sm:w-auto h-12 px-8 font-semibold shadow-md shadow-primary/20">
          <Link href="/app/groups/create" data-testid="btn-create-group">{t("groups.create")}</Link>
        </Button>
      </header>

      {summary.groupCount === 0 ? (
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
    </div>
  );
}