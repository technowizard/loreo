import { describe, expect, it } from "vitest";

import enCommon from "./en/common.json";
import idCommon from "./id/common.json";

const phaseOneKeys = [
	"login.emailPlaceholder",
	"login.invalidCredentials",
	"login.success",
	"register.createAccount",
	"register.genericError",
	"register.success",
	"home.continueReading",
	"home.pasteUrlToSaveFirstArticle",
	"routes.login.metaTitle",
	"routes.register.metaTitle",
] as const;

const phaseTwoKeys = [
	"nav.home",
	"nav.articles",
	"userMenu.fallbackName",
	"userMenu.switchTheme",
	"userMenu.settings",
	"userMenu.logOut",
	"userMenu.themes.system",
	"userMenu.themes.light",
	"userMenu.themes.sepia",
	"userMenu.themes.dark",
	"routes.home.metaTitle",
	"routes.articles.metaTitle",
	"routes.settings.metaTitle",
	"routes.manageTags.metaTitle",
	"routes.importArticles.metaTitle",
	"routes.importProgress.metaTitle",
	"routes.articleReader.fallbackMetaTitle",
] as const;

const phaseThreeKeys = [
	// Articles page toasts
	"articles.toasts.updating",
	"articles.toasts.linkUpdated",
	"articles.toasts.deletingLink",
	"articles.toasts.linkDeleted",
	"articles.toasts.reprocessing",
	"articles.toasts.queuedForReprocessing",
	// Toolbar
	"articles.toolbar.searchPlaceholder",
	"articles.toolbar.searchAria",
	"articles.toolbar.clearSearchAria",
	"articles.toolbar.filterSheetTitle",
	"articles.toolbar.filterSheetDescription",
	"articles.toolbar.saveArticle",
	"articles.toolbar.saveArticleAria",
	// Filter sidebar
	"articles.filters.articles",
	"articles.filters.priority",
	"articles.filters.readingLength",
	"articles.filters.sortBy",
	"articles.filters.tags",
	"articles.filters.manageTagsAria",
	"articles.filters.toggleGroupAria",
	// Empty states
	"articles.empty.noResultsTitle",
	"articles.empty.noResultsDescription",
	"articles.empty.clearSearch",
	"articles.empty.noFavoritesTitle",
	"articles.empty.noFavoritesDescription",
	"articles.empty.browseArticles",
	"articles.empty.noArchivedTitle",
	"articles.empty.noArchivedDescription",
	"articles.empty.noHighlightsTitle",
	"articles.empty.noHighlightsDescription",
	"articles.empty.emptyLibraryTitle",
	"articles.empty.emptyLibraryDescription",
	"articles.empty.saveFirstArticle",
	"articles.empty.gettingStartedTips",
	"articles.empty.tip1",
	"articles.empty.tip2",
	"articles.empty.tip3",
	"articles.empty.tip4",
	// Article card
	"articles.card.priority.none",
	"articles.card.priority.lowPriority",
	"articles.card.priority.thisWeek",
	"articles.card.priority.mustRead",
	"articles.card.actions.more",
	"articles.card.actions.favorite",
	"articles.card.actions.toggleFavorite",
	"articles.card.actions.editTags",
	"articles.card.actions.refresh",
	"articles.card.actions.archive",
	"articles.card.actions.unarchive",
	"articles.card.actions.delete",
	"articles.card.moreCount",
	// Add article dialog
	"articles.dialog.saveLaterTitle",
	"articles.dialog.saveLaterDescription",
	"articles.dialog.urlLabel",
	"articles.dialog.urlPlaceholder",
	"articles.dialog.tagsLabel",
	"articles.dialog.submit",
	"articles.toasts.linkSaved",
	"articles.toasts.failedCreateTag",
	"articles.toasts.tagCreated",
	// Edit tags dialog
	"articles.editTags.title",
	"articles.editTags.description",
	"articles.editTags.save",
	"articles.editTags.saving",
	"articles.toasts.failedUpdateTags",
	"articles.toasts.tagsUpdated",
] as const;

