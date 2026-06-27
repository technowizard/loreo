import {
  ArrowSquareOutIcon,
  BookmarkSimpleIcon,
  CheckCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  RssIcon,
  WarningCircleIcon
} from '@phosphor-icons/react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import { cn } from '@/lib/utils';

// PROTOTYPE — throwaway UI exploration for RSS Feed Support.
// Three variants of the Feeds/Review surface, switchable via `?variant=`, on `/prototype-feeds`.

const subscriptions = [
  {
    autoSave: false,
    domain: 'interconnected.org',
    error: null,
    id: 'feeds-1',
    lastFetched: '18 min ago',
    newCount: 6,
    title: 'Interconnected',
    url: 'https://interconnected.org/home/feed'
  },
  {
    autoSave: true,
    domain: 'ciechanow.ski',
    error: null,
    id: 'feeds-2',
    lastFetched: '2 hr ago',
    newCount: 0,
    title: 'Bartosz Ciechanowski',
    url: 'https://ciechanow.ski/atom.xml'
  },
  {
    autoSave: false,
    domain: 'example.com',
    error: 'Last fetch timed out. Loreo will try again later.',
    id: 'feeds-3',
    lastFetched: 'Yesterday',
    newCount: 2,
    title: 'Quiet Technical Notes',
    url: 'https://example.com/rss.xml'
  },
  {
    autoSave: false,
    domain: 'werd.io',
    error: null,
    id: 'feeds-4',
    lastFetched: '31 min ago',
    newCount: 4,
    title: 'Werd I/O',
    url: 'https://werd.io/content/feed'
  },
  {
    autoSave: false,
    domain: 'simonwillison.net',
    error: null,
    id: 'feeds-5',
    lastFetched: '44 min ago',
    newCount: 9,
    title: 'Simon Willison’s Weblog',
    url: 'https://simonwillison.net/atom/everything/'
  },
  {
    autoSave: true,
    domain: 'jvns.ca',
    error: null,
    id: 'feeds-6',
    lastFetched: '1 hr ago',
    newCount: 0,
    title: 'Julia Evans',
    url: 'https://jvns.ca/atom.xml'
  },
  {
    autoSave: false,
    domain: 'pluralistic.net',
    error: null,
    id: 'feeds-7',
    lastFetched: '3 hr ago',
    newCount: 5,
    title: 'Pluralistic',
    url: 'https://pluralistic.net/feed/'
  },
  {
    autoSave: false,
    domain: 'newsletter.pragmaticengineer.com',
    error: 'Feed returned 429. Loreo is waiting before trying again.',
    id: 'feeds-8',
    lastFetched: '8 hr ago',
    newCount: 1,
    title: 'The Pragmatic Engineer',
    url: 'https://newsletter.pragmaticengineer.com/feed'
  },
  {
    autoSave: false,
    domain: 'maggieappleton.com',
    error: null,
    id: 'feeds-9',
    lastFetched: '12 hr ago',
    newCount: 3,
    title: 'Maggie Appleton',
    url: 'https://maggieappleton.com/rss.xml'
  },
  {
    autoSave: false,
    domain: 'rachelbythebay.com',
    error: null,
    id: 'feeds-10',
    lastFetched: 'Yesterday',
    newCount: 7,
    title: 'Rachel by the Bay',
    url: 'https://rachelbythebay.com/w/atom.xml'
  },
  {
    autoSave: false,
    domain: 'inkandswitch.com',
    error: null,
    id: 'feeds-11',
    lastFetched: '2 days ago',
    newCount: 2,
    title: 'Ink & Switch',
    url: 'https://www.inkandswitch.com/rss.xml'
  },
  {
    autoSave: false,
    domain: 'nadia.xyz',
    error: 'Feed metadata changed. Loreo kept the old title until the next clean fetch.',
    id: 'feeds-12',
    lastFetched: '4 days ago',
    newCount: 1,
    title: 'Nadia Asparouhova',
    url: 'https://nadia.xyz/rss.xml'
  }
];

