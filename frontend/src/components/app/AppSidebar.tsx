import { LayoutDashboard, Sparkles, Settings, Lightbulb, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Link } from "react-router-dom";
import { UserButton, useClerk, useUser } from "@clerk/react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "AI Assistant", url: "/ai", icon: Sparkles },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 gap-2 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center shrink-0">
            <Lightbulb className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          {!collapsed && <span className="text-sm font-bold text-display">IdeaLab</span>}
        </Link>
      </div>

      {/* Nav */}
      <SidebarContent className="pt-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-foreground font-medium"
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User footer */}
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <UserButton afterSignOutUrl="/" />
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">
                  {user?.fullName ?? user?.primaryEmailAddress?.emailAddress}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => signOut({ redirectUrl: "/" })}
            className="w-full flex items-center gap-2 rounded-md px-2.5 py-2 text-xs text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            {!collapsed && <span>Log out</span>}
            {collapsed && <span className="sr-only">Log out</span>}
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
