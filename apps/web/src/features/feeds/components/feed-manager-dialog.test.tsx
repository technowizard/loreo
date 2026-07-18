import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();

  return {
    ...actual,
    Link: ({ children }: { children: ReactNode }) => <a href="#feed-items">{children}</a>
  };
});

import { server } from '@/tests/mocks/server';
import { render } from '@/tests/test-utils';

import type { FeedSubscription } from '@/types/feeds';

import { FeedManagerDialog } from './feed-manager-dialog';

const API_URL = 'http://localhost:3000';
const NOW = '2026-07-18T00:00:00.000Z';

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

describe('FeedManagerDialog', () => {
  it('renders the subscription image as its source identity', () => {
    const imageUrl = 'https://publisher.example/source-logo.png';
    render(
      <FeedManagerDialog
        onOpenChange={vi.fn()}
        onQueryChange={vi.fn()}
        onSelectFeed={vi.fn()}
        onStartAdd={vi.fn()}
        onStatusFilterChange={vi.fn()}
        open
        query=""
        selectedFeedId="add"
        statusFilter="all"
        subscriptions={[{ ...subscription, imageUrl }]}
        subscriptionsLoading={false}
      />
    );

    const sourceImage = document.querySelector(`img[src="${imageUrl}"]`);
    expect(sourceImage).toBeInTheDocument();

    fireEvent.error(sourceImage!);
    expect(document.querySelector(`img[src="${imageUrl}"]`)).not.toBeInTheDocument();
    expect(screen.getByText('EF')).toBeInTheDocument();
  });

  it('confirms deletion and selects Add Feed when the last subscription is removed', async () => {
    const user = userEvent.setup();
    const onSelectFeed = vi.fn();
    let deletedSubscriptionId: string | null = null;

    server.use(
      http.get(`${API_URL}/feeds/subscriptions/:id/summary`, () =>
        HttpResponse.json({ message: 'Summary unavailable', status: 500 }, { status: 500 })
      ),
      http.delete(`${API_URL}/feeds/subscriptions/:id`, ({ params }) => {
        deletedSubscriptionId = params.id as string;
        return HttpResponse.json({
          message: 'Feed subscription deleted successfully',
          result: { id: params.id },
          status: 200
        });
      })
    );

    render(
      <FeedManagerDialog
        onOpenChange={vi.fn()}
        onQueryChange={vi.fn()}
        onSelectFeed={onSelectFeed}
        onStartAdd={vi.fn()}
        onStatusFilterChange={vi.fn()}
        open
        query=""
        selectedFeedId={subscription.id}
        statusFilter="all"
        subscriptions={[subscription]}
        subscriptionsLoading={false}
      />
    );

    await user.click(await screen.findByRole('button', { name: /delete feed/i }));
    expect(screen.getByRole('dialog', { name: /delete example feed/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^delete feed$/i }));

    await waitFor(() => expect(deletedSubscriptionId).toBe(subscription.id));
    expect(onSelectFeed).toHaveBeenCalledWith('add');
  });

  it('confirms deletion and selects the next remaining feed', async () => {
    const user = userEvent.setup();
    const onClearFilters = vi.fn();
    const onSelectFeed = vi.fn();
    const secondSubscription = {
      ...subscription,
      feedUrl: 'https://second.example/feed.xml',
      id: 'feed-2',
      normalizedFeedUrl: 'https://second.example/feed.xml',
      siteUrl: 'https://second.example',
      status: 'paused' as const,
      title: 'Second Feed'
    };

    server.use(
      http.get(`${API_URL}/feeds/subscriptions/:id/summary`, () =>
        HttpResponse.json({
          message: 'Feed subscription summary fetched successfully',
          result: { dismissed: 0, new: 2, saved: 1 },
          status: 200
        })
      ),
      http.delete(`${API_URL}/feeds/subscriptions/:id`, ({ params }) =>
        HttpResponse.json({
          message: 'Feed subscription deleted successfully',
          result: { id: params.id },
          status: 200
        })
      )
    );

    render(
      <FeedManagerDialog
        onClearFilters={onClearFilters}
        onOpenChange={vi.fn()}
        onQueryChange={vi.fn()}
        onSelectFeed={onSelectFeed}
        onStartAdd={vi.fn()}
        onStatusFilterChange={vi.fn()}
        open
        query=""
        selectedFeedId={subscription.id}
        statusFilter="active"
        subscriptions={[subscription, secondSubscription]}
        subscriptionsLoading={false}
      />
    );

    await user.click(await screen.findByRole('button', { name: 'Delete Feed' }));
    const confirmation = screen.getByRole('dialog', { name: `Delete ${subscription.title}?` });
    await user.click(within(confirmation).getByRole('button', { name: 'Delete Feed' }));

    await waitFor(() => expect(onSelectFeed).toHaveBeenCalledWith(secondSubscription.id));
    expect(onClearFilters).toHaveBeenCalledOnce();
  });

  it('locks close, Escape, and mobile Back while an embedded feed add is pending', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onSelectFeed = vi.fn();
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

    render(
      <FeedManagerDialog
        onOpenChange={onOpenChange}
        onQueryChange={vi.fn()}
        onSelectFeed={onSelectFeed}
        onStartAdd={vi.fn()}
        onStatusFilterChange={vi.fn()}
        open
        query=""
        selectedFeedId="add"
        statusFilter="all"
        subscriptions={[subscription]}
        subscriptionsLoading={false}
      />
    );

    const urlInput = screen.getByLabelText(/Feed URL/i);
    const form = urlInput.closest('form');
    if (!form) throw new Error('Expected embedded Add Feed form');

    await user.type(urlInput, subscription.feedUrl);
    await user.click(within(form).getByRole('button', { name: /^Add Feed$/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Close$/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /Back to feeds/i })).toBeDisabled();
    });

    await user.keyboard('{Escape}');
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/Feed URL/i)).toBeInTheDocument();

    releaseRequest();
    await waitFor(() => expect(onSelectFeed).toHaveBeenCalledWith(subscription.id));
  });
});
