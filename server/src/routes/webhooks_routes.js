import { Router } from 'express';
import { WebhooksController } from '../controllers/webhooks_controller.js';

const router = Router();

router.get('/whatsapp', WebhooksController.whatsappVerify);
router.post('/whatsapp', WebhooksController.whatsappInbound);

export default router;
