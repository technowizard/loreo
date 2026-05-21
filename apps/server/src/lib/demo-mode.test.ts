import { describe, expect, it } from 'vitest';

import { DEMO_MODE_DISABLED_MESSAGE, demoModeForbiddenResponse } from './demo-mode.js';

describe('demo-mode helper', () => {
  it('returns the canonical forbidden response', () => {
    const response = demoModeForbiddenResponse();

    expect(response.status).toBe(403);
    expect(response.message).toBe(DEMO_MODE_DISABLED_MESSAGE);
    expect(response.errors).toBeNull();
  });
});