const phaseFourKeys = [
	"reader.whatsNext",
	"reader.actions.favorite",
	"reader.actions.favorited",
	"reader.actions.archiveAndMarkRead",
	"reader.actions.copyLink",
	"reader.actions.linkCopied",
	"reader.actions.upNext",
	"reader.actions.markedAsFavorite",
	"reader.actions.removedFromFavorites",
	"reader.actions.archivedAndMarkedRead",
	"reader.actions.linkUpdated",
	"reader.resume.title",
	"reader.resume.position",
	"reader.resume.continue",
	"reader.progress.read",
	"reader.progress.left",
	"reader.progress.top",
	"reader.progress.end",
] as const;

const phaseFiveKeys = [
	"settings.page.title",
	"settings.page.description",
	"settings.account.title",
	"settings.account.description",
	"settings.account.changeAvatar",
	"settings.account.avatarHint",
	"settings.account.nameLabel",
	"settings.account.namePlaceholder",
	"settings.account.save",
	"settings.account.emailLabel",
	"settings.account.emailPlaceholder",
	"settings.account.saveEmail",
	"settings.account.confirmPasswordLabel",
	"settings.account.passwordPlaceholder",
	"settings.account.confirm",
	"settings.account.cancel",
	"settings.account.toasts.avatarUpdated",
	"settings.account.toasts.nameUpdated",
	"settings.account.toasts.emailUpdated",
	"settings.security.title",
	"settings.security.description",
	"settings.security.currentPasswordLabel",
	"settings.security.currentPasswordPlaceholder",
	"settings.security.newPasswordLabel",
	"settings.security.newPasswordPlaceholder",
	"settings.security.confirmPasswordLabel",
	"settings.security.confirmPasswordPlaceholder",
	"settings.security.validationHint",
	"settings.security.updatePassword",
	"settings.security.toasts.passwordUpdated",
	"settings.readerPreferences.title",
	"settings.readerPreferences.description",
	"settings.readerPreferences.themeLabel",
	"settings.readerPreferences.themeTooltip",
	"settings.readerPreferences.typographyLabel",
	"settings.readerPreferences.fontSizeLabel",
	"settings.readerPreferences.lineSpacingLabel",
	"settings.readerPreferences.fontFamilyLabel",
	"settings.readerPreferences.showPreview",
	"settings.readerPreferences.hidePreview",
	"settings.readerPreferences.textAlignmentLabel",
	"settings.readerPreferences.textAlignment.default.title",
	"settings.readerPreferences.textAlignment.default.description",
	"settings.readerPreferences.textAlignment.justify.title",
	"settings.readerPreferences.textAlignment.justify.description",
	"settings.readerPreferences.resetPreferences.title",
	"settings.readerPreferences.resetPreferences.description",
	"settings.readerPreferences.resetToDefault",
	"settings.data.title",
	"settings.data.description",
	"settings.data.importCard.cardTitle",
	"settings.data.importCard.cardDescription",
	"settings.data.importCard.button",
	"settings.data.importCard.title",
	"settings.data.updated",
	"settings.data.recentImports",
	"settings.data.statusCompleted",
	"settings.data.statusInProgress",
	"settings.data.progress",
	"settings.data.counts.extracted",
	"settings.data.counts.failed",
	"settings.data.delete",
	"settings.data.viewDetails",
] as const;

