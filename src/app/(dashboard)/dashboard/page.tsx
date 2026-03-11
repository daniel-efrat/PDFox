import { 
  FileText, 
  Clock, 
  MoreVertical, 
  ChevronRight,
  TrendingUp,
  Files,
  UserCheck
} from "lucide-react";
import Link from "next/link";
import { cn, formatBytes } from "@/lib/utils";
import { getDocuments, getDashboardStats } from "@/actions/documents";
import { UploadZone } from "@/components/dashboard/UploadZone";
import { formatDistanceToNow } from "date-fns";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  const supabase = createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  const documents = await getDocuments();
  const statsData = await getDashboardStats();

  const stats = [
    { label: "Total Documents", value: statsData.totalDocs.toString(), icon: Files, color: "text-blue-500" },
    { label: "Used Storage", value: "0 MB", icon: TrendingUp, color: "text-green-500" },
    { label: "Signatures", value: statsData.signatures.toString(),icon: UserCheck, color: "text-orange-500" },
  ];

  const recentFiles = documents.slice(0, 4);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back, {user?.user_metadata?.full_name || user?.email || "User"}</h1>
        <p className="text-muted-foreground">Manage your PDFs, sign documents, and collaborate with your team.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="p-6 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors shadow-sm">
            <div className="flex items-center gap-4">
              <div className={cn("p-2 rounded-lg bg-background border border-border", stat.color)}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions / Upload Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Recent Files
            </h2>
            <Link href="/dashboard/files" className="text-sm text-primary hover:underline flex items-center gap-1 font-medium">
              View all
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm min-h-[100px] flex flex-col justify-center">
            {recentFiles.length > 0 ? (
              <div className="divide-y divide-border">
                {recentFiles.map((file) => (
                  <Link 
                    key={file.id} 
                    href={`/editor/${file.id}`}
                    className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-background border border-border group-hover:border-primary/50 transition-colors">
                        <FileText className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{file.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(file.updatedAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button className="p-1.5 rounded-md hover:bg-background transition-colors text-muted-foreground">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-20" />
                <p className="text-sm text-muted-foreground">No documents yet. Upload one to get started.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Quick Upload
          </h2>
          
          <UploadZone />
          
          <div className="rounded-xl bg-orange-500/5 border border-orange-500/20 p-6 space-y-4 shadow-sm">
            <h3 className="fav-bold flex items-center gap-2 text-orange-500">
              <TrendingUp className="h-4 w-4" />
              Pro Tip
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Use the <span className="font-semibold text-foreground">Extract Pages</span> tool to create smaller documents from large reports.
            </p>
            <button className="w-full py-2 bg-orange-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-colors">
              Try It Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
