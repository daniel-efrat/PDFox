export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Update your account preferences and workspace defaults.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-8">
        <h2 className="text-lg font-semibold mb-2">Preferences</h2>
        <p className="text-sm text-muted-foreground">
          Profile, notifications, and app behavior options will live here.
        </p>
      </div>
    </div>
  );
}
