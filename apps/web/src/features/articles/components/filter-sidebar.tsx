import {
  ArrowsDownUpIcon,
  BookmarksIcon,
  CaretDownIcon,
  ClockIcon,
  FlagIcon,
  GearSixIcon,
  TagIcon
} from '@phosphor-icons/react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SidebarItem, SidebarSection, SidebarTitle } from '@/components/ui/sidebar';

import { filterConfig } from '@/features/articles/constants/filter-config';

import { cn } from '@/lib/utils';

import type { Tag, TagGroup } from '@/types/tags';

interface FilterProps {
  activeFilter: {
    groups: string;
    filter: string;
    priority: string;
    q: string;
    readLength: string;
    sort: string;
    tags: string;
  };
  groupedTags: Array<TagGroup & { tags: Tag[] }>;
  onFilterClick: (filterId: string, type: string) => void;
  onNavigateToTagManagement: () => void;
}

const Filter = memo(function Filter({
  activeFilter,
  groupedTags,
  onFilterClick,
  onNavigateToTagManagement
}: FilterProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4">
      <SidebarTitle className="inline-flex items-center gap-2">
        <BookmarksIcon weight="bold" />
        {t('articles.filters.articles')}
      </SidebarTitle>
      <SidebarSection>
        {filterConfig.status.map((filter) => (
          <SidebarItem
            active={activeFilter.filter === filter.id}
            key={filter.id}
            onClick={() => onFilterClick(filter.id, 'status')}
          >
            {filter.name}
          </SidebarItem>
        ))}
      </SidebarSection>

      <SidebarTitle className="inline-flex items-center gap-2">
        <FlagIcon weight="bold" />
        {t('articles.filters.priority')}
      </SidebarTitle>
      <SidebarSection>
        {filterConfig.priority.map((filter) => (
          <SidebarItem
            active={activeFilter.priority === filter.id}
            key={filter.id}
            onClick={() => onFilterClick(filter.id, 'priority')}
          >
            {filter.name}
          </SidebarItem>
        ))}
      </SidebarSection>

      <SidebarTitle className="inline-flex items-center gap-2">
        <ClockIcon weight="bold" />
        {t('articles.filters.readingLength')}
      </SidebarTitle>
      <SidebarSection>
        {filterConfig.readLength.map((filter) => (
          <SidebarItem
            active={activeFilter.readLength === filter.id}
            key={filter.id}
            onClick={() => onFilterClick(filter.id, 'readLength')}
          >
            {filter.name}
          </SidebarItem>
        ))}
      </SidebarSection>

      <SidebarTitle className="inline-flex items-center gap-2">
        <ArrowsDownUpIcon weight="bold" />
        {t('articles.filters.sortBy')}
      </SidebarTitle>
      <SidebarSection>
        {filterConfig.sort.map((filter) => (
          <SidebarItem
            active={activeFilter.sort === filter.id}
            key={filter.id}
            onClick={() => onFilterClick(filter.id, 'sort')}
          >
            {filter.name}
          </SidebarItem>
        ))}
      </SidebarSection>

      <div className="inline-flex items-center justify-between">
        <SidebarTitle className="inline-flex items-center gap-2">
          <TagIcon weight="bold" />
          {t('articles.filters.tags')}
        </SidebarTitle>
        <Button
          aria-label={t('articles.filters.manageTagsAria')}
          onClick={onNavigateToTagManagement}
          size="icon"
          variant="ghost"
        >
          <GearSixIcon weight="bold" />
        </Button>
      </div>
      {groupedTags.map((group) => {
        return (
          <Collapsible className="group/collapsible" defaultOpen key={group.id}>
            <CollapsibleTrigger
              nativeButton={false}
              render={
                <div className="flex items-center gap-2">
                  <SidebarItem
                    active={activeFilter.groups === group.id}
                    className="flex-1 justify-start"
                    onClick={(event) => {
                      event.stopPropagation();
                      onFilterClick(group.id, 'groups');
                    }}
                  >
                    <span className="font-medium">{group.name}</span>
                  </SidebarItem>

                  <Button aria-label={t('articles.filters.toggleGroupAria')} variant="ghost">
                    <CaretDownIcon
                      className="transition-transform group-data-[state=open]/collapsible:rotate-180"
                      size={16}
                    />
                  </Button>
                </div>
              }
            />

            <CollapsibleContent className="my-2 ml-4">
              <SidebarSection>
                {group.tags.map((tag) => (
                  <SidebarItem
                    active={activeFilter.groups === group.id && activeFilter.tags === tag.name}
                    key={tag.name}
                    onClick={() => {
                      onFilterClick(`${group.id},${tag.name}`, 'tags');
                    }}
                  >
                    {tag.name}
                  </SidebarItem>
                ))}
              </SidebarSection>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
});

interface FilterSidebarProps extends FilterProps {
  className?: string;
}

function FilterSidebar({
  activeFilter,
  className,
  groupedTags,
  onFilterClick,
  onNavigateToTagManagement
}: FilterSidebarProps) {
  return (
    <div
      className={cn(
        'no-scrollbar sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto',
        'sm:w-48 sm:min-w-48 md:w-56 md:min-w-56',
        className
      )}
    >
      <div className={cn('px-4 py-2')}>
        <Filter
          activeFilter={activeFilter}
          groupedTags={groupedTags}
          onFilterClick={onFilterClick}
          onNavigateToTagManagement={onNavigateToTagManagement}
        />
      </div>
    </div>
  );
}

export type { FilterProps };
export { FilterSidebar, Filter };
