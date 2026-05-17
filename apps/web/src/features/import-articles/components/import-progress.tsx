import { ArrowRightIcon, ArrowsClockwiseIcon, CheckCircleIcon } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

import { ExtractionProgress } from './extraction-progress';

export function ImportProgress() {
  const { t } = useTranslation('common');
  const [progress, setProgress] = useState({
    extraction: 0,
    import: 0
  });
  const [status, setStatus] = useState('processing'); // 'import-in-progress' | 'import-completed' | 'extraction'

  // Simulate progress for demo purposes
  useEffect(() => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      if (progress > 100) {
        progress = 100;
        clearInterval(interval);
        setStatus('import-completed');
      }
      setProgress({ extraction: 0, import: progress });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // if (loading) {
  //   return (
  //     <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-6">
  //       <ArrowsClockwiseIcon className="animate-spin" size={36} />
  //       <div className="flex flex-col gap-2 text-center">
  //         <h1 className="text-foreground">Preparing your import</h1>
  //         <div className="text-muted-foreground">
  //           We&apos;re getting things ready for your import. This should only
  //           take a moment.
  //         </div>
  //       </div>
  //     </div>
  //   )
  // }

  if (status === 'extraction') {
    return (
      <ExtractionProgress
        extractionCompleted={0}
        extractionFailed={0}
        extractionProgress={100}
        fetchNextPage={() => undefined}
        filter={null}
        hasNextPage={false}
        importedCount={0}
        isFetchingNextPage={false}
        links={[]}
        onFilterChange={() => undefined}
        totalRows={0}
      />
    );
  }

  if (status === 'import-completed') {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-2">
        <div className="border-success-100 bg-success-200 text-success-400 dark:border-success-900 dark:bg-success-800 dark:text-success-400 inline-flex size-12 items-center justify-center rounded-full">
          <CheckCircleIcon size={44} weight="fill" />
        </div>
        <h1 className="text-foreground">{t('import.progress.completeTitle')}</h1>
        <div className="text-muted-foreground">{t('import.progress.completeDescription')}</div>
        <Button className="mt-4" onClick={() => setStatus('extraction')}>
          {t('import.progress.viewExtractionProgress')}
          <ArrowRightIcon size={16} weight="bold" />
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-6">
      <ArrowsClockwiseIcon className="animate-spin" size={36} />
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-foreground">{t('import.progress.importingTitle')}</h1>
        <div className="text-muted-foreground">{t('import.progress.importingDescription')}</div>
      </div>
      <div className="w-full">
        <div className="flex items-center justify-between font-semibold">
          <div>{t('import.progress.progressText', { current: 20, total: 1000 })}</div>
          <div>{progress.import}%</div>
        </div>
        <Progress className="mt-2" value={progress.import} />
      </div>
    </div>
  );
}
