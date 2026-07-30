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
