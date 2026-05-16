import { ArrowsClockwiseIcon } from '@phosphor-icons/react';
import { useNavigate } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import { ExtractionStatusCard } from './extraction-status-card';

interface ExtractionProgressProps {
  extractionCompleted: number;
  extractionFailed: number;
  extractionProgress: number;
  fetchNextPage: () => void;
  filter: 'completed' | 'failed' | null;
  hasNextPage: boolean;
  importedCount: number;
  isFetchingNextPage: boolean;
  links: {
    errorMessage: string | null;
    id: string;
    status: 'completed' | 'in_progress' | 'pending' | 'failed';
    title: string;
    url: string;
  }[];
  onFilterChange: (value: 'completed' | 'failed' | null) => void;
  totalRows: number;
}

const statuses = [
  { label: 'All Statuses', value: null },
  { label: 'Completed', value: 'completed' },
  { label: 'Failed', value: 'failed' }
];

export function ExtractionProgress(props: ExtractionProgressProps) {
  const {
    extractionCompleted,
    extractionFailed,
    extractionProgress,
    fetchNextPage,
    filter,
    hasNextPage,
    isFetchingNextPage,
    links,
    onFilterChange
  } = props;

  const navigate = useNavigate();

  return (
    <div className="mx-auto flex w-full flex-col gap-4">
      <div className="flex w-full justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-foreground">Extracting content</h1>
          <div className="text-muted-foreground max-w-[80%] text-sm sm:text-base">
            Extraction is running in the background. You can close this window and check back later.
          </div>
        </div>
        <div className="flex gap-2 self-end font-semibold tabular-nums">
          <div className="text-primary text-lg font-bold tabular-nums sm:text-xl">
            {extractionProgress}%
          </div>
        </div>
      </div>
      <Progress value={extractionProgress} />
      <div className="flex flex-col gap-4 sm:flex-row">
        <Card className="flex-1">
          <CardHeader>
            <CardContent>
              <h2>Completed</h2>
              <p className="mt-2 text-lg font-semibold tabular-nums">
                <span className="text-success-500 dark:text-success-400 text-3xl font-bold">
                  {extractionCompleted}
                </span>
              </p>
            </CardContent>
          </CardHeader>
        </Card>
        <Card className="flex-1">
          <CardHeader>
            <CardContent>
              <h2>Failed</h2>
              <p className="mt-2 text-lg font-semibold tabular-nums">
                <span className="text-danger-500 dark:text-danger-400 text-3xl font-bold">
                  {extractionFailed}
                </span>
              </p>
            </CardContent>
          </CardHeader>
        </Card>
      </div>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold sm:text-lg">Processing Queue</h2>
        <div>
          <Select
            disabled={isFetchingNextPage}
            items={statuses}
            onValueChange={(value) => {
              if (value === null) {
                onFilterChange(null);
              } else {
                onFilterChange(value as 'completed' | 'failed');
              }
            }}
            value={filter}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {statuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {links.map((link) => {
          return (
            <ExtractionStatusCard
              key={link.id}
              link={link}
              onViewArticle={() => navigate({ to: `/articles/${link.id}` })}
            />
          );
        })}
      </div>
      {hasNextPage && (
        <Button
          className="mx-auto min-h-11"
          disabled={isFetchingNextPage}
          onClick={() => fetchNextPage()}
          variant="ghost"
        >
          {isFetchingNextPage ? (
            <>
              <ArrowsClockwiseIcon className="animate-spin" size={16} />
              Loading...
            </>
          ) : (
            'Load more items'
          )}
        </Button>
      )}
    </div>
  );
}
