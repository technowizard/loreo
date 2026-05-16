import { createRouter } from '../../lib/create-app.js';

import * as handlers from './home.handlers.js';
import * as routes from './home.routes.js';

const router = createRouter().openapi(routes.getHomeSuggestions, handlers.getHomeSuggestions);

export default router;
