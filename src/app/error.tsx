"use client";
export default function Error({ error }: { error: Error }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">{error.message}</p>
      </div>
    </div>
  );
}
