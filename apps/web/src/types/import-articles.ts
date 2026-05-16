type ImportSessions = {
  createdAt: string;
  extractionCompleted: number;
  extractionFailed: number;
  extractionProgress: number;
  extractionStatus: 'in_progress' | 'completed';
  failedCount: number;
  id: string;
  importedCount: number;
  skippedCount: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  totalRows: number;
  updatedAt: string;
};

export type ImportSessionsResponse = {
  items: ImportSessions[];
};

export type ImportSessionResponse = {
  extractionCompleted: number;
  extractionFailed: number;
  extractionProgress: number;
  extractionStatus: 'in_progress' | 'completed';
  failedCount: number;
  importedCount: number;
  skippedCount: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  totalRows: number;
};
