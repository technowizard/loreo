import { Spinner } from '../ui/spinner';

export function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Spinner className="size-6" />
    </div>
  );
}
