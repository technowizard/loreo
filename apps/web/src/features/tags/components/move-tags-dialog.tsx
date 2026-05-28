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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import type { TagGroup, Tag as TagType } from '@/types/tags';

export type MoveTagsDialogState =
  | { mode: 'single'; tag: TagType }
  | { mode: 'bulk'; tagIds: string[] }
  | { fromGroupId: string; mode: 'group' };

type Props = {
  allGroups: TagGroup[];
  currentGroupId?: string;
  destinationGroupId: string;
  dialog: MoveTagsDialogState | null;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onDestinationChange: (id: string) => void;
};

export function MoveTagsDialog({
  allGroups,
  currentGroupId,
  destinationGroupId,
  dialog,
  isPending,
  onClose,
  onConfirm,
  onDestinationChange
}: Props) {
  const { t } = useTranslation();
  const title =
    dialog?.mode === 'single'
      ? t('tags.moveDialog.titleSingle', { name: dialog.tag.name })
      : dialog?.mode === 'bulk'
        ? t('tags.moveDialog.titleBulk', { count: dialog.tagIds.length })
        : t('tags.moveDialog.titleGroup');

  const availableGroups = allGroups.filter((c) => {
    if (dialog?.mode === 'group') return c.id !== dialog.fromGroupId;
    if (dialog?.mode === 'single') return c.id !== dialog.tag.groupId;
    return c.id !== currentGroupId;
  });

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      open={dialog !== null}
    >
      <DialogContent className="sm:max-w-100">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{t('tags.moveDialog.description')}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>{t('tags.moveDialog.destinationLabel')}</Label>
            <Select
              items={availableGroups.map((c) => ({
                label: c.name,
                value: c.id
              }))}
              onValueChange={(value) => onDestinationChange(value ?? '')}
              value={destinationGroupId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('tags.moveDialog.placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {availableGroups.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2">
                      <div className="size-3 rounded-full" style={{ backgroundColor: c.color }} />
                      {c.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            {t('tags.moveDialog.cancel')}
          </Button>
          <Button disabled={!destinationGroupId || isPending} onClick={onConfirm}>
            {isPending && <SpinnerIcon className="mr-2 animate-spin" size={16} />}
            {t('tags.moveDialog.move')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
