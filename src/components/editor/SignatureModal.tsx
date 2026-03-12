"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Canvas, PencilBrush } from "fabric";
import { X, Check, Trash2, Upload, Info, CircleCheck, AlertCircle } from "lucide-react";
import Image from "next/image";
import {
  deleteUserSignatureSlot,
  getUserSignatureSlots,
  processSignatureUploadImage,
  saveUserSignatureSlot,
  type SignatureImageUploadMode,
  type SavedSignatureSlot,
  type SignatureSlotType,
} from "@/actions/documents";

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signatureData: Record<string, unknown>) => void;
  penColor: string;
}

export function SignatureModal({
  isOpen,
  onClose,
  onSave,
  penColor,
}: SignatureModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [activeSlot, setActiveSlot] = useState<SignatureSlotType>("SIGNATURE");
  const [savedSlots, setSavedSlots] = useState<SavedSignatureSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isPersisting, setIsPersisting] = useState(false);
  const [uploadMode, setUploadMode] =
    useState<SignatureImageUploadMode>("PNG_TRANSPARENT");
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [isUploadProcessing, setIsUploadProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadInfo, setUploadInfo] = useState<string | null>(null);

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
      canvas.freeDrawingBrush.color = penColor;

      canvas.on('path:created', () => setIsEmpty(false));
      fabricRef.current = canvas;
    }

    return () => {
      if (fabricRef.current) {
        fabricRef.current.dispose();
        fabricRef.current = null;
      }
      setIsEmpty(true);
    };
  }, [isOpen, penColor]);

  useEffect(() => {
    if (!fabricRef.current?.freeDrawingBrush) return;
    fabricRef.current.freeDrawingBrush.color = penColor;
    fabricRef.current.requestRenderAll();
  }, [penColor]);

  const loadSlots = async () => {
    try {
      setIsLoadingSlots(true);
      const slots = await getUserSignatureSlots();
      setSavedSlots(slots);
    } catch (error) {
      console.error("Failed to load saved signature slots:", error);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    void loadSlots();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setUploadedPreview(null);
    setUploadError(null);
    setUploadInfo(null);
  }, [activeSlot, isOpen]);

  const currentSlotData = savedSlots.find((slot) => slot.slot === activeSlot);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!fabricRef.current || isEmpty) return;

    const objects = fabricRef.current.getObjects();
    if (objects.length === 0) return;

    try {
      setIsPersisting(true);
      const objectData = fabricRef.current.toObject() as Record<string, unknown>;
      const imageUrl = fabricRef.current.toDataURL({
        format: "png",
        quality: 1,
        multiplier: 1,
      });

      await saveUserSignatureSlot(activeSlot, JSON.stringify(objectData), imageUrl);
      await loadSlots();
      onSave(objectData);
    } catch (error) {
      console.error("Failed to save signature slot:", error);
    } finally {
      setIsPersisting(false);
    }
  };

  const handleClear = () => {
    if (fabricRef.current) {
      fabricRef.current.clear();
      fabricRef.current.backgroundColor = '#fff';
      fabricRef.current.requestRenderAll();
      setIsEmpty(true);
    }
  };

  const handleUseSaved = () => {
    if (!currentSlotData?.data) return;
    try {
      const parsed = JSON.parse(currentSlotData.data) as Record<string, unknown>;
      onSave(parsed);
    } catch (error) {
      console.error("Failed to parse saved signature slot:", error);
    }
  };

  const handleDeleteCurrentSlot = async () => {
    try {
      setIsPersisting(true);
      await deleteUserSignatureSlot(activeSlot);
      setSavedSlots((prev) => prev.filter((slot) => slot.slot !== activeSlot));
    } catch (error) {
      console.error("Failed to delete signature slot:", error);
    } finally {
      setIsPersisting(false);
    }
  };

  const handleUploadFile = async (
    event: ChangeEvent<HTMLInputElement>,
    mode: SignatureImageUploadMode,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadMode(mode);
      setIsUploadProcessing(true);
      setUploadError(null);
      setUploadInfo(
        mode === "PHOTO_WHITE_BG"
          ? "Removing white-paper background..."
          : "Preparing transparent PNG...",
      );
      const rawDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            resolve(reader.result);
            return;
          }
          reject(new Error("Failed to read file"));
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });

      const processedDataUrl = await processSignatureUploadImage(
        rawDataUrl,
        mode,
      );
      setUploadedPreview(processedDataUrl);
      setUploadInfo(
        mode === "PHOTO_WHITE_BG"
          ? "Background removed successfully. Preview ready."
          : "PNG loaded successfully. Preview ready.",
      );
    } catch (error) {
      console.error("Failed to process signature upload:", error);
      setUploadedPreview(null);
      setUploadError(
        mode === "PHOTO_WHITE_BG"
          ? "Failed to remove background. Please try another photo."
          : "Failed to read PNG. Please try another file.",
      );
      setUploadInfo(null);
    } finally {
      setIsUploadProcessing(false);
      event.target.value = "";
    }
  };

  const handleSaveUploadedAndUse = async () => {
    if (!uploadedPreview) return;
    try {
      setIsPersisting(true);
      setUploadError(null);
      const imageObject = { type: "image", src: uploadedPreview };
      await saveUserSignatureSlot(
        activeSlot,
        JSON.stringify(imageObject),
        uploadedPreview,
      );
      await loadSlots();
      setUploadInfo("Uploaded signature saved. Placing on document...");
      onSave(imageObject);
    } catch (error) {
      console.error("Failed to save uploaded signature slot:", error);
      setUploadError("Failed to save uploaded signature. Please try again.");
    } finally {
      setIsPersisting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
          <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">
            Signature & Initials
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-full transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 pt-4">
          <div className="inline-flex rounded-md border border-border overflow-hidden">
            <button
              onClick={() => setActiveSlot("SIGNATURE")}
              className={`px-4 py-2 text-xs font-bold ${activeSlot === "SIGNATURE" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              Signature
            </button>
            <button
              onClick={() => setActiveSlot("INITIALS")}
              className={`px-4 py-2 text-xs font-bold ${activeSlot === "INITIALS" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              Initials
            </button>
          </div>
        </div>

        <div className="p-6 pt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="border border-border rounded-lg p-4 bg-muted/20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Saved {activeSlot === "SIGNATURE" ? "Signature" : "Initials"}
              </h3>
              <button
                onClick={handleDeleteCurrentSlot}
                disabled={!currentSlotData || isPersisting}
                className="p-1 rounded hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Delete saved slot"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {isLoadingSlots ? (
              <p className="text-xs text-muted-foreground">Loading saved slot...</p>
            ) : currentSlotData?.imageUrl ? (
              <Image
                src={currentSlotData.imageUrl}
                alt={`Saved ${activeSlot.toLowerCase()}`}
                width={500}
                height={112}
                unoptimized
                className="w-full h-28 object-contain bg-white border border-border rounded-md"
              />
            ) : (
              <div className="w-full h-28 flex items-center justify-center text-xs text-muted-foreground bg-white border border-dashed border-border rounded-md">
                No saved {activeSlot.toLowerCase()} yet
              </div>
            )}

            <button
              onClick={handleUseSaved}
              disabled={!currentSlotData || isPersisting}
              className="mt-3 w-full px-3 py-2 text-xs font-bold rounded-md border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Use Saved
            </button>
          </div>

          <div className="border border-border rounded-lg p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider mb-3">
              Create New {activeSlot === "SIGNATURE" ? "Signature" : "Initials"}
            </h3>
            <div className="bg-white flex justify-center rounded-md border-2 border-dashed border-border overflow-hidden">
              <canvas ref={canvasRef} />
            </div>
            <button
              onClick={handleClear}
              className="mt-3 flex items-center gap-2 px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Clear Canvas
            </button>

            <div className="mt-4 pt-4 border-t border-border space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider">
                Upload Signature Image
              </div>
              <p className="text-[11px] text-muted-foreground">
                Choose one of the upload modes below.
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <label className="px-3 py-2 text-xs font-bold rounded-md border border-border hover:bg-muted cursor-pointer inline-flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  {isUploadProcessing && uploadMode === "PNG_TRANSPARENT"
                    ? "Processing PNG..."
                    : "Upload Transparent PNG"}
                  <input
                    type="file"
                    accept="image/png,image/webp"
                    className="hidden"
                    onChange={(event) =>
                      handleUploadFile(event, "PNG_TRANSPARENT")
                    }
                    disabled={isUploadProcessing || isPersisting}
                  />
                </label>

                <label className="px-3 py-2 text-xs font-bold rounded-md border border-border hover:bg-muted cursor-pointer inline-flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  {isUploadProcessing && uploadMode === "PHOTO_WHITE_BG"
                    ? "Removing BG..."
                    : "Upload Paper Photo"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={(event) =>
                      handleUploadFile(event, "PHOTO_WHITE_BG")
                    }
                    disabled={isUploadProcessing || isPersisting}
                  />
                </label>
              </div>

              <p className="text-[11px] text-muted-foreground">
                `Upload Transparent PNG` stores as-is. `Upload Paper Photo` sends the image to withoutBG for background removal.
              </p>

              {uploadedPreview ? (
                <Image
                  src={uploadedPreview}
                  alt="Uploaded signature preview"
                  width={500}
                  height={112}
                  unoptimized
                  className="w-full h-28 object-contain bg-white border border-border rounded-md"
                />
              ) : (
                <div className="w-full h-28 flex items-center justify-center text-xs text-muted-foreground bg-white border border-dashed border-border rounded-md">
                  Upload preview will appear here
                </div>
              )}
              <button
                onClick={handleSaveUploadedAndUse}
                disabled={!uploadedPreview || isUploadProcessing || isPersisting}
                className="w-full px-3 py-2 text-xs font-bold rounded-md border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save Upload & Use
              </button>
              {uploadInfo ? (
                <p className="text-[11px] text-emerald-600 flex items-center gap-1">
                  {isUploadProcessing ? (
                    <Info className="h-3 w-3 shrink-0" />
                  ) : (
                    <CircleCheck className="h-3 w-3 shrink-0" />
                  )}
                  <span>{uploadInfo}</span>
                </p>
              ) : null}
              {uploadError ? (
                <p className="text-[11px] text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>{uploadError}</span>
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold rounded-md hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isEmpty || isPersisting}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              Save New & Use
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
