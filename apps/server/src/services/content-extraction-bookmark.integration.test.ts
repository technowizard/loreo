import { describe, expect, it } from 'vitest';

import { contentExtractionService } from './content-extraction.service.js';
import { markdownService } from './markdown.service.js';

describe('Ghost bookmark extraction pipeline', () => {
  it('preserves bookmark metadata through Readability and Markdown conversion', async () => {
    const sourceUrl = 'https://publisher.example/articles/story';
    const html = `
      <!doctype html>
      <html>
        <head><title>Example article</title></head>
        <body>
          <article>
            <p>Opening article content.</p>
            <figure class="kg-card kg-bookmark-card">
              <a class="kg-bookmark-container" href="https://example.com/bookmark-target">
                <div class="kg-bookmark-content">
                  <div class="kg-bookmark-title">Example bookmark</div>
                  <div class="kg-bookmark-description">Bookmark description.</div>
                </div>
                <div class="kg-bookmark-thumbnail">
                  <img src="https://cdn.example.com/bookmark-thumbnail.png" alt="" />
                </div>
              </a>
            </figure>
          </article>
        </body>
      </html>
    `;

    const readable = await contentExtractionService.extractReadableContent(html, sourceUrl);

    expect(readable.content).toContain('kg-bookmark-card');

    const markdown = markdownService.convertToMarkdown(readable.content ?? '', {
      baseUrl: sourceUrl,
      title: readable.title
    });

    expect(markdown).toContain('[**Example bookmark**](https://example.com/bookmark-target)');
    expect(markdown).toContain('Bookmark description.');
  });
});
