export default function TeamPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team</h1>
        <p className="text-muted-foreground">
          Invite collaborators and manage workspace members.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-8">
        <h2 className="text-lg font-semibold mb-2">Team workspace</h2>
        <p className="text-sm text-muted-foreground">
          Shared folders, roles, and permissions will be managed from this page.
        </p>
      </div>
    </div>
  );
}
