import type { Highlight } from './highlights.js';
import type { Tag } from './tags.js';

export interface LinkData {
  author: string | null;
  content: string | null; // html or markdown content
  coverImage: string | null;
  createdAt?: string;
  errorMessage: string | null;
  excerpt: string | null;
  favicon: string | null;
  highlights?: Highlight[];
  id: string;
  isArchived: boolean;
  isFavorite: boolean;
  isPaywalled: boolean;
  isRead: boolean;
  lastReadAt: Date | null;
  priority: 'none' | 'low-priority' | 'this-week' | 'must-read';
  processingStartedAt?: Date | null;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  publishedAt: Date | null; // ISO string
  readingProgress: number;
  readingTime: number; // reading time in minute
  tags?: Tag[];
  textContent: string | null;
  timeSpentReading: number;
  title: string;
  updatedAt?: Date;
  url: string;
  userId: string;
  importSessionId?: string | null; // import session tracking
}

interface ContinueReading {
  coverImage: string | null;
  id: string;
  lastReadAt: string | Date;
  progress: number;
  readingTime: number;
  title: string;
}

interface GroupedReads {
  totalArticles: number;
  totalReadingTime: number;
}

export interface HomeSuggestions {
  continueReading: ContinueReading | null;
  hasReadArticle: boolean;
  recentlySaved: Omit<
    LinkData,
    'content' | 'userId' | 'errorMessage' | 'lastReadAt' | 'updatedAt'
  >[];
  longReads: GroupedReads;
  shortReads: GroupedReads;
}
