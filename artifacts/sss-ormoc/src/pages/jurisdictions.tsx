import { useState, useMemo } from "react";
import { Layout } from "@/components/layout";
import {
  useListAllJurisdictions,
  useCreateJurisdiction,
  useUpdateJurisdiction,
  useDeleteJurisdiction,
  getListAllJurisdictionsQueryKey,
  getListJurisdictionsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import type { JurisdictionItem } from "@workspace/api-client-react/src/generated/api.schemas";

const CATEGORIES = ["ORMOC CITY", "BARANGAY", "TOWN"];

export default function JurisdictionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<JurisdictionItem | null>(null);
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: allJurisdictions, isLoading } = useListAllJurisdictions();
  const createMutation = useCreateJurisdiction();
  const updateMutation = useUpdateJurisdiction();
  const deleteMutation = useDeleteJurisdiction();

  const filtered = useMemo(() => {
    if (!allJurisdictions) return [];
    return allJurisdictions.filter((j) => {
      const matchSearch = j.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = filterCategory === "all" || j.category === filterCategory;
      return matchSearch && matchCat;
    });
  }, [allJurisdictions, searchTerm, filterCategory]);

  const grouped = useMemo(() => {
    const map: Record<string, JurisdictionItem[]> = {};
    for (const j of filtered) {
      if (!map[j.category]) map[j.category] = [];
      map[j.category].push(j);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const uniqueCategories = useMemo(() => {
    if (!allJurisdictions) return CATEGORIES;
    const cats = new Set(allJurisdictions.map((j) => j.category));
    return Array.from(cats).sort();
  }, [allJurisdictions]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListAllJurisdictionsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListJurisdictionsQueryKey() });
  };

  const openAdd = () => {
    setEditItem(null);
    setFormName("");
    setFormCategory(CATEGORIES[0]);
    setCustomCategory("");
    setDialogOpen(true);
  };

  const openEdit = (item: JurisdictionItem) => {
    setEditItem(item);
    setFormName(item.name);
    const knownCat = CATEGORIES.includes(item.category);
    setFormCategory(knownCat ? item.category : "__custom__");
    setCustomCategory(knownCat ? "" : item.category);
    setDialogOpen(true);
  };

  const resolvedCategory = formCategory === "__custom__" ? customCategory : formCategory;

  const handleSave = async () => {
    if (!formName.trim() || !resolvedCategory.trim()) {
      toast({ title: "Name and category are required", variant: "destructive" });
      return;
    }
    try {
      if (editItem) {
        await updateMutation.mutateAsync({
          id: editItem.id,
          data: { name: formName.trim(), category: resolvedCategory.trim() },
        });
        toast({ title: "Jurisdiction updated" });
      } else {
        await createMutation.mutateAsync({
          data: { name: formName.trim(), category: resolvedCategory.trim() },
        });
        toast({ title: "Jurisdiction added" });
      }
      invalidate();
      setDialogOpen(false);
    } catch {
      toast({ title: "Error saving jurisdiction", variant: "destructive" });
    }
  };

  const handleDelete = async (item: JurisdictionItem) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    try {
      await deleteMutation.mutateAsync({ id: item.id });
      invalidate();
      toast({ title: "Jurisdiction deleted" });
    } catch {
      toast({ title: "Error deleting jurisdiction", variant: "destructive" });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Jurisdictions</h2>
            <p className="text-muted-foreground">
              Manage jurisdiction areas assigned to account officers
            </p>
          </div>
          <Button onClick={openAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Jurisdiction
          </Button>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jurisdictions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {uniqueCategories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Loading jurisdictions...
            </CardContent>
          </Card>
        ) : grouped.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No jurisdictions found
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {grouped.map(([category, items]) => (
              <Card key={category}>
                <div className="flex items-center justify-between px-6 py-3 border-b bg-muted/30">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                      {category}
                    </span>
                    <Badge variant="secondary">{items.length}</Badge>
                  </div>
                </div>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>NAME</TableHead>
                        <TableHead>ADDED</TableHead>
                        <TableHead className="w-24">ACTIONS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEdit(item)}
                              >
                                <Pencil className="h-4 w-4 text-primary" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(item)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && setDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit Jurisdiction" : "Add Jurisdiction"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="e.g. Burgos St."
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueCategories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                  <SelectItem value="__custom__">Other (custom)</SelectItem>
                </SelectContent>
              </Select>
              {formCategory === "__custom__" && (
                <Input
                  placeholder="Enter custom category name"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="mt-2"
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : editItem ? "Save Changes" : "Add Jurisdiction"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
