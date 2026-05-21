import { env } from './env-config.js';
import { errorResponse, HttpStatus } from './response.js';

export const DEMO_MODE_DISABLED_MESSAGE = 'This action is disabled in demo mode';

export function isDemoMode() {
  return env.isDemo;
}

export function demoModeForbiddenResponse() {
  return errorResponse(DEMO_MODE_DISABLED_MESSAGE, HttpStatus.FORBIDDEN);
}
