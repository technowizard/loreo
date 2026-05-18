import type { ComponentProps } from 'react';

import { useThemeConfig } from '@/hooks/use-theme-config';

import { cn } from '@/lib/utils';

type ArticleTypographyProps = ComponentProps<'article'>;

export default function ArticleTypography({ className, ...props }: ArticleTypographyProps) {
  const { fontFamily, fontSize, lineSpacing, textAlignment } = useThemeConfig();

  return (
    <article
      className={cn(
        'prose',

        'mx-auto max-w-[80ch]',

        'text-foreground',

        fontFamily.name === 'default' && 'font-default',
        fontFamily.name === 'inter' && 'font-inter',
        fontFamily.name === 'plex-sans' && 'font-plex-sans',
        fontFamily.name === 'public-sans' && 'font-public-sans',
        fontFamily.name === 'lora' && 'font-lora',
        fontFamily.name === 'literata' && 'font-literata',
        fontFamily.name === 'spectral' && 'font-spectral',
        fontFamily.name === 'alegreya' && 'font-alegreya',
        fontFamily.name === 'atkinson' && 'font-atkinson',
        fontFamily.name === 'dyslexic' && 'font-dyslexic',
        fontFamily.name === 'lexend-deca' && 'font-lexend-deca',
        fontFamily.name === 'comic-neue' && 'font-comic-neue',

        fontSize === 'Small' && '[&_p]:text-sm',
        fontSize === 'Medium' && '[&_p]:text-base',
        fontSize === 'Large' && '[&_p]:text-lg',
        fontSize === 'Extra Large' && '[&_p]:text-xl',
        fontSize === 'Huge' && '[&_p]:text-2xl',

        lineSpacing === 'Compact' && '[&_p]:leading-snug',
        lineSpacing === 'Normal' && '[&_p]:leading-normal',
        lineSpacing === 'Relaxed' && '[&_p]:leading-relaxed',
        lineSpacing === 'Loose' && '[&_p]:leading-loose',

        textAlignment === 'default' && '[&_p]:text-left',
        textAlignment === 'justify' && '[&_p]:text-justify',

        '[&_p]:text-foreground [&_p]:my-6',

        'prose-figcaption:text-center prose-strong:text-foreground prose-img:mx-auto prose-img:rounded-lg',

        "[&_blockquote_p]:before:content-[''] [&_blockquote_p]:after:content-['']",
        '[&_blockquote]:border-l-primary-500 sepia-theme:[&_blockquote]:border-l-sepia-600 dark:[&_blockquote]:border-l-primary-400',

        'marker:text-foreground',

        '[&_code]:rounded [&_code]:bg-zinc-950 [&_code]:px-2 [&_code]:py-1 [&_code]:text-zinc-50 [&_code]:before:content-none [&_code]:after:content-none [&_pre]:rounded [&_pre]:bg-zinc-950 [&_pre]:px-2 [&_pre]:py-1 [&_pre]:text-zinc-50 [&_pre]:before:content-none [&_pre]:after:content-none [&_pre_code]:p-0',

        className
      )}
      {...props}
    />
  );
}
