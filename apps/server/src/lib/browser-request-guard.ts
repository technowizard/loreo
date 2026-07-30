import { isValidUrl } from './url-validator.js';

// Intentional layering with article-url-guard: browser requests are evaluated
// per subresource and return a boolean for Playwright route handling, whereas
// article navigation uses an exception-oriented domain boundary.
export async function isAllowedBrowserRequestUrl(url: string): Promise<boolean> {
  return isValidUrl(url);
}
