import { beforeEach, describe, expect, it, vi } from 'vitest';

const queueMock = vi.hoisted(() => ({
  close: vi.fn(),
  on: vi.fn(),
  upsertJobScheduler: vi.fn(async () => ({ id: 'scheduled-job' }))
}));

vi.mock('@/lib/job-queue.js', () => ({
  createQueue: vi.fn(() => queueMock)
}));

const { registerFeedPollScheduler } = await import('./feed-poll-scheduler.queue.js');

describe('feed poll scheduler queue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('upserts one stable recurring scan across server instances', async () => {
    await registerFeedPollScheduler({ batchSize: 75, intervalMs: 30_000 });
    await registerFeedPollScheduler({ batchSize: 75, intervalMs: 30_000 });

    expect(queueMock.upsertJobScheduler).toHaveBeenCalledTimes(2);
    for (const callNumber of [1, 2]) {
      expect(queueMock.upsertJobScheduler).toHaveBeenNthCalledWith(
        callNumber,
        'feed-poll-due-scan',
        { every: 30_000 },
        {
          data: { batchSize: 75 },
          name: 'scan-due-feeds'
        }
      );
    }
  });
});
