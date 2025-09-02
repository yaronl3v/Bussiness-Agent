import { Router } from 'express';
import { AgentsController } from '../controllers/agents_controller.js';
import { requireAuth } from '../middleware/auth_middleware.js';

const router = Router({ mergeParams: true });

router.get('/', requireAuth, AgentsController.list);
router.post('/', requireAuth, AgentsController.create);
router.get('/:agentId', requireAuth, AgentsController.get);
router.patch('/:agentId', requireAuth, AgentsController.update);
router.delete('/:agentId', requireAuth, AgentsController.remove);
router.post('/:agentId/activate', requireAuth, AgentsController.activate);
router.post('/:agentId/reindex', requireAuth, AgentsController.reindex);

export default router;
