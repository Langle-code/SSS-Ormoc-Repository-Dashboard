import { useAuth } from "@/hooks/use-auth";
import { Badge } from "./ui/badge";

export function Topbar() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold">Digital R-1/R-1A Repository and Dashboard</h1>
        {user && (
          <Badge variant="secondary" className="capitalize">
            {user.role.replace("_", " ")}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-4">
        {/* Additional topbar actions could go here */}
      </div>
    </header>
  );
}
