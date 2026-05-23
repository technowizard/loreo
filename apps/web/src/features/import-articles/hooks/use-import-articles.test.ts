import { beforeEach, describe, expect, it } from 'vitest';

import { useImportArticles } from './use-import-articles';

describe('useImportArticles', () => {
  beforeEach(() => {
    useImportArticles.setState({
      mapping: { tags: '', timeAdded: '', title: '', url: '' },
      preview: { estimatedTime: '', result: [] },
      previewResult: [],
      uploadedFile: {
        columns: [],
        fileId: '',
        name: '',
        size: null,
        totalRows: 0
      }
    });
  });

  it('should have default empty state', () => {
    const state = useImportArticles.getState();
    expect(state.mapping).toEqual({
      tags: '',
      timeAdded: '',
      title: '',
      url: ''
    });
    expect(state.uploadedFile).toEqual({
      columns: [],
      fileId: '',
      name: '',
      size: null,
      totalRows: 0
    });
    expect(state.preview.result).toEqual([]);
  });

  it('should update file on selection', () => {
    const file = new File(['content'], 'test.csv', { type: 'text/csv' });
    useImportArticles.getState().onSelectedFileChange(file);
    expect(useImportArticles.getState().uploadedFile.name).toBe('test.csv');
    expect(useImportArticles.getState().uploadedFile.size).toBe(file.size);
  });

  it('should update upload on success', () => {
    useImportArticles.getState().onUploadSuccess({
      columns: ['title', 'url', 'tags'],
      fileId: 'file-123',
      rowCount: 42
    });
    const state = useImportArticles.getState();
    expect(state.uploadedFile.columns).toEqual(['title', 'url', 'tags']);
    expect(state.uploadedFile.fileId).toBe('file-123');
    expect(state.uploadedFile.totalRows).toBe(42);
  });

  it('should update mapping on change', () => {
    useImportArticles.getState().onUploadSuccess({
      columns: ['Title', 'URL', 'Tags'],
      fileId: 'file-123',
      rowCount: 10
    });

    useImportArticles.getState().onMappingChange('title', 'Title');
    expect(useImportArticles.getState().mapping.title).toBe('Title');
  });

  it('should update multiple mappings', () => {
    useImportArticles.getState().onUploadSuccess({
      columns: ['Title', 'URL', 'Tags'],
      fileId: 'file-123',
      rowCount: 10
    });

    useImportArticles.getState().onMappingChange('title', 'Title');
    useImportArticles.getState().onMappingChange('url', 'URL');
    useImportArticles.getState().onMappingChange('tags', 'Tags');

    const mapping = useImportArticles.getState().mapping;
    expect(mapping.title).toBe('Title');
    expect(mapping.url).toBe('URL');
    expect(mapping.tags).toBe('Tags');
  });

  it('should handle empty field in mapping change', () => {
    useImportArticles.getState().onMappingChange('', 'Title');
    expect(useImportArticles.getState().mapping).toEqual({
      tags: '',
      timeAdded: '',
      title: '',
      url: ''
    });
  });

  it('should update preview on import success', () => {
    const previewResult = [
      { isValid: true, title: 'Article 1', url: 'https://example.com/1' },
      { isValid: false, title: 'Article 2', url: 'invalid' }
    ];
    useImportArticles.getState().onPreviewImportSuccess({
      estimatedTime: '~2 minutes',
      preview: previewResult
    });
    const state = useImportArticles.getState();
    expect(state.preview.result).toEqual(previewResult);
    expect(state.preview.estimatedTime).toBe('~2 minutes');
  });

  it('should reset uploaded file', () => {
    useImportArticles.getState().onUploadSuccess({
      columns: ['title'],
      fileId: 'file-123',
      rowCount: 10
    });
    useImportArticles.getState().resetUploadedFile();
    const state = useImportArticles.getState();
    expect(state.uploadedFile).toEqual({
      columns: [],
      fileId: '',
      name: '',
      size: null
    });
  });
});
