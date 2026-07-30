import { isValidUrl } from './url-validator.js';

// Keep this domain-specific assertion separate from browser-request-guard:
// article navigation reports a typed failure to the extraction workflow, while
// browser subresource interception needs a boolean decision per request.
export async function assertSafeArticleUrl(url: string): Promise<void> {
  if (!(await isValidUrl(url))) {
    throw new Error('Article URL is not allowed');
  }
}
