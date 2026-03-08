"use client";

import { AppSidebar } from "@/components/app-sidebar";

interface AppLayoutClientProps {
  children: React.ReactNode;
  userEmail: string;
  userId: string;
}

export function AppLayoutClient({ children, userEmail, userId }: AppLayoutClientProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar userEmail={userEmail} userId={userId} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
