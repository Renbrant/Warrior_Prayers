import { useState, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import {
  useStartPrayerSession,
  useMarkPrayed,
  useCompletePrayerSession,
  useGetGroup,
  getGetGroupQueryKey,
} from "@workspace/api-client-react";
import type { SessionRequest, SessionSummary } from "@workspace/api-client-react";
import {
  X,
  ArrowLeft,
  ArrowRight,
  Flame,
  CheckCircle2,
  BookOpen,
  Clock,
  Users,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  Plus,
  History,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Types ───────────────────────────────────────────────────────────────────

type Phase = "setup" | "compact" | "detailed" | "complete";
type Mode = "compact" | "detailed";
type OrgType = "priority" | "category";
type FilterType = "all_active" | "urgent_only" | "important_urgent" | "not_yet_prayed" | "already_praying" | "created_by_me" | "anonymous" | "recent_updates";

// ─── Urgency helpers ─────────────────────────────────────────────────────────

const URGENCY_BADGE: Record<string, string> = {
  urgent: "bg-red-500/20 text-red-400 border-red-500/30",
  important: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  normal: "bg-muted text-muted-foreground border-border",
};

function UrgencyBadge({ urgency }: { urgency: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${URGENCY_BADGE[urgency] ?? URGENCY_BADGE.normal}`}
    >
      {urgency === "urgent" && <Flame className="w-3 h-3" />}
      {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
    </span>
  );
}

// ─── Setup Phase ─────────────────────────────────────────────────────────────

function SetupPhase({
  groupId,
  groupName,
  onStart,
  isLoading,
}: {
  groupId: string;
  groupName: string;
  onStart: (mode: Mode, orgType: OrgType, filter: FilterType) => void;
  isLoading: boolean;
}) {
  const [mode, setMode] = useState<Mode>("detailed");
  const [orgType, setOrgType] = useState<OrgType>("priority");
  const [filter, setFilter] = useState<FilterType>("all_active");
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation(`/app/groups/${groupId}`)}
          className="rounded-full"
          data-testid="btn-exit-setup"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-bold text-foreground">Prayer Mode</h1>
          <p className="text-xs text-muted-foreground">{groupName}</p>
        </div>
      </header>

      <div className="flex-1 p-6 max-w-lg mx-auto w-full space-y-8">
        <div className="text-center space-y-2 pt-4">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto">
            <Flame className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-extrabold text-foreground">Ready to Pray?</h2>
          <p className="text-muted-foreground text-sm">Choose how you'd like to pray through your group's requests.</p>
        </div>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prayer Style</h3>
          <div className="grid grid-cols-2 gap-3">
            <ModeCard
              selected={mode === "detailed"}
              onClick={() => setMode("detailed")}
              title="Detailed"
              description="Read each request card-by-card, one at a time"
              testId="btn-mode-detailed"
            />
            <ModeCard
              selected={mode === "compact"}
              onClick={() => setMode("compact")}
              title="Compact"
              description="See all requests at a glance, grouped together"
              testId="btn-mode-compact"
            />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Organize By</h3>
          <div className="grid grid-cols-2 gap-3">
            <ModeCard
              selected={orgType === "priority"}
              onClick={() => setOrgType("priority")}
              title="Priority"
              description="Urgent requests first"
              testId="btn-org-priority"
            />
            <ModeCard
              selected={orgType === "category"}
              onClick={() => setOrgType("category")}
              title="Category"
              description="Grouped by prayer topic"
              testId="btn-org-category"
            />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Show Me</h3>
          <div className="space-y-2">
            {(
              [
                ["all_active", "All active & follow-up requests"],
                ["urgent_only", "Urgent requests only"],
                ["important_urgent", "Important & urgent"],
                ["not_yet_prayed", "Not yet prayed (by me)"],
                ["already_praying", "Requests I'm already praying for"],
                ["created_by_me", "My own prayer requests"],
                ["anonymous", "Anonymous requests"],
                ["recent_updates", "Recently updated (last 7 days)"],
              ] as [FilterType, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                data-testid={`btn-filter-${value}`}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border text-sm font-medium transition-all ${
                  filter === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground hover:border-primary/30"
                }`}
              >
                {label}
                {filter === value && <CheckCircle2 className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </div>
        </section>

        <Button
          onClick={() => onStart(mode, orgType, filter)}
          disabled={isLoading}
          className="w-full h-14 rounded-full text-base font-semibold shadow-lg shadow-primary/20"
          data-testid="btn-start-session"
        >
          {isLoading ? "Starting…" : "Start Praying →"}
        </Button>
      </div>
    </div>
  );
}

function ModeCard({
  selected,
  onClick,
  title,
  description,
  testId,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
  testId: string;
}) {
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      className={`flex flex-col gap-1.5 p-4 rounded-2xl border text-left transition-all ${
        selected
          ? "border-primary bg-primary/10"
          : "border-border bg-card hover:border-primary/30"
      }`}
    >
      <span className={`font-semibold text-sm ${selected ? "text-primary" : "text-foreground"}`}>
        {title}
      </span>
      <span className="text-xs text-muted-foreground leading-tight">{description}</span>
    </button>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ groupId, onBack }: { groupId: string; onBack: () => void }) {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center space-y-6">
      <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center mx-auto">
        <BookOpen className="w-8 h-8 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">No Active Prayer Requests</h2>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          There are no active prayer requests in this group right now.
        </p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button
          onClick={() => setLocation(`/app/groups/${groupId}/requests/new`)}
          className="rounded-full"
          data-testid="btn-empty-add"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Prayer Request
        </Button>
        <Button
          variant="outline"
          onClick={() => setLocation(`/app/groups/${groupId}/history`)}
          className="rounded-full"
          data-testid="btn-empty-history"
        >
          <History className="w-4 h-4 mr-2" /> View Prayer History
        </Button>
        <Button variant="ghost" onClick={onBack} className="rounded-full text-muted-foreground">
          Back to Group
        </Button>
      </div>
    </div>
  );
}

