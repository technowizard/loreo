import type { Link } from '@/types/links';

type LinkStatus = Pick<Link, 'id' | 'processingStatus'>;

export function getRecentlyCompletedLinkIds(
  previousLinks: LinkStatus[],
  currentLinks: LinkStatus[]
) {
  const previousStatusById = new Map(previousLinks.map((link) => [link.id, link.processingStatus]));

  return currentLinks
    .filter((link) => link.processingStatus === 'completed')
    .filter((link) => {
      const previousStatus = previousStatusById.get(link.id);

      return previousStatus === 'pending' || previousStatus === 'processing';
    })
    .map((link) => link.id);
}
