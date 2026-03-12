export default function SignaturesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Signatures</h1>
        <p className="text-muted-foreground">
          Manage your saved signatures and initials for faster signing.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-8">
        <h2 className="text-lg font-semibold mb-2">Signature manager</h2>
        <p className="text-sm text-muted-foreground">
          Your saved signature slots are available in the editor when placing signature fields.
        </p>
      </div>
    </div>
  );
}
