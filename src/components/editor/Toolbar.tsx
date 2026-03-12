"use client";

import { useState } from "react";
import { 
  MousePointer2, 
  Type, 
  Highlighter, 
  Pencil, 
  RotateCw, 
  Trash2, 
  Download, 
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  PenTool,
  Maximize2
} from "lucide-react";
import { useEditorStore } from "@/stores/useEditorStore";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { getDocument, saveDocumentAnnotations } from "@/actions/documents";
import { bakeAnnotations } from "@/lib/pdf/export";

export function EditorToolbar() {
  const [isExporting, setIsExporting] = useState(false);
  const { 
    activeTool, 
    setActiveTool, 
    zoom, 
    setZoom, 
    isSaving, 
    hasUnsavedChanges,
    title,
    rotatePage,
    deletePages,
    selectedPageIndices,
    currentPage,
    clearPageSelection,
    undo,
    redo,
    historyIndex,
    history,
    selectedColor,
    setSelectedColor,
    selectedBrushSize,
    setSelectedBrushSize,
    selectedFontFamily,
    setSelectedFontFamily,
    selectedFontSize,
    setSelectedFontSize,
    annotations,
    documentId,
    setUnsavedChanges
  } = useEditorStore();

  const handleExport = async () => {
    if (!documentId || isExporting) return;
    try {
      setIsExporting(true);
      if (hasUnsavedChanges) {
        await saveDocumentAnnotations(documentId, annotations);
        setUnsavedChanges(false);
      }
      const document = await getDocument(documentId);
      const sourceResponse = await fetch(document.fileUrl);
      if (!sourceResponse.ok) {
        throw new Error("Failed to download source PDF");
      }
      const sourceBytes = new Uint8Array(await sourceResponse.arrayBuffer());
      const exportedBytes = await bakeAnnotations(sourceBytes, annotations);
      const copiedBytes = new Uint8Array(exportedBytes.length);
      copiedBytes.set(exportedBytes);
      const blob = new Blob([copiedBytes.buffer], { type: "application/pdf" });
      const objectUrl = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      const baseTitle = String(title || document.title || "document").trim();
      link.href = objectUrl;
      link.download = `${baseTitle || "document"}-export.pdf`;
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Failed to export PDF:", error);
      window.alert("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const tools = [
    { id: 'SELECT', icon: MousePointer2, label: 'Select' },
    { id: 'TEXT', icon: Type, label: 'Text' },
    { id: 'HIGHLIGHT', icon: Highlighter, label: 'Highlight' },
    { id: 'DRAW', icon: Pencil, label: 'Draw' },
    { id: 'SIGNATURE', icon: PenTool, label: 'Sign' },
    { id: 'CROP', icon: Maximize2, label: 'Crop' },
  ] as const;

  const colors = [
    { name: 'Orange', value: '#F97316' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Black', value: '#000000' },
    { name: 'Highlight', value: 'rgba(255, 255, 0, 0.4)' },
  ];

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

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg border border-border">
          <button
            onClick={undo}
            disabled={historyIndex === 0}
            className="p-2 rounded-md hover:bg-muted disabled:opacity-30 transition-all"
            title="Undo"
          >
            <RotateCw className="h-4 w-4 transform -scale-x-100" />
          </button>
          <button
            onClick={redo}
            disabled={historyIndex === history.length - 1}
            className="p-2 rounded-md hover:bg-muted disabled:opacity-30 transition-all"
            title="Redo"
          >
            <RotateCw className="h-4 w-4" />
          </button>
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
      </div>

      {/* Contextual Tool Controls */}
      <div className="flex items-center gap-4">
        {(activeTool === 'SELECT' || activeTool === 'DRAW' || activeTool === 'TEXT' || activeTool === 'HIGHLIGHT' || activeTool === 'SIGNATURE') && (
          <div className="flex items-center gap-3 bg-muted/30 px-3 py-1 rounded-lg border border-border">
            {activeTool === 'DRAW' && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Size</span>
                  <input 
                    type="range" 
                    min="1" 
                    max="20" 
                    value={selectedBrushSize}
                    onChange={(e) => setSelectedBrushSize(parseInt(e.target.value))}
                    className="w-20 h-1 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
                <div className="h-4 w-[1px] bg-border"></div>
              </>
            )}

            {activeTool === 'TEXT' && (
              <>
                <div className="flex items-center gap-2">
                   <select 
                    value={selectedFontFamily}
                    onChange={(e) => setSelectedFontFamily(e.target.value)}
                    className="bg-transparent text-[10px] font-bold uppercase outline-none cursor-pointer"
                   >
                     <option value="sans-serif">Sans</option>
                     <option value="serif">Serif</option>
                     <option value="monospace">Mono</option>
                   </select>
                </div>
                <div className="h-4 w-[1px] bg-border"></div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Size</span>
                  <input 
                    type="number" 
                    min="8" 
                    max="72" 
                    value={selectedFontSize}
                    onChange={(e) => setSelectedFontSize(parseInt(e.target.value))}
                    className="w-10 bg-transparent text-[10px] font-bold outline-none"
                  />
                </div>
                <div className="h-4 w-[1px] bg-border"></div>
              </>
            )}

            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Color</span>
              <div className="flex gap-1">
                {colors.map(color => (
                  <button 
                    key={color.value}
                    onClick={() => setSelectedColor(color.value)}
                    className={cn(
                      "h-4 w-4 rounded-full border border-white/20 transition-transform",
                      selectedColor === color.value && "scale-125 ring-1 ring-primary ring-offset-1 ring-offset-card"
                    )}
                    style={{ backgroundColor: color.value.startsWith('rgba') ? '#FFFF00' : color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
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

        <button 
          onClick={() => {
            if (selectedPageIndices.length > 0) {
              rotatePage(selectedPageIndices[0], 90);
            } else {
              rotatePage(currentPage - 1, 90);
            }
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground text-xs font-bold hover:bg-secondary/90 transition-colors shadow-sm"
        >
          <RotateCw className="h-3.5 w-3.5" />
          Rotate
        </button>
        
        <button 
          onClick={() => {
            const targets = selectedPageIndices.length > 0 ? selectedPageIndices : [currentPage - 1];
            if (confirm(`Are you sure you want to delete ${targets.length} page(s)?`)) {
              deletePages(targets);
              clearPageSelection();
            }
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-destructive/10 text-destructive text-xs font-bold hover:bg-destructive/20 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>

        <button
          onClick={handleExport}
          disabled={isExporting || !documentId}
          className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-3.5 w-3.5" />
          {isExporting ? "Exporting..." : "Export"}
        </button>
      </div>
    </div>
  );
}
