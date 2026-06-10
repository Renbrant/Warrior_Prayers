import { useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetPrayerHistory,
  useGetGroup,
  getGetPrayerHistoryQueryKey,
  getGetGroupQueryKey,
} from "@workspace/api-client-react";
import { ArrowLeft, CheckCircle2, MinusCircle, ChevronRight, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function PrayerHistory() {
  const { groupId } = useParams<{ groupId: string }>();
  const [, setLocation] = useLocation();
  const [reasonFilter, setReasonFilter] = useState<string>("all");

  const { data: group } = useGetGroup(groupId!, { query: { queryKey: getGetGroupQueryKey(groupId!), enabled: !!groupId } });

  const params = {
    closureReason: reasonFilter !== "all" ? reasonFilter : undefined,
  };

  const { data: requests = [], isLoading } = useGetPrayerHistory(groupId!, params, {
    query: {
      queryKey: getGetPrayerHistoryQueryKey(groupId!, params),
      enabled: !!groupId,
    },
  });

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation(`/app/groups/${groupId}/requests`)}
          className="rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Prayer History</h1>
          {group?.name && (
            <p className="text-sm text-muted-foreground">{group.name}</p>
          )}
        </div>
      </div>

      <div>
        <Select value={reasonFilter} onValueChange={setReasonFilter}>
          <SelectTrigger className="w-48 rounded-xl h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All closures</SelectItem>
            <SelectItem value="answered_prayer">Answered Prayer</SelectItem>
            <SelectItem value="no_longer_needed">No Longer Needed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground space-y-2">
          <History className="w-10 h-10 mx-auto opacity-30" />
          <p className="font-medium">No history yet</p>
          <p className="text-sm">Closed prayer requests will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {requests.map((req) => {
            const displayName = group?.hidePrayerPersonNames
              ? req.prayerPersonInitials
              : req.prayerPersonName ?? req.prayerPersonInitials;

            return (
              <button
                key={req.id}
                onClick={() =>
                  setLocation(`/app/groups/${groupId}/requests/${req.id}`)
                }
                className="w-full text-left bg-card border border-border rounded-2xl p-4 hover:border-primary/40 transition-colors group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2">
                      {req.closureReason === "answered_prayer" ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Answered
                        </span>
                      ) : req.closureReason === "no_longer_needed" ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-full">
                          <MinusCircle className="w-3 h-3" /> No Longer Needed
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-full capitalize">
                          {req.status}
                        </span>
                      )}
                    </div>
                    <p className="font-semibold truncate">{req.title}</p>
                    {displayName && (
                      <p className="text-sm text-muted-foreground">
                        For <span className="font-medium">{displayName}</span>
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Closed {formatDate(req.closedAt)}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1 group-hover:text-primary transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