const feedItems = [
  {
    author: 'Matt Webb',
    domain: 'interconnected.org',
    excerpt:
      'A short meditation on small tools, slow attention, and how software changes the shape of a morning.',
    feedId: 'feeds-1',
    id: 'item-1',
    publishedAt: 'Today',
    source: 'Interconnected',
    state: 'new',
    title: 'Notes from a room full of clocks'
  },
  {
    author: 'Bartosz Ciechanowski',
    domain: 'ciechanow.ski',
    excerpt:
      'A visual explanation of a familiar mechanism, starting from first principles and building up patiently.',
    feedId: 'feeds-2',
    id: 'item-2',
    publishedAt: 'Yesterday',
    source: 'Bartosz Ciechanowski',
    state: 'saved',
    title: 'The shape of gears'
  },
  {
    author: 'A. Reader',
    domain: 'example.com',
    excerpt:
      'Practical notes on keeping local-first tools useful without turning them into another dashboard.',
    feedId: 'feeds-3',
    id: 'item-3',
    publishedAt: '2 days ago',
    source: 'Quiet Technical Notes',
    state: 'new',
    title: 'A calmer way to collect references'
  },
  {
    author: 'Matt Webb',
    domain: 'interconnected.org',
    excerpt:
      'A lightweight sketch of what happens when an interface gives people room to return later.',
    feedId: 'feeds-1',
    id: 'item-4',
    publishedAt: '3 days ago',
    source: 'Interconnected',
    state: 'dismissed',
    title: 'Later is a useful state'
  },
  {
    author: 'Ben Werdmuller',
    domain: 'werd.io',
    excerpt:
      'Notes on independent publishing, small protocols, and the social texture of owning your writing online.',
    feedId: 'feeds-4',
    id: 'item-5',
    publishedAt: 'Today',
    source: 'Werd I/O',
    state: 'new',
    title: 'Owning the little pieces'
  },
  {
    author: 'Simon Willison',
    domain: 'simonwillison.net',
    excerpt:
      'A compact walkthrough of a surprising command-line trick and the rough edges that made it memorable.',
    feedId: 'feeds-5',
    id: 'item-6',
    publishedAt: 'Today',
    source: 'Simon Willison’s Weblog',
    state: 'new',
    title: 'Small tools with sharp handles'
  },
  {
    author: 'Julia Evans',
    domain: 'jvns.ca',
    excerpt:
      'A friendly explanation of a networking behavior that looks mysterious until the packet path is drawn out.',
    feedId: 'feeds-6',
    id: 'item-7',
    publishedAt: 'Yesterday',
    source: 'Julia Evans',
    state: 'saved',
    title: 'Why did my DNS do that?'
  },
  {
    author: 'Cory Doctorow',
    domain: 'pluralistic.net',
    excerpt:
      'A long-form argument about interoperability, reader agency, and why defaults matter more than slogans.',
    feedId: 'feeds-7',
    id: 'item-8',
    publishedAt: 'Yesterday',
    source: 'Pluralistic',
    state: 'new',
    title: 'The durable web is a policy choice'
  },
  {
    author: 'Gergely Orosz',
    domain: 'newsletter.pragmaticengineer.com',
    excerpt:
      'A field report on engineering management, hiring loops, and the invisible maintenance cost of platforms.',
    feedId: 'feeds-8',
    id: 'item-9',
    publishedAt: '2 days ago',
    source: 'The Pragmatic Engineer',
    state: 'new',
    title: 'What platform teams inherit'
  },
  {
    author: 'Maggie Appleton',
    domain: 'maggieappleton.com',
    excerpt:
      'A beautifully illustrated note on digital gardens, knowledge rituals, and the difference between collecting and returning.',
    feedId: 'feeds-9',
    id: 'item-10',
    publishedAt: '3 days ago',
    source: 'Maggie Appleton',
    state: 'new',
    title: 'Tending notes without worshipping them'
  },
  {
    author: 'Rachel',
    domain: 'rachelbythebay.com',
    excerpt:
      'A terse production story about logs, queues, and the one metric nobody thought to graph.',
    feedId: 'feeds-10',
    id: 'item-11',
    publishedAt: '3 days ago',
    source: 'Rachel by the Bay',
    state: 'new',
    title: 'The graph was lying by omission'
  },
  {
    author: 'Ink & Switch',
    domain: 'inkandswitch.com',
    excerpt:
      'Research notes on malleable software and local collaboration that feels closer to sketching than filing.',
    feedId: 'feeds-11',
    id: 'item-12',
    publishedAt: '4 days ago',
    source: 'Ink & Switch',
    state: 'new',
    title: 'Tools as rooms, not rails'
  },
  {
    author: 'Nadia Asparouhova',
    domain: 'nadia.xyz',
    excerpt:
      'A careful essay about public goods, maintenance, and what happens after the launch attention fades.',
    feedId: 'feeds-12',
    id: 'item-13',
    publishedAt: '5 days ago',
    source: 'Nadia Asparouhova',
    state: 'new',
    title: 'Maintenance after applause'
  },
  {
    author: 'Simon Willison',
    domain: 'simonwillison.net',
    excerpt:
      'A short link roundup with enough context to decide whether the rabbit hole is worth saving for later.',
    feedId: 'feeds-5',
    id: 'item-14',
    publishedAt: '5 days ago',
    source: 'Simon Willison’s Weblog',
    state: 'dismissed',
    title: 'Links that almost became tabs'
  },
  {
    author: 'Cory Doctorow',
    domain: 'pluralistic.net',
    excerpt:
      'A dense policy essay that might be worth saving, but probably not reading in the middle of a workday.',
    feedId: 'feeds-7',
    id: 'item-15',
    publishedAt: '6 days ago',
    source: 'Pluralistic',
    state: 'new',
    title: 'A right to repair the timeline'
  },
  {
    author: 'Rachel',
    domain: 'rachelbythebay.com',
    excerpt:
      'A debugging story where the real bug was not the crash, but the assumption that made it invisible.',
    feedId: 'feeds-10',
    id: 'item-16',
    publishedAt: '1 week ago',
    source: 'Rachel by the Bay',
    state: 'saved',
    title: 'The crash was only the messenger'
  }
];
const stateSummary = {
  currentPolicy: 'Review by default; auto-save only on trusted feeds',
  duePolling: 'Global cadence with manual refresh and backoff',
  retention: '90 days / latest 500 per feed',
  stagedNew: feedItems.filter((item) => item.state === 'new').length,
  subscriptions: subscriptions.length
};

