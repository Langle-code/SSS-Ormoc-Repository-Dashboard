import { useState, useMemo } from "react";
import { Layout } from "@/components/layout";
import {
  useListUsers,
  useUpdateUser,
  useDeleteUser,
  useListJurisdictions,
  getListUsersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, X, UserPlus, Loader2 } from "lucide-react";
import type { User } from "@workspace/api-client-react";

const API_BASE = "";

export default function Users() {
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<string>("");
  const [editJurisdictions, setEditJurisdictions] = useState<string[]>([]);

  const [showAddUser, setShowAddUser] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "account_officer">("account_officer");
  const [newJurisdictions, setNewJurisdictions] = useState<string[]>([]);
  const [addLoading, setAddLoading] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: users, isLoading } = useListUsers();
  const { data: jurisdictionData } = useListJurisdictions();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const allJurisdictions = useMemo(() => {
    if (!jurisdictionData?.categories) return [];
    return [...jurisdictionData.categories.flatMap((cat) => cat.items)].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [jurisdictionData]);

  // ── Edit user ──────────────────────────────────────────────
  const openEdit = (u: User) => {
    setEditUser(u);
    setEditName(u.name);
    setEditRole(u.role);
    setEditJurisdictions(u.jurisdictions);
  };

  const handleUpdate = async () => {
    if (!editUser) return;
    try {
      await updateMutation.mutateAsync({
        id: editUser.id,
        data: { name: editName, role: editRole as any, jurisdictions: editJurisdictions },
      });
      queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      toast({ title: "User updated" });
      setEditUser(null);
    } catch {
      toast({ title: "Failed to update user", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this user?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      toast({ title: "User deleted" });
    } catch {
      toast({ title: "Failed to delete user", variant: "destructive" });
    }
  };

  const addJurisdiction = (value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (value === "All Jurisdictions") {
      setter(["All Jurisdictions"]);
    } else {
      setter((prev) => prev.filter((j) => j !== "All Jurisdictions").concat(
        prev.includes(value) ? [] : [value]
      ));
    }
  };

  const removeJurisdiction = (value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) => prev.filter((j) => j !== value));
  };

  // ── Add user ──────────────────────────────────────────────
  const resetAddForm = () => {
    setNewName("");
    setNewEmail("");
    setNewPassword("");
    setNewRole("account_officer");
    setNewJurisdictions([]);
  };

  const handleAddUser = async () => {
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setAddLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/register`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim(),
          password: newPassword,
          role: newRole,
          jurisdictions: newJurisdictions,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast({
          title: "Failed to create user",
          description: data.error || "An error occurred",
          variant: "destructive",
        });
        return;
      }

      queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      toast({ title: `User "${newName}" created successfully` });
      setShowAddUser(false);
      resetAddForm();
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Users</h2>
            <p className="text-muted-foreground">Manage system users and their roles</p>
          </div>
          <Button onClick={() => setShowAddUser(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add User
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NAME</TableHead>
                  <TableHead>EMAIL</TableHead>
                  <TableHead>ROLE</TableHead>
                  <TableHead>JURISDICTIONS</TableHead>
                  <TableHead>LOGIN COUNT</TableHead>
                  <TableHead>CREATED</TableHead>
                  <TableHead>ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : users?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No users found</TableCell>
                  </TableRow>
                ) : (
                  users?.map((u) => (
                    <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={u.role === "admin" ? "default" : "secondary"} className="capitalize">
                          {u.role.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="flex flex-wrap gap-1">
                          {u.jurisdictions.slice(0, 2).map((j) => (
                            <Badge key={j} variant="outline" className="text-xs">{j}</Badge>
                          ))}
                          {u.jurisdictions.length > 2 && (
                            <Badge variant="outline" className="text-xs">+{u.jurisdictions.length - 2}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{u.loginCount}</TableCell>
                      <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(u)} data-testid={`button-edit-user-${u.id}`}>
                            <Pencil className="h-4 w-4 text-primary" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(u.id)} data-testid={`button-delete-user-${u.id}`}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* ── Add User Dialog ── */}
      <Dialog open={showAddUser} onOpenChange={(open) => { if (!open) { setShowAddUser(false); resetAddForm(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Juan Dela Cruz"
                data-testid="input-new-user-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Official Email</Label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="juan@sss.gov.ph"
                data-testid="input-new-user-email"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 6 characters"
                data-testid="input-new-user-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as any)}>
                <SelectTrigger data-testid="select-new-user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="account_officer">Account Officer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Jurisdictions</Label>
              <Select onValueChange={(v) => addJurisdiction(v, setNewJurisdictions)}>
                <SelectTrigger data-testid="select-new-user-jurisdiction">
                  <SelectValue placeholder="Add jurisdiction..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {newRole === "admin" && (
                    <SelectItem value="All Jurisdictions">All Jurisdictions</SelectItem>
                  )}
                  {allJurisdictions.map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {newJurisdictions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {newJurisdictions.map((j) => (
                    <Badge key={j} variant="secondary" className="gap-1">
                      {j}
                      <button type="button" onClick={() => removeJurisdiction(j, setNewJurisdictions)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setShowAddUser(false); resetAddForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleAddUser} disabled={addLoading} data-testid="button-create-user">
              {addLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating...</> : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit User Dialog ── */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} data-testid="input-edit-user-name" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger data-testid="select-edit-user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="account_officer">Account Officer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Jurisdictions</Label>
              <Select onValueChange={(v) => addJurisdiction(v, setEditJurisdictions)}>
                <SelectTrigger data-testid="select-edit-user-jurisdiction">
                  <SelectValue placeholder="Add jurisdiction..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {editRole === "admin" && (
                    <SelectItem value="All Jurisdictions">All Jurisdictions</SelectItem>
                  )}
                  {jurisdictionData?.categories?.map((cat) => (
                    <div key={cat.category}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{cat.category}</div>
                      {cat.items.map((item) => (
                        <SelectItem key={item} value={item}>{item}</SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
              {editJurisdictions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {editJurisdictions.map((j) => (
                    <Badge key={j} variant="secondary" className="gap-1">
                      {j}
                      <button type="button" onClick={() => removeJurisdiction(j, setEditJurisdictions)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button onClick={handleUpdate} data-testid="button-update-user">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
