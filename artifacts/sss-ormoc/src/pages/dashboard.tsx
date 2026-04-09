import { useAuth } from "@/hooks/use-auth";
import { useGetDashboardStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/layout";
import { Building2, FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useGetDashboardStats();

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {user?.role === "admin" ? "Admin" : "Account Officer"} Dashboard
          </h2>
          <p className="text-muted-foreground">Overview of the document management system</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card data-testid="card-total-employers">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employers</CardTitle>
              <Building2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{isLoading ? "..." : stats?.totalEmployers ?? 0}</div>
            </CardContent>
          </Card>
          <Card data-testid="card-scanned-forms">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scanned Forms</CardTitle>
              <FileText className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{isLoading ? "..." : stats?.totalDocuments ?? 0}</div>
            </CardContent>
          </Card>
          <Card data-testid="card-pending">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{isLoading ? "..." : stats?.pendingDocuments ?? 0}</div>
            </CardContent>
          </Card>
          <Card data-testid="card-approved">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved Forms</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{isLoading ? "..." : stats?.approvedDocuments ?? 0}</div>
            </CardContent>
          </Card>
          <Card data-testid="card-rejected">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected Forms</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{isLoading ? "..." : stats?.rejectedDocuments ?? 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {user?.role === "admin" && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/employers">
                  <span className="flex items-center gap-3 rounded-md p-2 text-sm hover:bg-muted cursor-pointer" data-testid="link-manage-employers">
                    <Building2 className="h-4 w-4 text-primary" />
                    Manage Employers
                  </span>
                </Link>
                <Link href="/upload">
                  <span className="flex items-center gap-3 rounded-md p-2 text-sm hover:bg-muted cursor-pointer" data-testid="link-upload-form">
                    <FileText className="h-4 w-4 text-primary" />
                    Upload Scanned Form
                  </span>
                </Link>
                <Link href="/verify">
                  <span className="flex items-center gap-3 rounded-md p-2 text-sm hover:bg-muted cursor-pointer" data-testid="link-verify-docs">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Document Verification
                  </span>
                </Link>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Form Types</span>
                  <span className="font-medium">R1, R-1A</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Storage</span>
                  <span className="font-medium">Supabase</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status Options</span>
                  <span className="font-medium">Pending / Approved / Rejected</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
