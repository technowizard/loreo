import '@/lib/i18n';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { useLanguage } from '@/hooks/use-language';

import { LanguageSection } from './language-section';

describe('LanguageSection', () => {
  it('shows the active language and renders a dropdown menu for language selection', () => {
    let snapshot: ReturnType<typeof useLanguage> | undefined;

    function Probe() {
      snapshot = useLanguage();
      return null;
    }

    const markup = renderToStaticMarkup(
      <>
        <LanguageSection />
        <Probe />
      </>
    );

    expect(markup).toContain('Current language: English');
    expect(markup).toContain('English');
    expect(markup).toContain('aria-haspopup="menu"');

    renderToStaticMarkup(<Probe />);

    expect(snapshot).toBeDefined();
    expect(snapshot?.current).toBe('en');
    expect(snapshot?.next).toBe('id');

    snapshot?.toggle();

    renderToStaticMarkup(<Probe />);

    expect(snapshot?.current).toBe('id');
    expect(snapshot?.next).toBe('en');
  });
});
