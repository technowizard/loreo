import { describe, expect, it } from 'vitest';

import enCommon from './en/common.json';
import idCommon from './id/common.json';

const phaseOneKeys = [
  'login.emailPlaceholder',
  'login.invalidCredentials',
  'login.success',
  'register.createAccount',
  'register.genericError',
  'register.success',
  'home.continueReading',
  'home.pasteUrlToSaveFirstArticle',
  'routes.login.metaTitle',
  'routes.register.metaTitle'
] as const;

const phaseTwoKeys = [
  'nav.home',
  'nav.articles',
  'userMenu.fallbackName',
  'userMenu.switchTheme',
  'userMenu.settings',
  'userMenu.logOut',
  'userMenu.themes.system',
  'userMenu.themes.light',
  'userMenu.themes.sepia',
  'userMenu.themes.dark',
  'routes.home.metaTitle',
  'routes.articles.metaTitle',
  'routes.settings.metaTitle',
  'routes.manageTags.metaTitle',
  'routes.importArticles.metaTitle',
  'routes.importProgress.metaTitle',
  'routes.articleReader.fallbackMetaTitle'
] as const;

const phaseThreeKeys = [
  // Articles page toasts
  'articles.toasts.updating',
  'articles.toasts.linkUpdated',
  'articles.toasts.deletingLink',
  'articles.toasts.linkDeleted',
  'articles.toasts.reprocessing',
  'articles.toasts.queuedForReprocessing',
  // Toolbar
  'articles.toolbar.searchPlaceholder',
  'articles.toolbar.searchAria',
  'articles.toolbar.clearSearchAria',
  'articles.toolbar.filterSheetTitle',
  'articles.toolbar.filterSheetDescription',
  'articles.toolbar.saveArticle',
  'articles.toolbar.saveArticleAria',
  // Filter sidebar
  'articles.filters.articles',
  'articles.filters.priority',
  'articles.filters.readingLength',
  'articles.filters.sortBy',
  'articles.filters.tags',
  'articles.filters.manageTagsAria',
  'articles.filters.toggleGroupAria',
  // Empty states
  'articles.empty.noResultsTitle',
  'articles.empty.noResultsDescription',
  'articles.empty.clearSearch',
  'articles.empty.noFavoritesTitle',
  'articles.empty.noFavoritesDescription',
  'articles.empty.browseArticles',
  'articles.empty.noArchivedTitle',
  'articles.empty.noArchivedDescription',
  'articles.empty.noHighlightsTitle',
  'articles.empty.noHighlightsDescription',
  'articles.empty.emptyLibraryTitle',
  'articles.empty.emptyLibraryDescription',
  'articles.empty.saveFirstArticle',
  'articles.empty.gettingStartedTips',
  'articles.empty.tip1',
  'articles.empty.tip2',
  'articles.empty.tip3',
  'articles.empty.tip4',
  // Article card
  'articles.card.priority.none',
  'articles.card.priority.lowPriority',
  'articles.card.priority.thisWeek',
  'articles.card.priority.mustRead',
  'articles.card.actions.more',
  'articles.card.actions.favorite',
  'articles.card.actions.toggleFavorite',
  'articles.card.actions.editTags',
  'articles.card.actions.refresh',
  'articles.card.actions.archive',
  'articles.card.actions.unarchive',
  'articles.card.actions.delete',
  'articles.card.moreCount',
  // Add article dialog
  'articles.dialog.saveLaterTitle',
  'articles.dialog.saveLaterDescription',
  'articles.dialog.urlLabel',
  'articles.dialog.urlPlaceholder',
  'articles.dialog.tagsLabel',
  'articles.dialog.submit',
  'articles.toasts.linkSaved',
  'articles.toasts.failedCreateTag',
  'articles.toasts.tagCreated',
  // Edit tags dialog
  'articles.editTags.title',
  'articles.editTags.description',
  'articles.editTags.save',
  'articles.editTags.saving',
  'articles.toasts.failedUpdateTags',
  'articles.toasts.tagsUpdated'
] as const;

function getValue(source: unknown, key: string) {
  return key.split('.').reduce<unknown>((value, segment) => {
    if (value && typeof value === 'object' && segment in value) {
      return (value as Record<string, unknown>)[segment];
    }

    return undefined;
  }, source);
}

describe('common locale phase 1 coverage', () => {
  it.each(phaseOneKeys)('defines %s in English and Indonesian locales', (key) => {
    expect(getValue(enCommon, key)).toEqual(expect.any(String));
    expect(getValue(idCommon, key)).toEqual(expect.any(String));
  });
});

describe('common locale phase 2 coverage', () => {
  it.each(phaseTwoKeys)('defines %s in English and Indonesian locales', (key) => {
    expect(getValue(enCommon, key)).toEqual(expect.any(String));
    expect(getValue(idCommon, key)).toEqual(expect.any(String));
  });
});

describe('common locale phase 3 coverage', () => {
  it.each(phaseThreeKeys)('defines %s in English and Indonesian locales', (key) => {
    expect(getValue(enCommon, key)).toEqual(expect.any(String));
    expect(getValue(idCommon, key)).toEqual(expect.any(String));
  });
});
