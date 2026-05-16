import { useRouter } from '@tanstack/react-router';

export function NotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
      <p className="font-mono text-sm text-muted-foreground">404</p>
      <h1 className="text-sm font-bold uppercase tracking-widest">Page not found</h1>
      <button
        type="button"
        onClick={() => router.history.back()}
        className="font-mono text-xs text-muted-foreground underline-offset-4 hover:underline"
      >
        go back
      </button>
    </div>
  );
}
