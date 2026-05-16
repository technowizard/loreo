import { useEffect, useRef } from 'react';

import { updateSettings } from '@/features/settings/api/update-settings';

import type { UserSettings } from '@/types/settings';

import { useThemeConfig } from './use-theme-config';

const DEBOUNCE_MS = 500;

export function useSettingsSync(enabled: boolean) {
  const theme = useThemeConfig((s) => s.theme);
  const fontFamily = useThemeConfig((s) => s.fontFamily);
  const fontSize = useThemeConfig((s) => s.fontSize);
  const lineSpacing = useThemeConfig((s) => s.lineSpacing);
  const textAlignment = useThemeConfig((s) => s.textAlignment);
  const articleCardView = useThemeConfig((s) => s.articleCardView);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    // skip the initial render — only sync on user-driven changes
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }

    const settings: UserSettings = {
      articleCardView,
      fontFamily,
      fontSize: fontSize as UserSettings['fontSize'],
      lineSpacing: lineSpacing as UserSettings['lineSpacing'],
      textAlignment: textAlignment as UserSettings['textAlignment'],
      theme: theme as UserSettings['theme']
    };

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      updateSettings(settings).catch(() => {});
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, theme, fontFamily, fontSize, lineSpacing, textAlignment, articleCardView]);
}
