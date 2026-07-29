import { isValidUrl } from './url-validator.js';

export async function assertSafeFeedUrl(url: string): Promise<void> {
  if (!(await isValidUrl(url))) {
    throw new Error('Feed URL is not allowed');
  }
}

export async function isSafeFeedEntryUrl(url: string): Promise<boolean> {
  return isValidUrl(url);
}
