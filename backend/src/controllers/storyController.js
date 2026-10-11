import mongoose from 'mongoose';
import Box from '../models/Box.js';
import PlatformSetting from '../models/PlatformSetting.js';
import Store from '../models/Store.js';
import StoreStory from '../models/StoreStory.js';

const STORY_SETTING_KEY = 'story-promotion';
const MAX_IMAGE_DATA_LENGTH = 4_500_000;
const imageDataPattern = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;

/**
 * رسوم القصة لمجرد متجر محدد:
 * يُستخدم إعداد المتجر الخاص (storySettings) إن وُجد وإلا الرسوم العالمية.
 * المتجر الجديد يحصل على إعدادات افتراضية (0 ر.ع، أسبوعي).
 */
const getStoryFee = async (storeId) => {
  if (storeId) {
    const store = await Store.findById(storeId).lean();
    if (store?.storySettings?.feeOmr !== undefined) {
      return { feeOmr: store.storySettings.feeOmr || 0, period: store.storySettings.period || 'weekly' };
    }
  }
  const settings = await PlatformSetting.findOne({ key: STORY_SETTING_KEY }).lean();
  return { feeOmr: settings?.storyPromotionFeeOmr || 0, period: 'weekly' };
};

const serializeStory = (story) => ({
  id: story.id,
  storeId: String(story.storeId?._id || story.storeId),
  storeName: story.storeId?.name || '',
  storeLogoUrl: story.storeId?.logoUrl || '',
  category: story.storeId?.category || 'bakery',
  imageData: story.imageData,
  caption: story.caption,
  feeOmr: story.feeOmr,
  paymentStatus: story.paymentStatus,
  paymentReference: story.paymentReference,
  reviewStatus: story.reviewStatus,
  rejectionReason: story.rejectionReason,
  expiresAt: story.expiresAt,
  createdAt: story.createdAt,
});

const validateImageData = (imageData) =>
  typeof imageData === 'string'
  && imageData.length <= MAX_IMAGE_DATA_LENGTH
  && imageDataPattern.test(imageData);

export const getStorySettings = async (req, res) => {
  // مسؤول المتجر يرى إعدادات متجره الخاصة (رسوم + فترة)
  if (req.user?.role === 'store_manager' && req.user?.storeId) {
    const store = await Store.findById(req.user.storeId).lean();
    if (store) {
      return res.status(200).json({
        success: true,
        storyPromotionFeeOmr: store.storySettings?.feeOmr ?? 0,
        storyFeePeriod: store.storySettings?.period ?? 'weekly',
        storyEnabled: store.storySettings?.enabled !== false,
      });
    }
  }
  // الآدمن يرى الرسوم العالمية الافتراضية
  const feeOmr = await getStoryFee();
  return res.status(200).json({ success: true, storyPromotionFeeOmr: feeOmr });
};

export const updateStorySettings = async (req, res) => {
  const feeOmr = Number(req.body.storyPromotionFeeOmr);
  if (!Number.isFinite(feeOmr) || feeOmr < 0.001 || feeOmr > 1000) {
    return res.status(400).json({ success: false, message: 'رسوم القصة يجب أن تكون بين 0.001 و1000 ر.ع' });
  }

  const settings = await PlatformSetting.findOneAndUpdate(
    { key: STORY_SETTING_KEY },
    { $set: { storyPromotionFeeOmr: feeOmr } },
    { new: true, upsert: true, runValidators: true }
  );
  return res.status(200).json({ success: true, storyPromotionFeeOmr: settings.storyPromotionFeeOmr });
};

export const createStoreStory = async (req, res) => {
  if (!req.user?.storeId) {
    return res.status(403).json({ success: false, message: 'حساب مدير المتجر غير مرتبط بمتجر' });
  }
  if (!validateImageData(req.body.imageData)) {
    return res.status(400).json({ success: false, message: 'الصورة غير صالحة أو تتجاوز الحد الأقصى 3 ميجابايت' });
  }

  const [store, feeData] = await Promise.all([
    Store.findById(req.user.storeId),
    getStoryFee(req.user.storeId),
  ]);
  if (!store || store.status !== 'active') {
    return res.status(403).json({ success: false, message: 'المتجر غير نشط أو غير موجود' });
  }
  if (!store.storySettings?.enabled) {
    return res.status(403).json({ success: false, message: 'إعلانات القصص معطّلة لهذا المتجر من لوحة الإدارة' });
  }
  if (feeData.feeOmr <= 0) {
    return res.status(409).json({ success: false, message: 'لم يحدد الأدمن رسوم نشر القصة لهذا المتجر بعد' });
  }

  const story = await StoreStory.create({
    storeId: store.id,
    imageData: req.body.imageData,
    caption: typeof req.body.caption === 'string' ? req.body.caption.trim().slice(0, 180) : '',
    feeOmr: feeData.feeOmr,
    feePeriod: feeData.period,
  });
  return res.status(201).json({ success: true, story: serializeStory(story) });
};

