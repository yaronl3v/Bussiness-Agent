import { Router } from 'express';
import { requireAuth } from '../middleware/auth_middleware.js';
import { ConversationsController } from '../controllers/conversations_controller.js';

const router = Router({ mergeParams: true });

router.get('/:id/messages', requireAuth, ConversationsController.listMessages);
router.post('/:id/messages', requireAuth, ConversationsController.sendMessage);

export default router;
