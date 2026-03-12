"use client";

import { useEffect, useState, useRef } from "react";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadDocument } from "@/actions/documents";
import { useRouter } from "next/navigation";

export function UploadZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = () => {
      fileInputRef.current?.click();
    };

    window.addEventListener("pdfab:upload-pdf", handler);
    return () => window.removeEventListener("pdfab:upload-pdf", handler);
  }, []);

  const onUpload = async (file: File) => {
    if (!file.type.includes("pdf")) {
      setError("Please upload a PDF file");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const doc = await uploadDocument(formData);
      router.push(`/editor/${doc.id}`);
    } catch (err) {
      console.error(err);
      setError("Failed to upload. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) onUpload(file);
  };

  return (
    <div className="space-y-4 w-full">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center gap-4 transition-all cursor-pointer group",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-border bg-card/50 hover:border-primary/50",
          isUploading && "pointer-events-none opacity-60",
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
          }}
          className="hidden"
          accept="application/pdf"
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="font-semibold text-sm">Uploading your PDF...</p>
          </div>
        ) : (
          <>
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <Upload className="h-7 w-7" />
            </div>
            <div>
              <p className="font-semibold text-base mb-1">Drop your PDF here</p>
              <p className="text-sm text-muted-foreground">
                or click to browse files
              </p>
            </div>
            <p className="text-[11px] text-muted-foreground pt-6 border-t border-border w-full">
              Maximum file size: 50MB
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
