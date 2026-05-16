import type { ReactNode } from 'react';

type Props = {
  icon: ReactNode;
  subtitle: string;
  title: string;
};

function FirstTimeSuggestionPlaceholder({ icon, subtitle, title }: Props) {
  return (
    <div className="border-border bg-card rounded-3xl border p-4 shadow-sm">
      <div className="flex items-center gap-3">
        {icon}
        <div className="flex-1">
          <h5 className="text-foreground font-medium">{title}</h5>
          <p className="text-muted-foreground mt-0.5 text-sm">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

export default FirstTimeSuggestionPlaceholder;
