import type { StreamlinedLink } from './links';

export type HomeSuggestions = {
  continueReading: {
    coverImage: string | null;
    id: string;
    lastReadAt: string;
    progress: number;
    readingTime: number;
    title: string;
  } | null;
  longReads: {
    totalArticles: number;
    totalReadingTime: number;
  };
  recentlySaved: StreamlinedLink[];
  hasReadArticle: boolean;
  shortReads: {
    totalArticles: number;
    totalReadingTime: number;
  };
};
