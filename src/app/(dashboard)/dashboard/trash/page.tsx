export default function TrashPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trash</h1>
        <p className="text-muted-foreground">
          Review deleted documents before they are permanently removed.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-8">
        <h2 className="text-lg font-semibold mb-2">Trash is empty</h2>
        <p className="text-sm text-muted-foreground">
          Deleted files will appear here and can be restored later.
        </p>
      </div>
    </div>
  );
}
