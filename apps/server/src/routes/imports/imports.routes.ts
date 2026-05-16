import { createRoute, z } from '@hono/zod-openapi';

import { jsonContent, jsonContentRequired } from '@/lib/openapi.js';
import { errorResponseSchema, HttpStatus, successResponseSchema } from '@/lib/response.js';

import { adminUser } from '@/middlewares/admin-user.js';
import { currentUser } from '@/middlewares/current-user.js';
import {
  importExecuteRateLimit,
  importPreviewRateLimit,
  importUploadRateLimit
} from '@/middlewares/rate-limit.js';

const tags = ['Import'];

const UploadResponseSchema = z.object({
  fileId: z.string(),
  filename: z.string(),
  columns: z.array(z.string()),
  rowCount: z.number()
});

const FieldMappingSchema = z.object({
  url: z.string(),
  title: z.string(),
  tags: z.string().optional(),
  timeAdded: z.string().optional()
});

const PreviewRequestSchema = z.object({
  fileId: z.string(),
  mapping: FieldMappingSchema
});

const PreviewRowSchema = z.object({
  url: z.string().optional(),
  title: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isValid: z.boolean(),
  errors: z.array(z.string()).optional()
});

const PreviewResponseSchema = z.object({
  preview: z.array(PreviewRowSchema),
  totalRows: z.number(),
  estimatedTime: z.string()
});

const ExecuteRequestSchema = z.object({
  fileId: z.string(),
  mapping: FieldMappingSchema.optional(),
  options: z
    .object({
      skipDuplicates: z.boolean().default(true)
    })
    .optional()
});

const ExecuteResponseSchema = z.object({
  jobId: z.string(),
  estimatedCount: z.number(),
  importSessionId: z.string(),
  message: z.string()
});

