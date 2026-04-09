import { useState } from "react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import {
  useListDocuments,
  useUpdateDocumentStatus,
  useDeleteDocument,
  getListDocumentsQueryKey,
  getGetDashboardStatsQueryKey,
  useListJurisdictions,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, XCircle, Clock, Trash2, ExternalLink } from "lucide-react";

export default function VerifyDocuments() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [jurisdictionFilter, setJurisdictionFilter] = useState<string>("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: documents, isLoading } = useListDocuments({
    status: (statusFilter || undefined) as any,
    jurisdiction: jurisdictionFilter || undefined,
  });
  const { data: jurisdictionData } = useListJurisdictions();
  const updateStatus = useUpdateDocumentStatus();
  const deleteDoc = useDeleteDocument();

  const isAdmin = user?.role === "admin";

  const handleStatusChange = async (docId: number, status: "pending" | "approved" | "rejected") => {
    try {
      await updateStatus.mutateAsync({ id: docId, data: { status } });
      queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
      toast({ title: `Document ${status}` });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleDelete = async (docId: number) => {
    if (!confirm("Delete this document?")) return;
    try {
      await deleteDoc.mutateAsync({ id: docId });
      queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
      toast({ title: "Document deleted" });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircle className="mr-1 h-3 w-3" />Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-700 border-red-200"><XCircle className="mr-1 h-3 w-3" />Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {isAdmin ? "Verify Documents" : "View Documents"}
          </h2>
          <p className="text-muted-foreground">
            {isAdmin ? "Review and update quality status of scanned forms" : "View scanned forms from your assigned jurisdictions"}
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val === "all" ? "" : val)}>
            <SelectTrigger className="w-40" data-testid="filter-status">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={jurisdictionFilter} onValueChange={(val) => setJurisdictionFilter(val === "all" ? "" : val)}>
            <SelectTrigger className="w-52" data-testid="filter-jurisdiction">
              <SelectValue placeholder="All Jurisdictions" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="all">All Jurisdictions</SelectItem>
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
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>FORM NAME</TableHead>
                  <TableHead>TYPE</TableHead>
                  <TableHead>EMPLOYER</TableHead>
                  <TableHead>JURISDICTION</TableHead>
                  <TableHead>DATE</TableHead>
                  <TableHead>STATUS</TableHead>
                  {isAdmin && <TableHead>ACTIONS</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : documents?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-8 text-muted-foreground">No documents found</TableCell>
                  </TableRow>
                ) : (
                  documents?.map((doc) => (
                    <TableRow key={doc.id} data-testid={`row-document-${doc.id}`}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                          {doc.formName}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{doc.formType}</Badge>
                      </TableCell>
                      <TableCell>{doc.employerName}</TableCell>
                      <TableCell>{doc.jurisdiction}</TableCell>
                      <TableCell>{new Date(doc.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{getStatusBadge(doc.status)}</TableCell>
                      {isAdmin && (
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleStatusChange(doc.id, "approved")} title="Approve" data-testid={`button-approve-${doc.id}`}>
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleStatusChange(doc.id, "rejected")} title="Reject" data-testid={`button-reject-${doc.id}`}>
                              <XCircle className="h-4 w-4 text-red-600" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleStatusChange(doc.id, "pending")} title="Set Pending" data-testid={`button-pending-${doc.id}`}>
                              <Clock className="h-4 w-4 text-yellow-600" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)} title="Delete" data-testid={`button-delete-doc-${doc.id}`}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
