export const FONT_FAMILIES = {
  legible: [
    {
      descriptionKey: 'reader.fontFamilies.atkinson.description',
      labelKey: 'reader.fontFamilies.atkinson.label',
      style: 'legible',
      value: 'atkinson'
    },
    {
      descriptionKey: 'reader.fontFamilies.lexendDeca.description',
      labelKey: 'reader.fontFamilies.lexendDeca.label',
      style: 'legible',
      value: 'lexend-deca'
    },
    {
      descriptionKey: 'reader.fontFamilies.dyslexic.description',
      labelKey: 'reader.fontFamilies.dyslexic.label',
      style: 'legible',
      value: 'dyslexic'
    },
    {
      descriptionKey: 'reader.fontFamilies.comicNeue.description',
      labelKey: 'reader.fontFamilies.comicNeue.label',
      style: 'legible',
      value: 'comic-neue'
    }
  ],
  sansSerif: [
    {
      descriptionKey: 'reader.fontFamilies.default.description',
      labelKey: 'reader.fontFamilies.default.label',
      style: 'sans-serif',
      value: 'default'
    },
    {
      descriptionKey: 'reader.fontFamilies.inter.description',
      labelKey: 'reader.fontFamilies.inter.label',
      style: 'sans-serif',
      value: 'inter'
    },
    {
      descriptionKey: 'reader.fontFamilies.plexSans.description',
      labelKey: 'reader.fontFamilies.plexSans.label',
      style: 'sans-serif',
      value: 'plex-sans'
    },
    {
      descriptionKey: 'reader.fontFamilies.publicSans.description',
      labelKey: 'reader.fontFamilies.publicSans.label',
      style: 'sans-serif',
      value: 'public-sans'
    }
  ],
  serif: [
    {
      descriptionKey: 'reader.fontFamilies.lora.description',
      labelKey: 'reader.fontFamilies.lora.label',
      style: 'serif',
      value: 'lora'
    },
    {
      descriptionKey: 'reader.fontFamilies.literata.description',
      labelKey: 'reader.fontFamilies.literata.label',
      style: 'serif',
      value: 'literata'
    },
    {
      descriptionKey: 'reader.fontFamilies.spectral.description',
      labelKey: 'reader.fontFamilies.spectral.label',
      style: 'serif',
      value: 'spectral'
    },
    {
      descriptionKey: 'reader.fontFamilies.alegreya.description',
      labelKey: 'reader.fontFamilies.alegreya.label',
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
