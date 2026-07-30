import { describe, expect, it } from 'vitest';

import { markdownService, type MarkdownConversionContext } from './markdown.service.js';

const defaultContext: MarkdownConversionContext = {
  baseUrl: 'https://publisher.example/articles/story',
  title: 'Extracted article title'
};

function convertToMarkdown(html: string, context = defaultContext) {
  return markdownService.convertToMarkdown(html, context);
}

describe('markdownService.convertToMarkdown', () => {
  describe('content preservation', () => {
    it('preserves navigational, fragment, commentary, and following links', () => {
      const html = `
        <p>
          <a href="#section">Jump to section</a>
          <a href="#fn-1">Footnote</a>
          <a href="/commentary">Commentary</a>
          <a href="/following">Following</a>
        </p>
      `;

      expect(convertToMarkdown(html)).toBe(
        '[Jump to section](https://publisher.example/articles/story#section) [Footnote](https://publisher.example/articles/story#fn-1) [Commentary](https://publisher.example/commentary) [Following](https://publisher.example/following)'
      );
    });

    it('preserves prose in unrelated author and most-read class names', () => {
      const html = `
        <div class="authoritative-analysis"><p>Authoritative analysis stays.</p></div>
        <div class="most-read-context"><p>Most readers need this context.</p></div>
      `;

      expect(convertToMarkdown(html)).toBe(
        'Authoritative analysis stays.\n\nMost readers need this context.'
      );
    });

    it('preserves standalone non-Latin and emoji content', () => {
      const html = `
        <p>你好世界</p>
        <p>日本語</p>
        <p>Привет мир</p>
        <p>مرحبا بالعالم</p>
        <p>🙂</p>
      `;

      expect(convertToMarkdown(html)).toBe(
        '你好世界\n\n日本語\n\nПривет мир\n\nمرحبا بالعالم\n\n🙂'
      );
    });

    it('preserves Ghost bookmark title, description, and destination', () => {
      const html = `
        <figure class="kg-card kg-bookmark-card">
          <a href="https://github.com/example/bookmark-target?ref=publisher.example">
            <img src="https://cdn.example.com/icon.png" alt="" />
            <p>GitHub - example/bookmark-target</p>
            <p>Contribute to example/bookmark-target development by creating an account on GitHub.</p>
          </a>
        </figure>
      `;

      expect(convertToMarkdown(html)).toBe(
        '[**GitHub - example/bookmark-target**](https://github.com/example/bookmark-target?ref=publisher.example)\n\nContribute to example/bookmark-target development by creating an account on GitHub.'
      );
    });

    it('supports Ghost bookmark title and description elements', () => {
      const html = `
        <figure class="kg-card kg-bookmark-card">
          <a href="/bookmark-target">
            <div class="kg-bookmark-content">
              <div class="kg-bookmark-title">Example bookmark</div>
              <div class="kg-bookmark-description"><em>Bookmark description.</em></div>
            </div>
            <div class="kg-bookmark-thumbnail"><img src="/thumbnail.png" alt="" /></div>
          </a>
        </figure>
      `;

      expect(convertToMarkdown(html)).toBe(
        '[**Example bookmark**](https://publisher.example/bookmark-target)\n\n*Bookmark description.*'
      );
    });

    it('does not treat ordinary linked figures as Ghost bookmarks', () => {
      const html = `
        <figure class="article-figure">
          <a href="/story">
            <img src="/figure.png" alt="Figure" />
            <p>Figure title</p>
          </a>
        </figure>
      `;

      expect(convertToMarkdown(html)).toBe('![Figure](/figure.png)');
    });

    it('does not emit an active link for an unsafe bookmark destination', () => {
      const html = `
        <figure class="kg-card kg-bookmark-card">
          <a href="javascript:alert('unsafe')">
            <img src="/icon.png" alt="Bookmark icon" />
            <p>Unsafe bookmark</p>
            <p>Bookmark description.</p>
          </a>
        </figure>
      `;

      expect(convertToMarkdown(html)).toBe('![Bookmark icon](/icon.png)');
    });

    it('escapes bookmark link delimiters in metadata', () => {
      const html = `
        <figure class="kg-card kg-bookmark-card">
          <a href="https://example.com/bookmark-(target)">
            <img src="/icon.png" alt="" />
            <p>Example [*bookmark*_] &#96;code&#96;~</p>
            <p>First line<br />Second line.</p>
          </a>
        </figure>
      `;

      expect(convertToMarkdown(html)).toBe(
        '[**Example \\[\\*bookmark\\*\\_\\] \\`code\\`\\~**](https://example.com/bookmark-\\(target\\))\n\nFirst line  \nSecond line.'
      );
    });

    it('continues removing executable and styling elements', () => {
      const html = `
        <style>.hidden { display: none; }</style>
        <script>alert('unsafe')</script>
        <p>Readable article content.</p>
      `;

      expect(convertToMarkdown(html)).toBe('Readable article content.');
    });
  });

  describe('document context', () => {
    const context = {
      baseUrl: 'https://publisher.example/articles/story',
      title: 'Expected article title'
    };

    it('resolves publisher-relative links while preserving document fragments', () => {
      const html = `
        <p>
          <a href="/docs">Docs</a>
          <a href="../guide">Guide</a>
          <a href="#section">Section</a>
          <a href="//cdn.example.com/file">CDN</a>
        </p>
      `;

      expect(convertToMarkdown(html, context)).toBe(
        '[Docs](https://publisher.example/docs) [Guide](https://publisher.example/guide) [Section](https://publisher.example/articles/story#section) [CDN](https://cdn.example.com/file)'
      );
    });

    it('strips active-content links while preserving safe contact links', () => {
      const html = `
        <p><a href="javascript:alert('unsafe')">Unsafe script</a></p>
        <p><a href="data:text/html,&lt;script&gt;alert('unsafe')&lt;/script&gt;">Unsafe data</a></p>
        <p><a href="mailto:author@publisher.example">Email the author</a></p>
      `;

      expect(convertToMarkdown(html, context)).toBe(
        'Unsafe script\n\nUnsafe data\n\n[Email the author](mailto:author@publisher.example)'
      );
    });

    it('removes a leading H1 only when it duplicates the extracted title', () => {
      const html = '<h1>Expected article title</h1><p>Opening paragraph.</p>';

      expect(convertToMarkdown(html, context)).toBe('Opening paragraph.');
    });

    it('removes a duplicate leading H1 when it is the entire document', () => {
      expect(convertToMarkdown('<h1>Expected article title</h1>', context)).toBe('');
    });

    it('preserves a leading H1 that differs from the extracted title', () => {
      const html = '<h1>A meaningful section heading</h1><p>Opening paragraph.</p>';

      expect(convertToMarkdown(html, context)).toBe(
        '# A meaningful section heading\n\nOpening paragraph.'
      );
    });

    it('preserves linked heading structure and destination', () => {
      const html = `
        <a href="/story">
          <h2>Read the investigation</h2>
          <p>Background and supporting details.</p>
        </a>
      `;

      expect(convertToMarkdown(html, context)).toBe(
        '## [Read the investigation](https://publisher.example/story)\n\nBackground and supporting details.'
      );
    });

    it('keeps multiple blocks after a linked heading as valid Markdown', () => {
      const html = `
        <a href="/story">
          <h2>Read the investigation</h2>
          <p>First supporting paragraph.</p>
          <p>Second supporting paragraph.</p>
          <ul><li>Supporting evidence</li></ul>
        </a>
      `;

      expect(convertToMarkdown(html, context)).toBe(
        '## [Read the investigation](https://publisher.example/story)\n\nFirst supporting paragraph.\n\nSecond supporting paragraph.\n\n- Supporting evidence'
      );
    });
  });
});
