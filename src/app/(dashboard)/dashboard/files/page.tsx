import { 
  FileText, 
  Search,
  Filter,
  MoreVertical,
  Download,
  Trash2,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { getDocuments } from "@/actions/documents";
import { formatDistanceToNow } from "date-fns";
import { formatBytes } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function FilesPage() {
  const documents = await getDocuments();

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Documents</h1>
          <p className="text-muted-foreground">Manage and organize all your uploaded PDFs.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search files..." 
              className="pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full md:w-64"
            />
          </div>
          <button className="p-2 rounded-lg border border-border bg-card hover:bg-muted transition-colors">
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Name</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Updated</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {documents.length > 0 ? (
              documents.map((file) => (
                <tr key={file.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-6 py-4">
                    <Link href={`/editor/${file.id}`} className="flex items-center gap-4">
                      <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-background border border-border group-hover:border-primary/50 transition-colors">
                        <FileText className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{file.title}</p>
                        <p className="text-xs text-muted-foreground">PDF Document</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(file.updatedAt), { addSuffix: true })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <Link 
                        href={`/editor/${file.id}`}
                        className="p-2 rounded-md hover:bg-background transition-colors text-muted-foreground"
                        title="Edit"
                       >
                        <ExternalLink className="h-4 w-4" />
                       </Link>
                       <button className="p-2 rounded-md hover:bg-background transition-colors text-muted-foreground" title="Download">
                        <Download className="h-4 w-4" />
                      </button>
                      <button className="p-2 rounded-md hover:bg-background transition-colors text-destructive" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                  <p className="text-sm text-muted-foreground">No documents found. Upload one to see it here.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
