import { produce } from 'immer';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { FONT_SIZES, LINE_SPACING } from '../features/settings/constants/theme-config';

import { createSelectorHooks } from '@/lib/create-selector-hooks';

import type { UserSettings } from '@/types/settings';

interface FontFamilySettings {
  label: string;
  name: string;
  style: string;
}

interface ThemeConfigType {
  articleCardView: 'grid' | 'list';
  decreaseFontSize: () => void;
  decreaseLineSpacing: () => void;
  fontFamily: FontFamilySettings;
  fontSize: string;
  hydrate: (settings: UserSettings) => void;
  increaseFontSize: () => void;
  increaseLineSpacing: () => void;
  lineSpacing: string;
  resetSettings: () => void;
  showThemeConfig: boolean;
  textAlignment: string;
  theme: string;
  toggleArticleCardView: (value: 'grid' | 'list') => void;
  toggleFontFamily: (fontFamily: FontFamilySettings) => void;
  toggleFontSize: (value: string | null) => void;
  toggleLineSpacing: (value: string | null) => void;
  toggleShowThemeConfig: () => void;
  toggleTextAlignment: (value: string) => void;
  toggleTheme: (value: string) => void;
}

const defaultReadingPreferences = {
  articleCardView: 'grid' as const,
  fontFamily: {
    label: 'default',
    name: 'default',
    style: 'sans-serif'
  } as const,
  fontSize: 'Medium' as const,
  lineSpacing: 'Normal' as const,
  textAlignment: 'default' as const,
  theme: 'system' as const
};

const useThemeConfigBase = create<ThemeConfigType>()(
  persist(
    (set) => ({
      ...defaultReadingPreferences,
      decreaseFontSize: () => {
        set(
          produce((state) => {
            const currentIndex = FONT_SIZES.indexOf(state.fontSize);
            if (currentIndex > 0) {
              state.fontSize = FONT_SIZES[currentIndex - 1];
            }
          })
        );
      },
      decreaseLineSpacing: () => {
        set(
          produce((state) => {
            const currentIndex = LINE_SPACING.indexOf(state.lineSpacing);
            if (currentIndex > 0) {
              state.lineSpacing = LINE_SPACING[currentIndex - 1];
            }
          })
        );
      },
      hydrate: (settings) => {
        set(
          produce((state) => {
            state.theme = settings.theme;
            state.fontFamily = settings.fontFamily;
            state.fontSize = settings.fontSize;
            state.lineSpacing = settings.lineSpacing;
            state.textAlignment = settings.textAlignment;
            state.articleCardView = settings.articleCardView;
          })
        );
      },
      increaseFontSize: () => {
        set(
          produce((state) => {
            const currentIndex = FONT_SIZES.indexOf(state.fontSize);
            if (currentIndex < FONT_SIZES.length - 1) {
              state.fontSize = FONT_SIZES[currentIndex + 1];
            }
          })
        );
      },
      increaseLineSpacing: () => {
        set(
          produce((state) => {
            const currentIndex = LINE_SPACING.indexOf(state.lineSpacing);
            if (currentIndex < LINE_SPACING.length - 1) {
              state.lineSpacing = LINE_SPACING[currentIndex + 1];
            }
          })
        );
      },
      resetSettings: () => {
        set(
          produce((state) => {
            state.theme = defaultReadingPreferences.theme;
            state.fontFamily = defaultReadingPreferences.fontFamily;
            state.fontSize = defaultReadingPreferences.fontSize;
            state.lineSpacing = defaultReadingPreferences.lineSpacing;
            state.textAlignment = defaultReadingPreferences.textAlignment;
            state.articleCardView = defaultReadingPreferences.articleCardView;
          })
        );
      },
      showThemeConfig: false,
      toggleArticleCardView: (value) => {
        set(
          produce((state) => {
            state.articleCardView = value;
          })
        );
      },
      toggleFontFamily: (fontFamily) => {
        set(
          produce((state) => {
            state.fontFamily.label = fontFamily.name;
            state.fontFamily.name = fontFamily.name;
            state.fontFamily.style = fontFamily.style;
          })
        );
      },
      toggleFontSize: (value) => {
        set(
          produce((state) => {
            state.fontSize = value;
          })
        );
      },
      toggleLineSpacing: (value) => {
        set(
          produce((state) => {
            state.lineSpacing = value;
          })
        );
      },
      toggleShowThemeConfig: () =>
        set(produce((state) => ({ showThemeConfig: !state.showThemeConfig }))),
      toggleTextAlignment: (value) => {
        set(
          produce((state) => {
            state.textAlignment = value;
          })
        );
      },
      toggleTheme: (value) => {
        set(
          produce((state) => {
            state.theme = value;
          })
        );
      }
    }),
    {
      name: 'reader-config'
    }
  )
);

export const useThemeConfig = createSelectorHooks(useThemeConfigBase);
