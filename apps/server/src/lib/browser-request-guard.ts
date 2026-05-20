import { isValidUrl } from './url-validator.js';

export async function isAllowedBrowserRequestUrl(url: string): Promise<boolean> {
  return isValidUrl(url);
}
