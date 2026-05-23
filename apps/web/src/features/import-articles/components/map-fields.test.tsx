import { render, screen } from '@testing-library/react';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MapFields } from './map-fields';

const mockUseTranslation = vi.fn(() => ({ t: (key: string) => key }));
const mockUseImportArticles = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => mockUseTranslation()
}));

vi.mock('@/features/import-articles/hooks/use-import-articles', () => ({
  useImportArticles: () => mockUseImportArticles()
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <span>{children}</span>
}));

describe('MapFields', () => {
  const defaultState = {
    mapping: { url: '', title: '', tags: '', timeAdded: '' },
    onMappingChange: vi.fn(),
    uploadedFile: {
      columns: ['URL', 'Title', 'Tags', 'Date'],
      fileId: 'file-1',
      name: 'articles.csv',
      size: 1024,
      totalRows: 0
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseImportArticles.mockReturnValue(defaultState);
  });

  it('renders the mapping table with field labels', () => {
    render(<MapFields />);

    expect(screen.getByText('import.mapFields.articleFieldHeading')).toBeInTheDocument();
    expect(screen.getByText('import.mapFields.csvColumnHeading')).toBeInTheDocument();
    expect(screen.getByText('import.mapFields.fieldUrl')).toBeInTheDocument();
    expect(screen.getByText('import.mapFields.fieldTitle')).toBeInTheDocument();
    expect(screen.getByText('import.mapFields.fieldTags')).toBeInTheDocument();
    expect(screen.getByText('import.mapFields.fieldTimeAdded')).toBeInTheDocument();
  });

  it('shows required badges on url and title fields', () => {
    render(<MapFields />);

    const requiredBadges = screen.getAllByText('import.mapFields.required');
    expect(requiredBadges).toHaveLength(2);
  });

  it('shows help tooltips on tags and timeAdded fields', () => {
    render(<MapFields />);

    expect(screen.getAllByText('import.mapFields.helpText')).toHaveLength(2);
  });

  it('calls onMappingComplete when both url and title are mapped', () => {
    const onMappingComplete = vi.fn();

    mockUseImportArticles.mockReturnValue({
      ...defaultState,
      mapping: { url: 'URL', title: 'Title', tags: '', timeAdded: '' }
    });

    render(<MapFields onMappingComplete={onMappingComplete} />);

    expect(onMappingComplete).toHaveBeenCalledTimes(1);
  });

  it('does not call onMappingComplete when only url is mapped', () => {
    const onMappingComplete = vi.fn();

    mockUseImportArticles.mockReturnValue({
      ...defaultState,
      mapping: { url: 'URL', title: '', tags: '', timeAdded: '' }
    });

    render(<MapFields onMappingComplete={onMappingComplete} />);

    expect(onMappingComplete).not.toHaveBeenCalled();
  });
});
