import express from 'express';
import { getPublicMarketing } from '../controllers/marketingController.js';

const router = express.Router();

/* محتوى الموقع التسويقي — عام (لعرضه على صفحة الهبوط) */
router.get('/marketing', getPublicMarketing);

export default router;
