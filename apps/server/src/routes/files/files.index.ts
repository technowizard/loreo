import { createRouter } from '@/lib/create-app.js';

import * as handlers from './files.handlers.js';
import * as routes from './files.routes.js';

const router = createRouter().openapi(routes.getFileRoute, handlers.getFileHandler);

export default router;