const phaseSixKeys = [
	"tags.page.title",
	"tags.page.description",
	"tags.page.searchPlaceholder",
	"tags.page.newGroup",
	"tags.page.error",
	"tags.page.tryAgain",
	"tags.page.emptySearchTitle",
	"tags.page.emptyTitle",
	"tags.page.emptySearchDescription",
	"tags.page.emptyDescription",
	"tags.page.emptyHint",
	"tags.deleteDialog.titleGroup",
	"tags.deleteDialog.titleTag",
	"tags.deleteDialog.confirmGroup",
	"tags.deleteDialog.confirmTag",
	"tags.deleteDialog.cannotUndo",
	"tags.deleteDialog.cancel",
	"tags.deleteDialog.delete",
	"tags.groupForm.createTitle",
	"tags.groupForm.editTitle",
	"tags.groupForm.createDescription",
	"tags.groupForm.editDescription",
	"tags.groupForm.groupNameLabel",
	"tags.groupForm.groupNamePlaceholder",
	"tags.groupForm.colorLabel",
	"tags.groupForm.descriptionLabel",
	"tags.groupForm.descriptionPlaceholder",
	"tags.groupForm.previewLabel",
	"tags.groupForm.previewNameFallback",
	"tags.groupForm.previewDescriptionFallback",
	"tags.groupForm.cancel",
	"tags.groupForm.create",
	"tags.groupForm.update",
	"tags.tagForm.editTitle",
	"tags.tagForm.addTitle",
	"tags.tagForm.editDescription",
	"tags.tagForm.addDescription",
	"tags.tagForm.tagNameLabel",
	"tags.tagForm.tagNamePlaceholder",
	"tags.tagForm.previewLabel",
	"tags.tagForm.previewNameFallback",
	"tags.tagForm.cancel",
	"tags.tagForm.update",
	"tags.tagForm.create",
	"tags.sheet.tagsCount",
	"tags.sheet.cancel",
	"tags.sheet.select",
	"tags.sheet.addTag",
	"tags.sheet.selectedCount",
	"tags.sheet.moveTo",
	"tags.sheet.delete",
	"tags.sheet.moveAria",
	"tags.sheet.editAria",
	"tags.sheet.deleteAria",
	"tags.moveDialog.titleSingle",
	"tags.moveDialog.titleBulk",
	"tags.moveDialog.titleGroup",
	"tags.moveDialog.description",
	"tags.moveDialog.destinationLabel",
	"tags.moveDialog.placeholder",
	"tags.moveDialog.cancel",
	"tags.moveDialog.move",
	"tags.groupCard.tagCount_one",
	"tags.groupCard.tagCount_other",
	"tags.groupCard.actions.editGroup",
	"tags.groupCard.actions.moveAllTags",
	"tags.groupCard.actions.deleteGroup",
	"tags.groupCard.actions.manageAria",
	"tags.groupCard.actions.manageTagsAria",
	"tags.groupCard.moreCount",
	"tags.groupCard.manageTags",
	"tags.groupCard.addFirstTag",
] as const;

function getValue(source: unknown, key: string) {
	return key.split(".").reduce<unknown>((value, segment) => {
		if (value && typeof value === "object" && segment in value) {
			return (value as Record<string, unknown>)[segment];
		}

		return undefined;
	}, source);
}

describe("common locale phase 1 coverage", () => {
	it.each(
		phaseOneKeys,
	)("defines %s in English and Indonesian locales", (key) => {
		expect(getValue(enCommon, key)).toEqual(expect.any(String));
		expect(getValue(idCommon, key)).toEqual(expect.any(String));
	});
});

describe("common locale phase 2 coverage", () => {
	it.each(
		phaseTwoKeys,
	)("defines %s in English and Indonesian locales", (key) => {
		expect(getValue(enCommon, key)).toEqual(expect.any(String));
		expect(getValue(idCommon, key)).toEqual(expect.any(String));
	});
});

describe("common locale phase 3 coverage", () => {
	it.each(
		phaseThreeKeys,
	)("defines %s in English and Indonesian locales", (key) => {
		expect(getValue(enCommon, key)).toEqual(expect.any(String));
		expect(getValue(idCommon, key)).toEqual(expect.any(String));
	});
});

describe("common locale phase 4 coverage", () => {
	it.each(
		phaseFourKeys,
	)("defines %s in English and Indonesian locales", (key) => {
		expect(getValue(enCommon, key)).toEqual(expect.any(String));
		expect(getValue(idCommon, key)).toEqual(expect.any(String));
	});
});

