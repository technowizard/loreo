import {
  FunnelIcon,
  ListBulletsIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  SquaresFourIcon,
  XIcon
} from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { Sidebar } from '@/components/ui/sidebar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Filter, type FilterProps } from '../components/filter-sidebar';

type CurrentFilterInfo = {
  description?: string;
  title?: string;
};

type Props = {
  articleCardView: 'grid' | 'list';
  currentFilterInfo: CurrentFilterInfo | undefined;
  filterContentProps: FilterProps;
  isMobile: boolean;
  isTablet: boolean;
  onAddArticle: () => void;
  onArticleCardViewChange: (view: 'grid' | 'list') => void;
  onSearchChange: (query: string) => void;
  onSearchClear: () => void;
  openFilterModal: boolean;
  searchQuery: string;
  setOpenFilterModal: (open: boolean) => void;
};

export function ArticlesToolbar({
  articleCardView,
  currentFilterInfo,
  filterContentProps,
  isMobile,
  isTablet,
  onAddArticle,
  onArticleCardViewChange,
  onSearchChange,
  onSearchClear,
  openFilterModal,
  searchQuery,
  setOpenFilterModal
}: Props) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onSearchClear();
  };

  return (
    <div className="bg-background sticky top-16 z-40 flex w-full flex-col justify-between space-y-4 pb-4 md:flex-row md:items-center">
      <div className="flex w-full flex-col gap-4">
        <div className="flex w-full justify-between">
          <div className="flex flex-col">
            <h1 className="text-foreground">{currentFilterInfo?.title}</h1>
            <p className="text-muted-foreground mt-1">{currentFilterInfo?.description}</p>
          </div>
        </div>

        <div className="flex w-full items-center gap-2">
          <div className="relative flex w-full items-center">
            <MagnifyingGlassIcon className="text-muted-foreground pointer-events-none absolute left-3 size-4" />
            <Input
              aria-label="Search articles"
              className="bg-white pr-10 pl-10"
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search articles..."
              type="text"
              value={searchQuery}
            />
            {searchQuery && (
              <button
                aria-label="Clear search"
                className="absolute right-3"
                onClick={onSearchClear}
                type="button"
              >
                <XIcon className="text-muted-foreground size-4" />
              </button>
            )}
          </div>

          {(isMobile || isTablet) && (
            <Sheet onOpenChange={setOpenFilterModal} open={openFilterModal}>
              <SheetTrigger
                render={
                  <Button size="icon" variant="outline">
                    <FunnelIcon className="size-5" />
                  </Button>
                }
              />
              <SheetContent className="overflow-scroll overscroll-contain" side="left">
                <SheetHeader>
                  <SheetTitle>Filter Articles</SheetTitle>
                  <SheetDescription>Choose a filter to organize your articles</SheetDescription>
                </SheetHeader>
                <Sidebar className="flex flex-col gap-y-4 px-4">
                  <Filter {...filterContentProps} />
                </Sidebar>
              </SheetContent>
            </Sheet>
          )}

          <Tabs
            onValueChange={(value) => onArticleCardViewChange(value as 'grid' | 'list')}
            value={articleCardView}
          >
            <TabsList>
              <TabsTrigger value="grid">
                <SquaresFourIcon />
              </TabsTrigger>
              <TabsTrigger value="list">
                <ListBulletsIcon />
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            aria-label="Save article"
            className="group hidden sm:flex"
            onClick={onAddArticle}
            size="lg"
          >
            <PlusIcon className="size-4 transition-transform duration-200 motion-safe:group-hover:rotate-90" />
            <span>Save article</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col space-y-4 sm:hidden">
        <Button aria-label="Save article" className="group" onClick={onAddArticle} size="lg">
          <PlusIcon className="size-4 transition-transform duration-200 motion-safe:group-hover:rotate-90" />
          <span>Save article</span>
        </Button>
      </div>
    </div>
  );
}
