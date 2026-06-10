import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetGroup,
  useUpdateGroup,
  getGetGroupQueryKey,
  getListMyGroupsQueryKey,
} from "@workspace/api-client-react";
import { ArrowLeft, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
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
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-0.5 flex-1">
        <Label htmlFor={id} className="text-foreground font-medium cursor-pointer">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch
        id={id}
        data-testid={`switch-${id}`}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}

export default function GroupSettings() {
  const { groupId } = useParams<{ groupId: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  const { data: group, isLoading } = useGetGroup(groupId!, {
    query: { queryKey: getGetGroupQueryKey(groupId!), enabled: !!groupId },
  });

  const updateGroup = useUpdateGroup();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [churchName, setChurchName] = useState("");
  const [city, setCity] = useState("");
  const [verse, setVerse] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [hidePrayerPersonNames, setHidePrayerPersonNames] = useState(false);
  const [allowCustomCategories, setAllowCustomCategories] = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  const [allowAnonymousRequests, setAllowAnonymousRequests] = useState(true);
  const [adminsCanViewAnonymousAuthors, setAdminsCanViewAnonymousAuthors] = useState(true);

  useEffect(() => {
    if (group) {
      setName(group.name ?? "");
      setDescription(group.description ?? "");
      setChurchName(group.churchName ?? "");
      setCity(group.city ?? "");
      setVerse(group.verse ?? "");
      setImageUrl(group.imageUrl ?? "");
      setHidePrayerPersonNames(group.hidePrayerPersonNames ?? false);
      setAllowCustomCategories(group.allowCustomCategories ?? true);
      setAllowComments(group.allowComments ?? true);
      setAllowAnonymousRequests(group.allowAnonymousRequests ?? true);
      setAdminsCanViewAnonymousAuthors(group.adminsCanViewAnonymousAuthors ?? true);
    }
  }, [group]);

  if (!isLoading && group?.myRole !== "admin") {
    setLocation(`/app/groups/${groupId}`);
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateGroup.mutate(
      {
        groupId: groupId!,
        data: {
          name: name.trim(),
          description: description || undefined,
          churchName: churchName || undefined,
          city: city || undefined,
          verse: verse || undefined,
          imageUrl: imageUrl || undefined,
          hidePrayerPersonNames,
          allowCustomCategories,
          allowComments,
          allowAnonymousRequests,
          adminsCanViewAnonymousAuthors,
        },
      },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: getGetGroupQueryKey(groupId!) });
          void queryClient.invalidateQueries({ queryKey: getListMyGroupsQueryKey() });
          toast({ title: t("groupSettings.saved") });
        },
        onError: () => {
          toast({ title: t("groupSettings.error"), variant: "destructive" });
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-10 max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

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
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" /> {t("groupSettings.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{group?.name}</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="bg-card border border-border rounded-3xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("group.form.groupDetails")}</h2>

          <div className="space-y-2">
            <Label htmlFor="name">{t("group.form.name")} <span className="text-destructive">*</span></Label>
            <Input
              id="name"
              data-testid="input-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl h-12"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("group.form.description")}</Label>
            <Textarea
              id="description"
              data-testid="input-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl min-h-[100px] resize-none"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="churchName">{t("group.form.churchMinistry")}</Label>
              <Input
                id="churchName"
                data-testid="input-church-name"
                value={churchName}
                onChange={(e) => setChurchName(e.target.value)}
                className="rounded-xl h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">{t("group.form.city")}</Label>
              <Input
                id="city"
                data-testid="input-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="rounded-xl h-12"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="verse">{t("group.form.verse")}</Label>
            <Input
              id="verse"
              data-testid="input-verse"
              value={verse}
              onChange={(e) => setVerse(e.target.value)}
              className="rounded-xl h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">{t("group.form.imageUrl")}</Label>
            <Input
              id="imageUrl"
              data-testid="input-image-url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder={t("group.form.imageUrlPlaceholder")}
              className="rounded-xl h-12"
            />
          </div>
        </section>

        <section className="bg-card border border-border rounded-3xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("group.form.privacySettings")}</h2>
          <ToggleRow
            id="hidePrayerPersonNames"
            label={t("group.form.hidePrayerNames")}
            description={t("group.form.hidePrayerNamesDesc")}
            checked={hidePrayerPersonNames}
            onCheckedChange={setHidePrayerPersonNames}
          />
          <ToggleRow
            id="allowCustomCategories"
            label={t("group.form.allowCustomCategories")}
            description={t("group.form.allowCustomCategoriesDesc")}
            checked={allowCustomCategories}
            onCheckedChange={setAllowCustomCategories}
          />
          <ToggleRow
            id="allowComments"
            label={t("group.form.allowComments")}
            description={t("group.form.allowCommentsDesc")}
            checked={allowComments}
            onCheckedChange={setAllowComments}
          />
          <ToggleRow
            id="allowAnonymousRequests"
            label={t("group.form.allowAnonymous")}
            description={t("group.form.allowAnonymousDesc")}
            checked={allowAnonymousRequests}
            onCheckedChange={setAllowAnonymousRequests}
          />
          {allowAnonymousRequests && (
            <ToggleRow
              id="adminsCanViewAnonymousAuthors"
              label={t("group.form.adminsViewAnonymous")}
              description={t("group.form.adminsViewAnonymousDesc")}
              checked={adminsCanViewAnonymousAuthors}
              onCheckedChange={setAdminsCanViewAnonymousAuthors}
            />
          )}
        </section>

        <Button
          type="submit"
          data-testid="btn-save"
          disabled={!name.trim() || updateGroup.isPending}
          className="w-full h-14 rounded-full text-base font-semibold shadow-lg shadow-primary/20"
        >
          {updateGroup.isPending ? t("groupSettings.saving") : t("groupSettings.saveBtn")}
        </Button>
      </form>

      <section className="bg-card border border-border rounded-3xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("categories.title")}</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">{t("categories.title")}</p>
            <p className="text-xs text-muted-foreground">{t("categories.noCategories")}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            data-testid="btn-manage-categories"
            onClick={() => setLocation(`/app/groups/${groupId}/categories`)}
          >
            {t("common.viewAll")}
          </Button>
        </div>
      </section>

      <section className="bg-card border border-destructive/20 rounded-3xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-destructive/80 uppercase tracking-wider">{t("common.delete")}</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">{t("common.delete")} Group</p>
            <p className="text-xs text-muted-foreground">{t("request.archiveConfirm.desc")}</p>
          </div>
          <Button
            variant="outline"
            disabled
            className="rounded-full border-destructive/30 text-destructive/40"
            data-testid="btn-delete-group"
            title="Coming soon"
          >
            {t("common.delete")}
          </Button>
        </div>
      </section>
    </div>
  );
}
