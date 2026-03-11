"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, PencilBrush } from "fabric";
import { X, Eraser, Check, Save } from "lucide-react";

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}

export function SignaturePad({ onSave, onClose }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      width: 400,
      height: 200,
      isDrawingMode: true,
      backgroundColor: "#f8fafc",
    });

    const brush = new PencilBrush(canvas);
    brush.width = 3;
    brush.color = "#0F172A";
    canvas.freeDrawingBrush = brush;

    fabricRef.current = canvas;

    return () => {
      canvas.dispose();
    };
  }, []);

  const handleClear = () => {
    if (fabricRef.current) {
      fabricRef.current.clear();
      fabricRef.current.backgroundColor = "#f8fafc";
      fabricRef.current.renderAll();
    }
  };

  const handleSave = () => {
    if (fabricRef.current) {
      const dataUrl = fabricRef.current.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1,
      });
      onSave(dataUrl);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-lg">Draw Signature</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-md transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="border-2 border-dashed border-border rounded-xl overflow-hidden bg-white">
            <canvas ref={canvasRef} className="mx-auto" />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Draw your signature above. Use a stylus for best results.
          </p>
        </div>

        <div className="p-4 bg-muted/30 border-t border-border flex items-center justify-between gap-3">
          <button 
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            <Eraser className="h-4 w-4" />
            Clear
          </button>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
            >
              <Save className="h-4 w-4" />
              Save Signature
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
