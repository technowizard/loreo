import { isValidUrl } from './url-validator.js';

export async function assertSafeArticleUrl(url: string): Promise<void> {
  if (!(await isValidUrl(url))) {
    throw new Error('Article URL is not allowed');
  }
}
