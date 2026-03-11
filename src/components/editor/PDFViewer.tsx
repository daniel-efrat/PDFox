"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { useEditorStore } from "@/stores/useEditorStore";
import { cn } from "@/lib/utils";
import { AnnotationLayer } from "./AnnotationLayer";

// Initialize pdfjs worker
if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

interface PDFViewerProps {
  fileUrl: string;
}

export function PDFViewer({ fileUrl }: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const { currentPage, zoom, setDocument } = useEditorStore();

  const renderPage = useCallback(async (pdfDoc: pdfjsLib.PDFDocumentProxy, pageNum: number, scale: number) => {
    if (!canvasRef.current) return;

    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      setViewportSize({ width: viewport.width, height: viewport.height });

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        canvas: canvas,
      };

      await page.render(renderContext).promise;
    } catch (error) {
      console.error("Error rendering page:", error);
    }
  }, []);

  useEffect(() => {
    const loadPdf = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument(fileUrl);
        const pdfDoc = await loadingTask.promise;
        setPdf(pdfDoc);
        setDocument(fileUrl, "Sample Document", pdfDoc.numPages);
      } catch (error) {
        console.error("Error loading PDF:", error);
      }
    };

    if (fileUrl) loadPdf();
  }, [fileUrl, setDocument]);

  useEffect(() => {
    if (pdf) {
      renderPage(pdf, currentPage, zoom);
    }
  }, [pdf, currentPage, zoom, renderPage]);

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-auto bg-muted/20 p-8 flex justify-center items-start scroll-smooth"
    >
      <div 
        className="relative shadow-2xl shadow-black/20 border border-border bg-white rounded-sm mb-20 origin-top transition-all duration-200"
        style={{ width: viewportSize.width, height: viewportSize.height }}
      >
        <canvas ref={canvasRef} className="block shadow-md" />
        
        {viewportSize.width > 0 && (
          <AnnotationLayer 
            width={viewportSize.width} 
            height={viewportSize.height} 
            pageIndex={currentPage - 1} 
          />
        )}
      </div>
    </div>
  );
}
