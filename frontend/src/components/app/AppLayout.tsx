import { ReactNode } from "react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <header className="h-14 flex items-center border-b border-border/40 px-4 shrink-0">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        </header>
        <main className="flex-1 overflow-auto w-full">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
