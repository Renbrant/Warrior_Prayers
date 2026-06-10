import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListMyInvitations,
  useAcceptInvite,
  useDeclineInvite,
  getListMyInvitationsQueryKey,
  getListMyGroupsQueryKey,
} from "@workspace/api-client-react";
import { Bell, Check, X, Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function MyInvitations() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: invitations, isLoading } = useListMyInvitations({
    query: { queryKey: getListMyInvitationsQueryKey() },
  });

  const acceptInvite = useAcceptInvite();
  const declineInvite = useDeclineInvite();

  const handleAccept = (token: string) => {
    acceptInvite.mutate(
      { token },
      {
        onSuccess: (group) => {
          void queryClient.invalidateQueries({ queryKey: getListMyInvitationsQueryKey() });
          void queryClient.invalidateQueries({ queryKey: getListMyGroupsQueryKey() });
          toast({ title: "Joined group!", description: `Welcome to ${group.name}` });
          setLocation(`/app/groups/${group.id}`);
        },
        onError: () => toast({ title: "Failed to accept invitation", variant: "destructive" }),
      },
    );
  };

  const handleDecline = (token: string) => {
    declineInvite.mutate(
      { token },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: getListMyInvitationsQueryKey() });
          toast({ title: "Invitation declined" });
        },
        onError: () => toast({ title: "Failed to decline invitation", variant: "destructive" }),
      },
    );
  };

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto space-y-6">
      <header className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/app/dashboard")}
          className="rounded-full"
          data-testid="btn-back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" /> Invitations
          </h1>
          <p className="text-sm text-muted-foreground">Pending group invitations</p>
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-3xl" />)}
        </div>
      ) : !invitations || invitations.length === 0 ? (
        <div className="bg-card border border-border rounded-3xl p-16 text-center space-y-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
            <Bell className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No pending invitations.</p>
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
          {invitations.map((inv) => (
            <li key={inv.id} className="bg-card border border-border rounded-3xl p-5 space-y-3">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{inv.groupName}</p>
                  {inv.groupDescription && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{inv.groupDescription}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Invited by <span className="text-foreground">{inv.invitedByName ?? inv.invitedByEmail}</span>
                    {" · "}
                    {new Date(inv.createdAt).toLocaleDateString()}
                    {inv.expiresAt && (
                      <span className="text-amber-500"> · Expires {new Date(inv.expiresAt).toLocaleDateString()}</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={() => handleAccept(inv.token)}
                  disabled={acceptInvite.isPending}
                  className="rounded-full flex-1 font-semibold"
                  data-testid={`btn-accept-${inv.id}`}
                >
                  <Check className="w-4 h-4 mr-1.5" /> Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDecline(inv.token)}
                  disabled={declineInvite.isPending}
                  className="rounded-full flex-1 font-semibold"
                  data-testid={`btn-decline-${inv.id}`}
                >
                  <X className="w-4 h-4 mr-1.5" /> Decline
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
