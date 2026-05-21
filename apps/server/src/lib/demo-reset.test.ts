import { describe, expect, it } from 'vitest';

import { assertDemoResetCanRun, isDemoResetDatabaseUrl } from './demo-reset.js';

describe('demo reset safety', () => {
  it('accepts demo-looking database urls', () => {
    expect(isDemoResetDatabaseUrl('postgresql://user:pass@demo-db.example.com/demo')).toBe(true);
    expect(isDemoResetDatabaseUrl('postgresql://user:pass@localhost/demo-loreo')).toBe(true);
  });

  it('rejects obvious non-demo database urls', () => {
    expect(isDemoResetDatabaseUrl('postgresql://user:pass@prod.example.com/postgres')).toBe(false);
    expect(isDemoResetDatabaseUrl('not-a-url')).toBe(false);
  });

  it('requires demo mode and a demo database target', () => {
    expect(() =>
      assertDemoResetCanRun(false, 'postgresql://user:pass@demo-db.example.com/demo')
    ).toThrow('Demo reset requires DEMO_MODE=true');
    expect(() =>
      assertDemoResetCanRun(true, 'postgresql://user:pass@prod.example.com/postgres')
    ).toThrow('Refusing to reset a non-demo database target');
  });
});
