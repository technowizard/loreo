import {
  ArchiveIcon,
  ArrowLeftIcon,
  ArrowSquareOutIcon,
  DotsThreeIcon,
  HighlighterIcon,
  MinusIcon,
  MonitorIcon,
  MoonIcon,
  PlusIcon,
  StarIcon,
  SunIcon,
  TagIcon,
  TextAaIcon,
  TextAlignJustifyIcon,
  TextAlignLeftIcon,
  TrashIcon
} from '@phosphor-icons/react';
import { useNavigate } from '@tanstack/react-router';
import { useTheme } from 'next-themes';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useGetLink } from '@/features/articles/api/get-link';
import EditTagsDialog from '@/features/articles/components/edit-tags-dialog';
import { useReaderActions } from '@/features/reader/hooks/use-reader-actions';
import { SelectionCard } from '@/features/settings/components/selection-card';
import {
  FONT_SIZES,
  getFontsByCategory,
  LINE_SPACING
} from '@/features/settings/constants/theme-config';

import { useMediaQuery } from '@/hooks/use-media-query';
import { useThemeConfig } from '@/hooks/use-theme-config';

import { env } from '@/lib/env';
import { cn, openOriginalLink } from '@/lib/utils';

import { Button } from '../ui/button';
import { Drawer, DrawerContent, DrawerTrigger } from '../ui/drawer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface ReaderNavProps {
  linkId: string;
  onOpenHighlights: () => void;
}

const fontSizeLocaleKeys = ['small', 'medium', 'large', 'extraLarge', 'huge'] as const;
const lineSpacingLocaleKeys = ['compact', 'normal', 'relaxed', 'loose'] as const;

const fontCategoryLocaleKeys = {
  legible: 'legible',
  'sans-serif': 'sansSerif',
  serif: 'serif'
} as const;

const fontFamilyLocaleKeys = {
  alegreya: 'alegreya',
  atkinson: 'atkinson',
  'comic-neue': 'comicNeue',
  default: 'default',
  dyslexic: 'dyslexic',
  inter: 'inter',
  'lexend-deca': 'lexendDeca',
  lora: 'lora',
  literata: 'literata',
  'plex-sans': 'plexSans',
  'public-sans': 'publicSans',
  spectral: 'spectral'
} as const;

function getFontFamilyLocaleKey(value: string) {
  if (value in fontFamilyLocaleKeys) {
    return fontFamilyLocaleKeys[value as keyof typeof fontFamilyLocaleKeys];
  }

  return fontFamilyLocaleKeys.default;
}

