import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

export function AuthBrandPanel() {
  const { t } = useTranslation();

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-xl bg-linear-to-br from-[oklch(0.44_0.18_248)] to-[oklch(0.18_0.09_240)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle,oklch(1_0_0/0.07)_1px,transparent_1px)] bg-size-[26px_26px]" />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_45%_at_50%_50%,oklch(0.54_0.15_249/0.18),transparent)]" />

      <FloatingArticleCard
        className="pointer-events-none absolute top-12 right-4 rotate-[5deg] opacity-80"
        variant="progress"
      />
      <FloatingArticleCard
        className="pointer-events-none absolute top-36 -left-8 -rotate-[4deg] opacity-55"
        variant="badge"
      />
      <FloatingArticleCard className="pointer-events-none absolute bottom-20 right-2 rotate-2 opacity-60" />

      <div className="relative flex flex-1 flex-col items-center justify-center gap-7 px-10 py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="bg-white flex size-16 items-center justify-center rounded-xl shadow-sm">
            <img alt="Loreo" className="size-14 drop-shadow-lg" src="/logo.svg" />
          </div>
          <span className="text-[2.5rem] font-bold leading-none tracking-tight text-white drop-shadow">
            Loreo
          </span>
        </div>

        <p className="max-w-[16rem] text-center text-lg leading-relaxed text-white/75">
          {t('brandPanel.firstTagline')}
          <br />
          {t('brandPanel.secondTagline')}
        </p>

        <ul className="mt-2 flex flex-col gap-2.5">
          {(t('brandPanel.keyFeatures', { returnObjects: true }) as string[]).map((feature) => (
            <li key={feature} className="flex items-center gap-2.5 text-sm text-white/60">
              <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-white/15 text-[10px] text-white/80">
                ✓
              </span>
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function FloatingArticleCard({
  className,
  variant = 'default'
}: {
  className?: string;
  variant?: 'default' | 'progress' | 'badge';
}) {
  return (
    <div
      className={cn(
        'w-52 overflow-hidden rounded-xl border border-white/20 bg-white/8 shadow-2xl backdrop-blur-md',
        className
      )}
    >
      <div className="relative aspect-video bg-white/[0.07]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex size-10 items-center justify-center rounded-xl bg-white/15">
            <div className="size-5 rounded-md bg-white/30" />
          </div>
        </div>

        {(variant === 'badge' || variant === 'progress') && (
          <div className="absolute inset-0 bg-linear-to-t from-black/30 via-transparent" />
        )}

        {variant === 'badge' && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-white/20 px-2 py-1">
            <div className="size-2 rounded-full bg-orange-300/80" />
            <div className="h-1.5 w-10 rounded-full bg-white/50" />
          </div>
        )}

        {variant === 'progress' && (
          <div className="absolute right-2 bottom-2 flex h-7 items-center gap-1.5 rounded-full bg-black/30 px-2.5 backdrop-blur-sm">
            <svg aria-hidden="true" className="-rotate-90 h-3.5 w-3.5" viewBox="0 0 32 32">
              <circle
                cx="16"
                cy="16"
                fill="none"
                r="12"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="5"
              />
              <circle
                cx="16"
                cy="16"
                fill="none"
                r="12"
                stroke="rgba(255,255,255,0.75)"
                strokeDasharray={`${2 * Math.PI * 12}`}
                strokeDashoffset={`${2 * Math.PI * 12 * 0.38}`}
                strokeLinecap="round"
                strokeWidth="5"
              />
            </svg>
            <div className="h-1.5 w-5 rounded-full bg-white/60" />
          </div>
        )}
      </div>

      <div className="p-3">
        <div className="mb-2.5 flex items-center gap-1.5">
          <div className="size-3 shrink-0 rounded-full bg-white/35" />
          <div className="h-1.5 w-14 rounded-full bg-white/25" />
        </div>

        <div className="mb-2 space-y-1.5">
          <div className="h-2 w-full rounded-full bg-white/30" />
          <div className="h-2 w-[85%] rounded-full bg-white/30" />
        </div>

        <div className="space-y-1">
          <div className="h-1.5 w-full rounded-full bg-white/18" />
          <div className="h-1.5 w-3/4 rounded-full bg-white/18" />
        </div>
      </div>

      <div className="flex items-center justify-between px-3 pb-3">
        <div className="flex items-center gap-1">
          <div className="h-4 w-11 rounded-full bg-white/15" />
          <div className="h-4 w-8 rounded-full bg-white/12" />
        </div>
        <div className="flex items-center gap-1">
          <div className="size-3 rounded-full border border-white/30" />
          <div className="h-1.5 w-8 rounded-full bg-white/22" />
        </div>
      </div>
    </div>
  );
}

export function MobileBrandHeader() {
  return (
    <div className="relative flex items-center justify-center overflow-hidden bg-linear-to-r from-[oklch(0.44_0.18_248)] to-[oklch(0.30_0.14_244)] px-6 py-5 lg:hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle,oklch(1_0_0/0.06)_1px,transparent_1px)] bg-size-[20px_20px]" />
      <div className="relative flex items-center gap-3">
        <div className="bg-white flex size-10 items-center justify-center rounded-lg shadow-sm">
          <img alt="Loreo" className="size-8 drop-shadow" src="/logo.svg" />
        </div>
        <span className="text-2xl font-bold tracking-tight text-white">Loreo</span>
      </div>
    </div>
  );
}
