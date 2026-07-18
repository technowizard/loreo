import { waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/tests/mocks/server';
import { renderHookWithProviders } from '@/tests/test-utils';

import { useFeedSubscriptionSummary } from './get-feed-subscription-summary';

const API_URL = 'http://localhost:3000';

describe('useFeedSubscriptionSummary', () => {
  it('loads grouped item totals for one subscription', async () => {
    server.use(
      http.get(`${API_URL}/feeds/subscriptions/feed-1/summary`, () =>
        HttpResponse.json({
          message: 'ok',
          result: { dismissed: 2, new: 7, saved: 4 },
          status: 200
        })
      )
    );

    const { result } = renderHookWithProviders(() =>
      useFeedSubscriptionSummary({ subscriptionId: 'feed-1' })
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.result).toEqual({ dismissed: 2, new: 7, saved: 4 });
  });
});