function ReaderNav({ linkId, onOpenHighlights }: ReaderNavProps) {
  const navigate = useNavigate();
  const { t } = useTranslation('common');

  const linkQuery = useGetLink({ linkId });

  const { setTheme, theme } = useTheme();
  const {
    decreaseFontSize,
    decreaseLineSpacing,
    fontFamily,
    fontSize,
    increaseFontSize,
    increaseLineSpacing,
    lineSpacing,
    textAlignment,
    toggleFontFamily,
    toggleTextAlignment,
    toggleTheme
  } = useThemeConfig();
  const { isMobile } = useMediaQuery();

  const actions = useReaderActions(linkId, {
    disabled: env.isDemo,
    formatUpdateMessage: (body) => {
      if (body.readingProgress !== undefined || body.timeSpentReading !== undefined) return false;
      if (body.isFavorite !== undefined)
        return body.isFavorite
          ? t('reader.actions.markedAsFavorite')
          : t('reader.actions.removedFromFavorites');
      if (body.isArchived !== undefined && body.isRead !== undefined)
        return t('reader.actions.archivedAndMarkedRead');
      return t('reader.actions.linkUpdated');
    }
  });

  const [shouldShowNavbar, setShouldShowNavbar] = useState(true);
  const [isEditTagsOpen, setIsEditTagsOpen] = useState(false);
  const lastScrollY = useRef(0);

  const article = linkQuery.data?.result;

  const handleFavoriteArticle = () => {
    if (!article) {
      return;
    }

    actions.updateLink(article.id, {
      isFavorite: !article.isFavorite
    });
  };

  const handleArchiveArticle = () => {
    if (!article) {
      return;
    }

    actions.updateLink(linkId, {
      isArchived: !article.isArchived
    });
  };

  const handleDeleteArticle = () => {
    actions.deleteLink(linkId);
  };

  const currentFonts = getFontsByCategory(fontFamily.style);
  const fontSizeLabelKey = fontSizeLocaleKeys[FONT_SIZES.indexOf(fontSize)] ?? 'medium';
  const lineSpacingLabelKey = lineSpacingLocaleKeys[LINE_SPACING.indexOf(lineSpacing)] ?? 'normal';

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 10) {
        setShouldShowNavbar(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      if (currentScrollY < lastScrollY.current) {
        setShouldShowNavbar(true);
      } else if (currentScrollY > lastScrollY.current) {
        setShouldShowNavbar(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      <header
        className={`sepia-theme:bg-background/80 sticky top-0 z-50 border-b border-zinc-300 bg-zinc-50/80 backdrop-blur-md transition-transform dark:bg-zinc-950/80 ${
          shouldShowNavbar ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="mx-auto max-w-[80ch] px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 w-full items-center justify-between">
            <Button
              aria-label={t('reader.nav.backToArticles')}
              onClick={() => navigate({ to: '/articles' })}
              variant="ghost"
            >
              <ArrowLeftIcon size={24} weight="bold" />
              <span className="hidden sm:block">{t('reader.nav.back')}</span>
            </Button>

            <div className="flex items-center space-x-2">
              <Button
                aria-label={t('reader.nav.openInNewTab')}
                onClick={() => openOriginalLink(article!.url)}
                size="icon"
                variant="ghost"
              >
                <ArrowSquareOutIcon size={24} weight="bold" />
              </Button>

              <Button
                aria-label={t('reader.nav.viewHighlights')}
                onClick={onOpenHighlights}
                size="icon"
                variant="ghost"
              >
                <HighlighterIcon size={24} weight="bold" />
              </Button>

              <Drawer direction={isMobile ? 'bottom' : 'right'}>
                <DrawerTrigger asChild>
                  <Button aria-label={t('reader.nav.openSettings')} size="icon" variant="ghost">
                    <TextAaIcon size={24} weight="bold" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent
                  overlay={false}
                  className="h-[50%] sm:h-full before:inset-0 sm:before:inset-2 before:rounded-b-none sm:before:rounded-b-4xl"
                >
                  <div className="space-y-4 overflow-y-auto p-4">
                    <div className="text-center text-lg font-semibold">
                      {t('reader.settings.title')}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex font-medium">{t('reader.settings.theme')}</div>
                      <div className="flex items-center justify-between gap-2">
                        <button
                          aria-label={t('reader.settings.setSystemTheme')}
                          aria-pressed={theme === 'system'}
                          className={cn(
                            'focus-visible:ring-ring hover:ring-foreground flex size-11 items-center justify-center rounded-full border transition-all hover:ring-1 focus-visible:ring-2 focus-visible:outline-none',
                            theme === 'system' && 'ring-foreground border-0 ring-1'
                          )}
                          onClick={() => {
                            setTheme('system');
                            toggleTheme('system');
                          }}
                        >
                          <MonitorIcon weight="bold" />
                        </button>
                        <button
                          aria-label={t('reader.settings.setLightTheme')}
                          aria-pressed={theme === 'light'}
                          className={cn(
                            'reader-light focus-visible:ring-ring hover:ring-foreground flex size-11 items-center justify-center rounded-full border transition-all hover:ring-1 focus-visible:ring-2 focus-visible:outline-none',
                            theme === 'light' && 'ring-foreground border-0 ring-1'
                          )}
                          onClick={() => {
                            setTheme('light');
                            toggleTheme('light');
                          }}
                        >
                          <SunIcon weight="bold" />
                        </button>
                        <button
                          aria-label={t('reader.settings.setSepiaTheme')}
                          aria-pressed={theme === 'sepia-theme'}
                          className={cn(
                            'reader-sepia focus-visible:ring-ring hover:ring-foreground flex size-11 items-center justify-center rounded-full border transition-all hover:ring-1 focus-visible:ring-2 focus-visible:outline-none',
                            theme === 'sepia-theme' && 'ring-foreground border-0 ring-1'
                          )}
                          onClick={() => {
                            setTheme('sepia-theme');
                            toggleTheme('sepia-theme');
                          }}
                        >
                          <SunIcon weight="bold" />
                        </button>
                        <button
                          aria-label={t('reader.settings.setDarkTheme')}
                          aria-pressed={theme === 'dark'}
                          className={cn(
                            'reader-dark focus-visible:ring-ring hover:ring-foreground flex size-11 items-center justify-center rounded-full border transition-all hover:ring-1 focus-visible:ring-2 focus-visible:outline-none',
                            theme === 'dark' && 'ring-foreground border-0 ring-1'
                          )}
                          onClick={() => {
                            setTheme('dark');
                            toggleTheme('dark');
                          }}
                        >
                          <MoonIcon weight="bold" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex font-medium">{t('reader.settings.fontSize')}</div>
                        <div className="flex items-center justify-between gap-4">
                          <Button
                            aria-label={t('reader.settings.decreaseFontSize')}
                            className="size-11"
                            disabled={fontSize === FONT_SIZES[0]}
                            onClick={decreaseFontSize}
                            size="icon"
                            variant="secondary"
                          >
                            <MinusIcon size={16} weight="bold" />
                          </Button>
                          <span className="w-12 text-center text-sm font-medium tabular-nums">
                            {t(`reader.fontSizes.${fontSizeLabelKey}`)}
                          </span>
                          <Button
                            aria-label={t('reader.settings.increaseFontSize')}
                            className="size-11"
                            disabled={fontSize === FONT_SIZES.at(-1)}
                            onClick={increaseFontSize}
                            size="icon"
                            variant="secondary"
                          >
                            <PlusIcon size={16} weight="bold" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex font-medium">{t('reader.settings.lineSpacing')}</div>
                        <div className="flex items-center justify-between gap-4">
                          <Button
                            aria-label={t('reader.settings.decreaseLineSpacing')}
                            className="size-11"
                            disabled={lineSpacing === LINE_SPACING[0]}
                            onClick={decreaseLineSpacing}
                            size="icon"
                            variant="secondary"
                          >
                            <MinusIcon weight="bold" />
                          </Button>
                          <span className="w-12 text-center text-sm font-medium tabular-nums">
                            {t(`reader.lineSpacing.${lineSpacingLabelKey}`)}
                          </span>
                          <Button
                            aria-label={t('reader.settings.increaseLineSpacing')}
                            className="size-11"
                            disabled={lineSpacing === LINE_SPACING.at(-1)}
                            onClick={increaseLineSpacing}
                            size="icon"
                            variant="secondary"
                          >
                            <PlusIcon weight="bold" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex w-full items-center gap-2">
                        <div className="flex w-1/2 font-medium">
                          {t('reader.settings.textAlignment')}
                        </div>
                        <div className="flex w-1/2 gap-2">
                          <button
                            aria-label={t('reader.settings.defaultTextAlignment')}
                            aria-pressed={textAlignment === 'default'}
                            className={cn(
                              'focus-visible:ring-ring hover:bg-muted/30 flex h-11 w-full cursor-pointer items-center justify-center rounded-md border transition-colors focus-visible:ring-2 focus-visible:outline-none',
                              textAlignment === 'default'
                                ? 'border-primary/30 bg-primary/10 text-primary'
                                : 'border-border bg-card text-muted-foreground'
                            )}
                            onClick={() => toggleTextAlignment('default')}
                          >
                            <TextAlignLeftIcon size={20} />
                          </button>
                          <button
                            aria-label={t('reader.settings.justifiedTextAlignment')}
                            aria-pressed={textAlignment === 'justify'}
                            className={cn(
                              'focus-visible:ring-ring hover:bg-muted/30 flex h-11 w-full cursor-pointer items-center justify-center rounded-md border transition-colors focus-visible:ring-2 focus-visible:outline-none',
                              textAlignment === 'justify'
                                ? 'border-primary/30 bg-primary/10 text-primary'
                                : 'border-border bg-card text-muted-foreground'
                            )}
                            onClick={() => toggleTextAlignment('justify')}
                          >
                            <TextAlignJustifyIcon size={20} />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="font-medium">{t('reader.settings.fontFamily')}</div>
                        <Tabs
                          className="w-full"
                          onValueChange={(value) => {
                            toggleFontFamily({
                              ...fontFamily,
                              style: value
                            });
                          }}
                          value={fontFamily.style}
                        >
                          <TabsList className="w-full">
                            {(['sans-serif', 'serif', 'legible'] as const).map((category) => (
                              <TabsTrigger className="capitalize" key={category} value={category}>
                                {t(`reader.fontCategories.${fontCategoryLocaleKeys[category]}`)}
                              </TabsTrigger>
                            ))}
                          </TabsList>
                          {currentFonts.map((font) => (
                            <TabsContent key={font.value} value={font.style}>
                              <SelectionCard
                                checked={fontFamily.name === font.value}
                                description={t(
                                  `reader.fontFamilies.${getFontFamilyLocaleKey(font.value)}.description`
                                )}
                                icon={
                                  <span className={cn('text-xl font-bold', `font-${font.value}`)}>
                                    Aa
                                  </span>
                                }
                                key={font.value}
                                onChange={() => {
                                  toggleFontFamily({
                                    label: font.value,
                                    name: font.value,
                                    style: font.style
                                  });
                                }}
                                title={t(
                                  `reader.fontFamilies.${getFontFamilyLocaleKey(font.value)}.label`
                                )}
                                value={font.value}
                              />
                            </TabsContent>
                          ))}
                        </Tabs>
                      </div>
                    </div>
                  </div>
                </DrawerContent>
              </Drawer>

              {!env.isDemo && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        aria-label={t('reader.settings.moreOptions')}
                        className="mr-0"
                        size="icon"
                        variant="ghost"
                      >
                        <DotsThreeIcon className="size-4" size={24} weight="bold" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end" className="divide-y w-36">
                    <DropdownMenuItem
                      className="focus:bg-accent h-11 rounded-none"
                      onClick={handleFavoriteArticle}
                    >
                      <StarIcon
                        className={cn('mr-2', article?.isFavorite && 'fill-yellow-500')}
                        size={24}
                        weight={article?.isFavorite ? 'fill' : 'bold'}
                      />
                      {article?.isFavorite
                        ? t('reader.settings.unfavorite')
                        : t('reader.settings.favorite')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="focus:bg-accent h-11 rounded-none"
                      onClick={handleArchiveArticle}
                    >
                      <ArchiveIcon
                        className="mr-2"
                        size={24}
                        weight={article?.isArchived ? 'fill' : 'bold'}
                      />
                      {article?.isArchived
                        ? t('reader.settings.unarchive')
                        : t('reader.settings.archive')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="focus:bg-accent h-11 rounded-none"
                      onClick={() => setIsEditTagsOpen(true)}
                    >
                      <TagIcon className="mr-2" size={24} weight="bold" />
                      {t('reader.settings.editTags')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="focus:bg-accent h-11 rounded-t-none"
                      onClick={handleDeleteArticle}
                      variant="destructive"
                    >
                      <TrashIcon className="mr-2" size={24} weight="bold" />
                      {t('reader.settings.deleteArticle')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </header>
      {article && !env.isDemo && (
        <EditTagsDialog
          initialTags={article.tags}
          linkId={linkId}
          onOpenChange={setIsEditTagsOpen}
          open={isEditTagsOpen}
        />
      )}
    </>
  );
}

export default ReaderNav;
