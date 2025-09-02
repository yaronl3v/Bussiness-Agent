import { Router } from 'express';
import { requireAuth } from '../middleware/auth_middleware.js';
import { VendorsController } from '../controllers/vendors_controller.js';

const router = Router({ mergeParams: true });

router.get('/agents/:id/vendors', requireAuth, VendorsController.list);
router.post('/agents/:id/vendors', requireAuth, VendorsController.create);
router.patch('/vendors/:id', requireAuth, VendorsController.update);
router.delete('/vendors/:id', requireAuth, VendorsController.remove);
router.post('/agents/:id/route', requireAuth, VendorsController.route);

export default router;
