import { FormEvent, useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { logAdminAction } from "@/lib/admin-log";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Loader2, Pencil, Trash2, Check, X } from "lucide-react";

interface CategoryRow {
  id: string;
  name: string;
  usage?: number;
}

const AdminCategories = () => {
  const { user } = useAdmin();
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const load = async () => {
    setLoading(true);
    const { data: cats } = await supabase.from("skill_categories").select("id, name").order("name");
    const { data: skills } = await supabase.from("skills").select("category");
    const usage = new Map<string, number>();
    (skills ?? []).forEach((s) => {
      if (s.category) usage.set(s.category, (usage.get(s.category) ?? 0) + 1);
    });
    setRows((cats ?? []).map((c) => ({ ...c, usage: usage.get(c.name) ?? 0 })));
    setLoading(false);
  };

  useEffect(() => {
    document.title = "Skill Categories — PortoBank Admin";
    load();
  }, []);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    const { error } = await supabase.from("skill_categories").insert({ name: newName.trim(), created_by: user?.id });
    setAdding(false);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    if (user) await logAdminAction(user.id, `Created category "${newName.trim()}"`, "category");
    setNewName("");
    toast({ title: "Category added" });
    load();
  };

  const saveEdit = async (row: CategoryRow) => {
    const next = editValue.trim();
    if (!next || next === row.name) {
      setEditingId(null);
      return;
    }
    const { error } = await supabase.from("skill_categories").update({ name: next }).eq("id", row.id);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    if (user) await logAdminAction(user.id, `Renamed category to "${next}"`, "category", row.id);
    toast({ title: "Category updated" });
    setEditingId(null);
    load();
  };

  const remove = async (row: CategoryRow) => {
    const { error } = await supabase.from("skill_categories").delete().eq("id", row.id);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    if (user) await logAdminAction(user.id, `Deleted category "${row.name}"`, "category", row.id);
    toast({ title: "Category deleted" });
    load();
  };

  return (
    <AdminLayout title="Skill Categories">
      <div className="space-y-6 max-w-2xl">
        <Card>
          <CardContent className="p-4 md:p-6">
            <form onSubmit={add} className="flex gap-2">
              <Input
                placeholder="New category name (e.g. Design, Engineering)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <Button type="submit" disabled={adding || !newName.trim()}>
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            {loading ? (
              <div className="py-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No categories yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {rows.map((r) => (
                  <li key={r.id} className="py-3 flex items-center justify-between gap-3">
                    {editingId === r.id ? (
                      <div className="flex-1 flex gap-2">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          autoFocus
                        />
                        <Button size="icon" variant="outline" onClick={() => saveEdit(r)}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{r.name}</p>
                          <p className="text-xs text-muted-foreground">{r.usage} skill{r.usage === 1 ? "" : "s"} using this</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditingId(r.id);
                              setEditValue(r.name);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete "{r.name}"?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {r.usage && r.usage > 0
                                    ? `Warning: ${r.usage} skill${r.usage === 1 ? " is" : "s are"} currently using this category. They will keep the label but lose its grouping.`
                                    : "This category is not in use."}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => remove(r)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminCategories;
