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
import Tag from '@/components/ui/tag';

import type { TagGroup, Tag as TagType } from '@/types/tags';

type TagForm = {
  color: string;
  name: string;
};

type Props = {
  group: TagGroup | null;
  errors: { name?: string };
  form: TagForm;
  isSaving: boolean;
  onFormChange: (field: string, value: string) => void;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  open: boolean;
  tag: TagType | null;
};

export function TagFormDialog({
  group,
  errors,
  form,
  isSaving,
  onFormChange,
  onOpenChange,
  onSave,
  open,
  tag
}: Props) {
  const { t } = useTranslation('common');
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {tag ? t('tags.tagForm.editTitle') : t('tags.tagForm.addTitle', { group: group?.name })}
          </DialogTitle>
          <DialogDescription>
            {tag
              ? t('tags.tagForm.editDescription')
              : t('tags.tagForm.addDescription', { group: group?.name })}
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-4 py-4"
          id="tag-form"
          onSubmit={(e) => {
            e.preventDefault();
            onSave();
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="tag-name">
              {t('tags.tagForm.tagNameLabel')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="tag-name"
              onChange={(e) => onFormChange('name', e.target.value)}
              placeholder={t('tags.tagForm.tagNamePlaceholder')}
              value={form.name}
            />
            {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
          </div>

          <div className="bg-secondary/50 rounded-md border p-3">
            <p className="text-muted-foreground mb-2 text-xs">{t('tags.tagForm.previewLabel')}</p>
            <Tag
              tag={{
                color: form.color || group?.color || '',
                name: form.name || t('tags.tagForm.previewNameFallback')
              }}
            />
          </div>
        </form>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            {t('tags.tagForm.cancel')}
          </Button>
          <Button disabled={isSaving} onClick={onSave}>
            {isSaving && <SpinnerIcon className="mr-2 animate-spin" size={16} />}
            {tag ? t('tags.tagForm.update') : t('tags.tagForm.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
