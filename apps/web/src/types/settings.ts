export interface UserSettings {
  articleCardView: 'grid' | 'list';
  fontFamily: {
    label: string;
    name: string;
    style: string;
  };
  fontSize: 'Small' | 'Medium' | 'Large' | 'Extra Large' | 'Huge';
  lineSpacing: 'Compact' | 'Normal' | 'Relaxed' | 'Loose';
  textAlignment: 'default' | 'justify';
  theme: 'system' | 'light' | 'dark' | 'sepia-theme';
}
