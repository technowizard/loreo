export function isDemoResetDatabaseUrl(databaseUrl: string): boolean {
  try {
    const url = new URL(databaseUrl);
    const host = url.hostname.toLowerCase();
    const database = url.pathname.slice(1).toLowerCase();

    return host.includes('demo') || database.includes('demo');
  } catch {
    return false;
  }
}

export function assertDemoResetCanRun(demoMode: boolean, databaseUrl: string): void {
  if (!demoMode) {
    throw new Error('Demo reset requires DEMO_MODE=true');
  }

  if (!isDemoResetDatabaseUrl(databaseUrl)) {
    throw new Error('Refusing to reset a non-demo database target');
  }
}
