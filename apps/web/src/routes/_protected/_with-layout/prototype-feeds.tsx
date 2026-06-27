import { createFileRoute } from '@tanstack/react-router';

import { PrototypeSwitcher } from '@/components/prototype/prototype-switcher';
import {
  VariantAReviewDesk,
  VariantBQuietRiver,
  VariantCFeedShelves
} from '@/features/feeds/prototype/feeds-review-prototype';

const variants = [
  { key: 'A', name: 'Review desk' },
  { key: 'B', name: 'Quiet river' },
  { key: 'C', name: 'Feed shelves' }
] as const;

export const Route = createFileRoute('/_protected/_with-layout/prototype-feeds')({
  head: () => ({ meta: [{ title: 'RSS feed prototype · Loreo' }] }),
  validateSearch: (search) => ({
    variant: typeof search.variant === 'string' ? search.variant : undefined
  }),
  component: PrototypeFeedsRoute
});

function PrototypeFeedsRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const variant = variants.some((option) => option.key === search.variant)
    ? (search.variant as string)
    : 'A';

  const setVariant = (nextVariant: string) => {
    void navigate({ replace: true, search: { variant: nextVariant } });
  };

  return (
    <>
      {variant === 'A' && <VariantAReviewDesk currentVariant={variant} />}
      {variant === 'B' && <VariantBQuietRiver currentVariant={variant} />}
      {variant === 'C' && <VariantCFeedShelves currentVariant={variant} />}
      <PrototypeSwitcher current={variant} onChange={setVariant} variants={variants} />
    </>
  );
}
