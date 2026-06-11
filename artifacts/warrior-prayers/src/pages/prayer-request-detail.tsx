import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetPrayerRequest,
  useGetGroup,
  useToggleCommitment,
  useRecordPrayed,
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
  BookOpen,
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
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

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
  const recordPrayed = useRecordPrayed();
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
        onError: () => toast({ title: t("common.error"), description: t("request.commitError"), variant: "destructive" }),
      },
    );
  };

  const [prayedCooldown, setPrayedCooldown] = useState<number | null>(null);

  useEffect(() => {
    if (!request?.nextPrayAt) {
      setPrayedCooldown(null);
      return;
    }
    const target = new Date(request.nextPrayAt).getTime();
    const tick = () => {
      const diff = Math.ceil((target - Date.now()) / 1000);
      if (diff <= 0) {
        setPrayedCooldown(null);
        queryClient.invalidateQueries({ queryKey: getGetPrayerRequestQueryKey(groupId!, requestId!) });
      } else {
        setPrayedCooldown(diff);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [request?.nextPrayAt, groupId, requestId, queryClient]);

  const formatCooldown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const handleRecordPrayed = () => {
    recordPrayed.mutate(
      { groupId: groupId!, requestId: requestId! },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getGetPrayerRequestQueryKey(groupId!, requestId!),
          });
        },
        onError: () => toast({ title: t("common.error"), description: t("request.prayError"), variant: "destructive" }),
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
        onError: () => toast({ title: t("common.error"), description: t("request.commentError"), variant: "destructive" }),
      },
    );
  };

  const handleDeleteComment = (commentId: string) => {
    deleteComment.mutate(
      { groupId: groupId!, requestId: requestId!, commentId },
      {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListCommentsQueryKey(groupId!, requestId!) }),
        onError: () => toast({ title: t("common.error"), description: t("request.deleteCommentError"), variant: "destructive" }),
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
          toast({ title: t("request.updateAdded") });
        },
        onError: () => toast({ title: t("common.error"), description: t("request.updateError"), variant: "destructive" }),
      },
    );
  };

  const handleAddUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const isClosing = newStatus === "closed" || newStatus === "archived";
    if (!isClosing && !updateText.trim()) return;
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
          toast({ title: t("request.deleted") });
          setLocation(`/app/groups/${groupId}/requests`);
        },
        onError: () => toast({ title: t("common.error"), description: t("request.deleteError"), variant: "destructive" }),
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
        onError: () => toast({ title: t("common.error"), description: t("request.translateError"), variant: "destructive" }),
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
        <p>{t("request.notFound")}</p>
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
                <AlertDialogTitle>{t("request.deleteTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("request.deleteDesc")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  {t("common.delete")}
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
                {t(`requests.urgency.${request.urgency}`, request.urgency)}
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
                  {t(`requests.status.${request.status}`, request.status.replace("_", "-"))}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold">{displayTitle}</h1>
            {showingTranslation && translation && displayTitle !== request.title && (
              <p className="text-xs text-muted-foreground italic">
                {t("request.original")}: {request.title}
              </p>
            )}
            {displayName && (
              <p className="text-sm text-muted-foreground">
                {t("request.for")} <span className="font-medium text-foreground">{displayName}</span>
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
              {t("request.translatedTo", { lang: LANGUAGE_LABELS[translation.targetLanguage] ?? translation.targetLanguage })}
              {translation.cached ? ` ${t("request.cached")}` : ""}
            </span>
            <button
              onClick={handleHideTranslation}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
            >
              <X className="w-3 h-3" /> {t("request.showOriginal")}
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
          {request.isAnonymous ? (
            request.authorName && isAdmin ? (
              <span className="flex items-center gap-1">
                <UserX className="w-3 h-3" />
                {t("request.anonymous")}
                <span className="text-muted-foreground/60">({t("request.adminView")}: {request.authorName})</span>
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <UserX className="w-3 h-3" /> {t("request.anonymous")}
              </span>
            )
          ) : (
            request.authorName && <span>{t("request.by")} {request.authorName}</span>
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
              {request.closureReason === "answered_prayer"
                ? t("request.closureReason.answeredPrayer")
                : t("request.closureReason.noLongerNeeded")}
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
              {t("request.translateThis")}
            </button>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <Languages className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">{t("request.translateTo")}:</span>
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
                {translateRequest.isPending
                  ? t("request.translating")
                  : showingTranslation
                    ? t("request.retranslate")
                    : t("request.translate")}
              </Button>
              {showingTranslation && (
                <button
                  onClick={handleHideTranslation}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("request.showOriginal")}
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
        <Heart className={`w-4 h-4 ${request.iCommitted ? "fill-primary text-primary" : ""}`} />
        {request.iCommitted ? t("request.youArePraying") : t("request.iAmPraying")}
        <span className="text-muted-foreground font-normal">
          · {request.commitmentCount === 1
            ? t("request.personPraying_one", { count: 1 })
            : t("request.personPraying_other", { count: request.commitmentCount })}
        </span>
      </button>

      <button
        onClick={handleRecordPrayed}
        disabled={recordPrayed.isPending || !!prayedCooldown}
        className={`w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl border font-semibold text-sm transition-colors ${
          prayedCooldown
            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 cursor-default"
            : "bg-card border-border hover:border-emerald-500/40 hover:bg-emerald-500/10"
        }`}
        data-testid="btn-prayed"
      >
        <BookOpen className={`w-4 h-4 ${prayedCooldown ? "text-emerald-400" : ""}`} />
        {prayedCooldown ? t("request.alreadyPrayed") : t("request.prayedBtn")}
        <span className="text-muted-foreground font-normal text-xs">
          {prayedCooldown && `· ${formatCooldown(prayedCooldown)}`}
          {request.prayedCount > 0 && (
            <>{prayedCooldown ? " · " : "· "}{request.prayedCount === 1
              ? t("request.prayedBy_one")
              : t("request.prayedBy_other", { count: request.prayedCount })}</>
          )}
        </span>
      </button>

      {request.updates.length > 0 && (
        <section className="bg-card border border-border rounded-3xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {t("request.updates")}
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
            <span>{t("request.addUpdate")}</span>
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
                placeholder={t("request.updatePlaceholder")}
                rows={3}
                className="rounded-xl resize-none"
                data-testid="input-update-text"
              />

              <div className="space-y-2">
                <Label>{t("request.changeStatus")}</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="rounded-xl h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keep">{t("request.statusOption.keepActive")}</SelectItem>
                    <SelectItem value="follow_up">{t("request.statusOption.followUp")}</SelectItem>
                    <SelectItem value="closed">{t("request.statusOption.close")}</SelectItem>
                    {isAdmin && <SelectItem value="archived">{t("request.statusOption.archive")}</SelectItem>}
                  </SelectContent>
                </Select>
              </div>

              {newStatus === "closed" && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>{t("request.closureReason.label")}</Label>
                    <Select value={closureReason} onValueChange={setClosureReason}>
                      <SelectTrigger className="rounded-xl h-10">
                        <SelectValue placeholder={t("request.closureReason.placeholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="answered_prayer">{t("request.closureReason.answeredPrayer")} 🙏</SelectItem>
                        <SelectItem value="no_longer_needed">{t("request.closureReason.noLongerNeeded")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {closureReason === "answered_prayer" && (
                    <div className="space-y-2">
                      <Label>{t("request.testimony")}</Label>
                      <Textarea
                        value={testimony}
                        onChange={(e) => setTestimony(e.target.value)}
                        placeholder={t("request.testimonyPlaceholder")}
                        rows={3}
                        className="rounded-xl resize-none"
                      />
                    </div>
                  )}

                  {closureReason === "no_longer_needed" && (
                    <div className="space-y-2">
                      <Label>{t("request.closingNote")}</Label>
                      <Textarea
                        value={closingNote}
                        onChange={(e) => setClosingNote(e.target.value)}
                        placeholder={t("request.closingNotePlaceholder")}
                        rows={2}
                        className="rounded-xl resize-none"
                      />
                    </div>
                  )}
                </div>
              )}

              <Button
                type="submit"
                disabled={
                  addUpdate.isPending ||
                  (newStatus === "keep" || newStatus === "follow_up"
                    ? !updateText.trim()
                    : newStatus === "closed"
                      ? !closureReason
                      : false)
                }
                className="w-full rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="btn-submit-update"
              >
                {addUpdate.isPending ? t("request.submitting") : t("request.postUpdate")}
              </Button>
            </form>
          )}
        </section>
      )}

      {(request.allowComments && group?.allowComments) && (
        <section className="bg-card border border-border rounded-3xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            {t("request.comments")}{comments.length > 0 ? ` (${comments.length})` : ""}
          </h2>

          {isCommentsLoading ? (
            <Skeleton className="h-16 rounded-xl" />
          ) : comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              {t("request.firstComment")}
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
                      {c.authorName ?? t("request.member")}{" · "}
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
                placeholder={t("request.commentPlaceholder")}
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
            <AlertDialogTitle>{t("request.closeConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {closureReason === "answered_prayer"
                ? t("request.closeConfirmAnswered")
                : t("request.closeConfirmClose")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { setPendingClose(false); executeAddUpdate(); }}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="btn-confirm-close"
            >
              {closureReason === "answered_prayer" ? t("request.markAnswered") : t("request.closeRequest")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={pendingArchive} onOpenChange={(open) => { if (!open) setPendingArchive(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("request.archiveConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("request.archiveConfirmDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeAddUpdate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="btn-confirm-archive"
            >
              {t("request.archive")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
