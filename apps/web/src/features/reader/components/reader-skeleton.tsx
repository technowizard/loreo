import { Skeleton } from '@/components/ui/skeleton';

function ReaderSkeleton() {
  return (
    <>
      <TitleSkeleton />
      <hr className="my-6" />
      <MetadataSkeleton />
      <TagsSkeleton />
      {Array.from({ length: 5 }).map((_, i) => (
        <ParagraphSkeleton key={i} />
      ))}
    </>
  );
}

function TitleSkeleton() {
  return (
    <>
      <Skeleton className="mb-3 h-10 w-[80%]" />
      <Skeleton className="my-5 h-6 w-[60%]" />
    </>
  );
}

function MetadataSkeleton() {
  return <Skeleton className="mb-5 h-6 w-60" />;
}

function TagsSkeleton() {
  return (
    <div className="inline-flex items-center space-x-2">
      <Skeleton className="h-6 w-15" />
      <Skeleton className="h-6 w-15" />
      <Skeleton className="h-6 w-15" />
    </div>
  );
}

function ParagraphSkeleton() {
  return (
    <div className="mt-6 flex flex-col space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-[60%]" />
    </div>
  );
}

export default ReaderSkeleton;
