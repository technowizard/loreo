import {
  ArrowsLeftRightIcon,
  DotsThreeIcon,
  PencilSimpleIcon,
  PlusIcon,
  TrashIcon
} from '@phosphor-icons/react';

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
  onAddFirstTag: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onManageTags: () => void;
  onMoveAll: () => void;
};

export function TagGroupCard({
  group,
  onAddFirstTag,
  onDelete,
  onEdit,
  onManageTags,
  onMoveAll
}: TagGroupCardProps) {
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
              {tagCount} {tagCount === 1 ? 'tag' : 'tags'}
            </span>
          )}
        </div>
        {group.description && (
          <CardDescription className="line-clamp-1">{group.description}</CardDescription>
        )}
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button aria-label={`Actions for ${group.name}`} size="icon" variant="ghost">
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
                Edit group
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
                  Move all tags
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
                Delete group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>

      <CardContent className="flex min-h-16 flex-col gap-2">
        {tagCount > 0 ? (
          <>
            <div className="flex flex-wrap items-center gap-1.5">
              {displayTags.map((tag) => (
                <Tag key={tag.id} tag={{ color: group.color, name: tag.name }} />
              ))}
              {remainingTags > 0 && (
                <span className="text-muted-foreground text-sm">+{remainingTags} more</span>
              )}
            </div>
            <button
              aria-label={`Manage tags for ${group.name}`}
              className="text-muted-foreground hover:text-foreground mt-auto text-sm transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onManageTags();
              }}
              type="button"
            >
              Manage tags &rarr;
            </button>
          </>
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
            Add First Tag
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
