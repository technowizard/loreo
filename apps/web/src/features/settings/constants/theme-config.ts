export const FONT_FAMILIES = {
  legible: [
    {
      description: 'Designed for readability',
      label: 'Atkinson Hyperlegible',
      style: 'legible',
      value: 'atkinson'
    },
    {
      description: 'Smooth font, supports relaxed reading',
      label: 'Lexend Deca',
      style: 'legible',
      value: 'lexend-deca'
    },
    {
      description: 'Dyslexia-friendly font',
      label: 'Open Dyslexic',
      style: 'legible',
      value: 'dyslexic'
    },
    {
      description: 'Casual, handwritten-style font',
      label: 'Comic Neue',
      style: 'legible',
      value: 'comic-neue'
    }
  ],
  sansSerif: [
    {
      description: 'Clean, modern, highly readable',
      label: 'Hanken Grotesk (Default)',
      style: 'sans-serif',
      value: 'default'
    },
    {
      description: 'Clear font, easy on eyes',
      label: 'Inter',
      style: 'sans-serif',
      value: 'inter'
    },
    {
      description: 'Balanced font with human, technical feel',
      label: 'IBM Plex Sans',
      style: 'sans-serif',
      value: 'plex-sans'
    },
    {
      description: 'Calm, neutral font',
      label: 'Public Sans',
      style: 'sans-serif',
      value: 'public-sans'
    }
  ],
  serif: [
    {
      description: 'Warm font for long reading',
      label: 'Lora',
      style: 'serif',
      value: 'lora'
    },
    {
      description: 'Book-style font for long reading',
      label: 'Literata',
      style: 'serif',
      value: 'literata'
    },
    {
      description: 'Modern font suited for long reading',
      label: 'Spectral',
      style: 'serif',
      value: 'spectral'
    },
    {
      description: 'Lively font with a classic feel',
      label: 'Alegreya',
      style: 'serif',
      value: 'alegreya'
    }
  ]
};

export const FONT_SIZES = ['Small', 'Medium', 'Large', 'Extra Large', 'Huge'];

export const LINE_SPACING = ['Compact', 'Normal', 'Relaxed', 'Loose'];

export const getFontsByCategory = (category: string) => {
  switch (category) {
    case 'sans-serif':
      return FONT_FAMILIES.sansSerif;
    case 'serif':
      return FONT_FAMILIES.serif;
    case 'legible':
      return FONT_FAMILIES.legible;
    default:
      return FONT_FAMILIES.sansSerif;
  }
};
