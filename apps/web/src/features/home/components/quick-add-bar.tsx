import { LinkIcon, PlusIcon } from '@phosphor-icons/react';
import { type SubmitEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { useCreateLink } from '@/features/articles/api/create-link';

import { useNotificationsStore } from '@/stores/notifications';

export function QuickAddBar() {
  const { t } = useTranslation('common');
  const notifySuccess = useNotificationsStore.useSuccess();

  const [url, setUrl] = useState('');

  const createLink = useCreateLink({
    mutationConfig: {
      onSuccess: () => {
        notifySuccess(t('home.quickAdd.success'));

        setUrl('');
      }
    }
  });

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    createLink.mutate({ url });
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-foreground text-xl font-bold">{t('home.quickAdd.title')}</h1>
      <form onSubmit={handleSubmit}>
        <div className="bg-card border-border flex w-full flex-col items-center gap-4 rounded-3xl border p-4 shadow sm:flex-row">
          <div className="relative flex w-full items-center">
            <LinkIcon className="text-muted-foreground pointer-events-none absolute left-3 size-4" />
            <Input
              className="pl-10"
              name="url"
              onChange={(event) => setUrl(event.target.value)}
              placeholder={t('home.quickAdd.placeholder')}
              required
              type="url"
              value={url}
            />
          </div>
          <Button className="w-full sm:w-30" type="submit">
            <PlusIcon className="size-4" />
            {t('home.quickAdd.save')}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default QuickAddBar;
