import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetPrayerRequest,
  useGetGroup,
  useToggleCommitment,
  useListComments,
  useAddComment,
  useDeleteComment,
  useAddPrayerUpdate,
  useDeletePrayerRequest,
  useTranslatePrayerRequest,
  getGetPrayerRequestQueryKey,
  getListCommentsQueryKey,
  getListPrayerRequestsQueryKey,
  getGetPrayerHistoryQueryKey,
  getGetGroupQueryKey,
} from "@workspace/api-client-react";
import type { PrayerUpdateInputNewStatus, PrayerUpdateInputClosureReason } from "@workspace/api-client-react";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Send,
  Trash2,
  Clock,
  Flame,
  ChevronDown,
  ChevronUp,
  UserX,
  CheckCircle2,
  Languages,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const URGENCY_BADGE: Record<string, string> = {
  urgent: "bg-red-500/20 text-red-400 border-red-500/30",
  important: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  normal: "bg-muted text-muted-foreground border-border",
};

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  pt: "Português",
  es: "Español",
};

const LANGUAGE_FROM_LABELS: Record<string, string> = {
  en: "English",
  pt: "Portuguese",
  es: "Spanish",
};

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function PrayerRequestDetail() {
  const { groupId, requestId } = useParams<{ groupId: string; requestId: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [commentText, setCommentText] = useState("");
  const [showAddUpdate, setShowAddUpdate] = useState(false);
  const [updateText, setUpdateText] = useState("");
  const [newStatus, setNewStatus] = useState<string>("keep");
  const [closureReason, setClosureReason] = useState<string>("");
  const [testimony, setTestimony] = useState("");
  const [closingNote, setClosingNote] = useState("");
  const [pendingArchive, setPendingArchive] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);

  const [showTranslate, setShowTranslate] = useState(false);
  const [selectedLang, setSelectedLang] = useState<string>("pt");
  const [translation, setTranslation] = useState<{
    translatedTitle: string;
    translatedDescription: string | null;
    targetLanguage: string;
    cached: boolean;
  } | null>(null);
  const [showingTranslation, setShowingTranslation] = useState(false);

  const { data: group } = useGetGroup(groupId!, { query: { queryKey: getGetGroupQueryKey(groupId!), enabled: !!groupId } });
  const { data: request, isLoading } = useGetPrayerRequest(groupId!, requestId!, {
    query: {
      queryKey: getGetPrayerRequestQueryKey(groupId!, requestId!),
      enabled: !!groupId && !!requestId,
    },
  });
  const { data: comments = [], isLoading: isCommentsLoading } = useListComments(groupId!, requestId!, {
    query: {
      queryKey: getListCommentsQueryKey(groupId!, requestId!),
      enabled: !!groupId && !!requestId && !!(request?.allowComments),
    },
  });

  const toggleCommitment = useToggleCommitment();
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();
  const addUpdate = useAddPrayerUpdate();
  const deleteRequest = useDeletePrayerRequest();
  const translateRequest = useTranslatePrayerRequest();

  const isMod = group?.myRole === "admin" || group?.myRole === "moderator";
  const isAdmin = group?.myRole === "admin";

  const handleCommit = () => {
    toggleCommitment.mutate(
      { groupId: groupId!, requestId: requestId! },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getGetPrayerRequestQueryKey(groupId!, requestId!),
          });
        },
        onError: () => toast({ title: "Error", description: "Could not update commitment.", variant: "destructive" }),
      },
    );
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment.mutate(
      { groupId: groupId!, requestId: requestId!, data: { comment: commentText.trim() } },
      {
        onSuccess: () => {
          setCommentText("");
          queryClient.invalidateQueries({ queryKey: getListCommentsQueryKey(groupId!, requestId!) });
        },
        onError: () => toast({ title: "Error", description: "Could not add comment.", variant: "destructive" }),
      },
    );
  };

  const handleDeleteComment = (commentId: string) => {
    deleteComment.mutate(
      { groupId: groupId!, requestId: requestId!, commentId },
      {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListCommentsQueryKey(groupId!, requestId!) }),
        onError: () => toast({ title: "Error", description: "Could not delete comment.", variant: "destructive" }),
      },
    );
  };

  const executeAddUpdate = () => {
    const statusToSend = newStatus !== "keep" ? (newStatus as PrayerUpdateInputNewStatus) : undefined;
    const reasonToSend = statusToSend === "closed" ? (closureReason as PrayerUpdateInputClosureReason) || undefined : undefined;

    addUpdate.mutate(
      {
        groupId: groupId!,
        requestId: requestId!,
        data: {
          updateText: updateText.trim(),
          newStatus: statusToSend,
          closureReason: reasonToSend,
          testimony: (reasonToSend === "answered_prayer" && testimony) ? testimony : undefined,
          closingNote: (reasonToSend === "no_longer_needed" && closingNote) ? closingNote : undefined,
        },
      },
      {
        onSuccess: () => {
          setUpdateText("");
          setNewStatus("keep");
          setClosureReason("");
          setTestimony("");
          setClosingNote("");
          setShowAddUpdate(false);
          setPendingArchive(false);
          queryClient.invalidateQueries({ queryKey: getGetPrayerRequestQueryKey(groupId!, requestId!) });
          queryClient.invalidateQueries({ queryKey: getListPrayerRequestsQueryKey(groupId!) });
          queryClient.invalidateQueries({ queryKey: getGetPrayerHistoryQueryKey(groupId!) });
          toast({ title: "Update added" });
        },
        onError: () => toast({ title: "Error", description: "Could not add update.", variant: "destructive" }),
      },
    );
  };

  const handleAddUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateText.trim()) return;
    if (newStatus === "archived") {
      setPendingArchive(true);
      return;
    }
    if (newStatus === "closed") {
      setPendingClose(true);
      return;
    }
    executeAddUpdate();
  };

  const handleDelete = () => {
    deleteRequest.mutate(
      { groupId: groupId!, requestId: requestId! },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPrayerRequestsQueryKey(groupId!) });
          toast({ title: "Prayer request deleted" });
          setLocation(`/app/groups/${groupId}/requests`);
        },
        onError: () => toast({ title: "Error", description: "Could not delete request.", variant: "destructive" }),
      },
    );
  };

  const handleTranslate = () => {
    if (translation?.targetLanguage === selectedLang) {
      setShowingTranslation(true);
      return;
    }
    translateRequest.mutate(
      { groupId: groupId!, requestId: requestId!, data: { targetLanguage: selectedLang as "en" | "pt" | "es" } },
      {
        onSuccess: (data) => {
          setTranslation({
            translatedTitle: data.translatedTitle,
            translatedDescription: data.translatedDescription ?? null,
            targetLanguage: data.targetLanguage,
            cached: data.cached,
          });
          setShowingTranslation(true);
        },
        onError: () => toast({ title: "Error", description: "Could not translate request.", variant: "destructive" }),
      },
    );
  };

  const handleHideTranslation = () => {
    setShowingTranslation(false);
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-40 rounded-3xl" />
        <Skeleton className="h-24 rounded-3xl" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Prayer request not found.</p>
      </div>
    );
  }

  const displayName = group?.hidePrayerPersonNames
    ? request.prayerPersonInitials
    : request.prayerPersonName ?? request.prayerPersonInitials;

  const canEdit = request.isMyRequest || isMod;
  const canDelete = request.isMyRequest || isAdmin;
  const isClosed = request.status === "closed" || request.status === "archived";

  const displayTitle = showingTranslation && translation ? translation.translatedTitle : request.title;
  const displayDescription = showingTranslation && translation
    ? (translation.translatedDescription ?? request.description)
    : request.description;

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation(`/app/groups/${groupId}/requests`)}
          className="rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1" />
        {canDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Prayer Request</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the prayer request, comments, and updates.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <section className="bg-card border border-border rounded-3xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${URGENCY_BADGE[request.urgency] ?? URGENCY_BADGE.normal}`}
              >
                {request.urgency === "urgent" && <Flame className="w-3 h-3 mr-1" />}
                {request.urgency.charAt(0).toUpperCase() + request.urgency.slice(1)}
              </span>
              {request.categoryName && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground"
                  style={
                    request.categoryColor
                      ? { borderColor: request.categoryColor + "40", color: request.categoryColor }
                      : {}
                  }
                >
                  {request.categoryName}
                </span>
              )}
              {request.status !== "active" && (
                <span className="text-xs px-2 py-0.5 rounded-full border border-border bg-muted text-muted-foreground capitalize">
                  {request.status.replace("_", "-")}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold">{displayTitle}</h1>
            {showingTranslation && translation && displayTitle !== request.title && (
              <p className="text-xs text-muted-foreground italic">
                Original: {request.title}
              </p>
            )}
            {displayName && (
              <p className="text-sm text-muted-foreground">
                For <span className="font-medium text-foreground">{displayName}</span>
              </p>
            )}
          </div>
        </div>

        {displayDescription && (
          <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
            {displayDescription}
          </p>
        )}

        {showingTranslation && translation && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-primary flex items-center gap-1">
              <Languages className="w-3 h-3" />
              Translated to {LANGUAGE_FROM_LABELS[translation.targetLanguage]}
              {translation.cached ? " (cached)" : ""}
            </span>
            <button
              onClick={handleHideTranslation}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
            >
              <X className="w-3 h-3" /> Show original
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
          {request.isAnonymous ? (
            request.authorName && isAdmin ? (
              <span className="flex items-center gap-1">
                <UserX className="w-3 h-3" />
                Anonymous
                <span className="text-muted-foreground/60">(admin view: {request.authorName})</span>
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <UserX className="w-3 h-3" /> Anonymous
              </span>
            )
          ) : (
            request.authorName && <span>By {request.authorName}</span>
          )}
          {request.importantDate && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {formatDate(request.importantDate)}
            </span>
          )}
          <span>{formatDate(request.createdAt)}</span>
        </div>

        {request.status === "closed" && request.closureReason && (
          <div className="mt-2 p-3 bg-muted/50 rounded-2xl space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {request.closureReason === "answered_prayer" ? "Answered Prayer" : "No Longer Needed"}
            </p>
            {request.answeredTestimony && (
              <p className="text-sm text-foreground/80 whitespace-pre-wrap">{request.answeredTestimony}</p>
            )}
            {request.closedNote && (
              <p className="text-sm text-foreground/80 whitespace-pre-wrap">{request.closedNote}</p>
            )}
          </div>
        )}

        {/* Translate controls */}
        <div className="pt-2 border-t border-border">
          {!showTranslate ? (
            <button
              onClick={() => setShowTranslate(true)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
              data-testid="btn-show-translate"
            >
              <Languages className="w-3.5 h-3.5" />
              Translate this request
            </button>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <Languages className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">Translate to:</span>
              <Select value={selectedLang} onValueChange={setSelectedLang}>
                <SelectTrigger className="h-7 text-xs rounded-lg w-32 px-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{LANGUAGE_LABELS.en}</SelectItem>
                  <SelectItem value="pt">{LANGUAGE_LABELS.pt}</SelectItem>
                  <SelectItem value="es">{LANGUAGE_LABELS.es}</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                onClick={handleTranslate}
                disabled={translateRequest.isPending}
                className="h-7 text-xs rounded-lg px-3"
                data-testid="btn-translate"
              >
                {translateRequest.isPending ? "Translating..." : showingTranslation ? "Re-translate" : "Translate"}
              </Button>
              {showingTranslation && (
                <button
                  onClick={handleHideTranslation}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Show original
                </button>
              )}
              <button
                onClick={() => { setShowTranslate(false); setShowingTranslation(false); }}
                className="text-muted-foreground hover:text-foreground transition-colors ml-auto"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </section>

      <button
        onClick={handleCommit}
        disabled={toggleCommitment.isPending}
        className={`w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl border font-semibold text-sm transition-colors ${
          request.iCommitted
            ? "bg-primary/20 border-primary/40 text-primary hover:bg-primary/30"
            : "bg-card border-border hover:border-primary/40 hover:bg-primary/10"
        }`}
        data-testid="btn-commit"
      >
        <Heart
          className={`w-4 h-4 ${request.iCommitted ? "fill-primary text-primary" : ""}`}
        />
        {request.iCommitted ? "You are praying for this" : "I am praying for this"}
        <span className="text-muted-foreground font-normal">
          · {request.commitmentCount} {request.commitmentCount === 1 ? "person" : "people"} praying
        </span>
      </button>

      {request.updates.length > 0 && (
        <section className="bg-card border border-border rounded-3xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Updates
          </h2>
          <div className="space-y-3">
            {request.updates.map((update) => (
              <div key={update.id} className="flex gap-3">
                <div className="w-px bg-border ml-3 shrink-0" />
                <div className="pb-3 flex-1">
                  <p className="text-sm whitespace-pre-wrap">{update.updateText}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {update.authorName && <span>{update.authorName} · </span>}
                    {formatDate(update.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {canEdit && !isClosed && (
        <section className="bg-card border border-border rounded-3xl p-5 space-y-3">
          <button
            onClick={() => setShowAddUpdate(!showAddUpdate)}
            className="flex items-center justify-between w-full text-sm font-semibold text-muted-foreground"
          >
            <span>Add Update</span>
            {showAddUpdate ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showAddUpdate && (
            <form onSubmit={handleAddUpdate} className="space-y-4 pt-1">
              <Textarea
                value={updateText}
                onChange={(e) => setUpdateText(e.target.value)}
                placeholder="Share an update on this prayer request..."
                rows={3}
                className="rounded-xl resize-none"
                data-testid="input-update-text"
              />

              <div className="space-y-2">
                <Label>Change Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="rounded-xl h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keep">Keep Active</SelectItem>
                    <SelectItem value="follow_up">Move to Follow-Up</SelectItem>
                    <SelectItem value="closed">Close Request</SelectItem>
                    {isAdmin && <SelectItem value="archived">Archive</SelectItem>}
                  </SelectContent>
                </Select>
              </div>

              {newStatus === "closed" && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Closure Reason</Label>
                    <Select value={closureReason} onValueChange={setClosureReason}>
                      <SelectTrigger className="rounded-xl h-10">
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="answered_prayer">Answered Prayer 🙏</SelectItem>
                        <SelectItem value="no_longer_needed">No Longer Needed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {closureReason === "answered_prayer" && (
                    <div className="space-y-2">
                      <Label>Testimony (optional, encrypted)</Label>
                      <Textarea
                        value={testimony}
                        onChange={(e) => setTestimony(e.target.value)}
                        placeholder="Share how God answered this prayer..."
                        rows={3}
                        className="rounded-xl resize-none"
                      />
                    </div>
                  )}

                  {closureReason === "no_longer_needed" && (
                    <div className="space-y-2">
                      <Label>Closing Note (optional, encrypted)</Label>
                      <Textarea
                        value={closingNote}
                        onChange={(e) => setClosingNote(e.target.value)}
                        placeholder="Any closing thoughts..."
                        rows={2}
                        className="rounded-xl resize-none"
                      />
                    </div>
                  )}
                </div>
              )}

              <Button
                type="submit"
                disabled={!updateText.trim() || addUpdate.isPending}
                className="w-full rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="btn-submit-update"
              >
                {addUpdate.isPending ? "Submitting..." : "Post Update"}
              </Button>
            </form>
          )}
        </section>
      )}

      {(request.allowComments && group?.allowComments) && (
        <section className="bg-card border border-border rounded-3xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Comments{comments.length > 0 ? ` (${comments.length})` : ""}
          </h2>

          {isCommentsLoading ? (
            <Skeleton className="h-16 rounded-xl" />
          ) : comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              Be the first to leave an encouraging comment.
            </p>
          ) : (
            <div className="space-y-3">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="flex gap-3 p-3 bg-background rounded-2xl"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{c.comment}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {c.authorName ?? "Member"}{" · "}
                    </p>
                  </div>
                  {(c.isMyComment || isMod) && (
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {!isClosed && (
            <form onSubmit={handleAddComment} className="flex gap-2 pt-1">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add an encouraging comment..."
                rows={2}
                className="rounded-xl resize-none flex-1"
                data-testid="input-comment"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment(e as unknown as React.FormEvent);
                  }
                }}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!commentText.trim() || addComment.isPending}
                className="rounded-xl shrink-0 self-end"
                data-testid="btn-send-comment"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          )}
        </section>
      )}

      <AlertDialog open={pendingClose} onOpenChange={(open) => { if (!open) setPendingClose(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close Prayer Request?</AlertDialogTitle>
            <AlertDialogDescription>
              {closureReason === "answered_prayer"
                ? "This request will be marked as Answered Prayer and closed. Group members who are praying for it will be notified."
                : "This request will be closed and removed from the active list. This cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { setPendingClose(false); executeAddUpdate(); }}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="btn-confirm-close"
            >
              {closureReason === "answered_prayer" ? "Mark as Answered" : "Close Request"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={pendingArchive} onOpenChange={(open) => { if (!open) setPendingArchive(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Prayer Request?</AlertDialogTitle>
            <AlertDialogDescription>
              Archiving will hide this request from the active list. Only admins can view archived requests. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeAddUpdate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="btn-confirm-archive"
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
