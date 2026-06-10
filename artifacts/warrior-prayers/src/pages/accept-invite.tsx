import { useParams, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useSignIn } from "@clerk/react";
import {
  useGetInviteByToken,
  getGetInviteByTokenQueryKey,
  useAcceptInvite,
  getListMyGroupsQueryKey,
} from "@workspace/api-client-react";
import { useGetMe } from "@workspace/api-client-react";
import { Shield, Users, Check, AlertTriangle, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: preview, isLoading: isPreviewLoading } = useGetInviteByToken(token!, {
    query: { queryKey: getGetInviteByTokenQueryKey(token!), enabled: !!token },
  });

  const { data: me, isLoading: isMeLoading } = useGetMe({});

  const acceptInvite = useAcceptInvite();

  const handleAccept = () => {
    if (!token) return;
    acceptInvite.mutate(
      { token },
      {
        onSuccess: (group) => {
          void queryClient.invalidateQueries({ queryKey: getListMyGroupsQueryKey() });
          toast({ title: "Joined!", description: `Welcome to ${group.name}` });
          setLocation(`/app/groups/${group.id}`);
        },
        onError: (err: unknown) => {
          const message = err instanceof Error ? err.message : "Something went wrong.";
          toast({ title: "Failed to accept invite", description: message, variant: "destructive" });
        },
      },
    );
  };

  if (isPreviewLoading || isMeLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-14 w-14 rounded-full mx-auto" />
          <Skeleton className="h-8 w-48 rounded-xl mx-auto" />
          <Skeleton className="h-5 w-64 rounded-md mx-auto" />
          <Skeleton className="h-12 rounded-full" />
        </div>
      </div>
    );
  }

  if (!preview) {
    return (
      <ErrorState
        title="Invite not found"
        message="This invitation link doesn't exist or has been removed."
        onBack={() => setLocation("/")}
      />
    );
  }

  if (preview.isExpired) {
    return (
      <ErrorState
        title="Invite expired"
        message="This invitation has expired or been revoked. Ask the group admin for a new link."
        onBack={() => setLocation("/")}
      />
    );
  }

  const isSignedIn = !!me;

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">You've been invited to join</p>
            <h1 className="text-2xl font-extrabold text-foreground">{preview.groupName}</h1>
          </div>
          {preview.groupDescription && (
            <p className="text-sm text-muted-foreground leading-relaxed">{preview.groupDescription}</p>
          )}
          {preview.invitedByName && (
            <p className="text-sm text-muted-foreground">
              Invited by <span className="text-foreground font-medium">{preview.invitedByName}</span>
            </p>
          )}
        </div>

        <div className="bg-card border border-border rounded-3xl p-6 space-y-3">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Shield className="w-4 h-4 text-primary shrink-0" />
            <span>This is a private prayer group. Your requests stay within the group.</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <BookOpen className="w-4 h-4 text-primary shrink-0" />
            <span>You'll be able to share and pray for requests with group members.</span>
          </div>
        </div>

        {isSignedIn ? (
          <Button
            onClick={handleAccept}
            disabled={acceptInvite.isPending}
            className="w-full h-14 rounded-full text-base font-semibold shadow-lg shadow-primary/20"
            data-testid="btn-accept"
          >
            <Check className="w-5 h-5 mr-2" />
            {acceptInvite.isPending ? "Joining…" : "Accept Invitation"}
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">Sign in or create an account to join this group</p>
            <Button
              onClick={() => setLocation(`/sign-up?redirect_url=/invite/${token}`)}
              className="w-full h-14 rounded-full text-base font-semibold shadow-lg shadow-primary/20"
              data-testid="btn-sign-up"
            >
              Create Account
            </Button>
            <Button
              onClick={() => setLocation(`/sign-in?redirect_url=/invite/${token}`)}
              variant="outline"
              className="w-full h-12 rounded-full font-semibold"
              data-testid="btn-sign-in"
            >
              Sign In
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ErrorState({
  title,
  message,
  onBack,
}: {
  title: string;
  message: string;
  onBack: () => void;
}) {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md text-center space-y-4">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground text-sm">{message}</p>
        <Button onClick={onBack} variant="outline" className="rounded-full">
          Go Home
        </Button>
      </div>
    </div>
  );
}
