import { z } from 'zod';

export const userSettingsSchema = z.object({
  theme: z.enum(['system', 'light', 'dark', 'sepia-theme']).default('light'),
  fontFamily: z
    .object({
      label: z.string(),
      name: z.string(),
      style: z.string()
    })
    .default({ label: 'Hanken Grotesk (Default)', name: 'default', style: 'sans-serif' }),
  fontSize: z.enum(['Small', 'Medium', 'Large', 'Extra Large', 'Huge']).default('Medium'),
  lineSpacing: z.enum(['Compact', 'Normal', 'Relaxed', 'Loose']).default('Normal'),
  textAlignment: z.enum(['default', 'justify']).default('default'),
  articleCardView: z.enum(['grid', 'list']).default('grid')
});

export type UserSettings = z.infer<typeof userSettingsSchema>;

export const defaultUserSettings: UserSettings = {
  theme: 'light',
  fontFamily: { label: 'Hanken Grotesk (Default)', name: 'default', style: 'sans-serif' },
  fontSize: 'Medium',
  lineSpacing: 'Normal',
  textAlignment: 'default',
  articleCardView: 'grid'
};
