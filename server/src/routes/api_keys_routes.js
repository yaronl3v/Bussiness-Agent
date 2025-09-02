import { Router } from 'express';
import { requireAuth } from '../middleware/auth_middleware.js';
import { ApiKeysController } from '../controllers/api_keys_controller.js';

const router = Router({ mergeParams: true });

router.get('/agents/:id/api-keys', requireAuth, ApiKeysController.list);
router.post('/agents/:id/api-keys', requireAuth, ApiKeysController.create);
router.delete('/api-keys/:keyId', requireAuth, ApiKeysController.remove);

export default router;
