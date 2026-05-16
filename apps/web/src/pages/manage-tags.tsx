import { MagnifyingGlassIcon, PlusIcon, TagIcon } from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import { DeleteConfirmationDialog } from '@/features/tags/components/delete-confirmation-dialog';
import { GroupTagsSheet } from '@/features/tags/components/group-tags-sheet';
import { MoveTagsDialog } from '@/features/tags/components/move-tags-dialog';
import { TagFormDialog } from '@/features/tags/components/tag-form-dialog';
import { TagGroupCard } from '@/features/tags/components/tag-group-card';
import { TagGroupFormDialog } from '@/features/tags/components/tag-group-form-dialog';
import { useTagsActions } from '@/features/tags/hooks/use-tags-actions';

import { cn } from '@/lib/utils';

function ManageTagsPage() {
  const {
    isLoading,
    isError,
    refetch,
    searchQuery,
    setSearchQuery,
    openCreateGroup,
    filteredGroups,
    openTagDialog,
    openDeleteConfirmation,
    openEditTagGroup,
    openTagsSheet,
    openMoveDialog,
    tagDialog,
    tagGroupDialog,
    deleteDialog,
    tagsSheet,
    moveDialog
  } = useTagsActions();

  return (
    <>
      <div className="flex flex-col space-y-6">
        <header className="mb-8 border-b pb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Manage Tags</h1>
          <p className="text-muted-foreground mt-1 text-sm">Organize your tags into groups</p>
        </header>

        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="relative flex w-full items-center">
            <MagnifyingGlassIcon className="text-muted-foreground pointer-events-none absolute left-3 size-4" />
            <Input
              className="pl-10"
              disabled={isLoading}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search groups..."
              type="text"
              value={searchQuery}
            />
          </div>
          <Button className="w-full sm:w-auto" disabled={isLoading} onClick={openCreateGroup}>
            <PlusIcon className="size-4" />
            New Group
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card className="animate-pulse" key={i} size="sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="bg-muted size-3 rounded-full" />
                    <div className="bg-muted h-5 w-24 rounded" />
                  </div>
                  <div className="bg-muted mt-1 h-4 w-full rounded" />
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {[1, 2, 3].map((j) => (
                      <div className="bg-muted h-6 w-16 rounded" key={j} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <p className="text-muted-foreground text-sm">Something went wrong loading your tags.</p>
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div
            className={cn(
              'flex flex-col items-center justify-center space-y-3',
              searchQuery ? 'py-12' : 'min-h-[50svh]'
            )}
          >
            <div
              className={cn(
                'rounded-full p-2',
                'bg-primary-50 dark:bg-primary-900/20',
                'border-primary-300 dark:border-primary-800 border'
              )}
            >
              <TagIcon className={cn('text-primary-600 dark:text-primary-400 size-6')} />
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <h4>{searchQuery ? 'No groups found' : 'No tag groups yet'}</h4>
              <p>
                {searchQuery
                  ? 'Try a different search term'
                  : 'Start by clicking the "New Group" button'}
              </p>
              {!searchQuery && (
                <p className="text-muted-foreground text-sm">
                  A good starting point is a &quot;General&quot; group
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {filteredGroups.map((group) => (
              <TagGroupCard
                group={group}
                key={group.id}
                onAddFirstTag={() => openTagDialog(group)}
                onDelete={() => openDeleteConfirmation('group', group, group.tags?.length)}
                onEdit={() => openEditTagGroup(group)}
                onManageTags={() => openTagsSheet(group)}
                onMoveAll={() => openMoveDialog({ fromGroupId: group.id, mode: 'group' })}
              />
            ))}
          </div>
        )}
      </div>

      <TagGroupFormDialog {...tagGroupDialog} />
      <TagFormDialog {...tagDialog} />
      <DeleteConfirmationDialog {...deleteDialog} />
      <GroupTagsSheet {...tagsSheet} />
      <MoveTagsDialog {...moveDialog} />
    </>
  );
}

export default ManageTagsPage;
