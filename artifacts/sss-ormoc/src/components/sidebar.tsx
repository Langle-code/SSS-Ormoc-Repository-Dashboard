import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  Users,
  Upload,
  FileCheck2,
  Settings,
  History,
  LogOut,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "account_officer"] },
  { href: "/employers", label: "Employers", icon: Building2, roles: ["admin"] },
  { href: "/upload", label: "Upload Form", icon: Upload, roles: ["admin"] },
  { href: "/verify", label: "Verify Documents", icon: FileCheck2, roles: ["admin", "account_officer"] }, // Account Officer has read-only view
  { href: "/users", label: "Users", icon: Users, roles: ["admin"] },
  { href: "/login-history", label: "Login History", icon: History, roles: ["admin"] },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  if (!user) return null;

  const filteredNavItems = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 shrink-0 items-center justify-center border-b border-sidebar-border px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground font-bold">
            SSS
          </div>
          <span className="text-lg font-semibold tracking-tight">Ormoc Branch</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6">
        <nav className="grid gap-1 px-3">
          {filteredNavItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <span
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/80"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium leading-none">{user.name}</span>
            <span className="text-xs text-sidebar-foreground/60 mt-1 capitalize">{user.role.replace("_", " ")}</span>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-2 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={() => logout()}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
        <p className="text-xs text-sidebar-foreground/40 text-center mt-4">
          AB 2026. All rights reserved. Tenshi Inc.
        </p>
      </div>
    </div>
  );
}
