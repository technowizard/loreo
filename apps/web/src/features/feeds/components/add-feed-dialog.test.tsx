import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { server } from '@/tests/mocks/server';
import { render } from '@/tests/test-utils';

import type { FeedSubscription } from '@/types/feeds';

import { AddFeedDialog } from './add-feed-dialog';

const API_URL = 'http://localhost:3000';
const NOW = '2026-07-12T00:00:00.000Z';

const subscription: FeedSubscription = {
  autoSave: false,
  createdAt: NOW,
  description: null,
  etag: null,
  failureCount: 0,
  feedUrl: 'https://example.com/feed.xml',
  id: 'feed-1',
  imageUrl: null,
  lastError: null,
  lastFetchedAt: NOW,
  lastModified: null,
  lastSuccessfulFetchAt: NOW,
  nextFetchAfter: null,
  normalizedFeedUrl: 'https://example.com/feed.xml',
  siteUrl: 'https://example.com',
  status: 'active',
  title: 'Example Feed',
  updatedAt: NOW,
  userId: 'user-1'
};

describe('AddFeedDialog', () => {
  it('updates guidance when auto-save changes', async () => {
    const user = userEvent.setup();
    render(<AddFeedDialog onOpenChange={vi.fn()} open />);

    expect(screen.getByText(/will appear in Review first/i)).toBeInTheDocument();

    await user.click(screen.getByRole('switch', { name: /Auto-save New Items/i }));

    expect(screen.getByText(/saved directly to your library/i)).toBeInTheDocument();
  });

  it('keeps server errors inline and returns focus to the URL field', async () => {
    const user = userEvent.setup();
    server.use(
      http.post(`${API_URL}/feeds/subscriptions`, () =>
        HttpResponse.json(
          { message: 'This URL did not return a valid RSS or Atom feed', status: 400 },
          { status: 400 }
        )
      )
    );

    render(<AddFeedDialog onOpenChange={vi.fn()} open />);
    const urlInput = screen.getByLabelText(/Feed URL/i);
    await user.type(urlInput, subscription.feedUrl);
    await user.click(screen.getByRole('button', { name: /^Add Feed$/i }));

    expect(await screen.findByText(/Check the feed URL and try again/i)).toBeInTheDocument();
    await waitFor(() => expect(urlInput).toHaveFocus());
    expect(urlInput).toHaveValue(subscription.feedUrl);
  });

  it('locks dismissal while checking and closes after a successful add', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    let releaseRequest: () => void = () => undefined;
    const requestGate = new Promise<void>((resolve) => {
      releaseRequest = resolve;
    });

    server.use(
      http.post(`${API_URL}/feeds/subscriptions`, async () => {
        await requestGate;
        return HttpResponse.json({
          message: 'Feed subscription created successfully',
          result: {
            autoSaved: 0,
            createdSubscription: true,
            fetched: true,
            pruned: 0,
            staged: 3,
            subscription
          },
          status: 202
        });
      })
    );

    render(<AddFeedDialog onOpenChange={onOpenChange} open />);
    await user.type(screen.getByLabelText(/Feed URL/i), subscription.feedUrl);
    await user.click(screen.getByRole('button', { name: /^Add Feed$/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Checking and Adding/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /^Cancel$/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /^Close$/i })).toBeDisabled();
    });

    releaseRequest();

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });
});
