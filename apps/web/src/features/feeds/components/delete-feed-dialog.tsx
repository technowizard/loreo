import { TrashIcon } from '@phosphor-icons/react';
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
import { Spinner } from '@/components/ui/spinner';

import type { FeedSubscription } from '@/types/feeds';

type DeleteFeedDialogProps = {
  errorMessage?: string | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  subscription: FeedSubscription;
};

export function DeleteFeedDialog({
  errorMessage,
  isDeleting,
  onConfirm,
  onOpenChange,
  open,
  subscription
}: DeleteFeedDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog onOpenChange={(nextOpen) => !isDeleting && onOpenChange(nextOpen)} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t('feeds.manager.delete.title', { title: subscription.title })}
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <span className="block">
              {t('feeds.manager.delete.description', { title: subscription.title })}
            </span>
            <span className="block font-medium text-foreground">
              {t('feeds.manager.delete.savedArticlesRemain')}
            </span>
            <span className="block font-semibold text-destructive">
              {t('feeds.manager.delete.cannotUndo')}
            </span>
          </DialogDescription>
        </DialogHeader>

        {errorMessage ? (
          <p className="text-sm text-destructive" role="alert">
            {t('feeds.manager.delete.error', { message: errorMessage })}
          </p>
        ) : null}

        <DialogFooter>
          <Button
            disabled={isDeleting}
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            {t('feeds.manager.delete.cancel')}
          </Button>
          <Button disabled={isDeleting} onClick={onConfirm} type="button" variant="destructive">
            {isDeleting ? (
              <Spinner aria-hidden="true" role="presentation" />
            ) : (
              <TrashIcon aria-hidden="true" />
            )}
            {isDeleting ? t('feeds.manager.delete.deleting') : t('feeds.manager.delete.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
