import {
  ArrowsLeftRightIcon,
  DotsThreeIcon,
  PencilSimpleIcon,
  PlusIcon,
  TrashIcon
} from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import Tag from '@/components/ui/tag';

import type { TagGroup } from '@/types/tags';

type TagGroupCardProps = {
  group: TagGroup;
  isDemo?: boolean;
  onAddFirstTag: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onManageTags: () => void;
  onMoveAll: () => void;
};

export function TagGroupCard({
  group,
  isDemo = false,
  onAddFirstTag,
  onDelete,
  onEdit,
  onManageTags,
  onMoveAll
}: TagGroupCardProps) {
  const { t } = useTranslation();
  const tagCount = group.tags?.length || 0;
  const displayTags = group.tags?.slice(0, 3) || [];
  const remainingTags = Math.max(0, tagCount - displayTags.length);

  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="size-3 rounded-full" style={{ backgroundColor: group.color }} />
          <CardTitle className="text-base">{group.name}</CardTitle>
          {tagCount > 0 && (
            <span className="text-muted-foreground text-xs">
              {t('tags.groupCard.tagCount', { count: tagCount })}
            </span>
          )}
        </div>
        {group.description && (
          <CardDescription className="line-clamp-1">{group.description}</CardDescription>
        )}
        {!isDemo && (
          <CardAction>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    aria-label={t('tags.groupCard.actions.manageAria', {
                      name: group.name
                    })}
                    size="icon"
                    variant="ghost"
                  >
                    <DotsThreeIcon className="size-4" weight="bold" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="h-11 sm:h-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  <PencilSimpleIcon className="size-4" />
                  {t('tags.groupCard.actions.editGroup')}
                </DropdownMenuItem>
                {tagCount > 0 && (
                  <DropdownMenuItem
                    className="h-11 sm:h-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveAll();
                    }}
                  >
                    <ArrowsLeftRightIcon className="size-4" />
                    {t('tags.groupCard.actions.moveAllTags')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="h-11 sm:h-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  variant="destructive"
                >
                  <TrashIcon className="size-4" />
                  {t('tags.groupCard.actions.deleteGroup')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardAction>
        )}
      </CardHeader>

      <CardContent className="flex min-h-16 flex-col gap-2">
        {tagCount > 0 ? (
          <>
            <div className="flex flex-wrap items-center gap-1.5">
              {displayTags.map((tag) => (
                <Tag key={tag.id} tag={{ color: group.color, name: tag.name }} />
              ))}
              {remainingTags > 0 && (
                <span className="text-muted-foreground text-sm">
                  {t('tags.groupCard.moreCount', { count: remainingTags })}
                </span>
              )}
            </div>
            <button
              aria-label={t('tags.groupCard.actions.manageTagsAria', {
                name: group.name
              })}
              className="text-muted-foreground hover:text-foreground mt-auto text-sm transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onManageTags();
              }}
              type="button"
            >
              {t('tags.groupCard.manageTags')}
            </button>
          </>
        ) : isDemo ? (
          <p className="text-muted-foreground text-sm">{t('demo.banner.description')}</p>
        ) : (
          <Button
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              onAddFirstTag();
            }}
            variant="outline"
          >
            <PlusIcon className="mr-2 size-4" />
            {t('tags.groupCard.addFirstTag')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
