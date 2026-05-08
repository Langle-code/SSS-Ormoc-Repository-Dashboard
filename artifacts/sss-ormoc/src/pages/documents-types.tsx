import { useState } from "react";
import {
  useDocumentTypes,
  useCreateDocumentType,
  useDeleteDocumentType,
} from "@/hooks/use-document-types";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { TypePill } from "@/components/TypePill";
import { format } from "date-fns";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DocumentTypes() {
  const { data: types, isLoading } = useDocumentTypes();
  const createMutation = useCreateDocumentType();
  const deleteMutation = useDeleteDocumentType();
  const { toast } = useToast();

  const [newName, setNewName] = useState("");
  const [toDelete, setToDelete] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (types?.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) {
      toast({ title: "That type already exists", variant: "destructive" });
      return;
    }
    try {
      await createMutation.mutateAsync(trimmed);
      toast({ title: "Document type added" });
      setNewName("");
    } catch (error: any) {
      toast({
        title: "Failed to add document type",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteMutation.mutateAsync(toDelete);
      toast({ title: "Document type removed" });
    } catch (error: any) {
      toast({
        title: "Failed to remove",
        description:
          error.code === "23503"
            ? "This type is still used by one or more documents."
            : error.message,
        variant: "destructive",
      });
    } finally {
      setToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Document Types</h2>
        <p className="text-gray-500 text-sm">
          Manage the categories shown when uploading and filtering documents.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleAdd} className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. SS Form L-501"
              maxLength={80}
              data-testid="input-new-document-type"
            />
            <Button
              type="submit"
              disabled={createMutation.isPending || !newName.trim()}
              data-testid="button-add-document-type"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" /> Add Type
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead>NAME</TableHead>
                <TableHead>PREVIEW</TableHead>
                <TableHead>ADDED</TableHead>
                <TableHead className="text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {types?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-gray-500">
                    No document types yet. Add one above.
                  </TableCell>
                </TableRow>
              ) : (
                types?.map((t) => (
                  <TableRow key={t.name}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>
                      <TypePill type={t.name} />
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {format(new Date(t.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setToDelete(t.name)}
                        data-testid={`action-delete-type-${t.name}`}
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove document type?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove "{toDelete}" from the list of types you can pick when uploading.
              You cannot remove a type that is still used by existing documents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-type">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              data-testid="button-confirm-delete-type"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
