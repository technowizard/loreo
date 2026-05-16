import {
  ArrowSquareOutIcon,
  CheckCircleIcon,
  TrashIcon,
  UploadIcon,
  XCircleIcon
} from '@phosphor-icons/react';
import { useNavigate } from '@tanstack/react-router';

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

  const importSessionQuery = useImportSessions();
  const importSessions = importSessionQuery.data?.result?.items || [];

  const deleteImportSessionMutation = useDeleteImportSession();

  const handleDeleteImportSession = (sessionId: string) => {
    deleteImportSessionMutation.mutate(sessionId);
  };

  return (
    <SettingsSection description="Import articles and manage your reading data" title="Data">
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <UploadIcon className="text-muted-foreground size-5" />
            Import Articles
          </CardTitle>
          <CardDescription>
            Import articles from a CSV file to quickly build your reading list
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full sm:w-auto"
            onClick={() => navigate({ to: '/settings/import-articles' })}
          >
            <UploadIcon className="mr-2 size-4" />
            Import from CSV
          </Button>
        </CardContent>
      </Card>

      {importSessions.length > 0 && (
        <SettingsRow>
          <div className="space-y-3">
            <div className="text-sm font-medium">Recent Imports</div>
            <div className="space-y-3">
              {importSessions.map((session) => (
                <Card key={session.id}>
                  <CardHeader className="pb-3">
                    <div className="items-tart flex justify-between gap-4">
                      <div className="flex flex-col gap-1">
                        <CardTitle className="text-base">
                          {`Import from CSV · ${formatDate(session.createdAt, 'DD/MM/YYYY')}`}
                        </CardTitle>
                        <CardDescription>
                          Updated {`${formatDate(session.updatedAt, 'DD MMM YYYY, HH:mm')}`}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={session.extractionStatus === 'completed' ? 'success' : 'info'}
                      >
                        {session.extractionStatus === 'completed' ? 'Completed' : 'In Progress'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{session.extractionProgress}%</span>
                      </div>
                      <Progress className="h-2" value={session.extractionProgress} />
                      <div className="flex items-center gap-3 pt-1">
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                          <CheckCircleIcon className="size-3.5" weight="fill" />
                          {session.extractionCompleted.toLocaleString()} extracted
                        </span>
                        {session.extractionFailed > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs text-red-600">
                            <XCircleIcon className="size-3.5" weight="fill" />
                            {session.extractionFailed} failed
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
                      Delete
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
                      View Details
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
