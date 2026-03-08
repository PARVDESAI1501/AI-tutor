"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  GraduationCap, LayoutDashboard, History, User, Info, LogOut,
  ChevronLeft, ChevronRight, FileText, Youtube, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  userEmail: string;
  userId: string;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/history", label: "History", icon: History },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/about", label: "About", icon: Info },
];

export function AppSidebar({ userEmail, userId }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [recentSources, setRecentSources] = useState<any[]>([]);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  // Load recent sources
  useEffect(() => {
    const loadRecent = async () => {
      const { data } = await supabase
        .from("sources")
        .select("id, title, source_type, status")
        .eq("status", "ready")
        .order("updated_at", { ascending: false })
        .limit(5);
      if (data) setRecentSources(data);
    };
    loadRecent();
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-screen border-r bg-card transition-all duration-300 relative",
        collapsed ? "w-[70px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b">
        <div className="flex-shrink-0 rounded-xl bg-gradient-to-br from-primary to-primary/80 p-2">
          <GraduationCap className="h-5 w-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight">AI-Tutor</span>
        )}
      </div>

      {/* Collapse */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-14 z-10 rounded-full border bg-background p-1 shadow-sm hover:bg-muted transition-colors"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      {/* Main Nav */}
      <nav className="py-3 px-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Recent Sources */}
      {!collapsed && recentSources.length > 0 && (
        <div className="px-2 py-3 border-t flex-1 overflow-y-auto">
          <p className="px-3 text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            Recent
          </p>
          <div className="space-y-0.5">
            {recentSources.map((source) => {
              const isActive = pathname === `/source/${source.id}`;
              return (
                <Link key={source.id} href={`/source/${source.id}`}>
                  <div
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all duration-200",
                      isActive
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    {source.source_type === "youtube" ? (
                      <Youtube className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                    ) : (
                      <FileText className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                    )}
                    <span className="truncate">{source.title}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom */}
      <div className="border-t p-3 space-y-2 mt-auto">
        <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between px-1")}>
          {!collapsed && <span className="text-xs text-muted-foreground">Theme</span>}
          <ThemeToggle />
        </div>
        {!collapsed && (
          <div className="px-1">
            <p className="text-xs font-medium truncate">{userEmail}</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className={cn(
            "w-full justify-start text-muted-foreground hover:text-red-500",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span className="ml-2">Sign Out</span>}
        </Button>
      </div>
    </aside>
  );
}
