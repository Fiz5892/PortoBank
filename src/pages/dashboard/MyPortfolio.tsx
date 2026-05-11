import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Briefcase, ExternalLink, Loader2, Pencil, Plus, Trash2, Upload } from "lucide-react";
import TagInput from "@/components/onboarding/TagInput";
import EmptyState from "@/components/layout/EmptyState";
import { useSEO } from "@/hooks/useSEO";

interface PortfolioItem {
  id: string;
  type: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  external_link: string | null;
  tags: string[] | null;
}

interface ItemForm {
  id?: string;
  type: string;
  title: string;
  description: string;
  cover_url: string;
  external_link: string;
  tags: string[];
}

const emptyForm: ItemForm = {
  type: "project",
  title: "",
  description: "",
  cover_url: "",
  external_link: "",
  tags: [],
};

const MyPortfolio = () => {
  const { user } = useAuth();
  useSEO({ title: "My Portfolio - PortoBank", description: "Manage your projects, certificates, and articles." });

  const [portfolioId, setPortfolioId] = useState<string | null>(null);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<ItemForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const refresh = async (uid: string) => {
    let { data: portfolios } = await supabase
      .from("portfolios")
      .select("id, is_published")
      .eq("user_id", uid)
      .order("created_at")
      .limit(1);

    let portfolio = portfolios?.[0];
    if (!portfolio) {
      const { data: created, error } = await supabase
        .from("portfolios")
        .insert({ user_id: uid, title: "My Portfolio" })
        .select("id, is_published")
        .single();
      if (error) {
        toast.error("Could not create portfolio");
        return;
      }
      portfolio = created;
    }

    if (!portfolio) return;
    setPortfolioId(portfolio.id);

    const { data: itemRows } = await supabase
      .from("portfolio_items")
      .select("id, type, title, description, cover_url, external_link, tags")
      .eq("portfolio_id", portfolio.id)
      .order("created_at", { ascending: false });
    setItems((itemRows ?? []) as PortfolioItem[]);
  };

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    refresh(user.id).finally(() => setLoading(false));
  }, [user]);

  const openCreate = () => {
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (item: PortfolioItem) => {
    setForm({
      id: item.id,
      type: item.type,
      title: item.title,
      description: item.description ?? "",
      cover_url: item.cover_url ?? "",
      external_link: item.external_link ?? "",
      tags: item.tags ?? [],
    });
    setModalOpen(true);
  };

  const handleCoverUpload = async (file: File) => {
    if (!user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      toast.error("Upload failed");
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setForm((prev) => ({ ...prev, cover_url: data.publicUrl }));
    setUploading(false);
  };

  const saveItem = async () => {
    if (!portfolioId) return;
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }

    setSaving(true);
    const payload = {
      portfolio_id: portfolioId,
      type: form.type,
      title: form.title.trim(),
      description: form.description.trim() || null,
      cover_url: form.cover_url || null,
      external_link: form.external_link.trim() || null,
      tags: form.tags.length > 0 ? form.tags : null,
    };

    const { error } = form.id
      ? await supabase.from("portfolio_items").update(payload).eq("id", form.id)
      : await supabase.from("portfolio_items").insert(payload);

    setSaving(false);
    if (error) {
      toast.error("Could not save item");
      return;
    }

    toast.success(form.id ? "Item updated" : "Item added");
    setModalOpen(false);
    if (user) await refresh(user.id);
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from("portfolio_items").delete().eq("id", id);
    if (error) {
      toast.error("Delete failed");
      return;
    }
    toast.success("Item deleted");
    setConfirmDelete(null);
    if (user) await refresh(user.id);
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold">My Portfolio</h1>
            <p className="text-muted-foreground mt-1">Manage your projects, certificates, and articles.</p>
          </div>
          <Button onClick={openCreate} disabled={!portfolioId}>
            <Plus className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </div>

        <Card className="p-6 shadow-subtle">
          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No items added yet"
              description="Add your first project, certificate, or article to start building your portfolio."
              action={
                <Button onClick={openCreate} disabled={!portfolioId}>
                  <Plus className="mr-2 h-4 w-4" /> Add your first item
                </Button>
              }
              className="py-8"
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <Card key={item.id} className="overflow-hidden shadow-subtle flex flex-col">
                  <div className="aspect-video bg-secondary overflow-hidden">
                    {item.cover_url ? (
                      <img src={item.cover_url} alt={item.title} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
                        No cover
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <Badge variant="secondary" className="w-fit text-xs font-normal mb-2 capitalize">
                      {item.type}
                    </Badge>
                    <h3 className="font-heading font-semibold truncate">{item.title}</h3>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{item.description}</p>
                    )}
                    {item.external_link && (
                      <a
                        href={item.external_link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-xs text-primary mt-2"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" /> Open link
                      </a>
                    )}
                    <div className="flex gap-2 mt-auto pt-4">
                      <Button variant="outline" size="sm" onClick={() => openEdit(item)} className="flex-1">
                        <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmDelete(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit item" : "Add item"}</DialogTitle>
            <DialogDescription>Showcase a project, certificate, or article.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(value) => setForm((prev) => ({ ...prev, type: value }))}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="certificate">Certificate</SelectItem>
                  <SelectItem value="article">Article</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="item-title">Title</Label>
              <Input
                id="item-title"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="item-description">Description</Label>
              <Textarea
                id="item-description"
                rows={4}
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Cover image</Label>
              <div className="mt-1.5 flex items-center gap-3">
                {form.cover_url && (
                  <img src={form.cover_url} alt="" className="h-14 w-20 object-cover rounded-md border" />
                )}
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-input text-sm cursor-pointer hover:bg-secondary">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {form.cover_url ? "Replace" : "Upload"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) handleCoverUpload(file);
                    }}
                  />
                </label>
              </div>
            </div>
            <div>
              <Label htmlFor="item-link">External link</Label>
              <Input
                id="item-link"
                placeholder="https://github.com/..."
                value={form.external_link}
                onChange={(event) => setForm((prev) => ({ ...prev, external_link: event.target.value }))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Skill tags</Label>
              <div className="mt-1.5">
                <TagInput
                  value={form.tags}
                  onChange={(tags) => setForm((prev) => ({ ...prev, tags }))}
                  placeholder="Add tag and press Enter"
                  max={10}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={saveItem} disabled={saving || uploading}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && deleteItem(confirmDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default MyPortfolio;
