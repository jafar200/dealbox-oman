import express from 'express';
import { getAvailableBoxes, createOrder, getMyOrders, createSupportMessage, getLoyalty, getPublicAnnouncement, getPublicBranding, getPushPublicKey, subscribePush, unsubscribePush, registerDevice, unregisterDevice } from '../controllers/clientController.js';
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
// شعار المنظومة الموحّد (شعار المشروع) — مسار عام لكل الأجهزة
router.get('/branding', getPublicBranding);
// إشعارات Web Push (متصفح/هاتف) — مسارات عامة
router.get('/push/public-key', getPushPublicKey);
router.post('/push/subscribe', subscribePush);
router.post('/push/unsubscribe', unsubscribePush);
// إشعارات تطبيق الجوال (FCM) — مسارات عامة
router.post('/push/register-device', registerDevice);
router.post('/push/unregister-device', unregisterDevice);

export default router;
