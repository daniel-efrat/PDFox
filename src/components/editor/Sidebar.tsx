"use client";

import { useEditorStore } from "@/stores/useEditorStore";
import { cn } from "@/lib/utils";
import { Copy, Trash2, RotateCw } from "lucide-react";

export function EditorSidebar() {
  const { totalPages, currentPage, setCurrentPage, selectedPageIndices, togglePageSelection } = useEditorStore();

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <aside className="w-64 border-r border-border bg-card/60 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
      <div className="p-4 border-b border-border bg-card flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Pages</h3>
        <div className="flex items-center gap-1">
          <button className="p-1.5 hover:bg-muted rounded text-muted-foreground transition-colors" title="Rotate selected">
            <RotateCw className="h-3.5 w-3.5" />
          </button>
          <button className="p-1.5 hover:bg-muted rounded text-muted-foreground transition-colors" title="Delete selected">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {pages.map((pageNumber, index) => (
          <div 
            key={pageNumber} 
            className="flex flex-col items-center gap-2 group"
          >
            <div 
              onClick={() => setCurrentPage(pageNumber)}
              className={cn(
                "relative w-40 aspect-[3/4] rounded-lg border-2 bg-background shadow-sm cursor-pointer transition-all hover:border-primary/50 overflow-hidden",
                currentPage === pageNumber && "border-primary ring-2 ring-primary/20",
                selectedPageIndices.includes(index) && "border-orange-500 shadow-orange-500/10"
              )}
            >
              <div className="absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground bg-muted/20">
                Page {pageNumber}
              </div>
              
              {/* Selection Checkbox */}
              <div 
                className="absolute top-2 left-2"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePageSelection(index);
                }}
              >
                <div className={cn(
                  "h-4 w-4 rounded border flex items-center justify-center transition-colors",
                  selectedPageIndices.includes(index) 
                    ? "bg-orange-500 border-orange-500 text-white" 
                    : "bg-white/80 border-border group-hover:border-primary/50"
                )}>
                  {selectedPageIndices.includes(index) && <div className="h-2 w-2 bg-current rounded-full" />}
                </div>
              </div>
            </div>
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-widest",
              currentPage === pageNumber ? "text-primary" : "text-muted-foreground"
            )}>
              {pageNumber}
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}