interface VariantProps {
  currentVariant: string;
}

function PrototypeStatePanel({ className, currentVariant }: VariantProps & { className?: string }) {
  return (
    <div
      className={cn('rounded-3xl border border-dashed border-border bg-muted/30 p-4', className)}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-medium">Prototype state</p>
        <Badge variant="outline">variant {currentVariant}</Badge>
      </div>
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        {Object.entries(stateSummary).map(([key, value]) => (
          <div
            className="flex items-start justify-between gap-3 rounded-2xl bg-background/70 px-3 py-2"
            key={key}
          >
            <dt className="text-muted-foreground">{key}</dt>
            <dd className="text-right font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function AddFeedBar({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn('flex gap-2', compact && 'flex-col')}>
      <div className="relative flex-1">
        <RssIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input className="pl-9" placeholder="Paste a public RSS or Atom feed URL" readOnly />
      </div>
      <Button type="button">
        <PlusIcon className="size-4" />
        Add feed
      </Button>
    </div>
  );
}

function FeedItemCard({
  item,
  quiet = false
}: {
  item: (typeof feedItems)[number];
  quiet?: boolean;
}) {
  return (
    <article
      className={cn('rounded-3xl border border-border bg-card p-4', quiet && 'bg-background')}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>{item.source}</span>
        <span>·</span>
        <span>{item.publishedAt}</span>
        {item.state === 'saved' && <Badge variant="success">Saved</Badge>}
        {item.state === 'dismissed' && <Badge variant="secondary">Dismissed</Badge>}
      </div>
      <h3 className="text-base font-semibold tracking-tight">{item.title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.excerpt}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button disabled={item.state !== 'new'} size="sm" type="button">
          <BookmarkSimpleIcon className="size-4" />
          Save article
        </Button>
        <Button disabled={item.state !== 'new'} size="sm" type="button" variant="outline">
          Dismiss
        </Button>
        <Button size="sm" type="button" variant="ghost">
          <ArrowSquareOutIcon className="size-4" />
          Original
        </Button>
      </div>
    </article>
  );
}

function SubscriptionRow({ subscription }: { subscription: (typeof subscriptions)[number] }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-medium">{subscription.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{subscription.domain}</p>
        </div>
        <Badge variant={subscription.autoSave ? 'success' : 'outline'}>
          {subscription.autoSave ? 'Auto-save' : `${subscription.newCount} new`}
        </Badge>
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <ClockIcon className="size-3.5" />
        Fetched {subscription.lastFetched}
      </div>
      {subscription.error && (
        <div className="mt-3 flex gap-2 rounded-2xl border border-warning-500/30 bg-warning-500/10 p-3 text-xs text-warning-700 dark:text-warning-400">
          <WarningCircleIcon className="mt-0.5 size-4 shrink-0" />
          <p>{subscription.error}</p>
        </div>
      )}
    </div>
  );
}

export function VariantAReviewDesk({ currentVariant }: VariantProps) {
  return (
    <div className="space-y-6 pb-24">
      <section className="rounded-4xl border border-border bg-card p-6">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <Badge variant="outline">Prototype · review desk</Badge>
            <h1 className="mt-4 text-2xl font-bold tracking-tight">
              Feeds, held at the edge of the shelf.
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              New feed entries wait here until you decide they are worth saving. The reading list
              stays reserved for articles you chose.
            </p>
          </div>
          <AddFeedBar />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-3 lg:sticky lg:top-24 lg:max-h-[calc(100svh-8rem)] lg:self-start lg:overflow-y-auto lg:pr-2">
          <div className="bg-background/90 sticky top-0 z-10 flex items-center justify-between pb-2 backdrop-blur">
            <h2 className="text-lg font-semibold">Subscriptions</h2>
            <Button size="sm" type="button" variant="outline">
              Refresh due
            </Button>
          </div>
          {subscriptions.map((subscription) => (
            <SubscriptionRow key={subscription.id} subscription={subscription} />
          ))}
        </aside>

        <main className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Ready to review</h2>
              <p className="text-sm text-muted-foreground">
                {stateSummary.stagedNew} new entries, no pressure to keep all of them.
              </p>
            </div>
            <div className="relative sm:w-72">
              <MagnifyingGlassIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input className="pl-9" placeholder="Filter staged items" readOnly />
            </div>
          </div>
          {feedItems.map((item) => (
            <FeedItemCard item={item} key={item.id} />
          ))}
        </main>
      </div>

      <PrototypeStatePanel currentVariant={currentVariant} />
    </div>
  );
}

export function VariantBQuietRiver({ currentVariant }: VariantProps) {
  return (
    <div className="grid gap-6 pb-24 xl:grid-cols-[1fr_340px]">
      <main className="space-y-5">
        <header className="border-b border-border pb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RssIcon className="size-4" />
            Feeds prototype · quiet river
          </div>
          <h1 className="mt-3 max-w-3xl text-2xl font-bold tracking-tight">
            A single stream of things you might want to keep.
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            This version removes feed management from the primary path. The user scans a gentle
            chronological river and saves only what belongs in Loreo.
          </p>
        </header>

        <div className="rounded-4xl border border-border bg-card p-3 sm:p-4">
          <div className="flex flex-wrap gap-2">
            <Badge>New</Badge>
            <Badge variant="outline">Saved</Badge>
            <Badge variant="outline">Dismissed</Badge>
            <Badge variant="outline">All feeds</Badge>
          </div>
        </div>

        <div className="relative pl-5 before:absolute before:top-0 before:bottom-0 before:left-2 before:w-px before:bg-border">
          {feedItems.map((item) => (
            <div className="relative pb-5" key={item.id}>
              <div className="bg-background absolute top-6 -left-[18px] flex size-5 items-center justify-center rounded-full border border-border">
                {item.state === 'saved' ? (
                  <CheckCircleIcon className="text-success-500 size-3.5" />
                ) : (
                  <RssIcon className="text-primary size-3.5" />
                )}
              </div>
              <FeedItemCard item={item} quiet />
            </div>
          ))}
        </div>
      </main>

      <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <Card>
          <CardHeader>
            <CardTitle>Add a feed</CardTitle>
          </CardHeader>
          <CardContent>
            <AddFeedBar compact />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Feed health</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[42svh] space-y-3 overflow-y-auto pr-2">
            {subscriptions.map((subscription) => (
              <div
                className="flex items-center justify-between gap-3 text-sm"
                key={subscription.id}
              >
                <div>
                  <p className="font-medium">{subscription.title}</p>
                  <p className="text-xs text-muted-foreground">{subscription.lastFetched}</p>
                </div>
                <Badge variant={subscription.error ? 'warning' : 'outline'}>
                  {subscription.error ? 'Backoff' : 'OK'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <PrototypeStatePanel currentVariant={currentVariant} />
      </aside>
    </div>
  );
}

export function VariantCFeedShelves({ currentVariant }: VariantProps) {
  const orderedShelves = [...subscriptions].sort((a, b) => {
    const score = (subscription: (typeof subscriptions)[number]) => {
      if (subscription.newCount > 0) return 0;
      if (subscription.error) return 1;
      return 2;
    };

    return score(a) - score(b) || b.newCount - a.newCount;
  });

  return (
    <div className="space-y-6 pb-24">
      <header className="rounded-4xl border border-border bg-card p-5 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_520px] lg:items-end">
          <div>
            <Badge variant="outline">Prototype · recommended shelves</Badge>
            <h1 className="mt-4 text-2xl font-bold tracking-tight">
              Review by source, save only what belongs on the shelf.
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Feeds with new entries rise first, warnings stay attached to their source, and quiet
              feeds collapse so mobile review stays light.
            </p>
          </div>
          <AddFeedBar />
        </div>
      </header>

      <div className="sticky top-16 z-20 -mx-4 overflow-x-auto px-4 py-1 md:top-20">
        <div className="bg-background/90 flex w-full gap-1 rounded-full border border-border p-1 shadow-xs backdrop-blur sm:w-max sm:gap-2">
          {[
            ['New', stateSummary.stagedNew],
            ['Saved', feedItems.filter((item) => item.state === 'saved').length],
            ['Dismissed', feedItems.filter((item) => item.state === 'dismissed').length],
            ['Feeds', subscriptions.length]
          ].map(([label, count], index) => (
            <button
              className={cn(
                'flex-1 rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors sm:flex-none',
                index === 0
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
              key={label}
              type="button"
            >
              {label} <span className="opacity-75">{count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="columns-1 gap-4 lg:columns-2 xl:columns-3">
        {orderedShelves.map((subscription) => {
          const items = feedItems.filter((item) => item.feedId === subscription.id);
          const newItems = items.filter((item) => item.state === 'new');
          const hasPriority = subscription.newCount > 0 || Boolean(subscription.error);

          return (
            <details
              className="group mb-4 block break-inside-avoid rounded-4xl border border-border bg-card p-4 open:shadow-xs"
              key={subscription.id}
              open={hasPriority}
            >
              <summary className="list-none cursor-pointer [&::-webkit-details-marker]:hidden">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate font-semibold">{subscription.title}</h2>
                      <span className="text-muted-foreground transition-transform group-open:rotate-90">
                        ›
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {subscription.domain}
                    </p>
                  </div>
                  <Badge
                    variant={
                      subscription.error
                        ? 'warning'
                        : subscription.autoSave
                          ? 'success'
                          : subscription.newCount > 0
                            ? 'default'
                            : 'outline'
                    }
                  >
                    {subscription.error
                      ? 'Backoff'
                      : subscription.autoSave
                        ? 'Auto'
                        : subscription.newCount > 0
                          ? `${subscription.newCount} new`
                          : 'Quiet'}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>Fetched {subscription.lastFetched}</span>
                  <span>·</span>
                  <span>{newItems.length} waiting here</span>
                </div>
              </summary>

              <div className="mt-4 border-t border-border pt-4">
                {subscription.error && (
                  <p className="mb-4 rounded-2xl bg-warning-500/10 p-3 text-xs text-warning-700 dark:text-warning-400">
                    {subscription.error}
                  </p>
                )}

                <div className="space-y-3">
                  {items.length > 0 ? (
                    items.map((item) => (
                      <div
                        className="rounded-3xl border border-border bg-background p-4"
                        key={item.id}
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="text-xs text-muted-foreground">{item.publishedAt}</span>
                          <Badge variant={item.state === 'new' ? 'default' : 'outline'}>
                            {item.state}
                          </Badge>
                        </div>
                        <h3 className="text-sm font-semibold leading-5">{item.title}</h3>
                        <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">
                          {item.excerpt}
                        </p>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <Button disabled={item.state !== 'new'} size="sm" type="button">
                            Save
                          </Button>
                          <Button
                            disabled={item.state !== 'new'}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-3xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                      Nothing waiting here. Auto-saved entries go straight to Articles.
                    </div>
                  )}
                </div>
              </div>
            </details>
          );
        })}
      </div>

      <PrototypeStatePanel currentVariant={currentVariant} />
    </div>
  );
}
