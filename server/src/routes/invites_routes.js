import { Router } from 'express';
import { requireAuth } from '../middleware/auth_middleware.js';
import { InvitesController } from '../controllers/invites_controller.js';

const router = Router({ mergeParams: true });

router.post('/orgs/:id/invites', requireAuth, InvitesController.create);
router.post('/invites/:token/accept', requireAuth, InvitesController.accept);

export default router;
