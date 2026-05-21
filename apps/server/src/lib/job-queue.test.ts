import { describe, expect, it, vi } from 'vitest';

import { importWithEnv } from '@/tests/env.js';

const bullmqMock = vi.hoisted(() => ({
  Queue: vi.fn(),
  Worker: vi.fn()
}));

vi.mock('bullmq', () => bullmqMock);

describe('job-queue', () => {
  it('returns no-op queues and workers in demo mode', async () => {
    const { createQueue, createWorker } = await importWithEnv(
      {
        DATABASE_URL: 'postgresql://demo:secret@db.example.com:5432/loreo',
        JWT_SECRET: 'secret',
        REDIS_HOST: 'localhost',
        DEMO_MODE: 'true'
      },
      () => import('./job-queue.js')
    );

    const queue = createQueue('content-extraction');
    const worker = createWorker('content-extraction', vi.fn());

    expect(bullmqMock.Queue).not.toHaveBeenCalled();
    expect(bullmqMock.Worker).not.toHaveBeenCalled();

    expect(queue.on('waiting', vi.fn())).toBe(queue);
    await expect(queue.add('process' as never, {} as never)).resolves.toEqual(
      expect.objectContaining({ id: expect.any(String) })
    );
    await expect(queue.getJob('job-1')).resolves.toBeNull();
    await expect(queue.close()).resolves.toBeUndefined();

    expect(worker.on('completed', vi.fn())).toBe(worker);
    await expect(worker.close()).resolves.toBeUndefined();
  });
});
