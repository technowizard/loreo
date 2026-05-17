export const STEP_UPLOAD = 0;
export const STEP_MAP_FIELDS = 1;
export const STEP_REVIEW = 2;

export type ImportWizardStep = typeof STEP_UPLOAD | typeof STEP_MAP_FIELDS | typeof STEP_REVIEW;

export const STEP_LABELS = ['Upload CSV', 'Map Fields', 'Final Review'] as const;

export const STEP_DESCRIPTIONS = [
  'Upload a CSV file to import your articles. Works with Pocket exports.',
  'Match the columns from your CSV file to the article fields. Required fields are marked with an asterisk (*).',
  'Please confirm the data summary below. Once you start the import, your articles will be added to your library.'
] as const;

export const STEP_ERROR_MESSAGES: Record<ImportWizardStep, string> = {
  [STEP_MAP_FIELDS]: 'Please complete field mapping before continuing',
  [STEP_REVIEW]: 'Please review your import before starting',
  [STEP_UPLOAD]: 'Please upload a CSV file before continuing'
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
