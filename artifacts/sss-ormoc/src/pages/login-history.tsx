import { Layout } from "@/components/layout";
import {
  useListLoginHistory,
  useClearLoginHistory,
  getListLoginHistoryQueryKey,
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
import { RefreshCw, Trash2 } from "lucide-react";

export default function LoginHistory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: entries, isLoading, refetch } = useListLoginHistory();
  const clearMutation = useClearLoginHistory();

  const handleClear = async () => {
    if (!confirm("Clear all login history?")) return;
    try {
      await clearMutation.mutateAsync();
      queryClient.invalidateQueries({ queryKey: getListLoginHistoryQueryKey() });
      toast({ title: "Login history cleared" });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Login History</h2>
            <p className="text-muted-foreground">
              All sign-in events {entries ? `\u2014 ${entries.length} records` : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()} data-testid="button-refresh-history">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="destructive" onClick={handleClear} data-testid="button-clear-history">
              <Trash2 className="mr-2 h-4 w-4" />
              Clear History
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>USER</TableHead>
                  <TableHead>ROLE</TableHead>
                  <TableHead>JURISDICTION</TableHead>
                  <TableHead>BROWSER</TableHead>
                  <TableHead>DATE & TIME</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : entries?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No login history</TableCell>
                  </TableRow>
                ) : (
                  entries?.map((entry) => (
                    <TableRow key={entry.id} data-testid={`row-login-${entry.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-medium">
                            {entry.userName?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <div>
                            <div className="font-medium">{entry.userName || "Unknown"}</div>
                            <div className="text-xs text-muted-foreground">{entry.userEmail}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={entry.userRole === "admin" ? "default" : "secondary"} className="capitalize">
                          {entry.userRole?.replace("_", " ") || "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>{entry.jurisdiction || "Unknown"}</TableCell>
                      <TableCell>{entry.browser}</TableCell>
                      <TableCell>{formatDate(entry.loginAt)}</TableCell>
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
