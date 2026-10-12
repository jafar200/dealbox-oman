import express from 'express';
import {
  getAdminOverview,
  getStoresList,
  getSettlements,
  updateSettlementStatus,
  createStoreWithManager,
  getSupportMessages,
  getLoyaltySettings,
  updateLoyaltySettings,
  getAnnouncement,
  updateAnnouncement,
  getPasswordResetSettings,
  updatePasswordResetSettings,
  getAdminAnalytics,
  getUsersAnalytics,
  getAccountingReport,
  getAdminTeam,
  createAdmin,
  updateAdminTeamMember,
  deleteAdminTeamMember,
} from '../controllers/adminController.js';
import {
  getAdminMarketing,
  updateAdminMarketing,
  uploadMarketingImage,
} from '../controllers/marketingController.js';
import { updateStore, updateStoreStorySettings } from '../controllers/adminController.js';
import { uploadStoreImage } from '../controllers/storeController.js';
import {
  getPartnerRequests,
  updatePartnerRequest,
} from '../controllers/partnerRequestController.js';
import {
  getAdminStories,
  getStorySettings,
  reviewStoreStory,
  updateStorySettings,
} from '../controllers/storyController.js';
import { protect, restrictTo, requirePermissions } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(restrictTo('admin'));

// لوحة التحكم العامة (متاحة لكل أدوار اللوحة المعتمدة)
router.get('/overview', requirePermissions('overview'), getAdminOverview);
router.get('/analytics', requirePermissions('overview'), getAdminAnalytics);

// المتاجر — يتطلب صلاحية المتاجر
router.get('/stores', requirePermissions('stores'), getStoresList);
router.post('/stores', requirePermissions('stores'), createStoreWithManager);
router.patch('/stores/:id', requirePermissions('stores'), updateStore);
router.post('/stores/:id/logo', requirePermissions('stores'), uploadStoreImage);
router.patch('/stores/:id/story-settings', requirePermissions('stores'), updateStoreStorySettings);

// طلبات انضمام الشركاء (من استمارة الموقع) — صلاحية المتاجر
router.get('/partner-requests', requirePermissions('stores'), getPartnerRequests);
router.patch('/partner-requests/:id', requirePermissions('stores'), updatePartnerRequest);

// الحجوزات والتقارير الفورية — صلاحية المستخدمين/التقارير
router.get('/users-analytics', requirePermissions('users'), getUsersAnalytics);
router.get('/support-messages', requirePermissions('reports'), getSupportMessages);

// المالية — التسويات والحسابات
router.get('/settlements', requirePermissions('accounting'), getSettlements);
router.patch('/settlements/:id', requirePermissions('accounting'), updateSettlementStatus);
router.get('/accounting', requirePermissions('accounting'), getAccountingReport);

// قصص المتاجر المدفوعة
router.get('/story-settings', requirePermissions('settings'), getStorySettings);
router.patch('/story-settings', requirePermissions('settings'), updateStorySettings);
router.get('/stories', requirePermissions('stories'), getAdminStories);
router.patch('/stories/:storyId/review', requirePermissions('stories'), reviewStoreStory);

// إعدادات النظام — صلاحية الإعدادات
router.get('/loyalty', requirePermissions('settings'), getLoyaltySettings);
router.patch('/loyalty', requirePermissions('settings'), updateLoyaltySettings);
router.get('/announcement', requirePermissions('settings'), getAnnouncement);
router.patch('/announcement', requirePermissions('settings'), updateAnnouncement);
router.get('/password-reset-settings', requirePermissions('settings'), getPasswordResetSettings);
router.patch('/password-reset-settings', requirePermissions('settings'), updatePasswordResetSettings);

// فريق المشرفين والصلاحيات الميدانية (RBAC) — تعديله مقصور على مدير عام (داخل المتحكم)
router.get('/team', requirePermissions('settings'), getAdminTeam);
router.post('/team', requirePermissions('settings'), createAdmin);
router.patch('/team/:id', requirePermissions('settings'), updateAdminTeamMember);
router.delete('/team/:id', requirePermissions('settings'), deleteAdminTeamMember);

// المحتوى التسويقي للموقع — صلاحية الإعدادات
router.get('/marketing', requirePermissions('settings'), getAdminMarketing);
router.put('/marketing', requirePermissions('settings'), updateAdminMarketing);
router.post('/marketing/images', requirePermissions('settings'), uploadMarketingImage);

export default router;
