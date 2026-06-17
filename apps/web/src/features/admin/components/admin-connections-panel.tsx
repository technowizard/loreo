import {
  CheckCircleIcon,
  SpinnerIcon,
  WarningCircleIcon,
  XCircleIcon
} from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

import { type ConnectionCheck, useGetAdminConnections } from '@/features/admin/api/get-connections';

import { cn } from '@/lib/utils';

function StatusIcon({ status }: { status: ConnectionCheck['status'] }) {
  if (status === 'ok') {
    return <CheckCircleIcon className="text-success-600 size-5" weight="fill" />;
  }
  if (status === 'degraded') {
    return <WarningCircleIcon className="text-warning-600 size-5" weight="fill" />;
  }
  return <XCircleIcon className="text-danger-600 size-5" weight="fill" />;
}

function ConnectionRow({ check }: { check: ConnectionCheck }) {
  const { t } = useTranslation();
  const statusKey = `admin.connections.status.${check.status}`;

  return (
    <li className="border-border flex items-start justify-between gap-4 border-b p-4 last:border-b-0">
      <div className="flex min-w-0 items-start gap-3">
        <StatusIcon status={check.status} />
        <div className="min-w-0">
          <p className="text-foreground text-sm font-medium">{check.label}</p>
          {check.message && (
            <p className="text-muted-foreground mt-0.5 text-xs break-words">{check.message}</p>
          )}
        </div>
      </div>
      <div className="text-right">
        <p
          className={cn(
            'text-xs font-medium capitalize',
            check.status === 'ok' && 'text-success-600',
            check.status === 'degraded' && 'text-warning-600',
            check.status === 'down' && 'text-danger-600'
          )}
        >
          {t(statusKey)}
        </p>
        {typeof check.latencyMs === 'number' && (
          <p className="text-muted-foreground mt-0.5 text-xs tabular-nums">
            {t('admin.connections.latency', { ms: check.latencyMs })}
          </p>
        )}
      </div>
    </li>
  );
}

export function AdminConnectionsPanel() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch, isFetching } = useGetAdminConnections();

  return (
    <div className="flex flex-col space-y-6">
      <header className="mb-8 border-b pb-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {t('admin.connections.title')}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {t('admin.connections.description')}
            </p>
          </div>
          <Button disabled={isFetching} onClick={() => refetch()} size="sm" variant="outline">
            {isFetching ? <Spinner className="size-4" /> : null}
            {t('admin.connections.refresh')}
          </Button>
        </div>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="size-8" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <p className="text-muted-foreground text-sm">{t('admin.connections.error')}</p>
          <Button onClick={() => refetch()} variant="outline">
            {t('admin.page.tryAgain')}
          </Button>
        </div>
      ) : (
        <ul className="bg-card border-border overflow-hidden rounded-xl border">
          {data?.result.map((check) => (
            <ConnectionRow check={check} key={check.id} />
          ))}
        </ul>
      )}

      <p className="text-muted-foreground text-xs">
        <SpinnerIcon className="mr-1 inline size-3" />
        {t('admin.connections.autoRefresh')}
      </p>
    </div>
  );
}
