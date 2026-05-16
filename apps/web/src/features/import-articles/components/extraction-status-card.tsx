import {
  ArrowsClockwiseIcon,
  CheckCircleIcon,
  ClockIcon,
  WarningCircleIcon,
  type Icon
} from '@phosphor-icons/react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { cn } from '@/lib/utils';

interface ExtractionStatusCardProps {
  link: {
    errorMessage: string | null;
    status: string;
    title: string;
    url: string;
  };
  onViewArticle: () => void;
}

const renderStatusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return <Badge variant="success">Completed</Badge>;
    case 'processing':
      return <Badge variant="info">Processing</Badge>;
    case 'failed':
      return <Badge variant="danger">Failed</Badge>;
    case 'pending':
      return <Badge variant="secondary">Pending</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export function ExtractionStatusCard({ link, onViewArticle }: ExtractionStatusCardProps) {
  const getStatusIconStyle = () => {
    switch (link.status) {
      case 'completed':
        return 'text-success-500 dark:text-success-400 bg-success-100 dark:bg-success-500/10';
      case 'failed':
        return 'text-danger-500 dark:text-danger-400 bg-danger-100 dark:bg-danger-500/10';
      case 'processing':
        return 'text-info-500 dark:text-info-400 bg-info-100 dark:bg-info-500/10';
      case 'pending':
        return 'bg-zinc-100 text-zinc-500 sepia-theme:bg-sepia-100 sepia-theme:text-sepia-500 dark:bg-zinc-500/10 dark:text-zinc-400';
      default:
        return '';
    }
  };

  const iconMap: Record<string, Icon | null> = {
    completed: CheckCircleIcon,
    failed: WarningCircleIcon,
    pending: ClockIcon,
    processing: ArrowsClockwiseIcon
  };

  const IconComponent = iconMap[link.status] || null;

  return (
    <Card>
      <CardContent className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'flex size-10 max-w-10 items-center justify-center rounded-md',
              getStatusIconStyle()
            )}
          >
            {IconComponent && (
              <IconComponent
                className={link.status === 'processing' ? 'animate-spin' : undefined}
                size={24}
                weight="fill"
              />
            )}
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-foreground line-clamp-1 max-w-64 sm:max-w-full">{link.title}</div>
            <div className="text-muted-foreground line-clamp-1 max-w-65 text-xs">{link.url}</div>
          </div>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex flex-row space-y-1 space-x-2 sm:flex-col sm:items-end sm:space-x-0">
            {renderStatusBadge(link.status)}
            {link.status === 'failed' && (
              <div className="text-danger-500 dark:text-danger-400 text-sm">
                {link.errorMessage}
              </div>
            )}
          </div>
          {link.status === 'failed' && (
            <div className="flex w-full flex-col space-y-2 sm:w-fit sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2">
              <Button onClick={onViewArticle} variant="outline">
                View
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
