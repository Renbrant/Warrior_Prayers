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
          toast({ title: "Settings saved", description: "Group settings updated successfully." });
        },
        onError: () => {
          toast({ title: "Failed to save settings", variant: "destructive" });
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
            <Settings className="w-5 h-5 text-primary" /> Group Settings
          </h1>
          <p className="text-sm text-muted-foreground">{group?.name}</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="bg-card border border-border rounded-3xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Group Details</h2>

          <div className="space-y-2">
            <Label htmlFor="name">Group Name <span className="text-destructive">*</span></Label>
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
            <Label htmlFor="description">Description</Label>
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
              <Label htmlFor="churchName">Church / Ministry</Label>
              <Input
                id="churchName"
                data-testid="input-church-name"
                value={churchName}
                onChange={(e) => setChurchName(e.target.value)}
                className="rounded-xl h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
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
            <Label htmlFor="verse">Scripture Verse</Label>
            <Input
              id="verse"
              data-testid="input-verse"
              value={verse}
              onChange={(e) => setVerse(e.target.value)}
              className="rounded-xl h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Group Image URL</Label>
            <Input
              id="imageUrl"
              data-testid="input-image-url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="rounded-xl h-12"
            />
          </div>
        </section>

        <section className="bg-card border border-border rounded-3xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Privacy Settings</h2>
          <ToggleRow id="hidePrayerPersonNames" label="Hide prayer person names" description="Members won't see who a prayer request is for" checked={hidePrayerPersonNames} onCheckedChange={setHidePrayerPersonNames} />
          <ToggleRow id="allowCustomCategories" label="Allow custom categories" description="Members can create their own prayer categories" checked={allowCustomCategories} onCheckedChange={setAllowCustomCategories} />
          <ToggleRow id="allowComments" label="Allow comments on prayer requests" description="Members can leave comments and encouragement" checked={allowComments} onCheckedChange={setAllowComments} />
          <ToggleRow id="allowAnonymousRequests" label="Allow anonymous prayer requests" description="Members can submit requests without showing their name" checked={allowAnonymousRequests} onCheckedChange={setAllowAnonymousRequests} />
          {allowAnonymousRequests && (
            <ToggleRow id="adminsCanViewAnonymousAuthors" label="Admins can see anonymous authors" description="Admins and moderators can view who submitted anonymous requests" checked={adminsCanViewAnonymousAuthors} onCheckedChange={setAdminsCanViewAnonymousAuthors} />
          )}
        </section>

        <Button
          type="submit"
          data-testid="btn-save"
          disabled={!name.trim() || updateGroup.isPending}
          className="w-full h-14 rounded-full text-base font-semibold shadow-lg shadow-primary/20"
        >
          {updateGroup.isPending ? "Saving…" : "Save Changes"}
        </Button>
      </form>

      <section className="bg-card border border-destructive/20 rounded-3xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-destructive/80 uppercase tracking-wider">Danger Zone</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Delete Group</p>
            <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
          </div>
          <Button
            variant="outline"
            disabled
            className="rounded-full border-destructive/30 text-destructive/40"
            data-testid="btn-delete-group"
            title="Coming soon"
          >
            Delete Group
          </Button>
        </div>
      </section>
    </div>
  );
}
