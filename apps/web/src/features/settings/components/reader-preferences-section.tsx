import {
  ClockClockwiseIcon,
  InfoIcon,
  MonitorIcon,
  MoonIcon,
  SunIcon,
  TextAlignJustifyIcon,
  TextAlignLeftIcon
} from '@phosphor-icons/react';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import { useThemeConfig } from '@/hooks/use-theme-config';

import { env } from '@/lib/env';
import { cn } from '@/lib/utils';

import { FONT_SIZES, getFontsByCategory, LINE_SPACING } from '../constants/theme-config';

import { SelectionCard } from './selection-card';
import { SettingsRow, SettingsSection } from './settings-section';

function getFontSizeLocaleKey(size: string) {
  switch (size) {
    case 'Extra Large':
      return 'extraLarge';
    case 'Huge':
      return 'huge';
    case 'Large':
      return 'large';
    case 'Small':
      return 'small';
    default:
      return 'medium';
  }
}

function getLineSpacingLocaleKey(spacing: string) {
  switch (spacing) {
    case 'Compact':
      return 'compact';
    case 'Loose':
      return 'loose';
    case 'Relaxed':
      return 'relaxed';
    default:
      return 'normal';
  }
}

export function ReaderPreferencesSection() {
  const { setTheme, theme } = useTheme();
  const {
    fontFamily,
    fontSize,
    lineSpacing,
    resetSettings,
    textAlignment,
    toggleFontFamily,
    toggleFontSize,
    toggleLineSpacing,
    toggleTextAlignment,
    toggleTheme
  } = useThemeConfig();

  const [showFontPreview, setShowFontPreview] = useState(false);
  const { t } = useTranslation('common');

  const currentFonts = getFontsByCategory(fontFamily.style);

  const readerFontSizeClass = (() => {
    switch (fontSize) {
      case 'Small':
        return 'text-base';
      case 'Medium':
        return 'text-lg';
      case 'Large':
        return 'text-xl';
      case 'Extra Large':
        return 'text-2xl';
      case 'Huge':
        return 'text-3xl';
      default:
        return 'text-base';
    }
  })();

  const readerLineSpacingClass = (() => {
    switch (lineSpacing) {
      case 'Compact':
        return 'leading-snug';
      case 'Normal':
        return 'leading-normal';
      case 'Relaxed':
        return 'leading-relaxed';
      case 'Loose':
        return 'leading-loose';
      default:
        return 'leading-normal';
    }
  })();

  return (
    <SettingsSection
      description={t('settings.readerPreferences.description')}
      title={t('settings.readerPreferences.title')}
    >
      {env.isDemo && (
        <div className="border-border bg-muted/30 text-muted-foreground mb-4 rounded-2xl border px-4 py-3 text-sm">
          {t('settings.readerPreferences.demoNote')}
        </div>
      )}
      <SettingsRow>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{t('settings.readerPreferences.themeLabel')}</span>
          <Tooltip>
            <TooltipTrigger>
              <InfoIcon className="text-muted-foreground size-4 cursor-help" weight="fill" />
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="max-w-xs text-xs">{t('settings.readerPreferences.themeTooltip')}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SelectionCard
            checked={theme === 'system'}
            icon={<MonitorIcon size={20} weight="bold" />}
            onChange={() => {
              setTheme('system');
              toggleTheme('system');
            }}
            title={t('settings.readerPreferences.theme.system')}
            value="system"
          />
          <SelectionCard
            checked={theme === 'light'}
            icon={<SunIcon size={20} weight="bold" />}
            onChange={() => {
              setTheme('light');
              toggleTheme('light');
            }}
            title={t('settings.readerPreferences.theme.light')}
            value="light"
          />
          <SelectionCard
            checked={theme === 'sepia-theme'}
            icon={<SunIcon size={20} weight="bold" />}
            onChange={() => {
              setTheme('sepia-theme');
              toggleTheme('sepia-theme');
            }}
            title={t('settings.readerPreferences.theme.sepia')}
            value="sepia-theme"
          />
          <SelectionCard
            checked={theme === 'dark'}
            icon={<MoonIcon size={20} weight="bold" />}
            onChange={() => {
              setTheme('dark');
              toggleTheme('dark');
            }}
            title={t('settings.readerPreferences.theme.dark')}
            value="dark"
          />
        </div>
      </SettingsRow>

      <div className="space-y-3">
        <div className="text-sm font-medium">{t('settings.readerPreferences.typographyLabel')}</div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel>{t('settings.readerPreferences.fontSizeLabel')}</FieldLabel>
            <Select onValueChange={toggleFontSize} value={fontSize}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {FONT_SIZES.map((size) => (
                    <SelectItem key={size} value={size}>
                      {t(`reader.fontSizes.${getFontSizeLocaleKey(size)}`)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>{t('settings.readerPreferences.lineSpacingLabel')}</FieldLabel>
            <Select onValueChange={toggleLineSpacing} value={lineSpacing}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {LINE_SPACING.map((spacing) => (
                    <SelectItem key={spacing} value={spacing}>
                      {t(`reader.lineSpacing.${getLineSpacingLocaleKey(spacing)}`)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">
            {t('settings.readerPreferences.fontFamilyLabel')}
          </div>
          <Button onClick={() => setShowFontPreview(!showFontPreview)} size="sm" variant="ghost">
            {showFontPreview
              ? t('settings.readerPreferences.hidePreview')
              : t('settings.readerPreferences.showPreview')}
          </Button>
        </div>
        <Tabs
          className="w-full"
          onValueChange={(category) =>
            toggleFontFamily({
              ...fontFamily,
              style: category as typeof fontFamily.style
            })
          }
          value={fontFamily.style}
        >
          <TabsList className="w-full">
            {(['sans-serif', 'serif', 'legible'] as const).map((category) => (
              <TabsTrigger className="capitalize" key={category} value={category}>
                {t(`reader.fontCategories.${category === 'sans-serif' ? 'sansSerif' : category}`)}
              </TabsTrigger>
            ))}
          </TabsList>
          {currentFonts.map((font) => (
            <TabsContent key={font.value} value={font.style}>
              <SelectionCard
                checked={fontFamily.name === font.value}
                description={t(font.descriptionKey)}
                icon={<span className={cn('text-xl font-bold', `font-${font.value}`)}>Aa</span>}
                onChange={() =>
                  toggleFontFamily({
                    label: font.value,
                    name: font.value,
                    style: font.style
                  })
                }
                title={t(font.labelKey)}
                value={font.value}
              >
                {showFontPreview && (
                  <p
                    className={cn(
                      'text-muted-foreground text-sm',
                      `font-${font.value}`,
                      readerFontSizeClass,
                      readerLineSpacingClass
                    )}
                  >
                    {t('settings.readerPreferences.previewText')}
                  </p>
                )}
              </SelectionCard>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-medium">
          {t('settings.readerPreferences.textAlignmentLabel')}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SelectionCard
            checked={textAlignment === 'default'}
            description={t('settings.readerPreferences.alignment.default.description')}
            icon={<TextAlignLeftIcon size={20} />}
            onChange={() => toggleTextAlignment('default')}
            title={t('settings.readerPreferences.alignment.default.title')}
            value="default"
          />
          <SelectionCard
            checked={textAlignment === 'justify'}
            description={t('settings.readerPreferences.alignment.justify.description')}
            icon={<TextAlignJustifyIcon size={20} />}
            onChange={() => toggleTextAlignment('justify')}
            title={t('settings.readerPreferences.alignment.justify.title')}
            value="justify"
          />
        </div>

        <div className="flex items-center justify-between rounded-4xl border border-dashed p-6">
          <div>
            <p className="text-sm font-medium">{t('settings.readerPreferences.reset.title')}</p>
            <p className="text-muted-foreground text-xs">
              {t('settings.readerPreferences.reset.description')}
            </p>
          </div>
          <Button onClick={resetSettings} size="sm" variant="outline">
            <ClockClockwiseIcon className="mr-1.5 size-4" />
            {t('settings.readerPreferences.resetToDefault')}
          </Button>
        </div>
      </div>
    </SettingsSection>
  );
}
