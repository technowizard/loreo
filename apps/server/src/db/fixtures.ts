/**
 * Shared demo fixtures used by both the seed script and integration tests.
 * Keeping them in sync means tests always run against data that reflects the demo.
 *
 * Query branch coverage (for home suggestions tests):
 *
 *   continueReading  — isRead=false, processingStatus='completed', readingProgress > 0
 *   shortReads       — isRead=false, isArchived=false, processingStatus='completed', readingTime < 10
 *   longReads        — isRead=false, isArchived=false, processingStatus='completed', readingTime >= 10
 *
 * Expected counts from this fixture set:
 *   continueReading  → "The Future of Web Performance" (readingProgress: 45)
 *   shortReads       → 3 articles (readingTime: 5, 7, 8) — includes the in-progress one
 *   longReads        → 2 articles (readingTime: 15, 22)
 *   recentlySaved    → 3 most recently created (capped by the query)
 */

export type LinkSeed = {
  url: string;
  title: string;
  readingTime: number;
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  isRead?: boolean;
  isFavorite?: boolean;
  isArchived?: boolean;
  readingProgress?: number;
  priority?: 'none' | 'low-priority' | 'this-week' | 'must-read';
  excerpt?: string;
  author?: string;
  coverImage?: string;
};

export const DEMO_LINKS: LinkSeed[] = [
  // --- shortReads (readingTime < 10, completed, unread, not archived) ---
  {
    url: 'https://web.dev/articles/cls',
    title: 'Cumulative Layout Shift: What It Is and How to Fix It',
    readingTime: 5,
    processingStatus: 'completed',
    author: 'Annie Sullivan',
    excerpt:
      'CLS measures visual stability. Learn how unexpected layout shifts hurt user experience and how to eliminate them.',
    priority: 'this-week'
  },
  {
    url: 'https://2ality.com/2022/10/javascript-decorators.html',
    title: 'JavaScript Decorators: An In-Depth Guide',
    readingTime: 7,
    processingStatus: 'completed',
    author: 'Axel Rauschmayer',
    excerpt:
      'Decorators are a stage 3 TC39 proposal. This post covers the complete API with practical examples.'
  },
  // --- shortReads + continueReading (readingProgress > 0) ---
  {
    url: 'https://web.dev/articles/performance-http2',
    title: 'The Future of Web Performance',
    readingTime: 8,
    processingStatus: 'completed',
    readingProgress: 45,
    author: 'Barry Pollard',
    excerpt: 'HTTP/2 and HTTP/3 change how browsers load resources. Here is what you need to know.',
    priority: 'must-read',
    isFavorite: true
  },
  // --- longReads (readingTime >= 10, completed, unread, not archived) ---
  {
    url: 'https://martinfowler.com/articles/microservices.html',
    title: 'Microservices: A Definition of This New Architectural Term',
    readingTime: 22,
    processingStatus: 'completed',
    author: 'Martin Fowler',
    excerpt:
      'The term microservice architecture has sprung up over the last few years to describe a particular way of designing software applications.',
    priority: 'low-priority'
  },
  {
    url: 'https://v8.dev/blog/turbofan-jit',
    title: 'Digging into the TurboFan JIT',
    readingTime: 15,
    processingStatus: 'completed',
    author: 'Ben L. Titzer',
    excerpt:
      "A deep dive into the internals of V8's optimizing compiler and how it achieves near-native performance.",
    isFavorite: true
  },
  // --- excluded: isRead=true → not counted in shortReads/longReads ---
  {
    url: 'https://exploringjs.com/impatient-js/',
    title: 'JavaScript for Impatient Programmers',
    readingTime: 6,
    processingStatus: 'completed',
    isRead: true
  },
  // --- excluded: isArchived=true → not counted in shortReads/longReads ---
  {
    url: 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/',
    title: 'A Complete Guide to Flexbox',
    readingTime: 9,
    processingStatus: 'completed',
    isArchived: true
  },
  // --- excluded: processingStatus='pending' → not counted anywhere ---
  {
    url: 'https://example.com/pending-article',
    title: 'Pending Article (not yet processed)',
    readingTime: 5,
    processingStatus: 'pending'
  }
];
