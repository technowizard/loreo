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

import type { TagGroup, Tag as TagType } from '@/types/tags';

type Props = {
  isDeleting: boolean;
  item: TagGroup | TagType | null;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  relatedCount?: number;
  type: 'group' | 'tag';
};

export function DeleteConfirmationDialog({
  isDeleting,
  item,
  onConfirm,
  onOpenChange,
  open,
  relatedCount,
  type
}: Props) {
  const itemName = type === 'group' ? (item as TagGroup)?.name : (item as TagType)?.name;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Delete {type === 'group' ? 'Group' : 'Tag'}: {itemName}
          </DialogTitle>
          <DialogDescription>
            {type === 'group' && (relatedCount || 0) > 0 ? (
              <>
                Are you sure you want to delete <strong>{itemName}</strong> and all {relatedCount}{' '}
                tags in this group?
              </>
            ) : (
              <>
                Are you sure you want to delete <strong>{itemName}</strong>?
              </>
            )}
            <br />
            <span className="text-destructive font-semibold">This action cannot be undone.</span>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Cancel
          </Button>
          <Button disabled={isDeleting} onClick={onConfirm} variant="destructive">
            {isDeleting && <SpinnerIcon className="mr-2 animate-spin" size={16} />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
