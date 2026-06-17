import { createRouter } from '@/lib/create-app.js';

import * as handlers from './admin.handlers.js';
import * as routes from './admin.routes.js';

const router = createRouter().openapi(routes.listUsers, handlers.listUsers);

export default router;
