import { SpinnerIcon } from '@phosphor-icons/react';

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
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="size-5 rounded-full" style={{ backgroundColor: form.color }} />
            <DialogTitle>{mode === 'create' ? 'New group' : 'Edit group'}</DialogTitle>
          </div>
          <DialogDescription>
            {mode === 'create'
              ? 'Create a new group to organize your tags'
              : 'Update group details'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="group-name">
              Group Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="group-name"
              onChange={(e) => onFormChange('name', e.target.value)}
              placeholder="e.g., Work, Personal, Learning"
              value={form.name}
            />
            {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
          </div>

          <div className="grid gap-2">
            <Label>
              Color <span className="text-destructive">*</span>
            </Label>
            <ColorPicker onChange={(color) => onFormChange('color', color)} value={form.color} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="group-description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Input
              id="group-description"
              onChange={(e) => onFormChange('description', e.target.value)}
              placeholder="What is this group for?"
              value={form.description}
            />
            {errors.description && <p className="text-destructive text-xs">{errors.description}</p>}
          </div>

          <div className="bg-secondary/50 rounded-md border p-3">
            <p className="text-muted-foreground mb-2 text-xs">Preview:</p>
            <div
              className="bg-card flex items-start gap-3 rounded-md border p-4"
              style={{ borderColor: form.color }}
            >
              <div
                className="size-5 shrink-0 rounded-full"
                style={{ backgroundColor: form.color }}
              />
              <div className="flex-1">
                <p className="font-semibold">{form.name || 'Group name'}</p>
                <p className="text-muted-foreground text-sm">
                  {form.description || 'Group description'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Cancel
          </Button>
          <Button disabled={isSaving} onClick={onSave}>
            {isSaving && <SpinnerIcon className="mr-2 animate-spin" size={16} />}
            {mode === 'create' ? 'Create' : 'Update'} group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
