import {
  ArrowRightIcon,
  PencilSimpleIcon,
  PlusIcon,
  SpinnerIcon,
  TrashIcon
} from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import Tag from '@/components/ui/tag';

import { cn } from '@/lib/utils';

import type { TagGroup, Tag as TagType } from '@/types/tags';

import type { MoveTagsDialogState } from './move-tags-dialog';

type GroupTagsSheetProps = {
  bulkDeletePending: boolean;
  isDemo?: boolean;
  group: TagGroup | null;
  isSelectMode: boolean;
  onAddTag: () => void;
  onBulkDelete: () => void;
  onClose: () => void;
  onClearSelection: () => void;
  onDeleteTag: (tag: TagType) => void;
  onEditTag: (tag: TagType) => void;
  onMoveTag: (state: MoveTagsDialogState) => void;
  onSelectMode: (active: boolean) => void;
  onToggleSelect: (tagId: string) => void;
  selectedTagIds: Set<string>;
};

export function GroupTagsSheet({
  bulkDeletePending,
  isDemo = false,
  group,
  isSelectMode,
  onAddTag,
  onBulkDelete,
  onClearSelection,
  onClose,
  onDeleteTag,
  onEditTag,
  onMoveTag,
  onSelectMode,
  onToggleSelect,
  selectedTagIds
}: GroupTagsSheetProps) {
  const { t } = useTranslation('common');
  const tagCount = group?.tags?.length || 0;

  return (
    <Sheet
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      open={group !== null}
    >
      <SheetContent className="flex flex-col sm:max-w-md">
        <SheetHeader className="border-b pb-4">
          <div className="flex items-center gap-2">
            <div className="size-4 rounded-full" style={{ backgroundColor: group?.color }} />
            <SheetTitle>{group?.name}</SheetTitle>
          </div>
          <SheetDescription>{group?.description}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {t('tags.sheet.tagsCount', { count: tagCount })}
            </span>
            {!isDemo && (
              <div className="flex items-center gap-2">
                {tagCount > 0 && (
                  <Button
                    onClick={() => (isSelectMode ? onClearSelection() : onSelectMode(true))}
                    size="sm"
                    variant={isSelectMode ? 'secondary' : 'ghost'}
                  >
                    {isSelectMode ? t('tags.sheet.cancel') : t('tags.sheet.select')}
                  </Button>
                )}
                <Button onClick={onAddTag} size="sm" variant="outline">
                  <PlusIcon className="mr-1 size-3" />
                  {t('tags.sheet.addTag')}
                </Button>
              </div>
            )}
          </div>

          {isDemo && (
            <p className="text-muted-foreground text-sm">{t('demo.banner.description')}</p>
          )}

          {!isDemo && selectedTagIds.size > 0 && (
            <div className="bg-secondary flex items-center gap-2 rounded-md px-3 py-2">
              <span className="flex-1 text-sm font-medium">
                {t('tags.sheet.selectedCount', { count: selectedTagIds.size })}
              </span>
              <Button
                onClick={() =>
                  onMoveTag({
                    mode: 'bulk',
                    tagIds: Array.from(selectedTagIds)
                  })
                }
                size="sm"
                variant="outline"
              >
                <ArrowRightIcon className="mr-1 size-3" />
                {t('tags.sheet.moveTo')}
              </Button>
              <Button
                disabled={bulkDeletePending}
                onClick={onBulkDelete}
                size="sm"
                variant="destructive"
              >
                {bulkDeletePending ? (
                  <SpinnerIcon className="mr-1 animate-spin" size={12} />
                ) : (
                  <TrashIcon className="mr-1 size-3" />
                )}
                {t('tags.sheet.delete')}
              </Button>
            </div>
          )}

          {group?.tags && group.tags.length > 0 && (
            <div className="flex flex-col gap-2">
              {group.tags.map((tag) => (
                <div
                  className={cn(
                    'flex items-center gap-2',
                    'bg-secondary/50 rounded-md px-3 py-2',
                    isSelectMode && 'cursor-pointer'
                  )}
                  key={tag.id}
                  onClick={isSelectMode ? () => onToggleSelect(tag.id) : undefined}
                >
                  {isSelectMode && (
                    <input
                      checked={selectedTagIds.has(tag.id)}
                      className="accent-primary size-4 shrink-0 cursor-pointer"
                      onChange={() => onToggleSelect(tag.id)}
                      onClick={(e) => e.stopPropagation()}
                      type="checkbox"
                    />
                  )}
                  <div className="flex flex-1 items-center justify-between">
                    <Tag tag={{ color: group.color, name: tag.name }} />
                    {!isSelectMode && !isDemo && (
                      <div className="flex items-center gap-1">
                        <Button
                          aria-label={t('tags.sheet.moveAria', {
                            name: tag.name
                          })}
                          onClick={() => onMoveTag({ mode: 'single', tag })}
                          size="icon"
                          variant="ghost"
                        >
                          <ArrowRightIcon className="size-3" />
                        </Button>
                        <Button
                          aria-label={t('tags.sheet.editAria', {
                            name: tag.name
                          })}
                          onClick={() => onEditTag(tag)}
                          size="icon"
                          variant="ghost"
                        >
                          <PencilSimpleIcon className="size-3" />
                        </Button>
                        <Button
                          aria-label={t('tags.sheet.deleteAria', {
                            name: tag.name
                          })}
                          onClick={() => onDeleteTag(tag)}
                          size="icon"
                          variant="ghost"
                        >
                          <TrashIcon className="text-destructive size-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
