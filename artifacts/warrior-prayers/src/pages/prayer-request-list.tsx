import { useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  useListPrayerRequests,
  useGetGroup,
  useListCategories,
  getListPrayerRequestsQueryKey,
  getGetGroupQueryKey,
  getListCategoriesQueryKey,
} from "@workspace/api-client-react";
import {
  Plus,
  ArrowLeft,
  Flame,
  Clock,
  ChevronRight,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";

const URGENCY_BADGE: Record<string, string> = {
  urgent: "bg-red-500/20 text-red-400 border-red-500/30",
  important: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  normal: "bg-muted text-muted-foreground border-border",
};

function UrgencyBadge({ urgency }: { urgency: string }) {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${URGENCY_BADGE[urgency] ?? URGENCY_BADGE.normal}`}
    >
      {urgency === "urgent" && <Flame className="w-3 h-3 mr-1" />}
      {t(`requests.urgency.${urgency}`, urgency.charAt(0).toUpperCase() + urgency.slice(1))}
    </span>
  );
}

export default function PrayerRequestList() {
  const { groupId } = useParams<{ groupId: string }>();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data: group } = useGetGroup(groupId!, {
    query: { queryKey: getGetGroupQueryKey(groupId!), enabled: !!groupId },
  });

  const { data: categories = [] } = useListCategories(groupId!, {
    query: { queryKey: getListCategoriesQueryKey(groupId!), enabled: !!groupId },
  });

  const params = {
    status: statusFilter || undefined,
    urgency: urgencyFilter !== "all" ? urgencyFilter : undefined,
    categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
  };

  const { data: requests = [], isLoading, isError, refetch } = useListPrayerRequests(groupId!, params, {
    query: {
      queryKey: getListPrayerRequestsQueryKey(groupId!, params),
      enabled: !!groupId,
    },
  });

  const isAdmin = group?.myRole === "admin";

  if (isError) {
    return (
      <div className="p-10 flex flex-col items-center gap-4 text-center">
        <p className="text-muted-foreground">{t("requests.failedLoad")}</p>
        <Button variant="outline" onClick={() => void refetch()} className="rounded-full" data-testid="btn-retry-requests">
          {t("common.tryAgain")}
        </Button>
      </div>
    );
  }

  const statusLabel = t(`requests.status.${statusFilter}`, statusFilter);

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation(`/app/groups/${groupId}`)}
          className="rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{t("requests.title")}</h1>
          {group?.name && (
            <p className="text-sm text-muted-foreground">{group.name}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation(`/app/groups/${groupId}/history`)}
          className="rounded-full"
        >
          <History className="w-4 h-4 mr-1.5" /> {t("requests.history")}
        </Button>
        <Button
          size="sm"
          onClick={() => setLocation(`/app/groups/${groupId}/requests/new`)}
          className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          data-testid="btn-new-request"
        >
          <Plus className="w-4 h-4 mr-1.5" /> {t("requests.new")}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 rounded-xl h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">{t("requests.status.active")}</SelectItem>
            <SelectItem value="follow_up">{t("requests.status.follow_up")}</SelectItem>
            <SelectItem value="closed">{t("requests.status.closed")}</SelectItem>
            {isAdmin && <SelectItem value="archived">{t("requests.status.archived")}</SelectItem>}
          </SelectContent>
        </Select>

        <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
          <SelectTrigger className="w-36 rounded-xl h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("requests.urgency.all")}</SelectItem>
            <SelectItem value="urgent">{t("requests.urgency.urgent")}</SelectItem>
            <SelectItem value="important">{t("requests.urgency.important")}</SelectItem>
            <SelectItem value="normal">{t("requests.urgency.normal")}</SelectItem>
          </SelectContent>
        </Select>

        {categories.length > 0 && (
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40 rounded-xl h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("requests.allCategories")}</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground space-y-2">
          <Flame className="w-10 h-10 mx-auto opacity-30" />
          <p className="font-medium">{t("requests.noPrayers")}</p>
          <p className="text-sm">
            {statusFilter === "active"
              ? t("requests.beFirst")
              : t("requests.noStatus", { status: statusLabel.toLowerCase() })}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {requests.map((req) => (
            <button
              key={req.id}
              onClick={() => setLocation(`/app/groups/${groupId}/requests/${req.id}`)}
              className="w-full text-left bg-card border border-border rounded-2xl p-4 hover:border-primary/40 hover:bg-card/80 transition-colors group"
              data-testid={`prayer-request-${req.id}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <UrgencyBadge urgency={req.urgency} />
                    {req.categoryName && (
                      <span
                        className="text-xs text-muted-foreground px-2 py-0.5 rounded-full border border-border"
                        style={
                          req.categoryColor
                            ? { borderColor: req.categoryColor + "40", color: req.categoryColor }
                            : {}
                        }
                      >
                        {req.categoryName}
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-foreground truncate">{req.title}</p>
                  {(req.prayerPersonName || req.prayerPersonInitials) && (
                    <p className="text-sm text-muted-foreground">
                      {t("requests.for")}{" "}
                      <span className="font-medium">
                        {group?.hidePrayerPersonNames
                          ? req.prayerPersonInitials
                          : req.prayerPersonName ?? req.prayerPersonInitials}
                      </span>
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground pt-0.5">
                    <span>
                      {req.commitmentCount === 1
                        ? t("requests.praying_one", { count: 1 })
                        : t("requests.praying_other", { count: req.commitmentCount })}
                    </span>
                    {req.isAnonymous && (
                      <span className="italic">{t("requests.anonymous")}</span>
                    )}
                    {req.importantDate && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(req.importantDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1 group-hover:text-primary transition-colors" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