describe("common locale phase 5 coverage", () => {
	it.each(
		phaseFiveKeys,
	)("defines %s in English and Indonesian locales", (key) => {
		expect(getValue(enCommon, key)).toEqual(expect.any(String));
		expect(getValue(idCommon, key)).toEqual(expect.any(String));
	});
});

const phaseSevenKeys = [
	"import.wizard.cancel",
	"import.wizard.confirmCancelTitle",
	"import.wizard.confirmCancelDescription",
	"import.wizard.back",
	"import.wizard.continue",
	"import.wizard.startImport",
	"import.wizard.toastCancelled",
	"import.wizard.toastFailed",
	"import.wizard.failedTitle",
	"import.wizard.failedDescription",
	"import.wizard.stepUpload",
	"import.wizard.stepMap",
	"import.wizard.stepReview",
	"import.wizard.stepUploadDescription",
	"import.wizard.stepMapDescription",
	"import.wizard.stepReviewDescription",
	"import.wizard.errorUploadRequired",
	"import.wizard.errorMapRequired",
	"import.wizard.errorNoData",
	"import.progress.completeTitle",
	"import.progress.completeDescription",
	"import.progress.importingTitle",
	"import.progress.importingDescription",
	"import.progress.processing",
	"import.progress.progressText",
	"import.progress.estimatedTime",
	"import.progress.viewExtractionProgress",
	"import.progress.goToArticles",
	"import.progress.goHome",
	"import.progress.importAnother",
	"import.upload.toastLoading",
	"import.upload.dropzoneAria",
	"import.upload.dropzoneText",
	"import.upload.selectFile",
	"import.upload.clearFile",
	"import.upload.fileHint",
	"import.upload.tipsTitle",
	"import.upload.tipOne",
	"import.upload.tipTwo",
	"import.upload.tipThree",
	"import.upload.successTitle",
	"import.upload.successDescription",
	"import.upload.alertRowCount",
	"import.mapFields.title",
	"import.mapFields.description",
	"import.mapFields.csvColumnHeading",
	"import.mapFields.articleFieldHeading",
	"import.mapFields.fieldUrl",
	"import.mapFields.fieldTitle",
	"import.mapFields.fieldTags",
	"import.mapFields.fieldDescription",
	"import.mapFields.fieldPublishedAt",
	"import.mapFields.required",
	"import.mapFields.doNotMap",
	"import.mapFields.helpText",
	"import.review.title",
	"import.review.description",
	"import.review.summary",
	"import.review.estimatedTime",
	"import.review.tableHeadingRow",
	"import.review.tableHeadingUrl",
	"import.review.tableHeadingTitle",
	"import.review.tableHeadingTags",
	"import.review.noTags",
	"import.review.moreCount",
	"import.review.startOver",
	"import.progressDemo.completing",
	"import.progressDemo.importingDemo",
	"import.extraction.title",
	"import.extraction.statusAll",
	"import.extraction.statusCompleted",
	"import.extraction.statusFailed",
	"import.extraction.statusProcessing",
	"import.extraction.badgeCompleted",
	"import.extraction.badgeProcessing",
	"import.extraction.badgeFailed",
	"import.extraction.badgePending",
	"import.extraction.loadMore",
	"import.extraction.noResults",
	"import.extraction.viewArticle",
] as const;

describe("common locale phase 6 coverage", () => {
	it.each(
		phaseSixKeys,
	)("defines %s in English and Indonesian locales", (key) => {
		expect(getValue(enCommon, key)).toEqual(expect.any(String));
		expect(getValue(idCommon, key)).toEqual(expect.any(String));
	});
});

describe("common locale phase 7 coverage", () => {
	it.each(
		phaseSevenKeys,
	)("defines %s in English and Indonesian locales", (key) => {
		expect(getValue(enCommon, key)).toEqual(expect.any(String));
		expect(getValue(idCommon, key)).toEqual(expect.any(String));
	});
});
