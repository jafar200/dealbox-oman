import express from 'express';
import {
  getStoreStats,
  getStoreOrders,
  getStoreBoxes,
  verifyPickupCode,
  createBox,
  uploadStoreImage,
} from '../controllers/storeController.js';
import {
  createStoreStory,
  getStoreStories,
  getStorySettings,
  submitStoryPayment,
} from '../controllers/storyController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(restrictTo('store_manager', 'admin'));

router.get('/stats', getStoreStats);
router.get('/orders', getStoreOrders);
router.get('/boxes', getStoreBoxes);
router.post('/verify-code', verifyPickupCode);
router.post('/boxes', createBox);
router.get('/story-settings', getStorySettings);
router.get('/stories', getStoreStories);
router.post('/stories', createStoreStory);
router.post('/stories/:storyId/payment', submitStoryPayment);
router.post('/stores/:id/logo', uploadStoreImage);

export default router;
