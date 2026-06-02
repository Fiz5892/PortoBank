import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, ExternalLink, Folder, X } from "lucide-react";

interface ProjectRow {
  id: string;
  type: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  external_link: string | null;
  tags: string[] | null;
}

interface FormState {
  id?: string;
  title: string;
  type: string;
  description: string;
  cover_url: string;
  external_link: string;
  tags: string[];
}

const emptyForm: FormState = {
  title: "",
  type: "Project",
  description: "",
  cover_url: "",
  external_link: "",
  tags: [],
};

const ManageProjects = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<ProjectRow[]>([]);
  const [portfolioId, setPortfolioId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [tagDraft, setTagDraft] = useState("");
  const [toDelete, setToDelete] = useState<ProjectRow | null>(null);

  const ensurePortfolio = async (): Promise<string | null> => {
    if (!user) return null;
    const { data: existing } = await supabase
      .from("portfolios")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    if (existing?.id) return existing.id;
    const { data: inserted, error } = await supabase
      .from("portfolios")
      .insert({
        user_id: user.id,
        title: "My Portfolio",
        is_published: true,
      })
      .select("id")
      .single();
    if (error) {
      toast.error(error.message);
      return null;
    }
    return inserted.id;
  };

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const pid = await ensurePortfolio();
    setPortfolioId(pid);
    if (!pid) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("portfolio_items")
      .select("id, type, title, description, cover_url, external_link, tags")
      .eq("portfolio_id", pid)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data ?? []) as ProjectRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const openCreate = () => {
    setForm(emptyForm);
    setTagDraft("");
    setDialogOpen(true);
  };

  const openEdit = (item: ProjectRow) => {
    setForm({
      id: item.id,
      title: item.title,
      type: item.type || "Project",
      description: item.description ?? "",
      cover_url: item.cover_url ?? "",
      external_link: item.external_link ?? "",
      tags: item.tags ?? [],
    });
    setTagDraft("");
    setDialogOpen(true);
  };

  const addTag = () => {
    const t = tagDraft.trim();
    if (!t) return;
    if (form.tags.includes(t)) {
      setTagDraft("");
      return;
    }
    if (form.tags.length >= 10) {
      toast.error("Maksimal 10 tag");
      return;
    }
    setForm({ ...form, tags: [...form.tags, t] });
    setTagDraft("");
  };

  const removeTag = (t: string) =>
    setForm({ ...form, tags: form.tags.filter((x) => x !== t) });

  const handleSave = async () => {
    if (!portfolioId) return;
    if (!form.title.trim()) {
      toast.error("Judul wajib diisi");
      return;
    }
    setSaving(true);
    const payload = {
      portfolio_id: portfolioId,
      type: form.type || "Project",
      title: form.title.trim(),
      description: form.description.trim() || null,
      cover_url: form.cover_url.trim() || null,
      external_link: form.external_link.trim() || null,
      tags: form.tags,
    };
    let error;
    if (form.id) {
      ({ error } = await supabase.from("portfolio_items").update(payload).eq("id", form.id));
    } else {
      ({ error } = await supabase.from("portfolio_items").insert(payload));
    }
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(form.id ? "Project diperbarui" : "Project ditambahkan");
    setDialogOpen(false);
    load();
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    const { error } = await supabase.from("portfolio_items").delete().eq("id", toDelete.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Project dihapus");
    setToDelete(null);
    load();
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold">Manage Projects</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Tambah, ubah, atau hapus project yang muncul di portfolio publik Anda.
            </p>
          </div>
          <Button onClick={openCreate} disabled={loading}>
            <Plus className="h-4 w-4 mr-2" /> Tambah Project
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <Card className="p-10 text-center border-dashed">
            <Folder className="h-10 w-10 mx-auto text-muted-foreground/60" />
            <p className="font-medium mt-3">Belum ada project</p>
            <p className="text-sm text-muted-foreground mt-1">
              Mulai dengan menambahkan project pertama Anda.
            </p>
            <Button onClick={openCreate} variant="outline" className="mt-4">
              <Plus className="h-4 w-4 mr-2" /> Tambah Project
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden flex flex-col">
                <div className="aspect-[16/10] bg-secondary overflow-hidden">
                  {item.cover_url ? (
                    <img
                      src={item.cover_url}
                      alt={item.title}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
                      No cover
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {item.type && (
                      <Badge variant="secondary" className="text-[10px] uppercase">
                        {item.type}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-heading font-semibold leading-tight">{item.title}</h3>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.tags.slice(0, 4).map((t) => (
                        <Badge key={t} variant="outline" className="text-xs font-normal">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(item)}>
                      <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setToDelete(item)}
                      aria-label="Hapus"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                    {item.external_link && (
                      <Button asChild size="sm" variant="ghost" aria-label="Buka link">
                        <a href={item.external_link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Project" : "Tambah Project"}</DialogTitle>
            <DialogDescription>
              Lengkapi detail project untuk ditampilkan di portfolio publik Anda.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="title">Judul *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="E-commerce Platform"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="type">Tipe</Label>
              <Input
                id="type"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                placeholder="Project / Case Study / Article"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value.slice(0, 500) })}
                maxLength={500}
                placeholder="Ceritakan tentang project ini..."
                className="min-h-24"
              />
              <p className="text-xs text-muted-foreground text-right">
                {form.description.length}/500
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cover">Cover Image URL</Label>
              <Input
                id="cover"
                value={form.cover_url}
                onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="link">External Link</Label>
              <Input
                id="link"
                value={form.external_link}
                onChange={(e) => setForm({ ...form, external_link: e.target.value })}
                placeholder="https://demo.example.com"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="React, Figma..."
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Tambah
                </Button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="gap-1">
                      {t}
                      <button
                        type="button"
                        onClick={() => removeTag(t)}
                        className="hover:text-destructive"
                        aria-label={`Hapus tag ${t}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {form.id ? "Simpan" : "Tambah"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus project?</AlertDialogTitle>
            <AlertDialogDescription>
              "{toDelete?.title}" akan dihapus permanen dari portfolio Anda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default ManageProjects;
