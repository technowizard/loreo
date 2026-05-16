import { CheckIcon, PlusIcon, TagIcon, XIcon } from '@phosphor-icons/react';
import {
  forwardRef,
  type KeyboardEvent,
  type Ref,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { cn } from '@/lib/utils';

import type { Tag, TagGroup } from '@/types/tags';

interface GroupedTags {
  [groupId: string]: {
    group: TagGroup;
    tags: Tag[];
  };
}

export interface TagInputProps {
  availableTags?: Tag[];
  groups?: TagGroup[];
  className?: string;
  disabled?: boolean;
  maxTags?: number;
  onChange?: (value: Tag[]) => void;
  onCreateTag?: (data: { groupId: string; name: string }) => void;
  placeholder?: string;
  value?: Tag[];
}

function mergeRefs<T = unknown>(
  ...refs: Array<RefObject<T> | Ref<T> | undefined | null>
): React.RefCallback<T> {
  return (value) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') {
        ref(value);
      } else if (ref != null) {
        (ref as RefObject<T | null>).current = value;
      }
    });
  };
}

const groupTagsByGroup = (tags: Tag[], groups: TagGroup[] = []): GroupedTags => {
  const grouped: GroupedTags = {};

  groups.forEach((group) => {
    grouped[group.id] = {
      group,
      tags: []
    };
  });

  tags.forEach((tag) => {
    if (!grouped[tag.groupId]) {
      grouped[tag.groupId] = {
        group: {
          color: '#6B7280',
          createdAt: new Date().toISOString(),
          description: '',
          id: tag.groupId,
          name: tag.groupId.charAt(0).toUpperCase() + tag.groupId.slice(1),
          tags: []
        },
        tags: []
      };
    }

    grouped[tag.groupId]!.tags.push(tag);
  });

  Object.values(grouped).forEach((group) => {
    group.tags.sort((a, b) => a.name.localeCompare(b.name));
  });

  return grouped;
};

const filterGroupedTags = (groupedTags: GroupedTags, searchInput: string): GroupedTags => {
  const filtered: GroupedTags = {};
  const input = searchInput.toLowerCase().trim();

  if (!input) {
    return groupedTags;
  }

  Object.entries(groupedTags).forEach(([groupId, group]) => {
    const matchingTags = group.tags.filter((tag) => tag.name.toLowerCase().includes(input));

    filtered[groupId] = {
      ...group,
      tags: matchingTags
    };
  });

  return filtered;
};

const isTagSelected = (tagId: string, selectedTags: Tag[]): boolean => {
  return selectedTags.some((tag) => tag.id === tagId);
};

