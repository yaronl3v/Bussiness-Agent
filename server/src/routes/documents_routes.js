import { Router } from 'express';
import { requireAuth } from '../middleware/auth_middleware.js';
import { DocumentsController } from '../controllers/documents_controller.js';
import IngestionService from '../services/ingestion_service.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadsRoot = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsRoot)) fs.mkdirSync(uploadsRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const { id: agentId } = req.params;
    const dir = path.join(uploadsRoot, String(agentId));
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const safe = Date.now() + '-' + file.originalname.replace(/[^A-Za-z0-9._-]/g, '_');
    cb(null, safe);
  }
});

const upload = multer({ storage });

const router = Router({ mergeParams: true });

router.get('/', requireAuth, DocumentsController.list);
router.post('/', requireAuth, DocumentsController.create);
router.post('/upload', requireAuth, upload.single('file'), DocumentsController.upload);
router.delete('/:docId', requireAuth, DocumentsController.remove);

router.post('/:docId/ingest', requireAuth, async (req, res, next) => {
  try {
    const { docId } = req.params;
    const result = await IngestionService.ingestDocument({ documentId: docId });
    return res.json(result);
  } catch (err) { next(err); }
});

export default router;
