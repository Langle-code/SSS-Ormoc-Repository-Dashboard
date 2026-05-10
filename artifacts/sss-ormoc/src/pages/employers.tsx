import { useState } from "react";
import { Layout } from "@/components/layout";
import {
  useListEmployers,
  useCreateEmployer,
  useUpdateEmployer,
  useDeleteEmployer,
  useListJurisdictions,
  getListEmployersQueryKey,
} from "@workspace/api-client-react";
import type { Employer } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const employerSchema = z.object({
  employerId: z.string().min(1, "Employer ID is required"),
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  jurisdiction: z.string().min(1, "Jurisdiction is required"),
});

export default function Employers() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployer, setEditingEmployer] = useState<Employer | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: employers, isLoading } = useListEmployers({ search: search || undefined });
  const { data: jurisdictionData } = useListJurisdictions();
  const createMutation = useCreateEmployer();
  const updateMutation = useUpdateEmployer();
  const deleteMutation = useDeleteEmployer();

  const form = useForm<z.infer<typeof employerSchema>>({
    resolver: zodResolver(employerSchema),
    defaultValues: { employerId: "", name: "", address: "", jurisdiction: "" },
  });

  const openCreate = () => {
    setEditingEmployer(null);
    form.reset({ employerId: "", name: "", address: "", jurisdiction: "" });
    setDialogOpen(true);
  };

  const openEdit = (emp: Employer) => {
    setEditingEmployer(emp);
    form.reset({
      employerId: emp.employerId,
      name: emp.name,
      address: emp.address,
      jurisdiction: emp.jurisdiction,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values: z.infer<typeof employerSchema>) => {
    try {
      if (editingEmployer) {
        await updateMutation.mutateAsync({ id: editingEmployer.id, data: values });
        toast({ title: "Employer updated" });
      } else {
        await createMutation.mutateAsync({ data: values });
        toast({ title: "Employer created" });
      }
      queryClient.invalidateQueries({ queryKey: getListEmployersQueryKey() });
      setDialogOpen(false);
    } catch {
      toast({ title: "Error", description: "Operation failed", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this employer?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListEmployersQueryKey() });
      toast({ title: "Employer deleted" });
    } catch {
      toast({ title: "Error", description: "Delete failed", variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Employer Management</h2>
            <p className="text-muted-foreground">Create and manage employer records</p>
          </div>
          <Button onClick={openCreate} data-testid="button-add-employer">
            <Plus className="mr-2 h-4 w-4" />
            Add Employer
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by Employer ID or Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search-employer"
          />
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>EMPLOYER ID</TableHead>
                  <TableHead>NAME</TableHead>
                  <TableHead>ADDRESS</TableHead>
                  <TableHead>JURISDICTION</TableHead>
                  <TableHead>CREATED AT</TableHead>
                  <TableHead>ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : employers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No employers found</TableCell>
                  </TableRow>
                ) : (
                  employers?.map((emp) => (
                    <TableRow key={emp.id} data-testid={`row-employer-${emp.id}`}>
                      <TableCell className="font-medium">{emp.employerId}</TableCell>
                      <TableCell>{emp.name}</TableCell>
                      <TableCell>{emp.address}</TableCell>
                      <TableCell>
                        <span className="text-primary hover:underline cursor-default">{emp.jurisdiction}</span>
                      </TableCell>
                      <TableCell>{new Date(emp.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(emp)} data-testid={`button-edit-${emp.id}`}>
                            <Pencil className="h-4 w-4 text-primary" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(emp.id)} data-testid={`button-delete-${emp.id}`}>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEmployer ? "Edit Employer" : "Add Employer"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="employerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employer ID</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 12345" {...field} data-testid="input-employer-id" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Acme Corp" {...field} data-testid="input-employer-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 123 Main St" {...field} data-testid="input-employer-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="jurisdiction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jurisdiction</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-employer-jurisdiction">
                          <SelectValue placeholder="Select jurisdiction" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-60">
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={form.formState.isSubmitting} data-testid="button-save-employer">
                  {form.formState.isSubmitting ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
