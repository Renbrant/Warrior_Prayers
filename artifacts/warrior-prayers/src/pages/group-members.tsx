import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetGroup,
  useListGroupMembers,
  useUpdateGroupMember,
  useRemoveGroupMember,
  getListGroupMembersQueryKey,
  getGetGroupQueryKey,
} from "@workspace/api-client-react";
import { ArrowLeft, Trash2, ChevronDown } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useGetMe } from "@workspace/api-client-react";

function MemberAvatar({ name, photoUrl }: { name: string | null; photoUrl: string | null }) {
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";
  if (photoUrl) {
    return <img src={photoUrl} alt={name ?? ""} className="w-10 h-10 rounded-full object-cover" />;
  }
  return (
    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
      {initials}
    </div>
  );
}

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

export default function GroupMembers() {
  const { groupId } = useParams<{ groupId: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null);
  const [removeMemberName, setRemoveMemberName] = useState<string>("");

  const { data: me } = useGetMe({});
  const { data: group, isLoading: isGroupLoading } = useGetGroup(groupId!, {
    query: { queryKey: getGetGroupQueryKey(groupId!), enabled: !!groupId },
  });
  const { data: members, isLoading: isMembersLoading } = useListGroupMembers(groupId!, {
    query: { queryKey: getListGroupMembersQueryKey(groupId!), enabled: !!groupId },
  });

  const updateMember = useUpdateGroupMember();
  const removeMember = useRemoveGroupMember();

  const isAdmin = group?.myRole === "admin";
  const isLoading = isGroupLoading || isMembersLoading;

  const handleRoleChange = (memberId: string, role: "admin" | "moderator" | "member") => {
    updateMember.mutate(
      { groupId: groupId!, memberId, data: { role } },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: getListGroupMembersQueryKey(groupId!) });
          toast({ title: "Role updated", description: `Member role changed to ${role}.` });
        },
        onError: () => {
          toast({ title: "Failed to update role", variant: "destructive" });
        },
      },
    );
  };

  const handleRemoveConfirm = () => {
    if (!removeMemberId) return;
    removeMember.mutate(
      { groupId: groupId!, memberId: removeMemberId },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: getListGroupMembersQueryKey(groupId!) });
          void queryClient.invalidateQueries({ queryKey: getGetGroupQueryKey(groupId!) });
          toast({ title: "Member removed" });
          setRemoveMemberId(null);
        },
        onError: () => {
          toast({ title: "Failed to remove member", variant: "destructive" });
          setRemoveMemberId(null);
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-6">
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
          <h1 className="text-2xl font-extrabold text-foreground">Members</h1>
          <p className="text-sm text-muted-foreground">{group?.name} · {group?.memberCount ?? 0} members</p>
        </div>
      </header>

      <div className="bg-card border border-border rounded-3xl overflow-hidden">
        {!members || members.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground text-sm">No members found.</p>
        ) : (
          <ul className="divide-y divide-border">
            {members.map((m) => {
              const isSelf = me?.id === m.userId;
              return (
                <li key={m.id} className="flex items-center gap-4 p-4">
                  <MemberAvatar name={m.fullName ?? null} photoUrl={m.profilePhotoUrl ?? null} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {m.fullName ?? m.email}
                      {isSelf && <span className="text-muted-foreground font-normal ml-1">(you)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Joined {new Date(m.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isAdmin && !isSelf ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full gap-1.5"
                            data-testid={`btn-role-${m.id}`}
                          >
                            {m.role.charAt(0).toUpperCase() + m.role.slice(1)}
                            <ChevronDown className="w-3.5 h-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border">
                          {(["admin", "moderator", "member"] as const).map((r) => (
                            <DropdownMenuItem
                              key={r}
                              onClick={() => handleRoleChange(m.id, r)}
                              className={m.role === r ? "text-primary" : ""}
                              data-testid={`role-option-${r}`}
                            >
                              {r.charAt(0).toUpperCase() + r.slice(1)}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <RoleBadge role={m.role} />
                    )}
                    {isAdmin && !isSelf && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full"
                        data-testid={`btn-remove-${m.id}`}
                        onClick={() => {
                          setRemoveMemberId(m.id);
                          setRemoveMemberName(m.fullName ?? m.email ?? "this member");
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <AlertDialog open={!!removeMemberId} onOpenChange={(open) => !open && setRemoveMemberId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{removeMemberName}</strong> from the group. They will need to be re-invited to rejoin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="btn-cancel-remove">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveConfirm}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              data-testid="btn-confirm-remove"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
