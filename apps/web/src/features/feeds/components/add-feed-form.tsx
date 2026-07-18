import { InfoIcon, PlusIcon } from '@phosphor-icons/react';
import { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';

import {
  createFeedSubscriptionBodySchema,
  useCreateFeedSubscription
} from '@/features/feeds/api/create-feed-subscription';

import { cn } from '@/lib/utils';

import type { CreateFeedSubscriptionResult } from '@/types/feeds';

const getActionError = (error: unknown) => (error instanceof Error ? error.message : null);

type AddFeedFormProps = {
  onCancel?: () => void;
  onPendingChange?: (pending: boolean) => void;
  onSuccess?: (result: CreateFeedSubscriptionResult) => void;
  presentation?: 'dialog' | 'embedded';
};

export function AddFeedForm({
  onCancel,
  onPendingChange,
  onSuccess,
  presentation = 'embedded'
}: AddFeedFormProps = {}) {
  const { t } = useTranslation();
  const fieldId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [feedUrl, setFeedUrl] = useState('');
  const [autoSave, setAutoSave] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const createFeed = useCreateFeedSubscription({
    mutationConfig: {
      onMutate: () => {
        onPendingChange?.(true);
      },
      onSuccess: (response) => {
        onPendingChange?.(false);
        setValidationError(null);
        onSuccess?.(response.result);
      },
      onError: () => {
        onPendingChange?.(false);
        globalThis.setTimeout(() => inputRef.current?.focus(), 0);
      }
    }
  });

  const inputId = `${fieldId}-url`;
  const helpId = `${fieldId}-help`;
  const errorId = `${fieldId}-error`;
  const normalizedFeedUrl = feedUrl.trim();
  const serverError = getActionError(createFeed.error);
  const errorMessage =
    validationError ?? (serverError ? t('feeds.form.serverError', { message: serverError }) : null);

  const validateUrl = () => {
    if (normalizedFeedUrl.length === 0) {
      setValidationError(null);
      return true;
    }

    const parsed = createFeedSubscriptionBodySchema.safeParse({
      autoSave,
      feedUrl: normalizedFeedUrl
    });
    if (parsed.success) {
      setValidationError(null);
      return true;
    }

    setValidationError(t('feeds.form.invalidUrl'));
    return false;
  };

  return (
    <form
      aria-busy={createFeed.isPending}
      className={cn('min-h-0', presentation === 'dialog' && 'flex flex-1 flex-col overflow-hidden')}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();

        if (!validateUrl() || normalizedFeedUrl.length === 0) {
          setValidationError(t('feeds.form.invalidUrl'));
          inputRef.current?.focus();
          return;
        }

        createFeed.mutate({ autoSave, feedUrl: normalizedFeedUrl });
      }}
    >
      <div
        className={cn(
          'space-y-6',
          presentation === 'dialog' &&
            'min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-6'
        )}
      >
        <div className="space-y-2">
          <Label htmlFor={inputId}>{t('feeds.form.urlLabel')}</Label>
          <Input
            aria-describedby={`${helpId} ${errorMessage ? errorId : ''}`.trim()}
            aria-invalid={Boolean(errorMessage)}
            autoComplete="off"
            className="h-11"
            disabled={createFeed.isPending}
            id={inputId}
            inputMode="url"
            name="feedUrl"
            onBlur={validateUrl}
            onChange={(event) => {
              setFeedUrl(event.target.value);
              setValidationError(null);
              createFeed.reset();
            }}
            placeholder={t('feeds.form.urlPlaceholder')}
            ref={inputRef}
            spellCheck={false}
            type="url"
            value={feedUrl}
          />
          <p className="text-sm text-muted-foreground" id={helpId}>
            {t('feeds.form.help')}
          </p>
          {errorMessage ? (
            <p className="break-words text-sm text-destructive" id={errorId} role="alert">
              {errorMessage}
            </p>
          ) : null}
        </div>

        <div className="border-t border-border pt-6">
          <label className="flex min-h-14 cursor-pointer items-center justify-between gap-4 rounded-2xl border border-border bg-muted/20 px-4 py-3 focus-within:ring-2 focus-within:ring-ring">
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
                {t('feeds.form.autoSaveLabel')}
                <span className="text-xs font-normal text-muted-foreground">
                  {autoSave ? t('feeds.form.enabled') : t('feeds.form.disabled')}
                </span>
              </span>
              <span className="mt-1 block text-pretty text-xs leading-5 text-muted-foreground">
                {autoSave
                  ? t('feeds.form.autoSaveEnabledHelp')
                  : t('feeds.form.autoSaveDisabledHelp')}
              </span>
            </span>
            <Switch
              checked={autoSave}
              disabled={createFeed.isPending}
              name="feedAutoSave"
              onCheckedChange={setAutoSave}
            />
          </label>
        </div>

        <p aria-live="polite" className="sr-only" role="status">
          {createFeed.isPending ? t('feeds.form.checking') : ''}
        </p>

        <Alert role="status" variant="info">
          <InfoIcon aria-hidden="true" />
          <AlertTitle className="text-sm font-semibold text-info-700 dark:text-info-400">
            {t('feeds.form.nextTitle')}
          </AlertTitle>
          <AlertDescription className="gap-1 text-sm leading-6">
            <p>{autoSave ? t('feeds.form.nextAutoSave') : t('feeds.form.nextReview')}</p>
            <p>{t('feeds.form.nextManage')}</p>
          </AlertDescription>
        </Alert>
      </div>

      <div
        className={cn(
          'flex shrink-0 flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end',
          presentation === 'dialog'
            ? 'bg-popover px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-5'
            : 'bg-background'
        )}
      >
        {presentation === 'dialog' ? (
          <Button
            className="min-h-11"
            disabled={createFeed.isPending}
            onClick={onCancel}
            type="button"
            variant="outline"
          >
            {t('feeds.form.cancel')}
          </Button>
        ) : null}
        <Button
          className="min-h-11"
          disabled={normalizedFeedUrl.length === 0 || createFeed.isPending}
          type="submit"
        >
          {createFeed.isPending ? (
            <Spinner aria-hidden="true" role="presentation" />
          ) : (
            <PlusIcon aria-hidden="true" weight="bold" />
          )}
          {createFeed.isPending ? t('feeds.form.checking') : t('feeds.addFeed')}
        </Button>
      </div>
    </form>
  );
}
