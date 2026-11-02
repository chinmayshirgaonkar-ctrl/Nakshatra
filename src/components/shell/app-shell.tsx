import * as React from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { MobileNav } from "./mobile-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col md:pl-72 min-w-0">
        <Topbar />
        <main className="flex-1 px-4 py-6 md:px-12 md:py-10 max-w-7xl mx-auto w-full pb-24 md:pb-10">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
