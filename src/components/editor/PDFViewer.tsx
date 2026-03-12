"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { useEditorStore } from "@/stores/useEditorStore";
import { cn } from "@/lib/utils";
import { AnnotationLayer } from "./AnnotationLayer";

// Initialize pdfjs worker
if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

interface PDFViewerProps {
  fileUrl: string;
}

interface PageRendererProps {
  pdf: pdfjsLib.PDFDocumentProxy;
  pageNumber: number;
  scale: number;
}

function PageRenderer({ pdf, pageNumber, scale }: PageRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const renderPage = async () => {
      if (!canvasRef.current) return;
      
      try {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale });
        
        if (!isMounted) return;
        setViewportSize({ width: viewport.width, height: viewport.height });

        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Cancel previous render task
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        
        await renderTask.promise;
      } catch (error: any) {
        if (error.name === 'RenderingCancelledException') {
          console.log(`Render cancelled for page ${pageNumber}`);
        } else {
          console.error("Error rendering page:", error);
        }
      }
    };

    renderPage();
    
    return () => {
      isMounted = false;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdf, pageNumber, scale]);

  return (
    <div 
      className="relative shadow-2xl shadow-black/20 border border-border bg-white rounded-sm mb-8 origin-top transition-all duration-200"
      style={{ width: viewportSize.width, height: viewportSize.height }}
    >
      <canvas ref={canvasRef} className="block shadow-md pointer-events-none" />
      
      {viewportSize.width > 0 && (
        <AnnotationLayer 
          width={viewportSize.width} 
          height={viewportSize.height} 
          pageIndex={pageNumber - 1} 
        />
      )}
    </div>
  );
}

export function PDFViewer({ fileUrl }: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const { totalPages, zoom, setTotalPages } = useEditorStore();

  useEffect(() => {
    const loadPdf = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument(fileUrl);
        const pdfDoc = await loadingTask.promise;
        setPdf(pdfDoc);
        setTotalPages(pdfDoc.numPages);
        
        if (typeof window !== "undefined") {
          (window as any).PDF_FILE_URL = fileUrl;
        }
      } catch (error) {
        console.error("Error loading PDF:", error);
      }
    };

    if (fileUrl) loadPdf();
  }, [fileUrl, setTotalPages]);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 overflow-auto bg-muted/20 p-8 flex flex-col items-center scroll-smooth selection:bg-none"
    >
      {pdf && Array.from({ length: totalPages }, (_, i) => (
        <PageRenderer 
          key={i + 1}
          pdf={pdf} 
          pageNumber={i + 1} 
          scale={zoom} 
        />
      ))}
    </div>
  );
}
