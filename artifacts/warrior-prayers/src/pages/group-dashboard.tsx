import { useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetGroup,
  useListGroupMembers,
  useLeaveGroup,
  getGetGroupQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Users, MapPin, Church, BookOpen, Settings, UserPlus, Plus, Flame, ArrowLeft, LogOut, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    admin: "bg-primary/20 text-primary border-primary/30",
    moderator: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    member: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors[role] ?? colors.member}`}>
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  );
}

function MemberAvatar({ name, photoUrl }: { name: string | null; photoUrl: string | null }) {
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";
  if (photoUrl) {
    return <img src={photoUrl} alt={name ?? ""} className="w-9 h-9 rounded-full object-cover" />;
  }
  return (
    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
      {initials}
    </div>
  );
}

export default function GroupDashboard() {
  const { groupId } = useParams<{ groupId: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  const { data: group, isLoading: isGroupLoading, isError: isGroupError, refetch: refetchGroup } = useGetGroup(groupId!, {
    query: { queryKey: getGetGroupQueryKey(groupId!), enabled: !!groupId },
  });

  const { data: members, isLoading: isMembersLoading } = useListGroupMembers(groupId!, {
    query: { queryKey: [`/groups/${groupId}/members`] as const, enabled: !!groupId },
  });

  const leaveGroup = useLeaveGroup({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ["/groups"] });
        toast({ title: "Left group", description: "You have left the group." });
        setLocation("/app/dashboard");
      },
      onError: (err: unknown) => {
        const msg =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: string }).message)
            : "Could not leave the group.";
        toast({ title: "Error", description: msg, variant: "destructive" });
      },
    },
  });

  const isAdmin = group?.myRole === "admin";

  if (isGroupLoading) {
    return (
      <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-5 w-48 rounded-md" />
        <div className="grid sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-3xl" />)}
        </div>
      </div>
    );
  }

  if (isGroupError) {
    return (
      <div className="p-10 flex flex-col items-center gap-4 text-center">
        <AlertCircle className="w-10 h-10 text-destructive" />
        <p className="text-muted-foreground">Failed to load group. Please try again.</p>
        <Button variant="outline" onClick={() => void refetchGroup()} className="rounded-full" data-testid="btn-retry-group">
          <RefreshCw className="w-4 h-4 mr-2" /> Try Again
        </Button>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        <p>Group not found or you don't have access.</p>
        <Button variant="ghost" onClick={() => setLocation("/app/dashboard")} className="mt-4">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const previewMembers = members?.slice(0, 5) ?? [];

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      <header className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/app/dashboard")}
          className="rounded-full -ml-2 text-muted-foreground"
          data-testid="btn-back"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">{group.name}</h1>
            {group.description && (
              <p className="text-muted-foreground leading-relaxed">{group.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {group.churchName && (
                <span className="flex items-center gap-1.5">
                  <Church className="w-3.5 h-3.5" /> {group.churchName}
                </span>
              )}
              {group.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> {group.city}
                </span>
              )}
              <RoleBadge role={group.myRole} />
            </div>
            {group.verse && (
              <p className="text-sm italic text-primary/80 flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                "{group.verse}"
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation(`/app/groups/${groupId}/invite`)}
                className="rounded-full"
                data-testid="btn-invite"
              >
                <UserPlus className="w-4 h-4 mr-1.5" /> Invite Members
              </Button>
            )}
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation(`/app/groups/${groupId}/settings`)}
                className="rounded-full"
                data-testid="btn-settings"
              >
                <Settings className="w-4 h-4 mr-1.5" /> Settings
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLeaveDialog(true)}
              className="rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
              data-testid="btn-leave-group"
            >
              <LogOut className="w-4 h-4 mr-1.5" /> Leave Group
            </Button>
          </div>
        </div>
      </header>

      <div className="grid sm:grid-cols-2 gap-4">
        <ActionCard
          icon={Plus}
          title="Add Prayer Request"
          description="Share a request with the group"
          onClick={() => setLocation(`/app/groups/${groupId}/requests/new`)}
          testId="btn-add-request"
        />
        <ActionCard
          icon={Flame}
          title="Start Praying"
          description="Enter focused prayer mode"
          onClick={() => setLocation(`/app/groups/${groupId}/pray`)}
          testId="btn-start-praying"
        />
      </div>

      <section className="bg-card border border-border rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Members
            <span className="text-sm font-normal text-muted-foreground">({group.memberCount})</span>
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation(`/app/groups/${groupId}/members`)}
            className="text-primary hover:text-primary rounded-full text-sm"
            data-testid="btn-view-all-members"
          >
            View All →
          </Button>
        </div>

        {isMembersLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
          </div>
        ) : previewMembers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No members found.</p>
        ) : (
          <ul className="space-y-2">
            {previewMembers.map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-1.5">
                <MemberAvatar name={m.fullName ?? null} photoUrl={m.profilePhotoUrl ?? null} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{m.fullName ?? m.email}</p>
                  <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                </div>
                <RoleBadge role={m.role} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-card border border-border rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Flame className="w-4 h-4 text-primary" /> Prayer Requests
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation(`/app/groups/${groupId}/requests`)}
            className="text-primary hover:text-primary rounded-full text-sm"
            data-testid="btn-view-all-requests"
          >
            View All →
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Share needs, commit to pray, and celebrate answered prayers.
        </p>
        <Button
          className="w-full rounded-2xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
          variant="ghost"
          onClick={() => setLocation(`/app/groups/${groupId}/requests`)}
          data-testid="btn-open-requests"
        >
          Open Prayer Requests
        </Button>
      </section>

      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Leave "{group.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              You will no longer have access to this group's prayer requests. You can rejoin later
              only if you receive a new invitation.
              {isAdmin && (
                <span className="block mt-2 text-yellow-400">
                  You are an admin. Make sure another admin exists before leaving.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => leaveGroup.mutate({ groupId: groupId! })}
              disabled={leaveGroup.isPending}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              data-testid="btn-confirm-leave"
            >
              {leaveGroup.isPending ? "Leaving…" : "Leave Group"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ActionCard({
  icon: Icon,
  title,
  description,
  onClick,
  testId,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
  testId: string;
}) {
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      className="bg-card border border-border rounded-3xl p-6 text-left hover:border-primary/50 hover:bg-card/80 transition-all group w-full"
    >
      <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <p className="font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </button>
  );
}
