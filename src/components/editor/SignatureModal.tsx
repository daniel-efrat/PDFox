"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, PencilBrush } from "fabric";
import { X, Check, Trash2 } from "lucide-react";

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signatureData: any) => void;
}

export function SignatureModal({ isOpen, onClose, onSave }: SignatureModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    if (isOpen && canvasRef.current && !fabricRef.current) {
      const canvas = new Canvas(canvasRef.current, {
        isDrawingMode: true,
        width: 500,
        height: 200,
        backgroundColor: '#fff',
      });

      canvas.freeDrawingBrush = new PencilBrush(canvas);
      canvas.freeDrawingBrush.width = 3;
      canvas.freeDrawingBrush.color = '#000';

      canvas.on('path:created', () => setIsEmpty(false));
      fabricRef.current = canvas;
    }

    return () => {
      if (fabricRef.current) {
        fabricRef.current.dispose();
        fabricRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!fabricRef.current || isEmpty) return;
    
    // Get the signature as an object or image
    // For simplicity, let's just get the group of paths
    const objects = fabricRef.current.getObjects();
    if (objects.length === 0) return;

    // Export the first path or combine them
    // Here we'll just take the whole canvas content as a data URL for now
    // or we can pass the objects.
    onSave(fabricRef.current.toObject());
    onClose();
  };

  const handleClear = () => {
    if (fabricRef.current) {
      fabricRef.current.clear();
      fabricRef.current.backgroundColor = '#fff';
      fabricRef.current.requestRenderAll();
      setIsEmpty(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
          <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">Draw Your Signature</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-full transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <div className="p-6 bg-white flex justify-center">
          <div className="border-2 border-dashed border-border rounded-lg overflow-hidden bg-white shadow-inner">
            <canvas ref={canvasRef} />
          </div>
        </div>
        
        <div className="p-4 border-t border-border flex items-center justify-between bg-muted/30">
          <button 
            onClick={handleClear}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </button>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold rounded-md hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isEmpty}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              Adopt & Sign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
