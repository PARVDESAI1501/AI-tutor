"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { Menu, X } from "lucide-react";
import { Button } from "./ui/button";

interface AppLayoutClientProps {
  children: React.ReactNode;
  userEmail: string;
  userId: string;
}

export function AppLayoutClient({ children, userEmail, userId }: AppLayoutClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background relative">
      {/* Mobile Menu Button - Appears only on small screens */}
      <div className="md:hidden absolute top-3 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="rounded-full shadow-md bg-background/90 backdrop-blur">
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute inset-0 bg-background/80 backdrop-blur-sm z-30" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar Wrapper */}
      <div className={`absolute md:relative z-40 h-full transition-transform duration-300 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <AppSidebar userEmail={userEmail} userId={userId} onMobileClose={() => setMobileMenuOpen(false)} />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden w-full h-full relative">
        {children}
      </main>
      
      <KeyboardShortcuts />
    </div>
  );
}
