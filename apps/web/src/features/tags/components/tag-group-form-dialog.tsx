import { SpinnerIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { ColorPicker } from './color-picker';

type TagGroupForm = {
  color: string;
  description: string;
  name: string;
};

type TagGroupErrors = {
  description?: string;
  name?: string;
};

type Props = {
  errors: TagGroupErrors;
  form: TagGroupForm;
  isSaving: boolean;
  mode: 'create' | 'edit';
  onFormChange: (field: string, value: string) => void;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  open: boolean;
};

export function TagGroupFormDialog({
  errors,
  form,
  isSaving,
  mode,
  onFormChange,
  onOpenChange,
  onSave,
  open
}: Props) {
  const { t } = useTranslation('common');
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="size-5 rounded-full" style={{ backgroundColor: form.color }} />
            <DialogTitle>
              {mode === 'create' ? t('tags.groupForm.createTitle') : t('tags.groupForm.editTitle')}
            </DialogTitle>
          </div>
          <DialogDescription>
            {mode === 'create'
              ? t('tags.groupForm.createDescription')
              : t('tags.groupForm.editDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="group-name">
              {t('tags.groupForm.groupNameLabel')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="group-name"
              onChange={(e) => onFormChange('name', e.target.value)}
              placeholder={t('tags.groupForm.groupNamePlaceholder')}
              value={form.name}
            />
            {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
          </div>

          <div className="grid gap-2">
            <Label>
              {t('tags.groupForm.colorLabel')} <span className="text-destructive">*</span>
            </Label>
            <ColorPicker onChange={(color) => onFormChange('color', color)} value={form.color} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="group-description">
              {t('tags.groupForm.descriptionLabel')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="group-description"
              onChange={(e) => onFormChange('description', e.target.value)}
              placeholder={t('tags.groupForm.descriptionPlaceholder')}
              value={form.description}
            />
            {errors.description && <p className="text-destructive text-xs">{errors.description}</p>}
          </div>

          <div className="bg-secondary/50 rounded-md border p-3">
            <p className="text-muted-foreground mb-2 text-xs">{t('tags.groupForm.previewLabel')}</p>
            <div
              className="bg-card flex items-start gap-3 rounded-md border p-4"
              style={{ borderColor: form.color }}
            >
              <div
                className="size-5 shrink-0 rounded-full"
                style={{ backgroundColor: form.color }}
              />
              <div className="flex-1">
                <p className="font-semibold">
                  {form.name || t('tags.groupForm.previewNameFallback')}
                </p>
                <p className="text-muted-foreground text-sm">
                  {form.description || t('tags.groupForm.previewDescriptionFallback')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            {t('tags.groupForm.cancel')}
          </Button>
          <Button disabled={isSaving} onClick={onSave}>
            {isSaving && <SpinnerIcon className="mr-2 animate-spin" size={16} />}
            {mode === 'create' ? t('tags.groupForm.create') : t('tags.groupForm.update')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
