"use client";

import { useEditorStore } from "@/stores/useEditorStore";
import { cn } from "@/lib/utils";
import { Copy, Trash2, RotateCw, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

interface ThumbnailProps {
  pageNumber: number;
  isActive: boolean;
}

function Thumbnail({ pageNumber, isActive }: ThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const { documentId } = useEditorStore();
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);

  useEffect(() => {
    let isMounted = true;
    const renderThumbnail = async () => {
      if (!canvasRef.current) return;
      
      try {
        setLoading(true);
        const state = useEditorStore.getState();
        const fileUrl = state.documentId ? (window as any).PDF_FILE_URL : null;
        
        if (!fileUrl) return;

        const loadingTask = pdfjsLib.getDocument(fileUrl);
        const pdfDoc = await loadingTask.promise;
        const page = await pdfDoc.getPage(pageNumber);
        
        const viewport = page.getViewport({ scale: 0.2 });
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        if (!context || !isMounted) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Cancel previous render task
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const renderTask = page.render({
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        });
        renderTaskRef.current = renderTask;
        
        await renderTask.promise;
        
        if (isMounted) setLoading(false);
      } catch (error: any) {
        if (error.name !== 'RenderingCancelledException') {
          console.error("Error rendering thumbnail:", error);
        }
        if (isMounted) setLoading(false);
      }
    };

    renderThumbnail();
    return () => { 
      isMounted = false; 
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pageNumber, documentId]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-muted/10">
      {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/50" />}
      <canvas ref={canvasRef} className={cn("max-w-full max-h-full shadow-sm", loading ? "hidden" : "block")} />
    </div>
  );
}

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
                "relative w-40 aspect-[3/4] rounded-lg border-2 bg-background shadow-sm cursor-pointer transition-all hover:border-primary/50 overflow-hidden flex items-center justify-center",
                currentPage === pageNumber && "border-primary ring-2 ring-primary/20",
                selectedPageIndices.includes(index) && "border-orange-500 shadow-orange-500/10"
              )}
            >
              <Thumbnail pageNumber={pageNumber} isActive={currentPage === pageNumber} />
              
              <div className={cn(
                "absolute inset-0 bg-black/5 opacity-0 transition-opacity group-hover:opacity-100",
                currentPage === pageNumber && "opacity-100"
              )} />

              {/* Selection Checkbox */}
              <div 
                className="absolute top-2 left-2 z-10"
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
