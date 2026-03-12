"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import { Search, Bell, Plus, LogOut } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

export function DashboardNavbar() {
  const router = useRouter();
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <header className="h-16 border-b border-border bg-card/40 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <div className="container h-full flex items-center justify-between px-6 bg-card">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-full max-w-md hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search PDFs, folders, and shared files..." 
              className="w-full h-9 pl-10 pr-4 rounded-md border border-border bg-background/50 text-sm outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              const input = document.querySelector('input[type="file"]') as HTMLInputElement;
              if (input) input.click();
            }}
            className="flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow-sm transition-transform active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Upload PDF
          </button>
          
          <div className="h-8 w-[1px] bg-border mx-2 hidden sm:block"></div>
          
          <button className="p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary border-2 border-card"></span>
          </button>

          <button
            onClick={handleSignOut}
            className="p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
