"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, FabricObject, Textbox, Rect, PencilBrush } from "fabric";
import { useEditorStore } from "@/stores/useEditorStore";
import { EditorTool } from "@/types/editor";

interface AnnotationLayerProps {
  width: number;
  height: number;
  pageIndex: number;
}

export function AnnotationLayer({ width, height, pageIndex }: AnnotationLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const { activeTool, addAnnotation, updateAnnotation, removeAnnotation } = useEditorStore();

  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new Canvas(canvasRef.current, {
      width,
      height,
      selection: activeTool === 'SELECT',
    });

    fabricRef.current = fabricCanvas;

    fabricCanvas.on('object:added', (e) => {
      // Handle new annotations
    });

    fabricCanvas.on('object:modified', (e) => {
      // Handle updates
    });

    return () => {
      fabricCanvas.dispose();
    };
  }, [width, height, pageIndex]); // Re-init on page/size change

  useEffect(() => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;

    canvas.selection = activeTool === 'SELECT';
    
    // Disable interaction for all objects if not in SELECT mode
    canvas.getObjects().forEach(obj => {
      obj.selectable = activeTool === 'SELECT';
      obj.evented = activeTool === 'SELECT';
    });

    if (activeTool === 'DRAW') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new PencilBrush(canvas);
      canvas.freeDrawingBrush.width = 2;
      canvas.freeDrawingBrush.color = '#F97316';
    } else {
      canvas.isDrawingMode = false;
    }

    canvas.requestRenderAll();
  }, [activeTool]);

  return (
    <div className="absolute inset-0 z-10">
      <canvas ref={canvasRef} />
    </div>
  );
}
