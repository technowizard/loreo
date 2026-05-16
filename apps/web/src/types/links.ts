import type { Entity } from './api';
import type { Highlight } from './highlights';
import type { Tag } from './tags';

export type Link = Entity<{
  author: string | null;
  content: string | null;
  coverImage: string | null;
  excerpt: string | null;
  favicon: string | null;
  highlights: Highlight[];
  id: string;
  isArchived: boolean;
  isFavorite: boolean;
  isPaywalled: boolean;
  isRead: boolean;
  lastReadAt: string | null;
  priority: 'none' | 'low-priority' | 'this-week' | 'must-read';
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  publishedAt: string | null;
  readingProgress: number;
  readingTime: number;
  tags: Tag[];
  textContent: string | null;
  timeAdded: string;
  timeSpentReading: number;
  title: string | null;
  url: string;
}>;

export type StreamlinedLink = Omit<Link, 'content' | 'textContent'>;

export type CreateLinkResponse = {
  id: string;
  url: string;
};

export type UpdateLinkBody = Partial<
  Pick<
    Link,
    'isArchived' | 'isFavorite' | 'isRead' | 'priority' | 'readingProgress' | 'timeSpentReading'
  >
>;
