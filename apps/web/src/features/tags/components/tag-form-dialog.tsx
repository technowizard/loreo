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
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tag ? 'Edit Tag' : `Add Tag to ${group?.name}`}</DialogTitle>
          <DialogDescription>
            {tag ? 'Update tag details' : `Create a new tag for the ${group?.name} group`}
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
              Tag Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="tag-name"
              onChange={(e) => onFormChange('name', e.target.value)}
              placeholder="Enter tag name"
              value={form.name}
            />
            {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
          </div>

          <div className="bg-secondary/50 rounded-md border p-3">
            <p className="text-muted-foreground mb-2 text-xs">Preview:</p>
            <Tag
              tag={{
                color: form.color || group?.color || '',
                name: form.name || 'Tag name'
              }}
            />
          </div>
        </form>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Cancel
          </Button>
          <Button disabled={isSaving} onClick={onSave}>
            {isSaving && <SpinnerIcon className="mr-2 animate-spin" size={16} />}
            {tag ? 'Update' : 'Create'} Tag
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