const TagInput = forwardRef<HTMLInputElement, TagInputProps>(
  (
    {
      availableTags = [],
      groups = [],
      className,
      disabled = false,
      maxTags = 5,
      onChange,
      onCreateTag,
      placeholder = 'Add tags...',
      value = []
    },
    ref
  ) => {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const groupedTags = useMemo(() => {
      return groupTagsByGroup(availableTags, groups);
    }, [availableTags, groups]);

    const filteredGroupedTags = useMemo(() => {
      return filterGroupedTags(groupedTags, inputValue);
    }, [groupedTags, inputValue]);

    const isMaxReached = maxTags ? value.length >= maxTags : false;

    const addTag = useCallback(
      (tag: Tag) => {
        if (isMaxReached) {
          return;
        }
        if (isTagSelected(tag.id, value)) {
          return;
        }

        onChange?.([...value, tag]);
        setInputValue('');
      },
      [value, isMaxReached, onChange]
    );

    const removeTag = useCallback(
      (tagId: string) => {
        onChange?.(value.filter((tag) => tag.id !== tagId));
      },
      [value, onChange]
    );

    const createAndSelectTag = useCallback(
      async (tagName: string, groupId: string) => {
        if (!tagName.trim()) {
          return;
        }
        if (isMaxReached) {
          return;
        }

        if (onCreateTag) {
          await onCreateTag({ groupId, name: tagName });
        }

        const newTag: Tag = {
          id: `temp-${Date.now()}`,
          groupId,
          name: tagName
        };

        onChange?.([...value, newTag]);
        setInputValue('');
      },
      [value, isMaxReached, onChange, onCreateTag]
    );

    const toggleTag = useCallback(
      (tag: Tag) => {
        if (isTagSelected(tag.id, value)) {
          removeTag(tag.id);
        } else {
          addTag(tag);
        }
      },
      [value, removeTag, addTag]
    );

    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLDivElement>) => {
        const input = inputValue.trim();

        if (e.key === 'Enter' && input && !isMaxReached) {
          e.preventDefault();

          const matchingTag = Object.values(filteredGroupedTags)
            .flatMap((group) => group.tags)
            .find((tag) => tag.name.toLowerCase() === input.toLowerCase());

          if (matchingTag) {
            if (!isTagSelected(matchingTag.id, value)) {
              addTag(matchingTag);
            }
          } else if (groups.length > 0) {
            const defaultGroup = groups[0]!;
            createAndSelectTag(input, defaultGroup.id);
          }
        }

        if (e.key === 'Escape') {
          setOpen(false);
          setInputValue('');
        }
      },
      [inputValue, isMaxReached, filteredGroupedTags, groups, value, addTag, createAndSelectTag]
    );

    useEffect(() => {
      if (open) {
        const timeoutId = setTimeout(() => {
          inputRef.current?.focus();
        }, 50);
        return () => clearTimeout(timeoutId);
      }
    }, [open]);

    const getTagGroupName = (tag: Tag): string => {
      const group = groups.find((c) => c.id === tag.groupId);
      return group?.name || tag.groupId;
    };

    const hasDuplicateTagNames = useMemo(() => {
      const nameCount = new Map<string, number>();
      value.forEach((tag) => {
        nameCount.set(tag.name, (nameCount.get(tag.name) || 0) + 1);
      });
      return Array.from(nameCount.values()).some((count) => count > 1);
    }, [value]);

    return (
      <Popover
        onOpenChange={(openState) => {
          setOpen(openState);
          if (!openState) {
            setInputValue('');
          }
        }}
        open={open}
      >
        <PopoverTrigger
          nativeButton={false}
          render={
            <div
              aria-disabled={disabled || isMaxReached}
              className={cn(
                'border-input sepia-theme:bg-input/30 dark:bg-input/30 ring-offset-background relative flex min-h-11 cursor-pointer flex-wrap items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors',
                'focus-within:ring-ring/50 focus-within:ring-2 focus-within:outline-none',
                disabled && 'cursor-not-allowed opacity-50',
                isMaxReached && 'border-orange-200 bg-orange-50',
                className
              )}
              onClick={() => {
                if (!disabled && !isMaxReached) {
                  setOpen(true);
                }
              }}
              role="combobox"
              tabIndex={0}
            >
              {value.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {value.map((tag) => (
                    <Badge
                      className="h-6 gap-1 rounded-md px-2 text-xs font-medium"
                      key={tag.id}
                      variant="outline"
                    >
                      {hasDuplicateTagNames ? `${tag.name} (${getTagGroupName(tag)})` : tag.name}
                      {!disabled && (
                        <Button
                          aria-label={`Remove ${tag.name}`}
                          className="hover:bg-muted h-3.5 w-3.5 rounded-full p-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTag(tag.id);
                          }}
                          size="icon"
                          type="button"
                          variant="ghost"
                        >
                          <XIcon className="size-3" weight="bold" />
                        </Button>
                      )}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}

              <div className="absolute top-1/2 right-4 flex shrink-0 -translate-y-1/2 opacity-60">
                <TagIcon className="size-3.5" />
              </div>
            </div>
          }
        />
        <PopoverContent align="start" className="w-(--anchor-width) rounded-md p-0" side="bottom">
          <Command onKeyDown={handleKeyDown} shouldFilter={false}>
            <CommandInput
              className="h-9"
              disabled={isMaxReached}
              onValueChange={setInputValue}
              placeholder="Search tags..."
              ref={mergeRefs(inputRef, ref)}
              value={inputValue}
            />
            <CommandList
              className="max-h-64 overflow-y-auto overscroll-contain"
              onTouchMove={(e) => {
                const target = e.currentTarget;
                const canScrollUp = target.scrollTop > 0;
                const canScrollDown = target.scrollTop < target.scrollHeight - target.clientHeight;

                if (canScrollUp || canScrollDown) {
                  e.stopPropagation();
                }
              }}
              onWheel={(e) => {
                const target = e.currentTarget;
                const canScrollUp = target.scrollTop > 0;
                const canScrollDown = target.scrollTop < target.scrollHeight - target.clientHeight;

                if (canScrollUp || canScrollDown) {
                  e.stopPropagation();
                }
              }}
              style={{
                overscrollBehavior: 'contain',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {!isMaxReached &&
                inputValue.trim() !== '' &&
                !Object.values(filteredGroupedTags)
                  .flatMap((group) => group.tags)
                  .some((tag) => tag.name.toLowerCase() === inputValue.trim().toLowerCase()) &&
                groups.length > 0 && (
                  <CommandGroup className="border-b border-dashed pb-2">
                    <div className="text-muted-foreground px-2 py-1.5 text-xs font-semibold">
                      Create &quot;{inputValue.trim()}&quot; in:
                    </div>
                    <div className="px-2 py-2">
                      <div className="flex flex-wrap gap-2">
                        {groups.map((group) => (
                          <button
                            className="hover:bg-primary hover:text-primary-foreground bg-background border-input focus:ring-ring inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm transition-all hover:shadow-md focus:ring-2 focus:ring-offset-2 focus:outline-none"
                            key={group.id}
                            onClick={() => createAndSelectTag(inputValue.trim(), group.id)}
                            type="button"
                          >
                            <PlusIcon className="h-3 w-3" />
                            <span>{group.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </CommandGroup>
                )}

              {!isMaxReached &&
                Object.entries(filteredGroupedTags).map(([groupId, group]) => (
                  <CommandGroup key={groupId}>
                    <div className="text-muted-foreground mb-2 flex items-center gap-2 border-b border-dashed px-2 py-2 text-xs font-semibold h-11">
                      <div
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: group.group.color }}
                      />
                      <span className="flex-1">{group.group.name}</span>
                      <span className="opacity-60">
                        {group.tags.length} tag
                        {group.tags.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {group.tags.length > 0 ? (
                      group.tags.map((tag) => (
                        <CommandItem
                          key={`${groupId}-${tag.id}`}
                          onSelect={() => toggleTag(tag)}
                          value={`${groupId}-${tag.id}-${tag.name}`}
                        >
                          <div className="flex w-full h-8 items-center gap-2">
                            <span className="flex-1">{tag.name}</span>
                            <CheckIcon
                              className={cn(
                                'h-4 w-4',
                                isTagSelected(tag.id, value) ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                          </div>
                        </CommandItem>
                      ))
                    ) : (
                      <div className="text-muted-foreground px-2 py-2 text-center text-xs italic">
                        {inputValue.trim() !== ''
                          ? `No tags matching "${inputValue.trim()}" in ${group.group.name}`
                          : `No tags in ${group.group.name}`}
                      </div>
                    )}
                  </CommandGroup>
                ))}

              {!isMaxReached && Object.keys(filteredGroupedTags).length === 0 && (
                <CommandEmpty>
                  {inputValue.trim() === '' ? 'No tags available' : 'No matching tags'}
                </CommandEmpty>
              )}

              {isMaxReached && (
                <div className="text-muted-foreground border-t border-dashed px-2 py-3 text-center text-xs">
                  Maximum number of tags reached ({maxTags})
                </div>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);

export { TagInput };
