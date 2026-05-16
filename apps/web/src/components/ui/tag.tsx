import { cn } from '@/lib/utils';

type TagProps = {
  className?: string;
  tag: {
    color: string;
    name: string;
  };
};

function Tag({ className, tag }: TagProps) {
  return (
    <div
      className={cn(
        'bg-background/80 inline-flex items-center space-x-2 rounded-4xl border px-2 py-1 text-sm font-medium',
        className
      )}
    >
      <div className="size-2.5 rounded-full" style={{ backgroundColor: tag.color }} />
      <span className="max-w-20 truncate">{tag.name}</span>
    </div>
  );
}

export default Tag;
