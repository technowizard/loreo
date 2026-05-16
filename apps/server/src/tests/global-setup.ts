import { execSync } from 'child_process';

export async function setup() {
  execSync('pnpm db:migrate:test', { stdio: 'inherit' });
}
