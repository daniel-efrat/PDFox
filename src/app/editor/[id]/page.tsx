"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dynamicLoader from "next/dynamic";
import { useEditorStore } from "@/stores/useEditorStore";
import { getDocument } from "@/actions/documents";
import { EditorToolbar } from "@/components/editor/Toolbar";

const PDFViewer = dynamicLoader(
  () => import("@/components/editor/PDFViewer").then((mod) => mod.PDFViewer),
  { ssr: false }
);

const EditorSidebar = dynamicLoader(
  () => import("@/components/editor/Sidebar").then((mod) => mod.EditorSidebar),
  { ssr: false }
);

export const dynamic = "force-dynamic";

export default function EditorPage() {
  const params = useParams();
  const id = params.id as string;
  const { setDocument, reset } = useEditorStore();
  const [docData, setDocData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoc = async () => {
      setLoading(true);
      try {
        const doc = await getDocument(id);
        setDocData(doc);
        setDocument(id, doc.title, 0); 
      } catch (err) {
        console.error("Failed to fetch document:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDoc();

    return () => reset();
  }, [id, setDocument, reset]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="text-sm font-medium text-muted-foreground">Loading PDFox Editor...</p>
        </div>
      </div>
    );
  }

  if (!docData) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <p className="text-lg font-medium">Document not found</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden text-foreground">
      <EditorToolbar />
      <div className="flex-1 flex overflow-hidden">
        <EditorSidebar />
        <div className="flex-1 relative bg-muted/20">
          <PDFViewer fileUrl={docData.fileUrl} />
        </div>
        
        {/* Right Properties Panel */}
        <div className="w-80 border-l border-border bg-card/40 hidden xl:block p-6">
           <h3 className="text-sm font-semibold uppercase tracking-wider mb-6">Properties</h3>
           <div className="space-y-6">
              <div className="space-y-2">
                 <label className="text-xs text-muted-foreground">Document Title</label>
                 <div className="text-sm font-medium bg-background border border-border rounded-md px-3 py-2">
                    {docData.title}
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-xs text-muted-foreground">Created At</label>
                 <div className="text-sm font-medium">
                    {new Date(docData.createdAt).toLocaleDateString()}
                 </div>
              </div>
              <div className="pt-6 border-t border-border">
                 <a 
                   href={docData.fileUrl} 
                   download={docData.title}
                   target="_blank"
                   className="block w-full py-2 rounded-md border border-border text-center text-sm font-medium hover:bg-muted transition-colors"
                 >
                    Download Original
                 </a>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
