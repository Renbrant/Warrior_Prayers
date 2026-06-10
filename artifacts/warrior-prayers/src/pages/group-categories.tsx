import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListCategories,
  useCreateCategory,
  useUpdateCategory,
  getListCategoriesQueryKey,
} from "@workspace/api-client-react";
import { ArrowLeft, Plus, Pencil, Check, X, Tag, EyeOff, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const PRESET_COLORS = [
  "#e07b2a", "#ef4444", "#f97316", "#eab308",
  "#22c55e", "#06b6d4", "#6366f1", "#ec4899",
  "#94a3b8",
];

function ColorDot({ color, selected, onClick }: { color: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-7 h-7 rounded-full border-2 transition-transform ${
        selected ? "border-foreground scale-110" : "border-transparent hover:scale-105"
      }`}
      style={{ backgroundColor: color }}
    />
  );
}

function CategoryRow({
  cat,
  onToggleActive,
  onEdit,
}: {
  cat: {
    id: string;
    name: string;
    color?: string | null;
    icon?: string | null;
    isActive: boolean;
    isDefault: boolean;
  };
  onToggleActive: (id: string, isActive: boolean) => void;
  onEdit: (cat: { id: string; name: string; color?: string | null; icon?: string | null }) => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-background rounded-2xl">
      <div
        className="w-4 h-4 rounded-full shrink-0"
        style={{ backgroundColor: cat.color ?? "#94a3b8" }}
      />
      <span className="flex-1 text-sm font-medium">
        {cat.icon && <span className="mr-1.5">{cat.icon}</span>}
        {cat.name}
        {cat.isDefault && (
          <span className="ml-2 text-xs text-muted-foreground">(default)</span>
        )}
      </span>
      {!cat.isActive && (
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          Inactive
        </span>
      )}
      <button
        onClick={() => onEdit(cat)}
        className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg"
        title="Edit"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => onToggleActive(cat.id, !cat.isActive)}
        className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg"
        title={cat.isActive ? "Deactivate" : "Reactivate"}
      >
        {cat.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

export default function GroupCategories() {
  const { groupId } = useParams<{ groupId: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const { data: categories = [], isLoading } = useListCategories(groupId!, {
    query: { queryKey: getListCategoriesQueryKey(groupId!), enabled: !!groupId },
  });

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [editColor, setEditColor] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createCategory.mutate(
      { groupId: groupId!, data: { name: newName.trim(), icon: newIcon || undefined, color: newColor } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey(groupId!) });
          setShowCreate(false);
          setNewName("");
          setNewIcon("");
          setNewColor(PRESET_COLORS[0]);
          toast({ title: "Category created" });
        },
        onError: () => toast({ title: "Error", description: "Could not create category.", variant: "destructive" }),
      },
    );
  };

  const startEdit = (cat: { id: string; name: string; color?: string | null; icon?: string | null }) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditIcon(cat.icon ?? "");
    setEditColor(cat.color ?? PRESET_COLORS[0]);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;
    updateCategory.mutate(
      {
        groupId: groupId!,
        categoryId: id,
        data: { name: editName.trim(), icon: editIcon || undefined, color: editColor || undefined },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey(groupId!) });
          setEditingId(null);
          toast({ title: "Category updated" });
        },
        onError: () => toast({ title: "Error", description: "Could not update category.", variant: "destructive" }),
      },
    );
  };

  const handleToggleActive = (id: string, isActive: boolean) => {
    updateCategory.mutate(
      { groupId: groupId!, categoryId: id, data: { isActive } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey(groupId!) });
          toast({ title: isActive ? "Category reactivated" : "Category deactivated" });
        },
        onError: () => toast({ title: "Error", description: "Could not update category.", variant: "destructive" }),
      },
    );
  };

  const active = categories.filter((c) => c.isActive);
  const inactive = categories.filter((c) => !c.isActive);

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation(`/app/groups/${groupId}/settings`)}
          className="rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-sm text-muted-foreground">Organize prayer requests by topic</p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          data-testid="btn-new-category"
        >
          <Plus className="w-4 h-4 mr-1.5" /> New
        </Button>
      </div>

      {showCreate && (
        <section className="bg-card border border-border rounded-3xl p-5 space-y-4">
          <h2 className="text-sm font-semibold">New Category</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">Name</Label>
              <Input
                id="new-name"
                data-testid="input-category-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Health, Family, Work..."
                className="rounded-xl h-11"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-icon">Emoji (optional)</Label>
              <Input
                id="new-icon"
                value={newIcon}
                onChange={(e) => setNewIcon(e.target.value)}
                placeholder="🙏"
                className="rounded-xl h-11 w-24"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <ColorDot key={c} color={c} selected={newColor === c} onClick={() => setNewColor(c)} />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={!newName.trim() || createCategory.isPending}
                className="rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="btn-create-category"
              >
                {createCategory.isPending ? "Creating..." : "Create"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)} className="rounded-2xl">
                Cancel
              </Button>
            </div>
          </form>
        </section>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 rounded-2xl" />)}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground space-y-2">
          <Tag className="w-8 h-8 mx-auto opacity-30" />
          <p className="text-sm">No categories yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {active.length > 0 && (
            <section className="bg-card border border-border rounded-3xl p-5 space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Active ({active.length})
              </h2>
              <div className="space-y-2">
                {active.map((cat) =>
                  editingId === cat.id ? (
                    <div key={cat.id} className="p-3 bg-background rounded-2xl space-y-3">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="rounded-xl h-10"
                        autoFocus
                      />
                      <Input
                        value={editIcon}
                        onChange={(e) => setEditIcon(e.target.value)}
                        placeholder="Emoji"
                        className="rounded-xl h-10 w-24"
                      />
                      <div className="flex gap-2 flex-wrap">
                        {PRESET_COLORS.map((c) => (
                          <ColorDot key={c} color={c} selected={editColor === c} onClick={() => setEditColor(c)} />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(cat.id)}
                          disabled={!editName.trim() || updateCategory.isPending}
                          className="rounded-xl"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" /> Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="rounded-xl">
                          <X className="w-3.5 h-3.5 mr-1" /> Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <CategoryRow
                      key={cat.id}
                      cat={cat}
                      onToggleActive={handleToggleActive}
                      onEdit={startEdit}
                    />
                  ),
                )}
              </div>
            </section>
          )}

          {inactive.length > 0 && (
            <section className="bg-card border border-border rounded-3xl p-5 space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Inactive ({inactive.length})
              </h2>
              <div className="space-y-2">
                {inactive.map((cat) => (
                  <CategoryRow
                    key={cat.id}
                    cat={cat}
                    onToggleActive={handleToggleActive}
                    onEdit={startEdit}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
