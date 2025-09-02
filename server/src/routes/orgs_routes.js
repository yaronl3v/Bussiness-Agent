import { Router } from 'express';
import { OrgsController } from '../controllers/orgs_controller.js';
import { requireAuth } from '../middleware/auth_middleware.js';

const router = Router();

router.get('/', requireAuth, OrgsController.list);
router.post('/', requireAuth, OrgsController.create);
router.get('/:id', requireAuth, OrgsController.get);
router.patch('/:id', requireAuth, OrgsController.update);
router.delete('/:id', requireAuth, OrgsController.remove);

export default router;
