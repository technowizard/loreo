import {
  ArrowSquareOutIcon,
  CheckCircleIcon,
  TrashIcon,
  UploadIcon,
  XCircleIcon
} from '@phosphor-icons/react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

import { useDeleteImportSession } from '@/features/import-articles/api/delete-import-session';
import { useImportSessions } from '@/features/import-articles/api/get-import-sessions';

import { formatDate } from '@/lib/date';

import { SettingsRow, SettingsSection } from './settings-section';

export function DataSection() {
  const navigate = useNavigate();
  const { t } = useTranslation('common');

  const importSessionQuery = useImportSessions();
  const importSessions = importSessionQuery.data?.result?.items || [];

  const deleteImportSessionMutation = useDeleteImportSession();

  const handleDeleteImportSession = (sessionId: string) => {
    deleteImportSessionMutation.mutate(sessionId);
  };

  return (
    <SettingsSection description={t('settings.data.description')} title={t('settings.data.title')}>
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <UploadIcon className="text-muted-foreground size-5" />
            {t('settings.data.importCard.cardTitle')}
          </CardTitle>
          <CardDescription>{t('settings.data.importCard.cardDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full sm:w-auto"
            onClick={() => navigate({ to: '/settings/import-articles' })}
          >
            <UploadIcon className="mr-2 size-4" />
            {t('settings.data.importCard.button')}
          </Button>
        </CardContent>
      </Card>

      {importSessions.length > 0 && (
        <SettingsRow>
          <div className="space-y-3">
            <div className="text-sm font-medium">{t('settings.data.recentImports')}</div>
            <div className="space-y-3">
              {importSessions.map((session) => (
                <Card key={session.id}>
                  <CardHeader className="pb-3">
                    <div className="items-tart flex justify-between gap-4">
                      <div className="flex flex-col gap-1">
                        <CardTitle className="text-base">
                          {t('settings.data.importCard.title', {
                            date: formatDate(session.createdAt, 'DD/MM/YYYY')
                          })}
                        </CardTitle>
                        <CardDescription>
                          {t('settings.data.updated', {
                            date: formatDate(session.updatedAt, 'DD MMM YYYY, HH:mm')
                          })}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={session.extractionStatus === 'completed' ? 'success' : 'info'}
                      >
                        {session.extractionStatus === 'completed'
                          ? t('settings.data.statusCompleted')
                          : t('settings.data.statusInProgress')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t('settings.data.progress')}</span>
                        <span className="font-medium">{session.extractionProgress}%</span>
                      </div>
                      <Progress className="h-2" value={session.extractionProgress} />
                      <div className="flex items-center gap-3 pt-1">
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                          <CheckCircleIcon className="size-3.5" weight="fill" />
                          {t('settings.data.extracted', {
                            count: session.extractionCompleted
                          })}
                        </span>
                        {session.extractionFailed > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs text-red-600">
                            <XCircleIcon className="size-3.5" weight="fill" />
                            {t('settings.data.failed', {
                              count: session.extractionFailed
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button
                      onClick={() => handleDeleteImportSession(session.id)}
                      size="sm"
                      variant="ghost"
                    >
                      <TrashIcon className="mr-1.5 size-4" />
                      {t('settings.data.delete')}
                    </Button>
                    <Button
                      onClick={() =>
                        navigate({
                          params: { sessionId: session.id },
                          to: '/settings/import-articles/$sessionId'
                        })
                      }
                      size="sm"
                    >
                      <ArrowSquareOutIcon className="mr-1.5 size-4" />
                      {t('settings.data.viewDetails')}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </SettingsRow>
      )}
    </SettingsSection>
  );
}
