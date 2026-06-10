import { useLocation } from "wouter";
import { useListMyGroups, getListMyGroupsQueryKey, type GroupSummary } from "@workspace/api-client-react";
import { Heart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

export default function PrayerHub() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  const { data: groups = [], isLoading } = useListMyGroups({
    query: { queryKey: getListMyGroupsQueryKey() },
  });

  return (
    <div className="p-6 md:p-10 max-w-xl mx-auto space-y-6">
      <header className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/app/dashboard")}
          className="rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" /> {t("prayerHub.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("prayerHub.chooseGroup")}</p>
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-3xl" />)}
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-card border border-border rounded-3xl p-16 text-center space-y-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">{t("prayerHub.noGroups")}</p>
          <p className="text-sm text-muted-foreground">
            {t("prayerHub.noGroupsDesc")}
          </p>
          <Button
            variant="ghost"
            onClick={() => setLocation("/app/dashboard")}
            className="rounded-full"
          >
            {t("common.backToDashboard")}
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {groups.map((group: GroupSummary) => (
            <li key={group.id}>
              <button
                className="w-full bg-card border border-border hover:border-primary/40 rounded-3xl p-5 flex items-center justify-between gap-4 transition-colors text-left"
                onClick={() => setLocation(`/app/groups/${group.id}/pray`)}
                data-testid={`btn-pray-${group.id}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                    {group.imageUrl
                      ? <img src={group.imageUrl} alt={group.name} className="w-full h-full object-cover" />
                      : <Heart className="w-5 h-5 text-primary" />
                    }
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{group.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {group.memberCount === 1
                        ? t("common.members_one", { count: 1 })
                        : t("common.members_other", { count: group.memberCount })}
                    </p>
                  </div>
                </div>
                <Heart className="w-4 h-4 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
