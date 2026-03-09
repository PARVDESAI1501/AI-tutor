"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { GraduationCap, History, User, LogOut, ChevronLeft, ChevronRight, FileText, Youtube, BookOpen, HelpCircle, Globe, FileAudio } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppSidebarProps { 
  userEmail: string; 
  userId: string; 
  onMobileClose?: () => void; 
}

interface RecentSource { id: string; title: string; source_type: string; status: string; }

const navItems = [
  { href: "/dashboard", label: "My Library", icon: BookOpen },
  { href: "/history", label: "History", icon: History },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/guide", label: "Quick Guide", icon: HelpCircle },
];

export function AppSidebar({ userEmail, userId, onMobileClose }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [recentSources, setRecentSources] = useState<RecentSource[]>([]);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const loadRecent = async () => {
      const { data } = await supabase.from("sources").select("id, title, source_type, status").eq("status", "ready").eq("user_id", userId).order("updated_at", { ascending: false }).limit(5);
      if (data) setRecentSources(data);
    };
    loadRecent();
  }, [pathname, supabase, userId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const getSidebarIcon = (type: string) => {
    if (type === "youtube") return <Youtube className="h-4 w-4 text-red-500 flex-shrink-0" />;
    if (type === "web") return <Globe className="h-4 w-4 text-green-500 flex-shrink-0" />;
    if (type === "audio" || type === "video") return <FileAudio className="h-4 w-4 text-yellow-500 flex-shrink-0" />;
    return <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />;
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="relative flex flex-col h-full border-r border-border/50 bg-background/95 backdrop-blur-xl z-40"
    >
      {/* TOGGLE BUTTON - Hidden on Mobile */}
      <motion.button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden md:flex absolute -right-4 top-8 z-50 h-8 w-8 items-center justify-center rounded-full border border-border bg-background shadow-md hover:bg-accent text-foreground transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </motion.button>

      <div className="flex items-center gap-3 px-6 py-6 border-b border-border/50">
        <motion.div className="flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 p-2 shadow-lg shadow-blue-500/20" whileHover={{ rotate: 10 }}>
          <GraduationCap className="h-6 w-6 text-white" />
        </motion.div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              AI-Tutor
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <nav className="py-6 px-3 space-y-1">
        {navItems.map((navItem) => {
          const isActive = pathname === navItem.href;
          return (
            <Link key={navItem.href} href={navItem.href} onClick={onMobileClose}>
              <motion.div
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={cn("flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all relative", isActive ? "text-primary-foreground shadow-md shadow-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
              >
                {isActive && <motion.div layoutId="sidebar-active" className="absolute inset-0 bg-primary rounded-xl" transition={{ type: "spring", stiffness: 300, damping: 30 }} />}
                <navItem.icon className="h-5 w-5 flex-shrink-0 relative z-10" />
                <AnimatePresence>
                  {!collapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10">{navItem.label}</motion.span>}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <AnimatePresence>
        {!collapsed && recentSources.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-3 py-4 border-t border-border/50 flex-1 overflow-y-auto">
            <p className="px-3 text-xs font-bold text-muted-foreground/70 mb-3 uppercase tracking-widest">Recent</p>
            <div className="space-y-1">
              {recentSources.map((source) => (
                <Link key={source.id} href={`/source/${source.id}`} onClick={onMobileClose}>
                  <motion.div whileHover={{ x: 4 }} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors", pathname === `/source/${source.id}` ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground")}>
                    {getSidebarIcon(source.source_type)}
                    <span className="truncate">{source.title}</span>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="border-t border-border/50 p-4 space-y-3 mt-auto bg-muted/10">
        <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between px-2")}>
          <AnimatePresence>{!collapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-medium text-muted-foreground">Theme</motion.span>}</AnimatePresence>
          <ThemeToggle />
        </div>
        <Button variant="ghost" className={cn("w-full justify-start text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl", collapsed && "justify-center px-0")} onClick={handleLogout}>
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <AnimatePresence>{!collapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="ml-3">Sign Out</motion.span>}</AnimatePresence>
        </Button>
      </div>
    </motion.aside>
  );
}
