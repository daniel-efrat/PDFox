"use client";

import { useEffect, useRef, useState } from "react";
import {
  Canvas,
  FabricObject,
  Textbox,
  Rect,
  PencilBrush,
  Group,
  Path,
} from "fabric";
import { useEditorStore } from "@/stores/useEditorStore";
import { SignatureModal } from "./SignatureModal";

interface AnnotationLayerProps {
  width: number;
  height: number;
  pageIndex: number;
}

export function AnnotationLayer({
  width,
  height,
  pageIndex,
}: AnnotationLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const {
    activeTool,
    addAnnotation,
    updateAnnotation,
    removeAnnotation,
    annotations,
    selectedColor,
    selectedBrushSize,
    undo,
    redo,
  } = useEditorStore();

  const [isSignModalOpen, setIsSignModalOpen] = useState(false);

  const toFabricOptions = (data: any) => {
    const { type, version, objects, path, text, ...options } = data ?? {};
    return options;
  };

  const enlivenObject = async (data: any) => {
    if (!data || typeof data !== "object") return null;

    // Restore explicitly by type. This avoids runtime class-registry issues in Fabric v7
    // where some classes do not expose static fromObject in this build.
    switch (data.type) {
      case "textbox":
        return new Textbox(data.text ?? "Type here...", toFabricOptions(data));
      case "rect":
        return new Rect(toFabricOptions(data));
      case "path":
        return new Path(data.path ?? "", toFabricOptions(data));
      case "group": {
        const childData = Array.isArray(data.objects) ? data.objects : [];
        const children = (
          await Promise.all(childData.map((child: any) => enlivenObject(child)))
        ).filter(Boolean) as FabricObject[];
        return new Group(children, toFabricOptions(data));
      }
      default:
        return null;
    }
  };

  // Sync annotations from store to canvas (for undo/redo)
  useEffect(() => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;

    // Clear current objects and re-add from store for this page
    const pageAnnotations = annotations.filter(
      (a) => a.pageIndex === pageIndex,
    );

    // Intelligent sync: clear and reload but ONLY when annotations change
    let cancelled = false;

    const sync = async () => {
      canvas.clear();

      const objs = await Promise.all(
        pageAnnotations.map(async (anno) => {
          try {
            if (!anno?.id || !anno?.data) return null;
            const obj = await enlivenObject(anno.data);

            if (!obj) return null;
            (obj as any).id = anno.id;

            if (anno.type === "HIGHLIGHT") {
              obj.set({
                fill: anno.data.fill ?? "rgba(255, 255, 0, 0.4)",
                opacity: anno.data.opacity ?? 0.4,
                strokeWidth: 0,
              });
            }

            return obj;
          } catch (e) {
            console.error(
              "[AnnotationLayer] Failed to restore annotation",
              anno,
              e,
            );
            return null;
          }
        }),
      );

      if (cancelled) return;
      objs.filter(Boolean).forEach((obj) => canvas.add(obj as any));
      canvas.requestRenderAll();
    };

    void sync();
    return () => {
      cancelled = true;
    };
  }, [annotations, pageIndex]);

  // Handle keyboard events (including Undo/Redo shortcuts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Deletion
      if (e.key === "Backspace" || e.key === "Delete") {
        if (!fabricRef.current) return;
        const activeObjects = fabricRef.current.getActiveObjects();
        if (activeObjects.length > 0) {
          activeObjects.forEach((obj) => {
            if ((obj as any).id) {
              removeAnnotation((obj as any).id);
            }
            fabricRef.current?.remove(obj);
          });
          fabricRef.current.discardActiveObject();
          fabricRef.current.requestRenderAll();
        }
        return;
      }

      // Undo: Ctrl+Z
      if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        undo();
      }
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if (
        (e.ctrlKey && e.key === "y") ||
        (e.ctrlKey && e.shiftKey && (e.key === "Z" || e.key === "z"))
      ) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, removeAnnotation]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new Canvas(canvasRef.current, {
      width,
      height,
      selection: false,
    });

    fabricRef.current = fabricCanvas;

    fabricCanvas.on("path:created", (e: any) => {
      const path = e.path;
      const id = Math.random().toString(36).substr(2, 9);
      path.id = id;
      addAnnotation({
        id,
        type: "DRAW",
        pageIndex,
        data: path.toObject(),
      });
    });

    fabricCanvas.on("object:modified", (e: any) => {
      const obj = e.target;
      if (obj && (obj as any).id) {
        updateAnnotation((obj as any).id, obj.toObject());
      }
    });

    // Handle clicks for adding text/shapes
    fabricCanvas.on("mouse:down", (options) => {
      const state = useEditorStore.getState();

      // If we clicked on an existing object, don't spawn a new one, just select it
      if (options.target) {
        fabricCanvas.setActiveObject(options.target);
        return;
      }

      if (state.activeTool === "SELECT" || state.activeTool === "DRAW") return;

      if (state.activeTool === "SIGNATURE") {
        setIsSignModalOpen(true);
        // Store click position for placing the signature
        (fabricCanvas as any).lastClickPoint = fabricCanvas.getScenePoint(
          options.e,
        );
        return;
      }

      const pointer = fabricCanvas.getScenePoint(options.e);
      let newObj: any = null;

      if (state.activeTool === "TEXT") {
        newObj = new Textbox("Type here...", {
          left: pointer.x,
          top: pointer.y,
          width: 150,
          fontSize: state.selectedFontSize,
          fontFamily: state.selectedFontFamily,
          fill: state.selectedColor,
        });
      } else if (state.activeTool === "HIGHLIGHT") {
        newObj = new Rect({
          left: pointer.x,
          top: pointer.y - 10,
          width: 100,
          height: 20,
          fill: state.selectedColor.startsWith("rgba")
            ? state.selectedColor
            : "rgba(255, 255, 0, 0.4)",
          opacity: 0.4,
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
          type: state.activeTool as any,
          pageIndex,
          data: newObj.toObject(),
        });
      }
    });

    return () => {
      fabricCanvas.dispose();
    };
  }, [width, height, pageIndex, addAnnotation, updateAnnotation]);

  const handleSaveSignature = async (sigData: any) => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;
    const point = (canvas as any).lastClickPoint || {
      x: width / 2,
      y: height / 2,
    };

    const id = Math.random().toString(36).substr(2, 9);

    // sigData is the fabric canvas object from the modal
    const objects = (
      await Promise.all(sigData.objects.map((o: any) => enlivenObject(o)))
    ).filter(Boolean) as FabricObject[];
    if (objects.length === 0) {
      setIsSignModalOpen(false);
      return;
    }
    const group = new Group(objects as FabricObject[], {
      left: point.x,
      top: point.y,
      scaleX: 0.5,
      scaleY: 0.5,
    });

    (group as any).id = id;
    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.requestRenderAll();

    addAnnotation({
      id,
      type: "SIGNATURE",
      pageIndex,
      data: group.toObject(),
    });

    setIsSignModalOpen(false); // Close modal after saving
  };

  // Synchronize tool settings (color, brush size, selectable state) WITHOUT clearing canvas
  useEffect(() => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;

    const isSelectionEnabled = (
      ["SELECT", "TEXT", "HIGHLIGHT", "SIGNATURE"] as string[]
    ).includes(activeTool);
    canvas.selection = activeTool === "SELECT";

    canvas.getObjects().forEach((obj) => {
      // Keep ALL elements visible and selectable/evented at all times for easy selection
      // But only allow moving/scaling if tool is SELECT or the specific tool
      obj.selectable = isSelectionEnabled;
      obj.evented = isSelectionEnabled;
    });

    if (activeTool === "DRAW") {
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
      {isSignModalOpen && (
        <SignatureModal
          isOpen={isSignModalOpen}
          onClose={() => setIsSignModalOpen(false)}
          onSave={handleSaveSignature}
        />
      )}
    </div>
  );
}