export const getStoreStories = async (req, res) => {
  if (!req.user?.storeId) {
    return res.status(403).json({ success: false, message: 'حساب مدير المتجر غير مرتبط بمتجر' });
  }
  const stories = await StoreStory.find({ storeId: req.user.storeId }).sort({ createdAt: -1 });
  return res.status(200).json({ success: true, stories: stories.map(serializeStory) });
};

export const submitStoryPayment = async (req, res) => {
  const paymentReference = typeof req.body.paymentReference === 'string'
    ? req.body.paymentReference.trim()
    : '';
  if (paymentReference.length < 3) {
    return res.status(400).json({ success: false, message: 'أدخل مرجع التحويل البنكي لإرساله للمراجعة' });
  }

  const story = await StoreStory.findOne({
    _id: req.params.storyId,
    storeId: req.user?.storeId,
    reviewStatus: { $in: ['pending_payment', 'rejected'] },
  });
  if (!story) {
    return res.status(404).json({ success: false, message: 'القصة غير موجودة أو لا تملك صلاحية تعديلها' });
  }

  story.paymentReference = paymentReference.slice(0, 100);
  story.paymentStatus = 'submitted';
  story.reviewStatus = 'pending_review';
  story.rejectionReason = '';
  await story.save();
  return res.status(200).json({ success: true, story: serializeStory(story) });
};

export const getAdminStories = async (req, res) => {
  const filter = req.query.status ? { reviewStatus: req.query.status } : {};
  const stories = await StoreStory.find(filter)
    .populate('storeId', 'name logoUrl category')
    .sort({ createdAt: -1 });
  return res.status(200).json({ success: true, stories: stories.map(serializeStory) });
};

export const reviewStoreStory = async (req, res) => {
  const { action, rejectionReason = '' } = req.body;
  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ success: false, message: 'إجراء المراجعة غير صالح' });
  }
  if (action === 'reject' && !String(rejectionReason).trim()) {
    return res.status(400).json({ success: false, message: 'اكتب سبب رفض القصة' });
  }

  const story = await StoreStory.findById(req.params.storyId);
  if (!story) return res.status(404).json({ success: false, message: 'القصة غير موجودة' });
  if (story.reviewStatus !== 'pending_review' || story.paymentStatus !== 'submitted') {
    return res.status(409).json({ success: false, message: 'لا يمكن اعتماد القصة قبل تقديم مرجع التحويل' });
  }

  story.reviewedBy = req.user.id;
  if (action === 'approve') {
    story.paymentStatus = 'confirmed';
    story.reviewStatus = 'approved';
    story.paidAt = new Date();
    story.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  } else {
    story.reviewStatus = 'rejected';
    story.rejectionReason = String(rejectionReason).trim().slice(0, 300);
  }
  await story.save();

  const populatedStory = await StoreStory.findById(story.id).populate('storeId', 'name logoUrl category');
  return res.status(200).json({ success: true, story: serializeStory(populatedStory) });
};

export const getPublicStories = async (req, res) => {
  const stories = await StoreStory.find({
    reviewStatus: 'approved',
    paymentStatus: 'confirmed',
    expiresAt: { $gt: new Date() },
  })
    .populate({ path: 'storeId', match: { status: 'active' }, select: 'name logoUrl category status' })
    .sort({ paidAt: -1 });
  return res.status(200).json({
    success: true,
    stories: stories.filter((story) => story.storeId?.status === 'active').map(serializeStory),
  });
};

export const getPublicStoreBoxes = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.storeId)) {
    return res.status(400).json({ success: false, message: 'معرف المتجر غير صالح' });
  }
  const store = await Store.findById(req.params.storeId).select('status');
  if (!store || store.status !== 'active') {
    return res.status(404).json({ success: false, message: 'المتجر غير متاح' });
  }

  const boxes = await Box.find({
    storeId: req.params.storeId,
    active: true,
    remainingCount: { $gt: 0 },
  }).sort({ createdAt: -1 });
  return res.status(200).json({ success: true, boxes });
};