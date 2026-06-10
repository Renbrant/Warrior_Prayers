import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetGroup,
  useListGroupInvites,
  useCreateGroupInvite,
  useRevokeGroupInvite,
  getListGroupInvitesQueryKey,
  getGetGroupQueryKey,
} from "@workspace/api-client-react";
import { ArrowLeft, Copy, Check, Link, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
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

const EXPIRY_OPTIONS = [
  { label: "7 days", value: 7 },
  { label: "14 days", value: 14 },
  { label: "30 days", value: 30 },
  { label: "Never", value: 0 },
];

const MAX_USES_OPTIONS = [
  { label: "1 use", value: 1 },
  { label: "5 uses", value: 5 },
  { label: "10 uses", value: 10 },
  { label: "25 uses", value: 25 },
  { label: "Unlimited", value: 0 },
];

export default function GroupInvite() {
  const { groupId } = useParams<{ groupId: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [emailInput, setEmailInput] = useState("");
  const [emailExpiry, setEmailExpiry] = useState(7);
  const [linkExpiry, setLinkExpiry] = useState(7);
  const [linkMaxUses, setLinkMaxUses] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [revokeTargetId, setRevokeTargetId] = useState<string | null>(null);

  const { data: group, isLoading: isGroupLoading } = useGetGroup(groupId!, {
    query: { queryKey: getGetGroupQueryKey(groupId!), enabled: !!groupId },
  });
  const { data: invites, isLoading: isInvitesLoading } = useListGroupInvites(groupId!, {
    query: { queryKey: getListGroupInvitesQueryKey(groupId!), enabled: !!groupId },
  });

  const createInvite = useCreateGroupInvite();
  const revokeInvite = useRevokeGroupInvite();

  const isAdmin = group?.myRole === "admin";

  const handleSendEmail = () => {
    if (!emailInput.trim()) return;
    createInvite.mutate(
      {
        groupId: groupId!,
        data: {
          invitedEmail: emailInput.trim(),
          expiresInDays: emailExpiry > 0 ? emailExpiry : undefined,
        },
      },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: getListGroupInvitesQueryKey(groupId!) });
          toast({ title: "Invitation sent", description: `Invite sent to ${emailInput.trim()}` });
          setEmailInput("");
        },
        onError: () => toast({ title: "Failed to send invitation", variant: "destructive" }),
      },
    );
  };

  const handleGenerateLink = () => {
    createInvite.mutate(
      {
        groupId: groupId!,
        data: {
          expiresInDays: linkExpiry > 0 ? linkExpiry : undefined,
          maxUses: linkMaxUses > 0 ? linkMaxUses : undefined,
        },
      },
      {
        onSuccess: (invite) => {
          void queryClient.invalidateQueries({ queryKey: getListGroupInvitesQueryKey(groupId!) });
          setGeneratedLink(invite.inviteUrl ?? "");
          toast({ title: "Link generated", description: "Copy it to share with new members." });
        },
        onError: () => toast({ title: "Failed to generate link", variant: "destructive" }),
      },
    );
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Copied to clipboard" });
  };

  const handleRevoke = (inviteId: string) => {
    revokeInvite.mutate(
      { groupId: groupId!, inviteId },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: getListGroupInvitesQueryKey(groupId!) });
          toast({ title: "Invite revoked" });
        },
        onError: () => toast({ title: "Failed to revoke invite", variant: "destructive" }),
      },
    );
  };

  if (isGroupLoading) {
    return (
      <div className="p-6 md:p-10 max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-40 rounded-3xl" />
        <Skeleton className="h-40 rounded-3xl" />
      </div>
    );
  }

  if (!isAdmin) {
    setLocation(`/app/groups/${groupId}`);
    return null;
  }

  const pendingInvites = invites?.filter((i) => i.status === "pending") ?? [];

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto space-y-8">
      <header className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation(`/app/groups/${groupId}`)}
          className="rounded-full"
          data-testid="btn-back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Invite Members</h1>
          <p className="text-sm text-muted-foreground">{group?.name}</p>
        </div>
      </header>

      <section className="bg-card border border-border rounded-3xl p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Mail className="w-4 h-4 text-primary" />
          <h2 className="text-base font-bold text-foreground">Invite by Email</h2>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email-input">Email address</Label>
          <Input
            id="email-input"
            data-testid="input-invite-email"
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="someone@example.com"
            className="rounded-xl h-12"
          />
        </div>
        <div className="space-y-2">
          <Label>Expires in</Label>
          <div className="flex flex-wrap gap-2">
            {EXPIRY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setEmailExpiry(opt.value)}
                data-testid={`expiry-email-${opt.value}`}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  emailExpiry === opt.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <Button
          onClick={handleSendEmail}
          disabled={!emailInput.trim() || createInvite.isPending}
          className="rounded-full w-full h-12 font-semibold"
          data-testid="btn-send-invite"
        >
          Send Invitation
        </Button>
      </section>

      <section className="bg-card border border-border rounded-3xl p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Link className="w-4 h-4 text-primary" />
          <h2 className="text-base font-bold text-foreground">Generate Private Link</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Expires in</Label>
            <div className="flex flex-wrap gap-2">
              {EXPIRY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setLinkExpiry(opt.value)}
                  data-testid={`expiry-link-${opt.value}`}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    linkExpiry === opt.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Max uses</Label>
            <div className="flex flex-wrap gap-2">
              {MAX_USES_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setLinkMaxUses(opt.value)}
                  data-testid={`maxuses-${opt.value}`}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    linkMaxUses === opt.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <Button
          onClick={handleGenerateLink}
          disabled={createInvite.isPending}
          variant="outline"
          className="rounded-full w-full h-12 font-semibold"
          data-testid="btn-generate-link"
        >
          Generate Link
        </Button>
        {generatedLink && (
          <div className="flex items-center gap-2 bg-background border border-border rounded-xl p-3 mt-2">
            <p className="flex-1 text-xs text-muted-foreground font-mono truncate">{generatedLink}</p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleCopy(generatedLink, "generated")}
              className="rounded-full shrink-0"
              data-testid="btn-copy-link"
            >
              {copiedId === "generated" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        )}
      </section>

      <section className="bg-card border border-border rounded-3xl p-6 space-y-4">
        <h2 className="text-base font-bold text-foreground">Active Invites</h2>
        {isInvitesLoading ? (
          <div className="space-y-2">
            {[0, 1].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        ) : pendingInvites.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending invites.</p>
        ) : (
          <ul className="space-y-2">
            {pendingInvites.map((inv) => (
              <li key={inv.id} className="flex items-center gap-3 bg-background border border-border rounded-xl p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {inv.invitedEmail ?? "Link invite"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(inv.createdAt).toLocaleDateString()}
                    {inv.expiresAt && ` · Expires ${new Date(inv.expiresAt).toLocaleDateString()}`}
                    {inv.maxUses != null && ` · ${inv.usedCount}/${inv.maxUses} uses`}
                  </p>
                </div>
                {!inv.invitedEmail && inv.inviteUrl && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(inv.inviteUrl!, inv.id)}
                    className="rounded-full"
                    data-testid={`btn-copy-${inv.id}`}
                  >
                    {copiedId === inv.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setRevokeTargetId(inv.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full"
                  data-testid={`btn-revoke-${inv.id}`}
                >
                  <X className="w-4 h-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AlertDialog open={!!revokeTargetId} onOpenChange={(open) => { if (!open) setRevokeTargetId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately invalidate the invite link or email invitation. The recipient will no longer be able to use it to join the group.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (revokeTargetId) handleRevoke(revokeTargetId);
                setRevokeTargetId(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="btn-confirm-revoke"
            >
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
