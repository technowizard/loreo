import { XIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

import type { CreateFeedSubscriptionResult } from '@/types/feeds';

import { AddFeedForm } from './add-feed-form';

type AddFeedDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function AddFeedDialog({ onOpenChange, open }: AddFeedDialogProps) {
  const { t } = useTranslation();
  const [isPending, setIsPending] = useState(false);

  const closeDialog = () => {
    if (isPending) return;
    onOpenChange(false);
  };

  const handleSuccess = (result: CreateFeedSubscriptionResult) => {
    setIsPending(false);
    onOpenChange(false);

    if (!result.createdSubscription) {
      toast.success(t('feeds.form.alreadyAddedTitle', { title: result.subscription.title }), {
        description: t('feeds.form.alreadyAddedDescription'),
        richColors: true
      });
      return;
    }

    toast.success(t('feeds.form.addedTitle', { title: result.subscription.title }), {
      description:
        result.autoSaved > 0
          ? t('feeds.form.addedAutoSaveDescription', { count: result.autoSaved })
          : t('feeds.form.addedReviewDescription', { count: result.staged }),
      richColors: true
    });
  };

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        if (!nextOpen && isPending) return;
        onOpenChange(nextOpen);
      }}
      open={open}
    >
      <DialogContent
        className="inset-0 top-0 left-0 flex h-dvh max-h-none w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden overscroll-contain rounded-none p-0 sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[min(760px,calc(100dvh-2rem))] sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-4xl"
        showCloseButton={false}
      >
        <DialogHeader className="shrink-0 border-b border-border px-4 pt-[max(1rem,env(safe-area-inset-top))] pr-16 pb-4 sm:px-6 sm:py-5 sm:pr-16">
          <DialogTitle className="text-balance text-xl font-semibold">
            {t('feeds.dialog.title')}
          </DialogTitle>
          <DialogDescription className="max-w-xl text-pretty">
            {t('feeds.dialog.description')}
          </DialogDescription>
        </DialogHeader>

        <Button
          aria-label={t('common.dialog.close')}
          className="absolute top-[max(1rem,env(safe-area-inset-top))] right-3 z-10 size-11 sm:top-4 sm:right-4"
          disabled={isPending}
          onClick={closeDialog}
          size="icon-lg"
          type="button"
          variant="ghost"
        >
          <XIcon aria-hidden="true" />
        </Button>

        <AddFeedForm
          onCancel={closeDialog}
          onPendingChange={setIsPending}
          onSuccess={handleSuccess}
          presentation="dialog"
        />
      </DialogContent>
    </Dialog>
  );
}
