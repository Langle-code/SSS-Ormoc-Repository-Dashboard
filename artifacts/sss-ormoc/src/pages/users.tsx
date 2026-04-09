import { useState } from "react";
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
import { Pencil, Trash2, X } from "lucide-react";
import type { User } from "@workspace/api-client-react/src/generated/api.schemas";

export default function Users() {
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<string>("");
  const [editJurisdictions, setEditJurisdictions] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: users, isLoading } = useListUsers();
  const { data: jurisdictionData } = useListJurisdictions();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

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
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this user?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      toast({ title: "User deleted" });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const addJurisdiction = (value: string) => {
    if (value === "All Jurisdictions") {
      setEditJurisdictions(["All Jurisdictions"]);
    } else if (!editJurisdictions.includes(value)) {
      setEditJurisdictions((prev) =>
        prev.filter((j) => j !== "All Jurisdictions").concat(value)
      );
    }
  };

  const removeJurisdiction = (value: string) => {
    setEditJurisdictions((prev) => prev.filter((j) => j !== value));
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground">Manage system users and their roles</p>
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
              <Select onValueChange={addJurisdiction}>
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
                      <button type="button" onClick={() => removeJurisdiction(j)}>
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
