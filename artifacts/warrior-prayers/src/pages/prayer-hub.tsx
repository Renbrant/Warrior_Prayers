import { useLocation } from "wouter";
import { useListMyGroups, getListMyGroupsQueryKey, type GroupSummary } from "@workspace/api-client-react";
import { Heart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function PrayerHub() {
  const [, setLocation] = useLocation();

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
            <Heart className="w-5 h-5 text-primary" /> Prayer Mode
          </h1>
          <p className="text-sm text-muted-foreground">Choose a group to begin</p>
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
          <p className="text-muted-foreground font-medium">No groups yet</p>
          <p className="text-sm text-muted-foreground">
            Join or create a prayer group to start Prayer Mode.
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
        <ul className="space-y-3">
          {groups.map((group: GroupSummary) => (
            <li key={group.id}>
              <button
                className="w-full bg-card border border-border hover:border-primary/40 rounded-3xl p-5 flex items-center justify-between gap-4 transition-colors text-left"
                onClick={() => setLocation(`/app/groups/${group.id}/pray`)}
                data-testid={`btn-pray-group-${group.id}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground truncate">{group.name}</p>
                  {group.churchName && (
                    <p className="text-sm text-muted-foreground truncate">{group.churchName}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2 text-primary font-semibold text-sm">
                  <Heart className="w-4 h-4" /> Pray
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
