import { SpinnerIcon } from '@phosphor-icons/react';
import { Trans, useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const itemName = type === 'group' ? (item as TagGroup)?.name : (item as TagType)?.name;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {type === 'group'
              ? t('tags.deleteDialog.titleGroup', { name: itemName })
              : t('tags.deleteDialog.titleTag', { name: itemName })}
          </DialogTitle>
          <DialogDescription>
            {type === 'group' && (relatedCount || 0) > 0 ? (
              <Trans
                count={relatedCount}
                i18nKey="tags.deleteDialog.confirmGroup"
                t={t}
                values={{ name: itemName }}
              >
                Are you sure you want to delete <strong>{itemName}</strong> and all {relatedCount}{' '}
                tags in this group?
              </Trans>
            ) : (
              <Trans i18nKey="tags.deleteDialog.confirmTag" t={t} values={{ name: itemName }}>
                Are you sure you want to delete <strong>{itemName}</strong>?
              </Trans>
            )}
            <br />
            <span className="text-destructive font-semibold">
              {t('tags.deleteDialog.cannotUndo')}
            </span>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            {t('tags.deleteDialog.cancel')}
          </Button>
          <Button disabled={isDeleting} onClick={onConfirm} variant="destructive">
            {isDeleting && <SpinnerIcon className="mr-2 animate-spin" size={16} />}
            {t('tags.deleteDialog.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
