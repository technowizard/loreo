import { ArrowsClockwiseIcon, XCircleIcon } from '@phosphor-icons/react';
import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { useExecuteImport } from '@/features/import-articles/api/execute-import';
import { usePreviewImport } from '@/features/import-articles/api/preview-import';
import { MapFields } from '@/features/import-articles/components/map-fields';
import { ReviewImport } from '@/features/import-articles/components/review-import';
import { UploadFromCsv } from '@/features/import-articles/components/upload-from-csv';
import { WizardStepIndicator } from '@/features/import-articles/components/wizard-step-indicator';
import { useImportArticles } from '@/features/import-articles/hooks/use-import-articles';

// Constants
const STEP_UPLOAD = 0;
const STEP_MAP_FIELDS = 1;
const STEP_REVIEW = 2;

const STEP_LABELS = ['Upload CSV', 'Map Fields', 'Final Review'] as const;

const STEP_DESCRIPTIONS = [
  'Upload a CSV file to import your articles. Works with Pocket exports.',
  'Match the columns from your CSV file to the article fields. Required fields are marked with an asterisk (*).',
  'Please confirm the data summary below. Once you start the import, your articles will be added to your library.'
] as const;

// Types
type Step = typeof STEP_UPLOAD | typeof STEP_MAP_FIELDS | typeof STEP_REVIEW;

function ImportArticlesPage() {
  const [step, setStep] = useState<Step>(STEP_UPLOAD);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track completion state for each step
  const [stepComplete, setStepComplete] = useState<Record<Step, boolean>>({
    [STEP_MAP_FIELDS]: false,
    [STEP_REVIEW]: false,
    [STEP_UPLOAD]: false
  });

  const stepRef = useRef<HTMLDivElement>(null);

  const { mapping, onPreviewImportSuccess, uploadedFile } = useImportArticles();

  const navigate = useNavigate();

  // Validation - check if current step is complete
  const canProceed = (): boolean => {
    return stepComplete[step];
  };

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

    if (!canProceed()) {
      const errorMessages: Record<Step, string> = {
        [STEP_MAP_FIELDS]: 'Please complete field mapping before continuing',
        [STEP_REVIEW]: 'Please review your import before starting',
        [STEP_UPLOAD]: 'Please upload a CSV file before continuing'
      };

      const errorMessage = errorMessages[step];
      setError(errorMessage);

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
      setStep((prev) => (prev + 1) as Step);
    }
  };

  const handleBack = () => {
    setError(null);
    if (step > STEP_UPLOAD) {
      setStep((prev) => (prev - 1) as Step);
    }
  };

  const handleCancel = () => {
    if (step !== STEP_UPLOAD || stepComplete[STEP_UPLOAD]) {
      if (confirm('Are you sure you want to cancel the import? Your progress will be lost.')) {
        resetWizard();
        toast.info('Import cancelled');
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
      toast.error('Import failed. Please try again.');

      setError('Import failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetWizard = () => {
    setStep(STEP_UPLOAD);
    setStepComplete({
      [STEP_MAP_FIELDS]: false,
      [STEP_REVIEW]: false,
      [STEP_UPLOAD]: false
    });
    setError(null);
  };

  const markStepComplete = (completedStep: Step) => {
    setStepComplete({ ...stepComplete, [completedStep]: true });
  };

  const handleUploadComplete = useCallback(() => {
    markStepComplete(STEP_UPLOAD);
  }, []);

  const handleMappingComplete = useCallback(() => {
    markStepComplete(STEP_MAP_FIELDS);
  }, []);

  const handleReviewComplete = useCallback(() => {
    markStepComplete(STEP_REVIEW);
  }, []);

  const previewImportMutation = usePreviewImport({
    mutationConfig: {
      onSuccess: (data) => {
        if (data.result) {
          onPreviewImportSuccess(data.result);

          setStep((prev) => (prev + 1) as Step);
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
      <WizardStepIndicator currentStep={step} steps={STEP_LABELS} />

      {/* Header */}
      <header>
        <h1 className="text-foreground text-3xl font-bold tracking-tight">{STEP_LABELS[step]}</h1>
        <p className="text-muted-foreground mt-1">{STEP_DESCRIPTIONS[step]}</p>
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
        <Button onClick={handleCancel} variant="ghost">
          Cancel
        </Button>

        <div className="flex gap-2">
          {step > STEP_UPLOAD && (
            <Button onClick={handleBack} variant="secondary">
              Go Back
            </Button>
          )}
          <Button className="min-h-11" disabled={isLoading} onClick={handleContinue}>
            {isLoading ? (
              <ArrowsClockwiseIcon className="h-4 w-4 animate-spin" />
            ) : step === STEP_REVIEW ? (
              'Start Import'
            ) : (
              'Continue'
            )}
          </Button>
        </div>
      </div>
    </main>
  );
}

export default ImportArticlesPage;