const JobStatusResponseSchema = z.object({
  jobId: z.string(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  progress: z.number(),
  processed: z.number(),
  total: z.number(),
  imported: z.number(),
  skipped: z.number(),
  failed: z.number(),
  error: z.string().optional()
});

const ImportSessionSchema = z.object({
  id: z.string(),
  filename: z.string(),
  totalRows: z.number(),
  importedCount: z.number(),
  skippedCount: z.number(),
  failedCount: z.number(),
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']),
  errorMessage: z.string().nullable(),
  extractionStatus: z.enum(['pending', 'in_progress', 'completed']).optional(),
  extractionProgress: z.number().optional(),
  extractionCompleted: z.number().optional(),
  extractionFailed: z.number().optional(),
  startedAt: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const uploadImport = createRoute({
  tags,
  method: 'post',
  path: '/imports/upload',
  middleware: [currentUser, importUploadRateLimit],
  request: {
    contentType: 'multipart/form-data',
    body: {
      content: {
        'multipart/form-data': {
          schema: z.object({
            file: z.instanceof(File).openapi({ type: 'string' })
          })
        }
      },
      required: true
    }
  },
  responses: {
    [HttpStatus.OK]: jsonContent(
      successResponseSchema(UploadResponseSchema),
      'File uploaded successfully'
    ),
    [HttpStatus.BAD_REQUEST]: jsonContent(
      errorResponseSchema(HttpStatus.BAD_REQUEST),
      'Invalid file or request'
    ),
    [HttpStatus.REQUEST_TOO_LONG]: jsonContent(
      errorResponseSchema(HttpStatus.REQUEST_TOO_LONG),
      'File exceeds size limit'
    ),
    [HttpStatus.UNAUTHORIZED]: jsonContent(
      errorResponseSchema(HttpStatus.UNAUTHORIZED),
      'Unauthorized'
    ),
    [HttpStatus.INTERNAL_SERVER_ERROR]: jsonContent(
      errorResponseSchema(HttpStatus.INTERNAL_SERVER_ERROR),
      'Unauthorized'
    )
  }
});

export const previewImport = createRoute({
  tags,
  method: 'post',
  path: '/imports/preview',
  middleware: [currentUser, importPreviewRateLimit],
  request: {
    contentType: 'application/json',
    body: jsonContentRequired(PreviewRequestSchema, 'Preview request')
  },
  responses: {
    [HttpStatus.OK]: jsonContent(successResponseSchema(PreviewResponseSchema), 'Preview data'),
    [HttpStatus.BAD_REQUEST]: jsonContent(
      errorResponseSchema(HttpStatus.BAD_REQUEST),
      'Invalid request'
    ),
    [HttpStatus.NOT_FOUND]: jsonContent(
      errorResponseSchema(HttpStatus.NOT_FOUND),
      'File not found'
    ),
    [HttpStatus.UNAUTHORIZED]: jsonContent(
      errorResponseSchema(HttpStatus.UNAUTHORIZED),
      'Unauthorized'
    ),
    [HttpStatus.INTERNAL_SERVER_ERROR]: jsonContent(
      errorResponseSchema(HttpStatus.INTERNAL_SERVER_ERROR),
      'Internal server error'
    )
  }
});

export const executeImport = createRoute({
  tags,
  method: 'post',
  path: '/imports/execute',
  middleware: [currentUser, importExecuteRateLimit],
  request: {
    contentType: 'application/json',
    body: jsonContentRequired(ExecuteRequestSchema, 'Execute request')
  },
  responses: {
    [HttpStatus.ACCEPTED]: jsonContent(
      successResponseSchema(ExecuteResponseSchema),
      'Import job queued'
    ),
    [HttpStatus.BAD_REQUEST]: jsonContent(
      errorResponseSchema(HttpStatus.BAD_REQUEST),
      'Invalid request'
    ),
    [HttpStatus.NOT_FOUND]: jsonContent(
      errorResponseSchema(HttpStatus.NOT_FOUND),
      'File not found'
    ),
    [HttpStatus.UNAUTHORIZED]: jsonContent(
      errorResponseSchema(HttpStatus.UNAUTHORIZED),
      'Unauthorized'
    ),
    [HttpStatus.INTERNAL_SERVER_ERROR]: jsonContent(
      errorResponseSchema(HttpStatus.INTERNAL_SERVER_ERROR),
      'Internal server error'
    )
  }
});

export const getJobStatus = createRoute({
  tags,
  method: 'get',
  path: '/imports/status/{jobId}',
  middleware: [currentUser],
  request: {
    params: z.object({
      jobId: z.string().openapi({ description: 'Job ID' })
    })
  },
  responses: {
    [HttpStatus.OK]: jsonContent(successResponseSchema(JobStatusResponseSchema), 'Job status'),
    [HttpStatus.NOT_FOUND]: jsonContent(errorResponseSchema(HttpStatus.NOT_FOUND), 'Job not found'),
    [HttpStatus.UNAUTHORIZED]: jsonContent(
      errorResponseSchema(HttpStatus.UNAUTHORIZED),
      'Unauthorized'
    ),
    [HttpStatus.INTERNAL_SERVER_ERROR]: jsonContent(
      errorResponseSchema(HttpStatus.INTERNAL_SERVER_ERROR),
      'Internal server error'
    )
  }
});

export const listImportSessions = createRoute({
  tags,
  method: 'get',
  path: '/imports/sessions',
  middleware: [currentUser],
  request: {
    query: z.object({
      limit: z.number().optional(),
      cursor: z.string().optional()
    })
  },
  responses: {
    [HttpStatus.OK]: jsonContent(
      successResponseSchema(
        z.object({
          items: z.array(ImportSessionSchema),
          hasMore: z.boolean(),
          nextCursor: z.string().optional()
        })
      ),
      'List of import sessions'
    ),
    [HttpStatus.INTERNAL_SERVER_ERROR]: jsonContent(
      errorResponseSchema(HttpStatus.INTERNAL_SERVER_ERROR),
      'Internal server error'
    )
  }
});

export const getImportSession = createRoute({
  tags,
  method: 'get',
  path: '/imports/sessions/{id}',
  middleware: [currentUser],
  request: {
    params: z.object({
      id: z.string().openapi({ description: 'Import session ID' })
    })
  },
  responses: {
    [HttpStatus.OK]: jsonContent(
      successResponseSchema(ImportSessionSchema),
      'Import session details'
    ),
    [HttpStatus.NOT_FOUND]: jsonContent(
      errorResponseSchema(HttpStatus.NOT_FOUND),
      'Session not found'
    ),
    [HttpStatus.INTERNAL_SERVER_ERROR]: jsonContent(
      errorResponseSchema(HttpStatus.INTERNAL_SERVER_ERROR),
      'Session not found'
    )
  }
});

export const cancelImportSession = createRoute({
  tags,
  method: 'post',
  path: '/imports/sessions/{id}/cancel',
  middleware: [currentUser],
  request: {
    params: z.object({
      id: z.string().openapi({ description: 'Import session ID' })
    })
  },
  responses: {
    [HttpStatus.OK]: jsonContent(
      successResponseSchema(
        z.object({
          message: z.string(),
          linksReset: z.number()
        })
      ),
      'Import cancelled successfully'
    ),
    [HttpStatus.NOT_FOUND]: jsonContent(
      errorResponseSchema(HttpStatus.NOT_FOUND),
      'Session not found'
    ),
    [HttpStatus.INTERNAL_SERVER_ERROR]: jsonContent(
      errorResponseSchema(HttpStatus.INTERNAL_SERVER_ERROR),
      'Internal server error'
    )
  }
});

export const deleteImportSession = createRoute({
  tags,
  method: 'delete',
  path: '/imports/sessions/{id}',
  middleware: [currentUser],
  request: {
    params: z.object({
      id: z.string().openapi({ description: 'Import session ID' })
    })
  },
  responses: {
    [HttpStatus.OK]: jsonContent(
      successResponseSchema(z.object({ message: z.string() })),
      'Import session deleted successfully'
    ),
    [HttpStatus.BAD_REQUEST]: jsonContent(
      errorResponseSchema(HttpStatus.BAD_REQUEST),
      'Session is currently processing — cancel it first'
    ),
    [HttpStatus.NOT_FOUND]: jsonContent(
      errorResponseSchema(HttpStatus.NOT_FOUND),
      'Session not found'
    ),
    [HttpStatus.INTERNAL_SERVER_ERROR]: jsonContent(
      errorResponseSchema(HttpStatus.INTERNAL_SERVER_ERROR),
      'Internal server error'
    )
  }
});

export const resumeImport = createRoute({
  tags,
  method: 'post',
  path: '/imports/sessions/{id}/resume',
  middleware: [currentUser],
  request: {
    params: z.object({
      id: z.string().openapi({ description: 'Import session ID' })
    })
  },
  responses: {
    [HttpStatus.OK]: jsonContent(
      successResponseSchema(
        z.object({
          message: z.string(),
          linksResumed: z.number()
        })
      ),
      'Import resumed successfully'
    ),
    [HttpStatus.NOT_FOUND]: jsonContent(
      errorResponseSchema(HttpStatus.NOT_FOUND),
      'Session not found'
    ),
    [HttpStatus.BAD_REQUEST]: jsonContent(
      errorResponseSchema(HttpStatus.BAD_REQUEST),
      'Session cannot be resumed'
    ),
    [HttpStatus.INTERNAL_SERVER_ERROR]: jsonContent(
      errorResponseSchema(HttpStatus.INTERNAL_SERVER_ERROR),
      'Internal server error'
    )
  }
});

const SessionLinkSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  errorMessage: z.string().nullable()
});

export const getSessionLinks = createRoute({
  tags,
  method: 'get',
  path: '/imports/sessions/{id}/links',
  middleware: [currentUser],
  request: {
    params: z.object({
      id: z.string().openapi({ description: 'Import session ID' })
    }),
    query: z.object({
      status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
      limit: z.string().optional(),
      cursor: z.string().optional()
    })
  },
  responses: {
    [HttpStatus.OK]: jsonContent(
      successResponseSchema(
        z.object({
          items: z.array(SessionLinkSchema),
          hasMore: z.boolean(),
          nextCursor: z.string().optional()
        })
      ),
      'Links in import session'
    ),
    [HttpStatus.NOT_FOUND]: jsonContent(
      errorResponseSchema(HttpStatus.NOT_FOUND),
      'Session not found'
    ),
    [HttpStatus.INTERNAL_SERVER_ERROR]: jsonContent(
      errorResponseSchema(HttpStatus.INTERNAL_SERVER_ERROR),
      'Internal server error'
    )
  }
});

export const retryFailedImport = createRoute({
  tags,
  method: 'post',
  path: '/imports/sessions/{id}/retry-failed',
  middleware: [currentUser],
  request: {
    params: z.object({
      id: z.string().openapi({ description: 'Import session ID' })
    })
  },
  responses: {
    [HttpStatus.OK]: jsonContent(
      successResponseSchema(
        z.object({
          id: z.string()
        })
      ),
      'Failed extractions re-queued'
    ),
    [HttpStatus.NOT_FOUND]: jsonContent(
      errorResponseSchema(HttpStatus.NOT_FOUND),
      'Session not found'
    ),
    [HttpStatus.UNAUTHORIZED]: jsonContent(
      errorResponseSchema(HttpStatus.UNAUTHORIZED),
      'Unauthorized'
    ),
    [HttpStatus.INTERNAL_SERVER_ERROR]: jsonContent(
      errorResponseSchema(HttpStatus.INTERNAL_SERVER_ERROR),
      'Internal server error'
    )
  }
});

export const cleanupOldSessions = createRoute({
  tags,
  method: 'post',
  path: '/imports/cleanup',
  middleware: [currentUser, adminUser],
  request: {
    body: jsonContentRequired(
      z.object({
        daysOld: z.number().default(90)
      }),
      'Cleanup options'
    )
  },
  responses: {
    [HttpStatus.OK]: jsonContent(
      successResponseSchema(
        z.object({
          sessionsDeleted: z.number(),
          linksDeleted: z.number(),
          message: z.string()
        })
      ),
      'Old sessions cleaned up'
    ),
    [HttpStatus.BAD_REQUEST]: jsonContent(
      errorResponseSchema(HttpStatus.BAD_REQUEST),
      'Invalid request'
    ),
    [HttpStatus.UNAUTHORIZED]: jsonContent(
      errorResponseSchema(HttpStatus.UNAUTHORIZED),
      'Unauthorized'
    ),
    [HttpStatus.FORBIDDEN]: jsonContent(errorResponseSchema(HttpStatus.FORBIDDEN), 'Forbidden'),
    [HttpStatus.INTERNAL_SERVER_ERROR]: jsonContent(
      errorResponseSchema(HttpStatus.INTERNAL_SERVER_ERROR),
      'Internal server error'
    )
  }
});

export type UploadImportRoute = typeof uploadImport;
export type PreviewImportRoute = typeof previewImport;
export type ExecuteImportRoute = typeof executeImport;
export type GetJobStatusRoute = typeof getJobStatus;
export type ListImportSessionsRoute = typeof listImportSessions;
export type GetImportSessionRoute = typeof getImportSession;
export type CancelImportSessionRoute = typeof cancelImportSession;
export type DeleteImportSessionRoute = typeof deleteImportSession;
export type ResumeImportRoute = typeof resumeImport;
export type GetSessionLinksRoute = typeof getSessionLinks;
export type RetryFailedImportRoute = typeof retryFailedImport;
export type CleanupOldSessionsRoute = typeof cleanupOldSessions;
