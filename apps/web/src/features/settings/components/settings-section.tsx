import type { ReactNode } from 'react';

interface SettingsSectionProps {
  children: ReactNode;
  description: string;
  title: string;
}

interface SettingsRowProps {
  children: ReactNode;
}

export function SettingsSection({ children, description, title }: SettingsSectionProps) {
  return (
    <section className="grid grid-cols-1 gap-8 py-8 md:grid-cols-3">
      <div className="md:col-span-1">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{description}</p>
      </div>
      <div className="md:col-span-2">
        <div className="flex flex-col space-y-6">{children}</div>
      </div>
    </section>
  );
}

export function SettingsRow({ children }: SettingsRowProps) {
  return <div className="flex flex-col space-y-2">{children}</div>;
}
