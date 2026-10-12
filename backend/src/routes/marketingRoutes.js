import express from 'express';
import { getPublicMarketing } from '../controllers/marketingController.js';
import {
  createPartnerRequest,
} from '../controllers/partnerRequestController.js';
import { partnerRequestLimiter } from '../middlewares/rateLimitMiddleware.js';

const router = express.Router();

/* محتوى الموقع التسويقي — عام (لعرضه على صفحة الهبوط) */
router.get('/marketing', getPublicMarketing);

/* استمارة انضمام الشركاء — عامة (بدون مصادقة) مع حد 5 طلبات/ساعة لكل IP */
router.post('/partnership-requests', partnerRequestLimiter, createPartnerRequest);

export default router;
