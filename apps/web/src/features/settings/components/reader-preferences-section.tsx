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

import { cn } from '@/lib/utils';

import { FONT_SIZES, getFontsByCategory, LINE_SPACING } from '../constants/theme-config';

import { SelectionCard } from './selection-card';
import { SettingsRow, SettingsSection } from './settings-section';

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
      description="Customize how articles look when you read them"
      title="Reader Preferences"
    >
      <SettingsRow>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Theme</span>
          <Tooltip>
            <TooltipTrigger>
              <InfoIcon className="text-muted-foreground size-4 cursor-help" weight="fill" />
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="max-w-xs text-xs">
                Applies to both the app interface and article reader
              </p>
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
            title="System"
            value="system"
          />
          <SelectionCard
            checked={theme === 'light'}
            icon={<SunIcon size={20} weight="bold" />}
            onChange={() => {
              setTheme('light');
              toggleTheme('light');
            }}
            title="Light"
            value="light"
          />
          <SelectionCard
            checked={theme === 'sepia-theme'}
            icon={<SunIcon size={20} weight="bold" />}
            onChange={() => {
              setTheme('sepia-theme');
              toggleTheme('sepia-theme');
            }}
            title="Sepia"
            value="sepia-theme"
          />
          <SelectionCard
            checked={theme === 'dark'}
            icon={<MoonIcon size={20} weight="bold" />}
            onChange={() => {
              setTheme('dark');
              toggleTheme('dark');
            }}
            title="Dark"
            value="dark"
          />
        </div>
      </SettingsRow>

      <div className="space-y-3">
        <div className="text-sm font-medium">Typography</div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel>Font Size</FieldLabel>
            <Select onValueChange={toggleFontSize} value={fontSize}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {FONT_SIZES.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Line Spacing</FieldLabel>
            <Select onValueChange={toggleLineSpacing} value={lineSpacing}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {LINE_SPACING.map((spacing) => (
                    <SelectItem key={spacing} value={spacing}>
                      {spacing}
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
          <div className="text-sm font-medium">Font Family</div>
          <Button onClick={() => setShowFontPreview(!showFontPreview)} size="sm" variant="ghost">
            {showFontPreview ? 'Hide Preview' : 'Show Preview'}
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
                {category === 'sans-serif' ? 'Sans Serif' : category}
              </TabsTrigger>
            ))}
          </TabsList>
          {currentFonts.map((font) => (
            <TabsContent key={font.value} value={font.style}>
              <SelectionCard
                checked={fontFamily.label === font.label}
                description={font.description}
                icon={<span className={cn('text-xl font-bold', `font-${font.value}`)}>Aa</span>}
                onChange={() =>
                  toggleFontFamily({
                    label: font.label,
                    name: font.value,
                    style: font.style
                  })
                }
                title={font.label}
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
                    The quick brown fox jumps over the lazy dog.
                  </p>
                )}
              </SelectionCard>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-medium">Text Alignment</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SelectionCard
            checked={textAlignment === 'default'}
            description="Text lines up on the left side"
            icon={<TextAlignLeftIcon size={20} />}
            onChange={() => toggleTextAlignment('default')}
            title="Default"
            value="default"
          />
          <SelectionCard
            checked={textAlignment === 'justify'}
            description="Text spreads evenly across the width"
            icon={<TextAlignJustifyIcon size={20} />}
            onChange={() => toggleTextAlignment('justify')}
            title="Justify"
            value="justify"
          />
        </div>

        <div className="flex items-center justify-between rounded-4xl border border-dashed p-6">
          <div>
            <p className="text-sm font-medium">Reset Preferences</p>
            <p className="text-muted-foreground text-xs">
              Restore all reader settings to their default values
            </p>
          </div>
          <Button onClick={resetSettings} size="sm" variant="outline">
            <ClockClockwiseIcon className="mr-1.5 size-4" />
            Reset to Default
          </Button>
        </div>
      </div>
    </SettingsSection>
  );
}
