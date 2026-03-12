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
  FabricImage,
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
  const syncRunIdRef = useRef(0);
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
  const [isCanvasReady, setIsCanvasReady] = useState(false);

  const resolvePointer = (canvas: any, evt: any) => {
    if (!evt || !canvas) return null;

    if (typeof canvas.getPointer === "function") {
      const p = canvas.getPointer(evt);
      if (p && typeof p.x === "number" && typeof p.y === "number") return p;
    }

    if (typeof canvas.getViewportPoint === "function") {
      const p = canvas.getViewportPoint(evt);
      if (p && typeof p.x === "number" && typeof p.y === "number") return p;
    }

    if (typeof evt.offsetX === "number" && typeof evt.offsetY === "number") {
      return { x: evt.offsetX, y: evt.offsetY };
    }

    return null;
  };

  const toFabricOptions = (data: any) => {
    const { type, version, objects, path, text, layoutManager, ...options } = data ?? {};
    return options;
  };

  const enlivenObject = async (data: any) => {
    if (!data || typeof data !== "object") return null;
    const objectType = String(data.type ?? "").toLowerCase();

    // Restore explicitly by type. This avoids runtime class-registry issues in Fabric v7
    // where some classes do not expose static fromObject in this build.
    switch (objectType) {
      case "textbox":
        return new Textbox(data.text ?? "Type here...", toFabricOptions(data));
      case "rect":
        return new Rect(toFabricOptions(data));
      case "path":
        return new Path((data.path ?? "") as any, toFabricOptions(data));
      case "image": {
        const src = typeof data.src === "string" ? data.src : "";
        if (!src) return null;
        const image = await FabricImage.fromURL(src);
        image.set(toFabricOptions(data));
        return image;
      }
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
    if (!fabricRef.current || !isCanvasReady) return;
    const canvas = fabricRef.current;

    // Clear current objects and re-add from store for this page
    const pageAnnotations = annotations.filter(
      (a) => a.pageIndex === pageIndex,
    );

    // Intelligent sync: clear and reload but ONLY when annotations change
    let cancelled = false;
    const runId = ++syncRunIdRef.current;

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
              const fill = anno.data.fill ?? "rgb(255, 255, 0)";
              const opacity =
                typeof anno.data.opacity === "number"
                  ? anno.data.opacity
                  : typeof fill === "string" && fill.startsWith("rgba")
                    ? 1
                    : 0.4;

              obj.set({
                fill,
                opacity,
                strokeWidth: 0,
                globalCompositeOperation:
                  anno.data.globalCompositeOperation ?? "multiply",
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

      if (cancelled || runId !== syncRunIdRef.current) return;
      objs.filter(Boolean).forEach((obj) => canvas.add(obj as any));
      canvas.requestRenderAll();
    };

    void sync();
    return () => {
      cancelled = true;
    };
  }, [annotations, pageIndex, isCanvasReady]);

  // Handle keyboard events (including Undo/Redo shortcuts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Deletion
      if (e.key === "Backspace" || e.key === "Delete") {
        if (!fabricRef.current) return;
        const activeObjects = fabricRef.current.getActiveObjects();
        const isEditingTextbox = activeObjects.some((obj: any) => {
          const objectType = String(obj?.type ?? "").toLowerCase();
          return (
            (objectType === "textbox" || objectType === "i-text") &&
            Boolean(obj?.isEditing)
          );
        });

        if (isEditingTextbox) {
          return;
        }

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

    canvasRef.current.style.touchAction = "none";

    const fabricCanvas = new Canvas(canvasRef.current, {
      width,
      height,
      selection: false,
    });
    fabricCanvas.setDimensions({ width, height });

    const lowerCanvas = (fabricCanvas as any).lowerCanvasEl as
      | HTMLCanvasElement
      | undefined;
    const upperCanvas = (fabricCanvas as any).upperCanvasEl as
      | HTMLCanvasElement
      | undefined;
    const wrapperEl = (fabricCanvas as any).wrapperEl as HTMLElement | undefined;

    if (wrapperEl) {
      wrapperEl.style.position = "absolute";
      wrapperEl.style.inset = "0";
      wrapperEl.style.width = `${width}px`;
      wrapperEl.style.height = `${height}px`;
      wrapperEl.style.pointerEvents = "auto";
    }

    if (lowerCanvas) {
      lowerCanvas.style.width = `${width}px`;
      lowerCanvas.style.height = `${height}px`;
    }

    if (upperCanvas) {
      upperCanvas.style.width = `${width}px`;
      upperCanvas.style.height = `${height}px`;
      upperCanvas.style.pointerEvents = "auto";
      upperCanvas.style.touchAction = "none";
    }

    fabricRef.current = fabricCanvas;
    setIsCanvasReady(true);

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
      const evt = (options as any)?.e;
      if (!evt) {
        return;
      }
      const clickPoint = resolvePointer(fabricCanvas as any, evt);
      if (
        !clickPoint ||
        typeof clickPoint.x !== "number" ||
        typeof clickPoint.y !== "number"
      ) {
        return;
      }

      // If we clicked on an existing object, don't spawn a new one, just select it
      if (options.target) {
        fabricCanvas.setActiveObject(options.target);
        return;
      }

      if (state.activeTool === "SELECT" || state.activeTool === "DRAW") return;

      if (state.activeTool === "SIGNATURE") {
        setIsSignModalOpen(true);
        // Store click position for placing the signature
        (fabricCanvas as any).lastClickPoint = clickPoint;
        return;
      }

      const pointer = clickPoint;
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
        const highlightFill =
          typeof state.selectedColor === "string" && state.selectedColor.length > 0
            ? state.selectedColor
            : "rgb(255, 255, 0)";

        newObj = new Rect({
          left: pointer.x,
          top: pointer.y - 10,
          width: 100,
          height: 20,
          fill: highlightFill,
          opacity:
            typeof highlightFill === "string" &&
            highlightFill.startsWith("rgba")
              ? 1
              : 0.4,
          strokeWidth: 0,
          globalCompositeOperation: "multiply",
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
      setIsCanvasReady(false);
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

    if (String(sigData?.type ?? "").toLowerCase() === "image" && typeof sigData?.src === "string") {
      const image = await FabricImage.fromURL(sigData.src);
      image.set({
        left: point.x,
        top: point.y,
        originX: "center",
        originY: "center",
      });
      if (typeof (image as any).scaleToWidth === "function") {
        try {
          (image as any).scaleToWidth(200);
        } catch {
          image.set({ scaleX: 0.5, scaleY: 0.5 });
        }
      } else {
        image.set({ scaleX: 0.5, scaleY: 0.5 });
      }
      image.setCoords();
      (image as any).id = id;
      canvas.add(image);
      canvas.setActiveObject(image);
      canvas.requestRenderAll();

      addAnnotation({
        id,
        type: "SIGNATURE",
        pageIndex,
        data: image.toObject(),
      });
      setIsSignModalOpen(false);
      return;
    }

    // sigData is the fabric canvas object from the modal
    const signatureObjects = Array.isArray(sigData?.objects) ? sigData.objects : [];
    const objects = (
      await Promise.all(signatureObjects.map((o: any) => enlivenObject(o)))
    ).filter(Boolean) as FabricObject[];
    if (objects.length === 0) {
      setIsSignModalOpen(false);
      return;
    }

    // The signature pad canvas stores paths with their own coordinates.
    // Normalize them so the group bounds start near (0,0), otherwise the group can land off-screen.
    const bounds = objects.reduce(
      (acc, obj) => {
        const rect = obj.getBoundingRect();
        return {
          left: Math.min(acc.left, rect.left),
          top: Math.min(acc.top, rect.top),
          right: Math.max(acc.right, rect.left + rect.width),
          bottom: Math.max(acc.bottom, rect.top + rect.height),
        };
      },
      {
        left: Number.POSITIVE_INFINITY,
        top: Number.POSITIVE_INFINITY,
        right: Number.NEGATIVE_INFINITY,
        bottom: Number.NEGATIVE_INFINITY,
      },
    );

    objects.forEach((obj) => {
      obj.set({
        left: (obj.left ?? 0) - bounds.left,
        top: (obj.top ?? 0) - bounds.top,
      });
      obj.setCoords();
    });

    const group = new Group(objects as FabricObject[], {
      left: point.x,
      top: point.y,
      originX: "center",
      originY: "center",
    });

    // Ensure the signature is visible at a reasonable size regardless of the modal canvas scale.
    // Prefer width-based scaling if possible, otherwise fall back to a constant scale.
    if (typeof (group as any).scaleToWidth === "function") {
      try {
        (group as any).scaleToWidth(200);
      } catch {
        group.set({ scaleX: 0.5, scaleY: 0.5 });
      }
    } else {
      group.set({ scaleX: 0.5, scaleY: 0.5 });
    }
    group.setCoords();

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

  // Apply selected color to currently selected object (Select tool + color click)
  useEffect(() => {
    if (!fabricRef.current) return;

    const canvas = fabricRef.current;
    const activeObject = canvas.getActiveObject() as any;
    if (!activeObject || !activeObject.id) return;

    const applyColor = (obj: any) => {
      const type = String(obj?.type ?? '').toLowerCase();

      if (type === 'textbox' || type === 'i-text') {
        obj.set({ fill: selectedColor });
        return;
      }

      if (type === 'path') {
        obj.set({ stroke: selectedColor });
        return;
      }

      if (type === 'rect') {
        const isHighlight = String(obj?.globalCompositeOperation ?? '').toLowerCase() === 'multiply';
        obj.set({
          fill: selectedColor,
          opacity: isHighlight && !String(selectedColor).startsWith('rgba') ? 0.4 : 1,
        });
        return;
      }

      if (type === 'group' && Array.isArray(obj._objects)) {
        obj._objects.forEach((child: any) => {
          const childType = String(child?.type ?? '').toLowerCase();
          if (childType === 'path') {
            child.set({ stroke: selectedColor });
          } else if (childType === 'textbox' || childType === 'i-text' || childType === 'rect') {
            child.set({ fill: selectedColor });
          }
          child.setCoords?.();
        });
      }
    };

    applyColor(activeObject);
    activeObject.setCoords?.();
    canvas.requestRenderAll();
    updateAnnotation(activeObject.id, activeObject.toObject());
  }, [selectedColor, updateAnnotation]);

  return (
    <div className="absolute inset-0 z-10 pointer-events-auto">
      <canvas ref={canvasRef} className="block w-full h-full pointer-events-auto" />
      {isSignModalOpen && (
        <SignatureModal
          isOpen={isSignModalOpen}
          onClose={() => setIsSignModalOpen(false)}
          onSave={handleSaveSignature}
          penColor={selectedColor}
        />
      )}
    </div>
  );
}
