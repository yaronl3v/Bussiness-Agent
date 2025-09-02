import { Router } from 'express';
import { requireAuth } from '../middleware/auth_middleware.js';
import { SearchController } from '../controllers/search_controller.js';

const router = Router({ mergeParams: true });

router.post('/', requireAuth, SearchController.ask);

export default router;
