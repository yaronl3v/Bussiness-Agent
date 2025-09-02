import { Router } from 'express';
import { requireAuth } from '../middleware/auth_middleware.js';
import { LeadsController } from '../controllers/leads_controller.js';

const router = Router({ mergeParams: true });

router.get('/agents/:id/leads', requireAuth, LeadsController.list);
router.patch('/leads/:id', requireAuth, LeadsController.update);

export default router;
