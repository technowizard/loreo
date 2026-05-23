import { beforeEach, describe, expect, it } from 'vitest';

import { FONT_SIZES, LINE_SPACING } from '../features/settings/constants/theme-config';

import { useThemeConfig } from './use-theme-config';

describe('useThemeConfig', () => {
  beforeEach(() => {
    useThemeConfig.setState({
      articleCardView: 'grid',
      fontFamily: { label: 'default', name: 'default', style: 'sans-serif' },
      fontSize: 'Medium',
      lineSpacing: 'Normal',
      textAlignment: 'default',
      theme: 'system',
      showThemeConfig: false
    });
  });

  it('should have default reading preferences', () => {
    const state = useThemeConfig.getState();
    expect(state.theme).toBe('system');
    expect(state.fontSize).toBe('Medium');
    expect(state.fontFamily.name).toBe('default');
    expect(state.lineSpacing).toBe('Normal');
    expect(state.textAlignment).toBe('default');
    expect(state.articleCardView).toBe('grid');
    expect(state.showThemeConfig).toBe(false);
  });

  it('should toggle theme', () => {
    useThemeConfig.getState().toggleTheme('dark');
    expect(useThemeConfig.getState().theme).toBe('dark');
  });

  it('should toggle font size', () => {
    useThemeConfig.getState().toggleFontSize('Large');
    expect(useThemeConfig.getState().fontSize).toBe('Large');
  });

  it('should increase font size', () => {
    useThemeConfig.getState().toggleFontSize('Medium');
    useThemeConfig.getState().increaseFontSize();
    expect(useThemeConfig.getState().fontSize).toBe('Large');
  });

  it('should not increase font size beyond max', () => {
    const maxSize = FONT_SIZES[FONT_SIZES.length - 1]!;
    useThemeConfig.getState().toggleFontSize(maxSize);
    useThemeConfig.getState().increaseFontSize();
    expect(useThemeConfig.getState().fontSize).toBe(maxSize);
  });

  it('should decrease font size', () => {
    useThemeConfig.getState().toggleFontSize('Large');
    useThemeConfig.getState().decreaseFontSize();
    expect(useThemeConfig.getState().fontSize).toBe('Medium');
  });

  it('should not decrease font size below min', () => {
    const minSize = FONT_SIZES[0]!;
    useThemeConfig.getState().toggleFontSize(minSize);
    useThemeConfig.getState().decreaseFontSize();
    expect(useThemeConfig.getState().fontSize).toBe(minSize);
  });

  it('should toggle line spacing', () => {
    useThemeConfig.getState().toggleLineSpacing('Relaxed');
    expect(useThemeConfig.getState().lineSpacing).toBe('Relaxed');
  });

  it('should increase line spacing', () => {
    useThemeConfig.getState().toggleLineSpacing('Normal');
    useThemeConfig.getState().increaseLineSpacing();
    expect(useThemeConfig.getState().lineSpacing).toBe('Relaxed');
  });

  it('should not increase line spacing beyond max', () => {
    const maxSpacing = LINE_SPACING[LINE_SPACING.length - 1]!;
    useThemeConfig.getState().toggleLineSpacing(maxSpacing);
    useThemeConfig.getState().increaseLineSpacing();
    expect(useThemeConfig.getState().lineSpacing).toBe(maxSpacing);
  });

  it('should decrease line spacing', () => {
    useThemeConfig.getState().toggleLineSpacing('Relaxed');
    useThemeConfig.getState().decreaseLineSpacing();
    expect(useThemeConfig.getState().lineSpacing).toBe('Normal');
  });

  it('should not decrease line spacing below min', () => {
    const minSpacing = LINE_SPACING[0]!;
    useThemeConfig.getState().toggleLineSpacing(minSpacing);
    useThemeConfig.getState().decreaseLineSpacing();
    expect(useThemeConfig.getState().lineSpacing).toBe(minSpacing);
  });

  it('should toggle text alignment', () => {
    useThemeConfig.getState().toggleTextAlignment('center');
    expect(useThemeConfig.getState().textAlignment).toBe('center');
  });

  it('should toggle article card view', () => {
    useThemeConfig.getState().toggleArticleCardView('list');
    expect(useThemeConfig.getState().articleCardView).toBe('list');
  });

  it('should toggle font family', () => {
    useThemeConfig.getState().toggleFontFamily({
      label: 'serif',
      name: 'serif',
      style: 'serif'
    });
    expect(useThemeConfig.getState().fontFamily).toEqual({
      label: 'serif',
      name: 'serif',
      style: 'serif'
    });
  });

  it('should toggle show theme config', () => {
    const initial = useThemeConfig.getState().showThemeConfig;
    useThemeConfig.getState().toggleShowThemeConfig();
    expect(useThemeConfig.getState().showThemeConfig).toBe(!initial);
  });

  it('should reset settings to defaults', () => {
    useThemeConfig.getState().toggleTheme('dark');
    useThemeConfig.getState().toggleFontSize('Large');
    useThemeConfig.getState().toggleTextAlignment('center');
    useThemeConfig.getState().resetSettings();

    const state = useThemeConfig.getState();
    expect(state.theme).toBe('system');
    expect(state.fontSize).toBe('Medium');
    expect(state.textAlignment).toBe('default');
    expect(state.articleCardView).toBe('grid');
  });

  it('should hydrate from user settings', () => {
    useThemeConfig.getState().hydrate({
      theme: 'dark',
      fontFamily: { label: 'serif', name: 'serif', style: 'serif' },
      fontSize: 'Small',
      lineSpacing: 'Relaxed',
      textAlignment: 'justify',
      articleCardView: 'list'
    });

    const state = useThemeConfig.getState();
    expect(state.theme).toBe('dark');
    expect(state.fontSize).toBe('Small');
    expect(state.lineSpacing).toBe('Relaxed');
    expect(state.textAlignment).toBe('justify');
    expect(state.articleCardView).toBe('list');
  });
});
