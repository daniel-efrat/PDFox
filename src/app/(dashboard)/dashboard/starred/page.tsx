export default function StarredPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Starred</h1>
        <p className="text-muted-foreground">
          Keep your most important documents easy to access.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-8">
        <h2 className="text-lg font-semibold mb-2">No starred documents yet</h2>
        <p className="text-sm text-muted-foreground">
          Starred items will appear here once that action is available.
        </p>
      </div>
    </div>
  );
}
