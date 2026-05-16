import { z } from 'zod';

export const userSettingsSchema = z.object({
  theme: z.enum(['system', 'light', 'dark', 'sepia-theme']).default('system').catch('system'),
  fontFamily: z
    .object({
      label: z.string(),
      name: z.string(),
      style: z.string()
    })
    .default({ label: 'Hanken Grotesk (Default)', name: 'default', style: 'sans-serif' })
    .catch({ label: 'Hanken Grotesk (Default)', name: 'default', style: 'sans-serif' }),
  fontSize: z
    .enum(['Small', 'Medium', 'Large', 'Extra Large', 'Huge'])
    .default('Medium')
    .catch('Medium'),
  lineSpacing: z.enum(['Compact', 'Normal', 'Relaxed', 'Loose']).default('Normal').catch('Normal'),
  textAlignment: z.enum(['default', 'justify']).default('default').catch('default'),
  articleCardView: z.enum(['grid', 'list']).default('grid').catch('grid')
});

export type UserSettings = z.infer<typeof userSettingsSchema>;

export const defaultUserSettings: UserSettings = {
  theme: 'system',
  fontFamily: { label: 'Hanken Grotesk (Default)', name: 'default', style: 'sans-serif' },
  fontSize: 'Medium',
  lineSpacing: 'Normal',
  textAlignment: 'default',
  articleCardView: 'grid'
};
