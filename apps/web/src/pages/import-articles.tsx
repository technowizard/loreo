import { ArrowsClockwiseIcon, XCircleIcon } from '@phosphor-icons/react';
import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

import { useExecuteImport } from '@/features/import-articles/api/execute-import';
import { usePreviewImport } from '@/features/import-articles/api/preview-import';
import { MapFields } from '@/features/import-articles/components/map-fields';
import { ReviewImport } from '@/features/import-articles/components/review-import';
import { UploadFromCsv } from '@/features/import-articles/components/upload-from-csv';
import { WizardStepIndicator } from '@/features/import-articles/components/wizard-step-indicator';
import {
  canProceedFromStep,
  createInitialStepCompletion,
  getNextStep,
  getPreviousStep,
  type ImportWizardStep,
  markStepComplete,
  STEP_DESCRIPTIONS,
  STEP_ERROR_MESSAGES,
  STEP_LABELS,
  STEP_MAP_FIELDS,
  STEP_REVIEW,
  STEP_UPLOAD
} from '@/features/import-articles/constants/wizard-config';
import { useImportArticles } from '@/features/import-articles/hooks/use-import-articles';

import { useNotificationsStore } from '@/stores/notifications';

function ImportArticlesPage() {
  const { t } = useTranslation('common');
  const [step, setStep] = useState<ImportWizardStep>(STEP_UPLOAD);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const notifyError = useNotificationsStore.useError();
  const notifyInfo = useNotificationsStore.useInfo();

  // Track completion state for each step
  const [stepComplete, setStepComplete] = useState(createInitialStepCompletion);

  const stepRef = useRef<HTMLDivElement>(null);

  const { mapping, onPreviewImportSuccess, uploadedFile } = useImportArticles();

  const navigate = useNavigate();

  // Focus management on step change
  useEffect(() => {
    stepRef.current?.focus();
  }, [step]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCancel();
      } else if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        handleContinue();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, stepComplete]);

  const handleContinue = () => {
    setError(null);

    if (!canProceedFromStep(step, stepComplete)) {
      setError(t(STEP_ERROR_MESSAGES[step]));

      return;
    }

    if (step === STEP_REVIEW) {
      handleImport();
    } else if (step === STEP_MAP_FIELDS) {
      previewImportMutation.mutate({
        fileId: uploadedFile.fileId,
        mapping
      });
    } else {
      setStep((prev) => getNextStep(prev));
    }
  };

  const handleBack = () => {
    setError(null);
    if (step > STEP_UPLOAD) {
      setStep((prev) => getPreviousStep(prev));
    }
  };

  const handleCancel = () => {
    if (step !== STEP_UPLOAD || stepComplete[STEP_UPLOAD]) {
      if (confirm(t('import.wizard.confirmCancelDescription'))) {
        resetWizard();
        notifyInfo(t('import.wizard.toastCancelled'));
      }
    }
  };

  const handleImport = async () => {
    setIsLoading(true);

    try {
      executeImportMutation.mutate({
        fileId: uploadedFile.fileId,
        mapping
      });
    } catch {
      notifyError(t('import.wizard.toastFailed'));

      setError(t('import.wizard.toastFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const resetWizard = () => {
    setStep(STEP_UPLOAD);
    setStepComplete(createInitialStepCompletion());
    setError(null);
  };

  const handleStepComplete = (completedStep: ImportWizardStep) => {
    setStepComplete((current) => markStepComplete(current, completedStep));
  };

  const handleUploadComplete = useCallback(() => {
    handleStepComplete(STEP_UPLOAD);
  }, []);

  const handleMappingComplete = useCallback(() => {
    handleStepComplete(STEP_MAP_FIELDS);
  }, []);

  const handleReviewComplete = useCallback(() => {
    handleStepComplete(STEP_REVIEW);
  }, []);

  const previewImportMutation = usePreviewImport({
    mutationConfig: {
      onSuccess: (data) => {
        if (data.result) {
          onPreviewImportSuccess(data.result);

          setStep((prev) => getNextStep(prev));
        }
      }
    }
  });

  const executeImportMutation = useExecuteImport({
    mutationConfig: {
      onMutate: () => {
        setIsLoading(true);
      },
      onSuccess: (data) => {
        if (data.result) {
          resetWizard();

          navigate({
            params: { sessionId: data.result.importSessionId },
            to: '/settings/import-articles/$sessionId'
          });
        }
      }
    }
  });

  const renderStep = () => {
    switch (step) {
      case STEP_UPLOAD:
        return <UploadFromCsv onUploadComplete={handleUploadComplete} />;
      case STEP_MAP_FIELDS:
        return <MapFields onMappingComplete={handleMappingComplete} />;
      case STEP_REVIEW:
        return <ReviewImport onReviewComplete={handleReviewComplete} />;
      default:
        return null;
    }
  };

  return (
    <main aria-label="Article import wizard" className="flex max-w-350 flex-col gap-6" role="main">
      <WizardStepIndicator currentStep={step} steps={STEP_LABELS.map((key) => t(key))} />

      {/* Header */}
      <header>
        <h1 className="text-foreground text-3xl font-bold tracking-tight">
          {t(STEP_LABELS[step])}
        </h1>
        <p className="text-muted-foreground mt-1">{t(STEP_DESCRIPTIONS[step])}</p>
      </header>

      {/* Error Alert */}
      {error && (
        <div
          className="border-destructive/50 bg-destructive/10 text-destructive mb-2 flex items-center gap-2 rounded-lg border p-3 text-sm"
          role="alert"
        >
          <XCircleIcon className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step Content */}
      <div
        aria-label={`Step ${step + 1} content`}
        className="focus-visible:ring-primary focus-visible:ring-2 focus-visible:outline-none"
        ref={stepRef}
        role="region"
        tabIndex={-1}
      >
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t pt-6">
        <div className="flex">
          {step !== STEP_UPLOAD && (
            <Button onClick={handleCancel} variant="ghost">
              {t('import.wizard.cancel')}
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          {step > STEP_UPLOAD && (
            <Button onClick={handleBack} variant="secondary">
              {t('import.wizard.back')}
            </Button>
          )}
          <Button className="min-h-11" disabled={isLoading} onClick={handleContinue}>
            {isLoading ? (
              <ArrowsClockwiseIcon className="h-4 w-4 animate-spin" />
            ) : step === STEP_REVIEW ? (
              t('import.wizard.startImport')
            ) : (
              t('import.wizard.continue')
            )}
          </Button>
        </div>
      </div>
    </main>
  );
}

export default ImportArticlesPage;
