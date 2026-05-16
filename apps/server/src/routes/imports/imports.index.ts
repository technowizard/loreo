import { createRouter } from '@/lib/create-app.js';

import * as handlers from './imports.handlers.js';
import * as routes from './imports.routes.js';

const router = createRouter()
  .openapi(routes.uploadImport, handlers.uploadImport)
  .openapi(routes.previewImport, handlers.previewImport)
  .openapi(routes.executeImport, handlers.executeImport)
  .openapi(routes.getJobStatus, handlers.getJobStatus)
  .openapi(routes.listImportSessions, handlers.listImportSessions)
  .openapi(routes.getImportSession, handlers.getImportSession)
  .openapi(routes.cancelImportSession, handlers.cancelImportSession)
  .openapi(routes.deleteImportSession, handlers.deleteImportSession)
  .openapi(routes.resumeImport, handlers.resumeImport)
  .openapi(routes.getSessionLinks, handlers.getSessionLinks)
  .openapi(routes.retryFailedImport, handlers.retryFailedImport)
  .openapi(routes.cleanupOldSessions, handlers.cleanupOldSessions);

export default router;
