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
  const { 
    activeTool, 
    addAnnotation, 
    updateAnnotation, 
    removeAnnotation, 
    annotations,
    selectedColor,
    selectedBrushSize
  } = useEditorStore();

  // Sync annotations from store to canvas (for undo/redo)
  useEffect(() => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;
    
    // Clear current objects and re-add from store for this page
    const pageAnnotations = annotations.filter(a => a.pageIndex === pageIndex);
    
    // Simple sync: if count differs or data differs, re-render
    // For better performance, we could track IDs
    const currentObjects = canvas.getObjects();
    
    // Clear and reload if mismatch
    // (In a more complex app, we'd diff objects)
    canvas.clear();
    
    pageAnnotations.forEach(async (anno) => {
      let obj: any;
      if (anno.type === 'TEXT') {
        obj = await Textbox.fromObject(anno.data);
      } else {
        obj = await FabricObject.fromObject(anno.data);
      }
      
      if (obj) {
        (obj as any).id = anno.id;
        canvas.add(obj);
      }
    });
    
    canvas.requestRenderAll();
  }, [annotations, pageIndex]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new Canvas(canvasRef.current, {
      width,
  // Handle keyboard events (including Undo/Redo shortcuts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl+Z
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
      }
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'Z')) {
        e.preventDefault();
        redo();
      }
      
      // Deletion
      if (e.key === 'Backspace' || e.key === 'Delete') {
        if (!fabricRef.current) return;
        const activeObjects = fabricRef.current.getActiveObjects();
        if (activeObjects.length > 0) {
          activeObjects.forEach(obj => {
            if ((obj as any).id) {
              removeAnnotation((obj as any).id);
            }
            fabricRef.current?.remove(obj);
          });
          fabricRef.current.discardActiveObject();
          fabricRef.current.requestRenderAll();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, removeAnnotation]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new Canvas(canvasRef.current, {
      width,
      height,
      selection: activeTool === 'SELECT',
    });

    fabricRef.current = fabricCanvas;

    fabricCanvas.on('path:created', (e: any) => {
      const path = e.path;
      const id = Math.random().toString(36).substr(2, 9);
      path.id = id;
      addAnnotation({
        id,
        type: 'DRAW',
        pageIndex,
        data: path.toObject(),
      });
    });

    fabricCanvas.on('object:modified', (e: any) => {
      const obj = e.target;
      if (obj && (obj as any).id) {
        updateAnnotation((obj as any).id, obj.toObject());
      }
    });

    // Handle clicks for adding text/shapes
    fabricCanvas.on('mouse:down', (options) => {
      // If we clicked on an existing object, don't spawn a new one, just select it
      if (options.target) {
        fabricCanvas.setActiveObject(options.target);
        return;
      }

      if (activeTool === 'SELECT' || activeTool === 'DRAW') return;

      if (activeTool === 'SIGNATURE') {
        setIsSignModalOpen(true);
        // Store click position for placing the signature
        (fabricCanvas as any).lastClickPoint = fabricCanvas.getScenePoint(options.e);
        return;
      }

      const pointer = fabricCanvas.getScenePoint(options.e);
      let newObj: any = null;

      if (activeTool === 'TEXT') {
        newObj = new Textbox('Type here...', {
          left: pointer.x,
          top: pointer.y,
          width: 150,
          fontSize: 20,
          fill: selectedColor,
        });
      } else if (activeTool === 'HIGHLIGHT') {
        newObj = new Rect({
          left: pointer.x,
          top: pointer.y - 10,
          width: 100,
          height: 20,
          fill: selectedColor,
          strokeWidth: 0,
        });
      }

      if (newObj) {
        const id = Math.random().toString(36).substr(2, 9);
        newObj.id = id;
        fabricCanvas.add(newObj);
        fabricCanvas.setActiveObject(newObj);
        
        addAnnotation({
          id,
          type: activeTool as any,
          pageIndex,
          data: newObj.toObject(),
        });
      }
    });

    return () => {
      fabricCanvas.dispose();
    };
  }, [width, height, pageIndex, activeTool, addAnnotation, updateAnnotation, removeAnnotation, selectedColor]);

  const handleSaveSignature = async (sigData: any) => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;
    const point = (canvas as any).lastClickPoint || { x: 50, y: 50 };

    // Create a group or individual objects from the signature data
    // For now, let's treat the signature as a collection of paths or a single object
    const id = Math.random().toString(36).substr(2, 9);
    
    // We can use fromObject on the whole sigData if we want to restore everything
    // But let's just add it as a "SIGNATURE" type
    const objects = await Promise.all(sigData.objects.map((o: any) => FabricObject.fromObject(o)));
    const group = new Group(objects as FabricObject[], {
      left: point.x,
      top: point.y,
      scaleX: 0.5,
      scaleY: 0.5,
    });

    (group as any).id = id;
    canvas.add(group);
    canvas.setActiveObject(group);
    
    addAnnotation({
      id,
      type: 'SIGNATURE',
      pageIndex,
      data: group.toObject(),
    });

    setIsSignModalOpen(false); // Close modal after saving
  };

  useEffect(() => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;

    const isSelectionEnabled = ['SELECT', 'TEXT', 'HIGHLIGHT', 'SIGNATURE'].includes(activeTool);
    canvas.selection = activeTool === 'SELECT';
    
    canvas.getObjects().forEach(obj => {
      obj.selectable = isSelectionEnabled;
      obj.evented = isSelectionEnabled;
    });

    if (activeTool === 'DRAW') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new PencilBrush(canvas);
      canvas.freeDrawingBrush.width = selectedBrushSize;
      canvas.freeDrawingBrush.color = selectedColor;
    } else {
      canvas.isDrawingMode = false;
    }

    canvas.requestRenderAll();
  }, [activeTool, selectedColor, selectedBrushSize]);

  return (
    <div className="absolute inset-0 z-10">
      <canvas ref={canvasRef} />
    </div>
  );
}