// ─── Compact Phase ────────────────────────────────────────────────────────────

function groupByCategory(requests: SessionRequest[]) {
  const groups: Map<string, { name: string; color: string | null; icon: string | null; items: SessionRequest[] }> =
    new Map();
  const uncategorized: SessionRequest[] = [];

  for (const req of requests) {
    if (req.categoryId && req.categoryName) {
      const key = req.categoryId;
      if (!groups.has(key)) {
        groups.set(key, { name: req.categoryName, color: req.categoryColor ?? null, icon: req.categoryIcon ?? null, items: [] });
      }
      groups.get(key)!.items.push(req);
    } else {
      uncategorized.push(req);
    }
  }

  const result = [...groups.values()];
  if (uncategorized.length > 0) {
    result.push({ name: "Uncategorized", color: null, icon: null, items: uncategorized });
  }
  return result;
}

function CompactPhase({
  groupId,
  session,
  onComplete,
  isCompleting,
}: {
  groupId: string;
  session: { id: string; organizationType: string; requests: SessionRequest[] };
  onComplete: () => void;
  isCompleting: boolean;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [prayedIds, setPrayedIds] = useState<Set<string>>(new Set());
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [showExit, setShowExit] = useState(false);
  const markPrayedMutation = useMarkPrayed();

  const byCategory = session.organizationType === "category";

  const groups = byCategory
    ? groupByCategory(session.requests)
    : [{ name: "All Requests", color: null, icon: null, items: session.requests }];

  const totalUrgent = session.requests.filter((r) => r.urgency === "urgent").length;

  function toggleGroup(name: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  function handleMarkPrayed(req: SessionRequest) {
    if (prayedIds.has(req.id)) return;
    setMarkingId(req.id);
    markPrayedMutation.mutate(
      { groupId, sessionId: session.id, data: { requestId: req.id } },
      {
        onSuccess: () => {
          setPrayedIds((prev) => new Set([...prev, req.id]));
          setMarkingId(null);
        },
        onError: () => setMarkingId(null),
      },
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {showExit && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6">
          <div className="bg-card border border-border rounded-3xl p-6 space-y-4 max-w-sm w-full">
            <h3 className="text-lg font-bold text-foreground">End Prayer Session?</h3>
            <p className="text-sm text-muted-foreground">
              Your progress will be saved. You can start another session any time.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-full"
                onClick={() => setShowExit(false)}
                data-testid="btn-exit-cancel"
              >
                Keep Praying
              </Button>
              <Button
                className="flex-1 rounded-full"
                onClick={onComplete}
                disabled={isCompleting}
                data-testid="btn-exit-confirm"
              >
                {isCompleting ? "Saving…" : "End Session"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <header className="flex items-center justify-between px-4 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowExit(true)}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Exit session"
            data-testid="btn-compact-exit"
          >
            <X className="w-4 h-4" />
          </button>
          <div>
            <p className="text-sm font-bold text-foreground">Compact Prayer</p>
            <p className="text-xs text-muted-foreground">
              {prayedIds.size}/{session.requests.length} prayed
              {totalUrgent > 0 ? ` · ${totalUrgent} urgent` : ""}
            </p>
          </div>
        </div>
        <Button
          onClick={onComplete}
          disabled={isCompleting}
          className="rounded-full text-sm h-9"
          data-testid="btn-compact-done"
        >
          {isCompleting ? "Saving…" : "Done Praying"}
        </Button>
      </header>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {groups.map((group) => {
          const urgentInGroup = group.items.filter((r) => r.urgency === "urgent");
          const isOpen = !byCategory || expanded.has(group.name);
          const focus = prayerFocusSummary(group.items);

          return (
            <div key={group.name} className="bg-card border border-border rounded-3xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left"
                onClick={() => byCategory && toggleGroup(group.name)}
                data-testid={`btn-group-${group.name}`}
              >
                <div className="flex items-center gap-3">
                  {group.icon && <span className="text-xl">{group.icon}</span>}
                  {group.color && !group.icon && (
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: group.color }}
                    />
                  )}
                  <div>
                    <p className="font-semibold text-foreground text-sm">{group.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {group.items.length} request{group.items.length !== 1 ? "s" : ""}
                      {urgentInGroup.length > 0 && (
                        <span className="text-red-400 ml-1.5">· {urgentInGroup.length} urgent</span>
                      )}
                    </p>
                    {focus && !isOpen && (
                      <p className="text-xs text-muted-foreground/70 mt-0.5 italic truncate max-w-[200px]">
                        {focus}
                      </p>
                    )}
                  </div>
                </div>
                {byCategory && (
                  isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRightIcon className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              {byCategory && !isOpen && focus && (
                <div className="px-4 pb-3 -mt-1">
                  <p className="text-xs text-muted-foreground italic">
                    <span className="font-semibold not-italic text-muted-foreground">Suggested focus: </span>
                    {focus}
                  </p>
                </div>
              )}

              {isOpen && (
                <div className="border-t border-border divide-y divide-border">
                  {byCategory && focus && (
                    <div className="px-4 py-2 bg-primary/5">
                      <p className="text-xs text-primary/80">
                        <span className="font-semibold">Suggested focus: </span>
                        {focus}
                      </p>
                    </div>
                  )}
                  {urgentInGroup.length > 0 && (
                    <div className="px-4 py-2 bg-red-500/5">
                      <p className="text-xs font-semibold text-red-400 mb-2 flex items-center gap-1">
                        <Flame className="w-3 h-3" /> Urgent
                      </p>
                      <div className="space-y-2">
                        {urgentInGroup.map((req) => (
                          <CompactRequestRow
                            key={req.id}
                            req={req}
                            prayed={prayedIds.has(req.id)}
                            onMarkPrayed={() => handleMarkPrayed(req)}
                            isMarking={markingId === req.id}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="px-4 py-3 space-y-2">
                    {group.items
                      .filter((r) => r.urgency !== "urgent")
                      .map((req) => (
                        <CompactRequestRow
                          key={req.id}
                          req={req}
                          prayed={prayedIds.has(req.id)}
                          onMarkPrayed={() => handleMarkPrayed(req)}
                          isMarking={markingId === req.id}
                        />
                      ))}
                    {group.items.filter((r) => r.urgency !== "urgent").length === 0 &&
                      urgentInGroup.length > 0 && (
                        <p className="text-xs text-muted-foreground italic">All requests in this group are urgent.</p>
                      )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div className="h-6" />
      </div>
    </div>
  );
}

function CompactRequestRow({
  req,
  prayed,
  onMarkPrayed,
  isMarking,
}: {
  req: SessionRequest;
  prayed: boolean;
  onMarkPrayed: () => void;
  isMarking: boolean;
}) {
  const displayName = req.prayerPersonName ?? (req.prayerPersonInitials ? `${req.prayerPersonInitials}.` : null);
  return (
    <div className="flex items-start gap-3 py-1">
      <button
        onClick={onMarkPrayed}
        disabled={prayed || isMarking}
        aria-label={prayed ? "Prayed" : "Mark as prayed"}
        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
          prayed
            ? "border-primary bg-primary"
            : "border-border hover:border-primary/60"
        }`}
        data-testid={`btn-compact-pray-${req.id}`}
      >
        {prayed && <Check className="w-3 h-3 text-white" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-snug ${prayed ? "line-through text-muted-foreground" : "text-foreground"}`}>
          {req.title}
        </p>
        {displayName && (
          <p className="text-xs text-muted-foreground">For {displayName}</p>
        )}
        {req.latestUpdate && (
          <p className="text-xs text-primary/70 mt-0.5 italic truncate">"{req.latestUpdate}"</p>
        )}
      </div>
      {req.urgency !== "normal" && <UrgencyBadge urgency={req.urgency} />}
    </div>
  );
}

function prayerFocusSummary(items: SessionRequest[]): string {
  const titles = items.slice(0, 3).map((r) => r.title);
  if (titles.length === 0) return "";
  const joined = titles.join(", ");
  return items.length > 3 ? `${joined} and ${items.length - 3} more` : joined;
}

// ─── Detailed Phase ───────────────────────────────────────────────────────────

function DetailedPhase({
  groupId,
  session,
  onComplete,
  isCompleting,
}: {
  groupId: string;
  session: { id: string; requests: SessionRequest[] };
  onComplete: () => void;
  isCompleting: boolean;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prayedIds, setPrayedIds] = useState<Set<string>>(new Set());
  const [showExit, setShowExit] = useState(false);
  const [, setLocation] = useLocation();

  const markPrayedMutation = useMarkPrayed();

  const requests = session.requests;
  const total = requests.length;
  const current = requests[currentIndex];

  function handleMarkPrayed() {
    if (!current || prayedIds.has(current.id)) return;
    markPrayedMutation.mutate(
      { groupId, sessionId: session.id, data: { requestId: current.id } },
      {
        onSuccess: () => {
          setPrayedIds((prev) => new Set([...prev, current.id]));
        },
      },
    );
  }

  function handleNext() {
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      onComplete();
    }
  }

  const isPrayed = current ? prayedIds.has(current.id) : false;
  const isLast = currentIndex === total - 1;

  if (!current) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No requests in this session.</p>
      </div>
    );
  }

  const displayName = current.prayerPersonName ?? current.prayerPersonInitials;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowExit(true)}
            className="rounded-full"
            data-testid="btn-exit"
          >
            <X className="w-5 h-5" />
          </Button>
          <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
            />
          </div>
        </div>
        <span className="text-sm font-semibold text-muted-foreground" data-testid="progress-indicator">
          {currentIndex + 1} / {total}
        </span>
      </header>

      {/* Card */}
      <div className="flex-1 overflow-auto p-4 md:p-8 flex flex-col items-center">
        <div className="w-full max-w-lg space-y-4">
          {/* Category + Urgency */}
          <div className="flex flex-wrap items-center gap-2">
            {current.categoryName && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border text-xs font-medium text-foreground">
                {current.categoryIcon && <span>{current.categoryIcon}</span>}
                {current.categoryName}
              </span>
            )}
            <UrgencyBadge urgency={current.urgency} />
            {current.status === "follow_up" && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
                Follow-up
              </span>
            )}
          </div>

          {/* Main card */}
          <div className="bg-card border border-border rounded-3xl p-6 space-y-5">
            {displayName && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                  {(current.prayerPersonInitials ?? current.prayerPersonName ?? "?").slice(0, 2).toUpperCase()}
                </div>
                <p className="text-sm text-muted-foreground">
                  {current.prayerPersonName ? `Praying for ${current.prayerPersonName}` : `Praying for ${current.prayerPersonInitials}`}
                </p>
              </div>
            )}

            <div>
              <h2 className="text-xl font-bold text-foreground leading-tight">{current.title}</h2>
            </div>

            {current.description && (
              <div className="bg-background rounded-2xl p-4">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {current.description}
                </p>
              </div>
            )}

            {current.latestUpdate && (
              <div className="border-l-2 border-primary/40 pl-4">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Latest Update</p>
                <p className="text-sm text-foreground leading-relaxed italic">"{current.latestUpdate}"</p>
              </div>
            )}

            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1 border-t border-border">
              {current.importantDate && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(current.importantDate).toLocaleDateString()}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {current.commitmentCount} praying
              </span>
              <span>
                Added {new Date(current.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3 pt-2">
            <Button
              onClick={handleMarkPrayed}
              disabled={isPrayed || markPrayedMutation.isPending}
              variant={isPrayed ? "outline" : "default"}
              className={`w-full h-12 rounded-full font-semibold transition-all ${
                isPrayed ? "border-green-500/30 text-green-400 bg-green-500/10" : "shadow-lg shadow-primary/20"
              }`}
              data-testid="btn-mark-prayed"
            >
              {isPrayed ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Prayed ✓
                </>
              ) : (
                "🙏 Mark as Prayed"
              )}
            </Button>

            <Button
              onClick={handleNext}
              disabled={isCompleting}
              variant="outline"
              className="w-full h-12 rounded-full font-semibold"
              data-testid="btn-next"
            >
              {isLast ? (
                isCompleting ? "Finishing…" : "Finish Session"
              ) : (
                <>
                  Next Request <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          {currentIndex > 0 && (
            <button
              onClick={() => setCurrentIndex((i) => i - 1)}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground py-2"
              data-testid="btn-prev"
            >
              ← Previous request
            </button>
          )}
        </div>
      </div>

      {/* Exit confirmation modal */}
      {showExit && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-sm w-full space-y-5">
            <h3 className="font-bold text-foreground text-lg">Exit Prayer Session?</h3>
            <p className="text-sm text-muted-foreground">
              Your progress ({prayedIds.size} prayed) won't be saved if you exit now.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-full"
                onClick={() => setShowExit(false)}
                data-testid="btn-exit-cancel"
              >
                Keep Praying
              </Button>
              <Button
                variant="destructive"
                className="flex-1 rounded-full"
                onClick={() => setLocation(`/app/groups/${groupId}`)}
                data-testid="btn-exit-confirm"
              >
                Exit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Complete Phase ───────────────────────────────────────────────────────────

function CompletePhase({
  groupId,
  summary,
  onStartAnother,
}: {
  groupId: string;
  summary: SessionSummary;
  onStartAnother: () => void;
}) {
  const [, setLocation] = useLocation();

  const minutes = Math.floor(summary.durationSeconds / 60);
  const seconds = summary.durationSeconds % 60;
  const durationLabel =
    minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start p-6">
      <div className="w-full max-w-lg space-y-8 pt-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-green-500/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">Session Complete!</h1>
            <p className="text-muted-foreground text-sm mt-1">
              You prayed through {summary.prayedCount} of {summary.totalCount} requests.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Prayed" value={String(summary.prayedCount)} />
          <StatCard label="Duration" value={durationLabel} />
          <StatCard label="Categories" value={String(summary.categoriesCovered.length)} />
        </div>

        {/* Categories covered */}
        {summary.categoriesCovered.length > 0 && (
          <div className="bg-card border border-border rounded-3xl p-5 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Topics Covered
            </h3>
            <div className="flex flex-wrap gap-2">
              {summary.categoriesCovered.map((cat) => (
                <span
                  key={cat}
                  className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Prayed requests list */}
        {summary.prayedRequests.length > 0 && (
          <div className="bg-card border border-border rounded-3xl p-5 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Prayed For
            </h3>
            <ul className="space-y-2">
              {summary.prayedRequests.map((req) => (
                <li key={req.id} className="flex items-center gap-2 text-sm text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  {req.title}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pb-8">
          <Button
            onClick={() => setLocation(`/app/groups/${groupId}`)}
            className="w-full h-12 rounded-full font-semibold shadow-lg shadow-primary/20"
            data-testid="btn-return-group"
          >
            Return to Group
          </Button>
          <Button
            variant="outline"
            onClick={onStartAnother}
            className="w-full h-12 rounded-full font-semibold"
            data-testid="btn-start-another"
          >
            Start Another Session
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 text-center">
      <p className="text-xl font-bold text-primary">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

// ─── Main orchestrator ────────────────────────────────────────────────────────

export default function PrayerMode() {
  const { groupId } = useParams<{ groupId: string }>();
  const [, setLocation] = useLocation();

  const [phase, setPhase] = useState<Phase>("setup");
  const [sessionData, setSessionData] = useState<{
    id: string;
    organizationType: string;
    requests: SessionRequest[];
  } | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [sessionMode, setSessionMode] = useState<Mode>("detailed");

  const { data: group } = useGetGroup(groupId!, {
    query: { queryKey: getGetGroupQueryKey(groupId!), enabled: !!groupId },
  });

  const startMutation = useStartPrayerSession();
  const completeMutation = useCompletePrayerSession();

  const handleStart = useCallback(
    (mode: Mode, orgType: OrgType, filter: FilterType) => {
      setSessionMode(mode);
      startMutation.mutate(
        { groupId: groupId!, data: { mode, organizationType: orgType, filter } },
        {
          onSuccess: (data) => {
            if (data.requests.length === 0) {
              setPhase("compact");
              setSessionData({ id: data.id, organizationType: data.organizationType, requests: [] });
            } else {
              setSessionData({ id: data.id, organizationType: data.organizationType, requests: data.requests });
              setPhase(mode);
            }
          },
        },
      );
    },
    [groupId, startMutation],
  );

  const handleComplete = useCallback(() => {
    if (!sessionData) return;
    completeMutation.mutate(
      { groupId: groupId!, sessionId: sessionData.id },
      {
        onSuccess: (data) => {
          setSummary(data);
          setPhase("complete");
        },
      },
    );
  }, [groupId, sessionData, completeMutation]);

  const handleStartAnother = useCallback(() => {
    setPhase("setup");
    setSessionData(null);
    setSummary(null);
    startMutation.reset();
    completeMutation.reset();
  }, [startMutation, completeMutation]);

  if (phase === "setup") {
    return (
      <SetupPhase
        groupId={groupId!}
        groupName={group?.name ?? ""}
        onStart={handleStart}
        isLoading={startMutation.isPending}
      />
    );
  }

  if ((phase === "compact" || phase === "detailed") && sessionData?.requests.length === 0) {
    return (
      <EmptyState
        groupId={groupId!}
        onBack={() => setLocation(`/app/groups/${groupId}`)}
      />
    );
  }

  if (phase === "compact" && sessionData) {
    return (
      <CompactPhase
        groupId={groupId!}
        session={sessionData}
        onComplete={handleComplete}
        isCompleting={completeMutation.isPending}
      />
    );
  }

  if (phase === "detailed" && sessionData) {
    return (
      <DetailedPhase
        groupId={groupId!}
        session={sessionData}
        onComplete={handleComplete}
        isCompleting={completeMutation.isPending}
      />
    );
  }

  if (phase === "complete" && summary) {
    return (
      <CompletePhase
        groupId={groupId!}
        summary={summary}
        onStartAnother={handleStartAnother}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Skeleton className="w-64 h-64 rounded-3xl" />
    </div>
  );
}
