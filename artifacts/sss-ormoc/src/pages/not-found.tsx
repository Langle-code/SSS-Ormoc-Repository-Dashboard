import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
      <h1 className="text-4xl font-bold text-foreground">404</h1>
      <p className="mt-2 text-lg text-muted-foreground">Page not found</p>
      <Link href="/dashboard">
        <Button className="mt-6">Go to Dashboard</Button>
      </Link>
    </div>
  );
}
