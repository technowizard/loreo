import { ArrowsClockwiseIcon, CheckCircleIcon, SpinnerIcon } from '@phosphor-icons/react';
import { useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

import { useGetImportSession } from '@/features/import-articles/api/get-import-session';
import { useGetLinksFromImportSession } from '@/features/import-articles/api/get-links-from-session';
import { ExtractionProgress } from '@/features/import-articles/components/extraction-progress';

const COMPLETE_SCREEN_DURATION = 2500;

function ImportProgressPage() {
  const { t } = useTranslation();
  const importSessionId = useParams({
    from: '/_protected/_with-layout/settings/import-articles/$sessionId'
  }).sessionId;

  const navigate = useNavigate();
  const search = useSearch({
    from: '/_protected/_with-layout/settings/import-articles/$sessionId'
  });
  const statusFilter = search.status;

  const importSessionQuery = useGetImportSession({ importSessionId });
  const importSession = importSessionQuery.data?.result;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetLinksFromImportSession({
    extractionStatus: statusFilter,
    importSessionId
  });
  const links = data?.pages.flatMap((page) => page.result?.items ?? []) ?? [];

  const [hasTransitioned, setHasTransitioned] = useState(false);
  const [drainProgress, setDrainProgress] = useState(100);

  useEffect(() => {
    if (importSession?.status !== 'completed' || hasTransitioned) return;

    const drainTimer = setTimeout(() => setDrainProgress(0), 50);
    const transitionTimer = setTimeout(() => setHasTransitioned(true), COMPLETE_SCREEN_DURATION);

    return () => {
      clearTimeout(drainTimer);
      clearTimeout(transitionTimer);
    };
  }, [importSession?.status, hasTransitioned]);

  const handleFilterChange = (value: 'completed' | 'failed' | null) => {
    if (value === null || value === undefined) {
      const { status: _, ...restSearch } = search;
      navigate({
        search: restSearch,
        to: '.'
      });
    } else {
      navigate({
        search: { ...search, status: value },
        to: '.'
      });
    }
  };

  const importPercentage = importSession
    ? Math.round((importSession.importedCount / importSession.totalRows) * 100)
    : 0;

  const importedCount = importSession?.importedCount ?? 0;
  const totalRows = importSession?.totalRows ?? 0;

  if (importSessionQuery.isLoading) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-6">
        <SpinnerIcon className="animate-spin" size={36} />
      </div>
    );
  }

  if (importSession && importSession.status === 'completed' && !hasTransitioned) {
    return (
      <main aria-label="Import complete" className="flex max-w-350 flex-col gap-6" role="main">
        <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-6">
          <CheckCircleIcon
            className="text-success-500 dark:text-success-400"
            size={48}
            weight="fill"
          />
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-foreground">{t('import.progress.completeTitle')}</h1>
            <p className="text-muted-foreground">
              {t('import.progress.progressText', {
                current: importedCount,
                total: totalRows
              })}
            </p>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-[width] ease-linear"
              style={{
                transitionDuration: `${COMPLETE_SCREEN_DURATION}ms`,
                width: `${drainProgress}%`
              }}
            />
          </div>
          <Button onClick={() => setHasTransitioned(true)} variant="secondary">
            {t('import.progress.viewExtractionProgress')}
          </Button>
        </div>
      </main>
    );
  }

  if (importSession && importSession.status === 'completed' && hasTransitioned) {
    return (
      <ExtractionProgress
        extractionCompleted={importSession.extractionCompleted ?? 0}
        extractionFailed={importSession.extractionFailed ?? 0}
        extractionProgress={importSession.extractionProgress ?? 0}
        fetchNextPage={fetchNextPage}
        filter={statusFilter || null}
        hasNextPage={hasNextPage}
        importedCount={importSession.importedCount ?? 0}
        isFetchingNextPage={isFetchingNextPage}
        links={links}
        onFilterChange={handleFilterChange}
        totalRows={importSession.totalRows ?? 0}
      />
    );
  }

  return (
    <main aria-label="Article import wizard" className="flex max-w-350 flex-col gap-6" role="main">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-6">
        <ArrowsClockwiseIcon className="animate-spin" size={36} />
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-foreground">{t('import.progress.importingTitle')}</h1>
          <div className="text-muted-foreground">{t('import.progress.importingDescription')}</div>
        </div>
        <div className="w-full">
          <div className="flex items-center justify-between font-semibold">
            <div>
              {t('import.progress.progressText', {
                current: importedCount,
                total: totalRows
              })}
            </div>
            <div>{importPercentage}%</div>
          </div>
          <Progress className="mt-2" value={importPercentage} />
        </div>
      </div>
    </main>
  );
}

export default ImportProgressPage;
