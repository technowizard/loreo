import { produce } from 'immer';
import { create } from 'zustand';

import { createSelectorHooks } from '@/lib/create-selector-hooks';

interface PreviewResultType {
  isValid: boolean;
  tags?: string[];
  title: string;
  url: string;
}

interface ImportArticlesType {
  mapping: {
    tags: string;
    timeAdded: string;
    title: string;
    url: string;
  };
  onMappingChange: (field: string, value: string | null) => void;
  onPreviewImportSuccess: (importResult: {
    estimatedTime: string;
    preview: PreviewResultType[];
  }) => void;
  onSelectedFileChange: (file: File) => void;
  onUploadSuccess: (uploadResult: { columns: string[]; fileId: string; rowCount: number }) => void;
  preview: {
    estimatedTime: string; // formatted string
    result: PreviewResultType[];
  };
  previewResult: PreviewResultType[];
  resetUploadedFile: () => void;
  uploadedFile: {
    columns: string[];
    fileId: string;
    name: string;
    size: number | null;
    totalRows: 0;
  };
}

const useImportArticlesBase = create<ImportArticlesType>((set) => ({
  mapping: {
    tags: '',
    timeAdded: '',
    title: '',
    url: ''
  },
  onMappingChange(field: string, value: string | null) {
    set(
      produce((state) => {
        const { mapping, uploadedFile } = state;

        if (!field) {
          return { ...mapping };
        }

        if (!value) {
          return (state.mapping = {
            ...mapping,
            [field]: ''
          });
        }

        const columnIndex = uploadedFile.columns.indexOf(value);

        state.mapping = {
          ...mapping,
          [field]: uploadedFile.columns[columnIndex]
        };
      })
    );
  },
  onPreviewImportSuccess: (importResult: {
    estimatedTime: string;
    preview: PreviewResultType[];
  }) => {
    set(
      produce((state) => {
        state.preview.result = importResult.preview;
        state.preview.estimatedTime = importResult.estimatedTime;
      })
    );
  },
  onSelectedFileChange: (file: File) => {
    set(
      produce((state) => {
        state.uploadedFile.name = file.name;
        state.uploadedFile.size = file.size;
      })
    );
  },
  onUploadSuccess: (uploadResult: { columns: string[]; fileId: string; rowCount: number }) => {
    set(
      produce((state) => {
        state.uploadedFile.fileId = uploadResult.fileId;
        state.uploadedFile.columns = uploadResult.columns;
        state.uploadedFile.totalRows = uploadResult.rowCount;
      })
    );
  },
  preview: {
    estimatedTime: '',
    result: []
  },
  previewResult: [],
  resetUploadedFile: () =>
    set(
      produce((state) => {
        state.uploadedFile = {
          columns: [],
          fileId: '',
          name: '',
          size: null
        };
      })
    ),
  uploadedFile: {
    columns: [],
    fileId: '',
    name: '',
    size: null,
    totalRows: 0
  }
}));

export const useImportArticles = createSelectorHooks(useImportArticlesBase);
