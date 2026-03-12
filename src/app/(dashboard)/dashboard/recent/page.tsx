export default function RecentPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Recent</h1>
        <p className="text-muted-foreground">
          Quickly reopen the PDFs you worked on most recently.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-8">
        <h2 className="text-lg font-semibold mb-2">No recent activity yet</h2>
        <p className="text-sm text-muted-foreground">
          Open or edit a document and it will appear here.
        </p>
      </div>
    </div>
  );
}
