import { useLocation } from "wouter";
import {
  useListMyGroups,
  useGetMe,
  getListMyGroupsQueryKey,
  getGetMeQueryKey,
} from "@workspace/api-client-react";
import {
  Users,
  MapPin,
  Church,
  ChevronRight,
  Plus,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    admin: "bg-primary/20 text-primary border-primary/30",
    moderator: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    member: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${colors[role] ?? colors.member}`}
    >
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  );
}

export default function Groups() {
  const [, setLocation] = useLocation();

  const { data: user } = useGetMe({
    query: { queryKey: getGetMeQueryKey(), staleTime: 60000 },
  });

  const {
    data: groups = [],
    isLoading,
    isError,
    refetch,
  } = useListMyGroups({
    query: {
      queryKey: getListMyGroupsQueryKey(),
      enabled: !!user?.isProfileComplete,
    },
  });

  if (isError) {
    return (
      <div className="p-10 flex flex-col items-center gap-4 text-center">
        <AlertCircle className="w-10 h-10 text-destructive" />
        <p className="text-muted-foreground">Failed to load groups. Please try again.</p>
        <Button variant="outline" onClick={() => void refetch()} className="rounded-full">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> My Groups
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Prayer groups you belong to
          </p>
        </div>
        <Button asChild className="rounded-full h-10 px-6 font-semibold shadow-md shadow-primary/20 shrink-0">
          <Link href="/app/groups/create" data-testid="btn-create-group">
            <Plus className="w-4 h-4 mr-1" /> New Group
          </Link>
        </Button>
      </header>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-3xl" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-card border border-border rounded-[2rem] p-12 text-center max-w-xl mx-auto mt-8 shadow-sm">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-primary" />
          </div>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            You are not part of any prayer group yet. Create a group or accept an invitation to get started.
          </p>
          <Button
            asChild
            size="lg"
            className="rounded-full h-12 px-8 font-semibold shadow-lg shadow-primary/20"
          >
            <Link href="/app/groups/create" data-testid="btn-create-group-empty">
              Create Prayer Group
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => setLocation(`/app/groups/${group.id}`)}
              data-testid={`group-card-${group.id}`}
              className="bg-card border border-border rounded-3xl p-6 text-left hover:border-primary/50 hover:shadow-md transition-all group w-full"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors mt-1" />
              </div>
              <h3 className="font-bold text-foreground truncate text-base">
                {group.name}
              </h3>
              {group.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {group.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-2">
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
                  {group.memberCount} member{group.memberCount !== 1 ? "s" : ""}
                </span>
                <RoleBadge role={group.myRole} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
