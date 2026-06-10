import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreatePrayerRequest,
  useListCategories,
  useGetGroup,
  getListPrayerRequestsQueryKey,
  getGetGroupQueryKey,
  getListCategoriesQueryKey,
} from "@workspace/api-client-react";
import { ArrowLeft, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";

function ToggleRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="flex-1">
        <label htmlFor={id} className="text-sm font-medium cursor-pointer">
          {label}
        </label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export default function CreatePrayerRequest() {
  const { groupId } = useParams<{ groupId: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  const { data: group } = useGetGroup(groupId!, { query: { queryKey: getGetGroupQueryKey(groupId!), enabled: !!groupId } });
  const { data: categories = [] } = useListCategories(groupId!, { query: { queryKey: getListCategoriesQueryKey(groupId!), enabled: !!groupId } });
  const createRequest = useCreatePrayerRequest();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prayerPersonName, setPrayerPersonName] = useState("");
  const [categoryId, setCategoryId] = useState<string>("none");
  const [urgency, setUrgency] = useState("normal");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const [importantDate, setImportantDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createRequest.mutate(
      {
        groupId: groupId!,
        data: {
          title: title.trim(),
          description: description || undefined,
          prayerPersonName: prayerPersonName || undefined,
          categoryId: categoryId !== "none" ? categoryId : undefined,
          urgency: urgency as "normal" | "important" | "urgent",
          isAnonymous,
          allowComments,
          importantDate: importantDate || undefined,
        },
      },
      {
        onSuccess: (created) => {
          void queryClient.invalidateQueries({ queryKey: getListPrayerRequestsQueryKey(groupId!) });
          toast({ title: t("createRequest.successTitle"), description: t("createRequest.successDesc") });
          setLocation(`/app/groups/${groupId}/requests/${created.id}`);
        },
        onError: () => {
          toast({ title: t("common.error"), description: t("createRequest.error"), variant: "destructive" });
        },
      },
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation(`/app/groups/${groupId}/requests`)}
          className="rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">{t("createRequest.title")}</h1>
      </div>

      <div className="flex items-start gap-2 p-3 bg-primary/10 border border-primary/20 rounded-2xl text-sm">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-muted-foreground">
          {t("createRequest.privacyNote")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <section className="bg-card border border-border rounded-3xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {t("createRequest.requestDetails")}
          </h2>

          <div className="space-y-2">
            <Label htmlFor="title">
              {t("createRequest.titleField")} <span className="text-red-400">*</span>
            </Label>
            <Input
              id="title"
              data-testid="input-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("createRequest.titlePlaceholder")}
              required
              className="rounded-xl h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prayerPersonName">
              {t("createRequest.personName")}{" "}
              <span className="text-xs text-muted-foreground">{t("createRequest.personNameEncrypted")}</span>
            </Label>
            <Input
              id="prayerPersonName"
              data-testid="input-person-name"
              value={prayerPersonName}
              onChange={(e) => setPrayerPersonName(e.target.value)}
              placeholder={t("createRequest.personNamePlaceholder")}
              className="rounded-xl h-12"
            />
            {group?.hidePrayerPersonNames && (
              <p className="text-xs text-muted-foreground">
                {t("createRequest.hiddenInitials")}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              {t("createRequest.description")}{" "}
              <span className="text-xs text-muted-foreground">{t("createRequest.personNameEncrypted")}</span>
            </Label>
            <Textarea
              id="description"
              data-testid="input-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("createRequest.descriptionPlaceholder")}
              rows={4}
              className="rounded-xl resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("createRequest.category")}</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="rounded-xl h-12" data-testid="select-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("createRequest.noCategory")}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("createRequest.urgency")}</Label>
              <Select value={urgency} onValueChange={setUrgency}>
                <SelectTrigger className="rounded-xl h-12" data-testid="select-urgency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">{t("requests.urgency.normal")}</SelectItem>
                  <SelectItem value="important">{t("requests.urgency.important")}</SelectItem>
                  <SelectItem value="urgent">{t("requests.urgency.urgent")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="importantDate">{t("createRequest.importantDate")}</Label>
            <Input
              id="importantDate"
              type="date"
              value={importantDate}
              onChange={(e) => setImportantDate(e.target.value)}
              className="rounded-xl h-12"
            />
          </div>
        </section>

        <section className="bg-card border border-border rounded-3xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {t("createRequest.privacy")}
          </h2>

          {group?.allowAnonymousRequests && (
            <ToggleRow
              id="isAnonymous"
              label={t("createRequest.postAnonymous")}
              description={t("createRequest.postAnonymousDesc")}
              checked={isAnonymous}
              onCheckedChange={setIsAnonymous}
            />
          )}

          <ToggleRow
            id="allowComments"
            label={t("createRequest.allowComments")}
            description={t("createRequest.allowCommentsDesc")}
            checked={allowComments}
            onCheckedChange={setAllowComments}
          />
        </section>

        <Button
          type="submit"
          disabled={!title.trim() || createRequest.isPending}
          className="w-full h-12 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          data-testid="btn-submit"
        >
          {createRequest.isPending ? t("createRequest.submitting") : t("createRequest.submitBtn")}
        </Button>
      </form>
    </div>
  );
}
