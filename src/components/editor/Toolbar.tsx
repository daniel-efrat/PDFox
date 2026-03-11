"use client";

import { 
  MousePointer2, 
  Type, 
  Highlighter, 
  Pencil, 
  RotateCw, 
  Trash2, 
  Download, 
  Save,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  PenTool,
  Maximize2
} from "lucide-react";
import { useEditorStore } from "@/stores/useEditorStore";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function EditorToolbar() {
  const { 
    activeTool, 
    setActiveTool, 
    zoom, 
    setZoom, 
    isSaving, 
    hasUnsavedChanges,
    title 
  } = useEditorStore();

  const tools = [
    { id: 'SELECT', icon: MousePointer2, label: 'Select' },
    { id: 'TEXT', icon: Type, label: 'Text' },
    { id: 'HIGHLIGHT', icon: Highlighter, label: 'Highlight' },
    { id: 'DRAW', icon: Pencil, label: 'Draw' },
    { id: 'SIGNATURE', icon: PenTool, label: 'Sign' },
    { id: 'CROP', icon: Maximize2, label: 'Crop' },
  ] as const;

  return (
    <div className="h-14 border-b border-border bg-card flex items-center justify-between px-4 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="p-2 hover:bg-muted rounded-md transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div className="h-6 w-[1px] bg-border mx-1"></div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-foreground truncate max-w-[200px]">{title}</span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            {isSaving ? "Saving..." : hasUnsavedChanges ? "Unsaved changes" : "All changes saved"}
            {hasUnsavedChanges && <span className="h-1 w-1 rounded-full bg-orange-500"></span>}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg border border-border">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className={cn(
              "p-2 rounded-md transition-all flex items-center gap-2",
              activeTool === tool.id 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            title={tool.label}
          >
            <tool.icon className="h-4 w-4" />
            {activeTool === tool.id && <span className="text-xs font-medium pr-1">{tool.label}</span>}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg border border-border">
          <button 
            onClick={() => setZoom(zoom - 0.1)}
            className="p-1.5 hover:bg-muted rounded-md text-muted-foreground transition-colors"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs font-mono w-12 text-center text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <button 
            onClick={() => setZoom(zoom + 0.1)}
            className="p-1.5 hover:bg-muted rounded-md text-muted-foreground transition-colors"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>

        <div className="h-6 w-[1px] bg-border mx-1"></div>

        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground text-xs font-bold hover:bg-secondary/90 transition-colors shadow-sm">
          <RotateCw className="h-3.5 w-3.5" />
          Rotate
        </button>
        
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-destructive/10 text-destructive text-xs font-bold hover:bg-destructive/20 transition-colors">
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>

        <button className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95">
          <Download className="h-3.5 w-3.5" />
          Export
        </button>
      </div>
    </div>
  );
}
