import type { ConnectionStatus } from './admin-health.service.types.js';

export interface ConnectionCheck {
  id: string;
  label: string;
  latencyMs?: number;
  message?: string;
  status: ConnectionStatus;
}

export interface AdminHealthService {
  checkConnections(): Promise<ConnectionCheck[]>;
}

export class DefaultAdminHealthService implements AdminHealthService {
  async checkConnections(): Promise<ConnectionCheck[]> {
    const browser = await this.checkBrowser();
    return [browser];
  }

  private async checkBrowser(): Promise<ConnectionCheck> {
    const { browserService } = await import('./browser.service.js');
    const result = await browserService.checkHealth();
    return {
      id: 'browser',
      label: 'Headless browser (camoufox)',
      latencyMs: result.latencyMs,
      message: result.message,
      status: result.status
    };
  }
}

export const adminHealthService = new DefaultAdminHealthService();
