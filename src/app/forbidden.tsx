export default function Forbidden() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-semibold">Access denied</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">You do not have permission to view this page.</p>
      </div>
    </div>
  );
}
