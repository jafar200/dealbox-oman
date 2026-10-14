import express from 'express';
import { getAvailableBoxes, createOrder, getMyOrders, createSupportMessage, getLoyalty, getPublicAnnouncement, getPushPublicKey, subscribePush, unsubscribePush } from '../controllers/clientController.js';
import { getPublicStories, getPublicStoreBoxes } from '../controllers/storyController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/boxes', getAvailableBoxes);
router.get('/stories', getPublicStories);
router.get('/stores/:storeId/boxes', getPublicStoreBoxes);
router.post('/orders', protect, createOrder);
router.get('/orders', protect, getMyOrders);
router.post('/support', protect, createSupportMessage);
router.get('/loyalty', protect, getLoyalty);
// مسار عام (بدون تسجيل دخول) ليصل التنبيه العام لكل المستفيدين على هواتفهم
router.get('/announcement', getPublicAnnouncement);
// إشعارات Web Push (متصفح/هاتف) — مسارات عامة
router.get('/push/public-key', getPushPublicKey);
router.post('/push/subscribe', subscribePush);
router.post('/push/unsubscribe', unsubscribePush);

export default router;
