import { useRouter } from '@tanstack/react-router';

export function ErrorFallback({ error }: { error: Error }) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
      <p className="font-mono text-sm text-muted-foreground">error</p>
      <h1 className="text-sm font-bold uppercase tracking-widest">Something went wrong</h1>
      <p className="max-w-sm text-center text-xs text-muted-foreground">{error.message}</p>
      <button
        type="button"
        onClick={() => router.invalidate()}
        className="font-mono text-xs text-muted-foreground underline-offset-4 hover:underline"
      >
        Try again
      </button>
    </div>
  );
}
