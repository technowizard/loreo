export const STEP_UPLOAD = 0;
export const STEP_MAP_FIELDS = 1;
export const STEP_REVIEW = 2;

export type ImportWizardStep = typeof STEP_UPLOAD | typeof STEP_MAP_FIELDS | typeof STEP_REVIEW;

export const STEP_LABELS = [
  'import.wizard.stepUpload',
  'import.wizard.stepMap',
  'import.wizard.stepReview'
] as const;

export const STEP_DESCRIPTIONS = [
  'import.wizard.stepUploadDescription',
  'import.wizard.stepMapDescription',
  'import.wizard.stepReviewDescription'
] as const;

export const STEP_ERROR_MESSAGES: Record<ImportWizardStep, string> = {
  [STEP_UPLOAD]: 'import.wizard.errorUploadRequired',
  [STEP_MAP_FIELDS]: 'import.wizard.errorMapRequired',
  [STEP_REVIEW]: 'import.wizard.errorNoData'
};

export type ImportWizardCompletion = Record<ImportWizardStep, boolean>;

export function createInitialStepCompletion(): ImportWizardCompletion {
  return {
    [STEP_MAP_FIELDS]: false,
    [STEP_REVIEW]: false,
    [STEP_UPLOAD]: false
  };
}

export function canProceedFromStep(
  step: ImportWizardStep,
  stepComplete: ImportWizardCompletion
): boolean {
  return stepComplete[step];
}

export function getNextStep(step: ImportWizardStep): ImportWizardStep {
  return Math.min(step + 1, STEP_REVIEW) as ImportWizardStep;
}

export function getPreviousStep(step: ImportWizardStep): ImportWizardStep {
  return Math.max(step - 1, STEP_UPLOAD) as ImportWizardStep;
}

export function markStepComplete(
  stepComplete: ImportWizardCompletion,
  completedStep: ImportWizardStep
): ImportWizardCompletion {
  return { ...stepComplete, [completedStep]: true };
}
