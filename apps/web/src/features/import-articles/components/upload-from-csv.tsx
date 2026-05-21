import { FileArrowUpIcon, FileIcon, InfoIcon, LightbulbIcon, XIcon } from '@phosphor-icons/react';
import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

import { useUploadCSV } from '@/features/import-articles/api/upload-csv';

import { useImportArticles } from '../hooks/use-import-articles';

import { formatFileSize } from '@/lib/utils';

import { useNotificationsStore } from '@/stores/notifications';

interface UploadFromCsvProps {
  disabled?: boolean;
  onUploadComplete?: () => void;
}

export function UploadFromCsv({ disabled = false, onUploadComplete }: UploadFromCsvProps) {
  const { t } = useTranslation('common');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const notifyError = useNotificationsStore.useError();

  const { onSelectedFileChange, onUploadSuccess, resetUploadedFile, uploadedFile } =
    useImportArticles();

  const uploadCSVMutation = useUploadCSV({
    mutationConfig: {
      onMutate: () => {
        toast.loading(t('import.upload.toastLoading'), {
          position: 'top-center',
          richColors: true
        });
      },
      onSuccess: (data) => {
        toast.dismiss(); // clear loading

        if (data.result) {
          onUploadSuccess(data.result);
        }
      }
    }
  });

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) {
        event.preventDefault();
        return;
      }

      const file = event.target.files?.[0];

      if (!file) {
        return;
      }

      // Reset input value to allow selecting the same file again
      event.target.value = '';

      onSelectedFileChange(file);
      uploadCSVMutation.mutate(file);
      onUploadComplete?.();
    },
    [disabled, onSelectedFileChange, onUploadComplete, uploadCSVMutation]
  );

  const handleButtonClick = useCallback(() => {
    if (disabled) {
      return;
    }

    fileInputRef.current?.click();
  }, [disabled]);

  const handleClearFile = useCallback(
    (event: React.MouseEvent) => {
      if (disabled) {
        return;
      }

      event.stopPropagation();
      resetUploadedFile();
    },
    [disabled, resetUploadedFile]
  );

  const handleDragEnter = useCallback(
    (event: React.DragEvent) => {
      if (disabled) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
    },
    [disabled]
  );

  const handleDragLeave = useCallback(
    (event: React.DragEvent) => {
      if (disabled) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
    },
    [disabled]
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent) => {
      if (disabled) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
    },
    [disabled]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      if (disabled) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const files = event.dataTransfer.files;

      if (files.length > 0) {
        const file = files[0]!;

        if (file.name.endsWith('.csv')) {
          onSelectedFileChange(file);
          uploadCSVMutation.mutate(file);
          onUploadComplete?.();
        } else {
          notifyError(t('import.wizard.errorUploadRequired'));
        }
      }
    },
    [disabled, notifyError, onSelectedFileChange, onUploadComplete, uploadCSVMutation]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (disabled) {
        return;
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleButtonClick();
      }
    },
    [disabled, handleButtonClick]
  );

  const formattedSize = formatFileSize(uploadedFile.size);

  return (
    <div className="flex w-full flex-col gap-6">
      <div
        aria-describedby="csv-tips"
        aria-label={t('import.upload.dropzoneAria')}
        className="group border-border hover:border-primary/50 hover:bg-accent/50 focus-visible:ring-ring dark:hover:bg-accent/30 relative flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        onClick={handleButtonClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
      >
        <input
          accept=".csv"
          aria-label={t('import.upload.dropzoneAria')}
          className="sr-only"
          onChange={handleFileSelect}
          ref={fileInputRef}
          type="file"
        />

        {uploadedFile.name ? (
          // Selected file state
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="bg-primary/10 border-primary/20 flex h-16 w-16 items-center justify-center rounded-full border transition-transform group-hover:scale-105">
              <FileIcon className="text-primary h-8 w-8" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-foreground max-w-70 truncate font-medium">
                {uploadedFile.name}
              </span>
              <Button
                aria-label={t('import.upload.clearFile')}
                className="h-6 w-6 rounded-full p-0"
                onClick={handleClearFile}
                size="sm"
                variant="ghost"
              >
                <XIcon className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-muted-foreground text-sm">
              {formattedSize} • {t('import.upload.clearFile')}
            </p>
          </div>
        ) : (
          // Default state
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="bg-primary/10 border-primary/20 flex h-16 w-16 items-center justify-center rounded-full border transition-transform group-hover:scale-105">
              <FileArrowUpIcon className="text-primary h-8 w-8" />
            </div>
            <h2 className="text-lg font-semibold">{t('import.upload.dropzoneText')}</h2>
            <p className="text-muted-foreground text-sm">{t('import.upload.fileHint')}</p>
            <Button className="mt-2" size="default">
              {t('import.upload.selectFile')}
            </Button>
          </div>
        )}
      </div>

      {uploadedFile.name ? (
        <Alert className="p-6" variant="success">
          <InfoIcon />
          <AlertTitle className="text-lg font-bold">{t('import.upload.successTitle')}</AlertTitle>
          <AlertDescription>
            <ul className="list-inside list-disc space-y-2 text-sm">
              <li>We&apos;ll scan the file to help you map URLs, titles, and tags</li>
              <li>Articles will be added to your library in the background</li>
              <li>Large imports might take a while to complete content fetching</li>
            </ul>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="p-6" variant="info">
          <LightbulbIcon />
          <AlertTitle className="text-lg font-bold">{t('import.upload.tipsTitle')}</AlertTitle>
          <AlertDescription>
            <ul className="list-inside list-disc space-y-2 text-sm">
              <li>{t('import.upload.tipOne')}</li>
              <li>{t('import.upload.tipTwo')}</li>
              <li>{t('import.upload.tipThree')}</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
