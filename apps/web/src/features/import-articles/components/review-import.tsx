import { InfoIcon } from '@phosphor-icons/react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import Tag from '@/components/ui/tag';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import { useImportArticles } from '../hooks/use-import-articles';

interface ReviewImportProps {
  onReviewComplete?: () => void;
}

export function ReviewImport({ onReviewComplete }: ReviewImportProps) {
  const { t } = useTranslation('common');
  const { preview, uploadedFile } = useImportArticles();

  useEffect(() => {
    onReviewComplete?.();
  }, [onReviewComplete]);

  return (
    <div className="flex max-w-350 flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row">
        <Card className="flex-1">
          <CardHeader>
            <CardContent>
              <h3>{t('import.review.summary', { count: uploadedFile.totalRows })}</h3>
              <p className="mt-2 text-lg font-semibold">
                <span className="text-primary text-3xl font-bold">{uploadedFile.totalRows}</span>{' '}
                {t('import.review.summary', { count: uploadedFile.totalRows })}
              </p>
            </CardContent>
          </CardHeader>
        </Card>
        <Card className="flex-1">
          <CardHeader>
            <CardContent>
              <div className="inline-flex gap-2">
                <h3>
                  {t('import.review.estimatedTime', {
                    time: preview.estimatedTime
                  })}
                </h3>
                <Tooltip>
                  <TooltipTrigger>
                    <InfoIcon className="text-muted-foreground size-5" weight="fill" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Estimated time is calculated based on the number of articles and the rate of
                    processing (20 items per second)
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="mt-2 text-lg font-semibold">
                <span className="text-primary text-3xl font-bold">{preview.estimatedTime}</span>
              </p>
            </CardContent>
          </CardHeader>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold sm:text-lg">{t('import.review.title')}</h3>
        <p className="text-muted-foreground text-xs sm:text-sm">
          Scroll horizontally to view all columns
        </p>
      </div>

      <div className="border-border bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('import.review.tableHeadingUrl')}</TableHead>
              <TableHead>{t('import.review.tableHeadingTitle')}</TableHead>
              <TableHead>{t('import.review.tableHeadingTags')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {preview.result.map((preview) => (
              <TableRow key={preview.url}>
                <TableCell className="text-primary-500 dark:text-primary-400 max-w-90 truncate font-medium">
                  {preview.url}
                </TableCell>
                <TableCell className="max-w-90 truncate">{preview.title}</TableCell>
                {preview.tags ? (
                  <TableCell className="inline-flex items-center gap-2">
                    {preview.tags.slice(0, 3).map((tag) => (
                      <Tag key={tag} tag={{ color: 'blue', name: tag }} />
                    ))}
                    {preview.tags.length > 3 && (
                      <span className="text-foreground text-sm">
                        {t('import.review.moreCount', {
                          count: preview.tags.length - 3
                        })}
                      </span>
                    )}
                  </TableCell>
                ) : (
                  <TableCell className="text-muted-foreground">
                    {t('import.review.noTags')}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
