import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateGroup, getListMyGroupsQueryKey } from "@workspace/api-client-react";
import { ArrowLeft, Users, Camera, Loader2 } from "lucide-react";
import { useUpload } from "@workspace/object-storage-web";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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

export default function CreateGroup() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();
  const createGroup = useCreateGroup();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [churchName, setChurchName] = useState("");
  const [city, setCity] = useState("");
  const [verse, setVerse] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading: isUploadingPhoto } = useUpload({
    onSuccess: (res) => setImageUrl(`/api/storage${res.objectPath}`),
    onError: () => toast({ title: t("common.error"), variant: "destructive" }),
  });
  const [hidePrayerPersonNames, setHidePrayerPersonNames] = useState(false);
  const [allowCustomCategories, setAllowCustomCategories] = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  const [allowAnonymousRequests, setAllowAnonymousRequests] = useState(true);
  const [adminsCanViewAnonymousAuthors, setAdminsCanViewAnonymousAuthors] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createGroup.mutate(
      {
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
        onSuccess: (group) => {
          void queryClient.invalidateQueries({ queryKey: getListMyGroupsQueryKey() });
          setLocation(`/app/groups/${group.id}`);
        },
        onError: () => {
          toast({
            title: t("createGroup.error"),
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto space-y-8">
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
          <h1 className="text-2xl font-extrabold text-foreground">{t("createGroup.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("createGroup.subtitle")}</p>
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
              placeholder={t("group.form.namePlaceholder")}
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
              placeholder={t("group.form.descPlaceholder")}
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
                placeholder={t("group.form.churchPlaceholder")}
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
                placeholder={t("group.form.cityPlaceholder")}
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
              placeholder={t("group.form.versePlaceholder")}
              className="rounded-xl h-12"
            />
          </div>

          <div className="space-y-2">
            <Label>{t("group.form.groupPhoto")}</Label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                {imageUrl ? (
                  <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-6 h-6 text-primary/60" />
                )}
              </div>
              <div className="flex-1">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-background hover:bg-muted transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {isUploadingPhoto
                    ? <><Loader2 className="w-4 h-4 animate-spin" />{t("group.form.uploading")}</>
                    : <><Camera className="w-4 h-4" />{t("group.form.uploadPhoto")}</>
                  }
                </button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadFile(file);
                    e.target.value = "";
                  }}
                />
              </div>
            </div>
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
          data-testid="btn-create-group"
          disabled={!name.trim() || createGroup.isPending}
          className="w-full h-14 rounded-full text-base font-semibold shadow-lg shadow-primary/20"
        >
          <Users className="w-5 h-5 mr-2" />
          {createGroup.isPending ? t("createGroup.creating") : t("createGroup.btn")}
        </Button>
      </form>
    </div>
  );
}
