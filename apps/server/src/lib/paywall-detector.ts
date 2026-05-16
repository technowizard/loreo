import { parseHTML } from 'linkedom';

interface PaywallRule {
  name: string;
  domains: string[];
  selectors?: string[];
  textPatterns?: RegExp[];
}

export interface PaywallResult {
  isPaywalled: boolean;
  matchedRule?: string;
}

const PAYWALL_RULES: PaywallRule[] = [
  {
    name: 'Medium',
    domains: ['medium.com'],
    selectors: ['meteredContent', '[data-testid="paywall"]'],
    textPatterns: [/Member-only story/]
  },
  {
    name: 'Substack',
    domains: ['substack.com'],
    selectors: ['.paywall', '.paywall-cta', '.subscribe-widget'],
    textPatterns: [/this post is for paid subscribers/i]
  },
  {
    name: 'New York Times',
    domains: ['nytimes.com'],
    selectors: ['[data-testid="inline-message"]', '.css-mcm29e'],
    textPatterns: [/subscribe to continue reading/i, /create a free account/i]
  },
  {
    name: 'Wall Street Journal',
    domains: ['wsj.com'],
    selectors: ['[data-module="Paywall"]', '.wsj-snippet-body'],
    textPatterns: [/subscribe now/i, /already a subscriber/i]
  },
  {
    name: 'The Atlantic',
    domains: ['theatlantic.com'],
    selectors: ['[data-paywall]', '.paywall-bar', '.subscribe-callout'],
    textPatterns: [/subscribe to the atlantic/i]
  },
  {
    name: 'Bloomberg',
    domains: ['bloomberg.com'],
    selectors: ['.fence-body', '[data-paywall-overlay]'],
    textPatterns: [/subscribe to read/i, /already a subscriber/i]
  },
  {
    name: 'Financial Times',
    domains: ['ft.com'],
    selectors: ['[data-barrier-type]', '.barrier-copy-title'],
    textPatterns: [/subscribe to continue reading/i, /become an ft subscriber/i]
  },
  {
    name: 'The Economist',
    domains: ['economist.com'],
    selectors: ['.paywall', '[data-component="paywall"]'],
    textPatterns: [/subscribe to the economist/i, /get full access/i]
  }
];

export function detectPaywall(html: string, url: string): PaywallResult {
  let hostname: string;

  try {
    hostname = new URL(url).hostname;
  } catch {
    return { isPaywalled: false };
  }

  const matchingRules = PAYWALL_RULES.filter((rule) =>
    rule.domains.some((domain) => hostname.includes(domain))
  );

  if (matchingRules.length === 0) {
    return { isPaywalled: false };
  }

  const { document } = parseHTML(html);
  const bodyText = document.body?.textContent ?? '';

  for (const rule of matchingRules) {
    if (rule.selectors?.some((selector) => document.querySelector(selector))) {
      return { isPaywalled: true, matchedRule: rule.name };
    }

    if (rule.textPatterns?.some((pattern) => pattern.test(bodyText))) {
      return { isPaywalled: true, matchedRule: rule.name };
    }
  }

  return { isPaywalled: false };
}
