"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FileText, 
  Clock, 
  Star, 
  Trash2, 
  Settings, 
  CreditCard,
  Users,
  PenTool
} from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
  { icon: FileText, label: "My PDFs", href: "/dashboard/files" },
  { icon: Clock, label: "Recent", href: "/dashboard/recent" },
  { icon: PenTool, label: "Signatures", href: "/dashboard/signatures" },
  { icon: Star, label: "Starred", href: "/dashboard/starred" },
  { icon: Trash2, label: "Trash", href: "/dashboard/trash" },
];

const secondaryItems = [
  { icon: Users, label: "Team", href: "/dashboard/team" },
  { icon: CreditCard, label: "Billing", href: "/dashboard/billing" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-border bg-card/40 flex flex-col h-screen fixed left-0 top-0 z-50">
      <div className="h-16 flex items-center px-6 border-b border-border bg-card">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo-transparent.png" alt="Logo" className="h-8 w-8 rounded-lg" />
          <span className="font-bold text-lg tracking-tight">PDFox</span>
        </Link>
      </div>
      
      <div className="flex-1 py-6 px-4 space-y-8 overflow-y-auto">
        <nav className="space-y-1">
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === item.href 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        
        <div className="space-y-4">
          <h4 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Workspace
          </h4>
          <nav className="space-y-1">
            {secondaryItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === item.href 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      
      <div className="p-4 border-t border-border bg-card/60">
        <div className="rounded-xl bg-primary/10 border border-primary/20 p-4">
          <p className="text-xs font-semibold text-primary mb-1">FREE PLAN</p>
          <p className="text-[10px] text-muted-foreground mb-3">5 of 10 monthly exports used</p>
          <Link 
            href="/dashboard/billing"
            className="block text-center py-2 px-3 rounded-md bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors"
          >
            Upgrade to Pro
          </Link>
        </div>
      </div>
    </aside>
  );
}
