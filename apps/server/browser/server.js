import { launchOptions } from 'camoufox-js';
import { firefox } from 'playwright-core';

const PORT = parseInt(process.env.PORT || '4444', 10);
const WS_PATH = process.env.WS_PATH || '/camoufox';

async function main() {
  const options = await launchOptions({
    headless: true,
    os: 'linux',
    firefox_user_prefs: {
      'browser.sessionhistory.max_entries': 0,
      'browser.sessionhistory.max_total_viewers': 0,
      'javascript.options.mem.gc_incremental_slice_ms': 10
    }
  });

  const server = await firefox.launchServer({
    ...options,
    host: '0.0.0.0',
    port: PORT,
    wsPath: WS_PATH
  });

  console.log(`Browser server listening on port ${PORT}`);
  console.log(`WebSocket endpoint: ${server.wsEndpoint()}`);

  const shutdown = async () => {
    console.log('Shutting down...');
    await server.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('Failed to start browser server:', err);
  process.exit(1);
});
