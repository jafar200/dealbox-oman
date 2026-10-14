import mongoose from 'mongoose';
import { generateBookingCode, generateOrderNumber } from '../utils/generateCode.js';
import Box from '../models/Box.js';
import Order from '../models/Order.js';
import SupportMessage from '../models/SupportMessage.js';
import PlatformSetting from '../models/PlatformSetting.js';
import { ENV } from '../config/env.js';
import { getVapidPublicKey, isWebPushConfigured, saveSubscription, removeSubscription } from '../utils/webPush.js';

// نقطة البداية الافتراضية للمسافات: ولاية السيب (الخوض)، مسقط
const DEFAULT_ORIGIN = { lat: 23.6139, lng: 58.1963 };

const roundOmr = (value) => Math.round(value * 1000) / 1000;

/**
 * ينشئ كود استلام فريداً (DB-XXXX) مع إعادة المحاولة عند التعارض
 * مع الـ unique index على bookingCode.
 */
const createUniqueBookingCode = async () => {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const bookingCode = generateBookingCode();
    const clash = await Order.exists({ bookingCode });
    if (!clash) return bookingCode;
  }
  throw new Error('تعذر توليد كود استلام فريد، يرجى إعادة المحاولة');
};

const toRadians = (degrees) => (degrees * Math.PI) / 180;

const haversineKm = (from, to) => {
  const earthRadiusKm = 6371;
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
};

const roundDistance = (value) => Math.round(value * 100) / 100;

const parseCoordinate = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * @desc Get all available deal boxes (Client view) - read from MongoDB
 * @route GET /api/v1/client/boxes
 * @query wilayah, category, maxDistance, lat, lng
 */
export const getAvailableBoxes = async (req, res) => {
  const { wilayah, category, maxDistance, lat, lng } = req.query;

  const origin = {
    lat: parseCoordinate(lat, DEFAULT_ORIGIN.lat),
    lng: parseCoordinate(lng, DEFAULT_ORIGIN.lng),
  };
  const distanceLimit = Number.isFinite(Number(maxDistance)) && Number(maxDistance) > 0
    ? Number(maxDistance)
    : null;

  const boxFilter = { active: true, remainingCount: { $gt: 0 } };
  if (category) boxFilter.category = category;

  try {
    const boxes = await Box.find(boxFilter)
      .populate('storeId', 'name wilayah area address coordinates phone logoUrl rating status')
      .sort({ createdAt: -1 })
      .lean();

    const data = boxes
      // المتجر يجب أن يكون نشطاً (active) ليظهر للزبون
      .filter((box) => box.storeId && box.storeId.status === 'active')
      // فلترة الولاية تتم من بيانات المتجر
      .filter((box) => !wilayah || box.storeId.wilayah === wilayah)
      .map((box) => {
        const store = box.storeId;
        const storeOrigin = {
          lat: parseCoordinate(store.coordinates?.lat, DEFAULT_ORIGIN.lat),
          lng: parseCoordinate(store.coordinates?.lng, DEFAULT_ORIGIN.lng),
        };

        return {
          id: box._id,
          storeId: store._id,
          storeName: store.name,
          storeLogoUrl: store.logoUrl || '',
          phone: store.phone,
          address: store.address,
          rating: store.rating,
          wilayah: store.wilayah,
          area: store.area,
          category: box.category,
          title: box.title,
          description: box.description,
          imageUrl: box.imageUrl,
          expectedItems: box.expectedItems || [],
          originalPrice: box.originalPrice,
          discountedPrice: box.discountedPrice,
          currency: box.currency || 'ر.ع',
          remainingCount: box.remainingCount,
          pickupWindow: `${box.pickupStart} - ${box.pickupEnd}`,
          pickupDate: box.pickupDate || 'اليوم',
          distanceKm: roundDistance(haversineKm(origin, storeOrigin)),
          coordinates: [storeOrigin.lat, storeOrigin.lng],
          createdAt: box.createdAt,
        };
      })
      .filter((box) => distanceLimit === null || box.distanceKm <= distanceLimit)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return res.status(200).json({
      success: true,
      count: data.length,
      currency: 'ر.ع',
      origin,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'تعذر تحميل الصناديق من قاعدة البيانات',
      details: error.message,
    });
  }
};

/**
 * تحويل مستند Order إلى شكل يفهمه واجهة الزبون
 */
const serializeOrder = (order) => ({
  id: String(order._id),
  orderNumber: order.orderNumber,
  bookingCode: order.bookingCode,
  boxId: String(order.boxId),
  storeId: String(order.storeId),
  storeName: order.storeName,
  boxTitle: order.boxTitle,
  title: order.boxTitle,
  quantity: order.quantity,
  pricePaid: order.pricePaidOmr,
  pricePaidOmr: order.pricePaidOmr,
  originalPrice: order.originalPriceOmr,
  originalPriceOmr: order.originalPriceOmr,
  platformCommissionOmr: order.platformCommissionOmr,
  storeNetPayoutOmr: order.storeNetPayoutOmr,
  currency: 'ر.ع',
  status: order.status,
  pickupCode: order.bookingCode,
  pickupWindow: order.pickupWindow,
  pickupTimeWindow: order.pickupWindow,
  createdAt: order.createdAt,
});

/**
 * @desc Create box reservation (Customer booking) -> persisted to Order collection
 * @route POST /api/v1/client/orders
 * @body  { boxId, quantity }
 */
export const createOrder = async (req, res) => {
  const { boxId, quantity: rawQuantity } = req.body || {};
  const quantity = Number(rawQuantity ?? 1);

  if (!mongoose.isValidObjectId(boxId)) {
    return res.status(400).json({ success: false, message: 'معرف الصندوق غير صالح' });
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
    return res.status(400).json({ success: false, message: 'الكمية المطلوبة غير صالحة' });
  }

  // خصم المخزون ذرياً حتى لا يُحجز الصندوق نفسه مرتين في نفس اللحظة
  const box = await Box.findOneAndUpdate(
    { _id: boxId, active: true, remainingCount: { $gte: quantity } },
    { $inc: { remainingCount: -quantity } },
    { new: true }
  ).populate('storeId', 'name wilayah area address phone status');

  if (!box) {
    const exists = await Box.exists({ _id: boxId });
    return res.status(exists ? 409 : 404).json({
      success: false,
      message: exists
        ? 'عذراً، نفدت الكمية المتاحة من هذا الصندوق'
        : 'الصندوق المطلوب غير موجود',
    });
  }

  const store = box.storeId;
  if (!store || store.status !== 'active') {
    // إعادة المخزون لأن المتجر لم يعد نشطاً
    await Box.updateOne({ _id: box._id }, { $inc: { remainingCount: quantity } });
    return res.status(409).json({ success: false, message: 'المتجر غير متاح حالياً للحجز' });
  }

  // خصم الولاء: يُفعَّل تلقائياً بعد 10 استلامات مؤكدة (collected)، بنسبة يحددها الأدمن
  const purchases = await Order.countDocuments({
    clientId: req.user?._id,
    status: 'collected',
  });
  const loyaltySettings = await PlatformSetting.findOne({ key: 'loyalty' }).lean();
  const loyaltyPct = purchases >= 10 ? (loyaltySettings?.loyaltyDiscountPercent ?? 0) : 0;
  const unitPrice = loyaltyPct > 0
    ? roundOmr(box.discountedPrice * (1 - loyaltyPct / 100))
    : box.discountedPrice;

  const pricePaidOmr = roundOmr(unitPrice * quantity);
  const originalPriceOmr = roundOmr(box.originalPrice * quantity);
  const platformCommissionOmr = roundOmr(pricePaidOmr * ENV.COMMISSION_RATE);
  const storeNetPayoutOmr = roundOmr(pricePaidOmr - platformCommissionOmr);
  const pickupWindow = `${box.pickupDate || 'اليوم'} ${box.pickupStart} - ${box.pickupEnd}`;

  try {
    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      bookingCode: await createUniqueBookingCode(),
      clientId: req.user?._id,
      clientName: req.user?.name || 'زبون DealBox',
      clientPhone: req.user?.phone || '+968 9000 0000',
      boxId: box._id,
      storeId: store._id,
      storeName: store.name,
      boxTitle: box.title,
      quantity,
      pricePaidOmr,
      originalPriceOmr,
      platformCommissionOmr,
      storeNetPayoutOmr,
      status: 'pending',
      pickupWindow,
    });

    return res.status(201).json({
      success: true,
      message: 'تم حجز الصندوق بنجاح! أظهر كود الاستلام للكاشير عند المتجر',
      data: serializeOrder(order),
    });
  } catch (error) {
    // أعد المخزون إذا فشل إنشاء الطلب (مثال: تعارض رقم الطلب)
    await Box.updateOne({ _id: box._id }, { $inc: { remainingCount: quantity } });

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'تعذر إتمام الحجز بسبب تعارض مؤقت، يرجى إعادة المحاولة',
      });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: Object.values(error.errors)[0]?.message });
    }
    return res.status(500).json({ success: false, message: 'تعذر إتمام الحجز في قاعدة البيانات' });
  }
};

/**
 * @desc Loyalty status for the signed-in client (purchases toward 10-buy reward).
 * @route GET /api/v1/client/loyalty
 */
export const getLoyalty = async (req, res) => {
  try {
    const purchases = await Order.countDocuments({
      clientId: req.user?._id,
      status: 'collected',
    });
    const settings = await PlatformSetting.findOne({ key: 'loyalty' }).lean();
    const percent = typeof settings?.loyaltyDiscountPercent === 'number' ? settings.loyaltyDiscountPercent : 5;
    const threshold = 10;
    return res.status(200).json({
      success: true,
      purchases,
      threshold,
      remaining: Math.max(0, threshold - purchases),
      loyaltyDiscountPercent: percent,
      eligible: purchases >= threshold,
    });
  } catch {
    return res.status(500).json({ success: false, message: 'تعذر تحميل بيانات الولاء' });
  }
};

/**
 * @desc Public general announcement published by the admin (shown to users on their phones).
 * @route GET /api/v1/client/announcement  (public — no auth)
 */
export const getPublicAnnouncement = async (req, res) => {
  try {
    const settings = await PlatformSetting.findOne({ key: 'announcement' }).lean();
    return res.status(200).json({
      success: true,
      announcement: settings?.announcementActive
        ? {
            title: settings.announcementTitle || '',
            body: settings.announcementBody || '',
            publishedAt: settings.announcementPublishedAt || null,
          }
        : null,
    });
  } catch {
    return res.status(500).json({ success: false, message: 'تعذر تحميل التنبيه العام' });
  }
};

/**
 * @desc VAPID public key for browser push subscriptions.
 * @route GET /api/v1/client/push/public-key  (public)
 */
export const getPushPublicKey = async (req, res) => {
  return res.status(200).json({
    success: true,
    enabled: isWebPushConfigured(),
    publicKey: getVapidPublicKey(),
  });
};

/**
 * @desc Save a browser push subscription so the device receives the admin announcement.
 * @route POST /api/v1/client/push/subscribe  (public)
 */
export const subscribePush = async (req, res) => {
  const { endpoint, keys } = req.body || {};
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ success: false, message: 'بيانات الاشتراك غير مكتملة' });
  }
  try {
    await saveSubscription({
      endpoint,
      keys: { p256dh: keys.p256dh, auth: keys.auth },
      userAgent: req.get('user-agent') || '',
    });
    return res.status(200).json({ success: true });
  } catch {
    return res.status(500).json({ success: false, message: 'تعذر حفظ اشتراك الإشعارات' });
  }
};

/**
 * @desc Remove a browser push subscription (user turned notifications off).
 * @route POST /api/v1/client/push/unsubscribe  (public)
 */
export const unsubscribePush = async (req, res) => {
  const { endpoint } = req.body || {};
  if (!endpoint) {
    return res.status(400).json({ success: false, message: 'معرّف الاشتراك مطلوب' });
  }
  try {
    await removeSubscription(endpoint);
    return res.status(200).json({ success: true });
  } catch {
    return res.status(500).json({ success: false, message: 'تعذر إلغاء اشتراك الإشعارات' });
  }
};

/**
 * @desc Submit a "الدعم الفني ومساعدة المستفيدين" message.
 * @route POST /api/v1/client/support
 */
export const createSupportMessage = async (req, res) => {
  const message = (req.body?.message || '').trim();
  if (!message) {
    return res.status(400).json({ success: false, message: 'اكتب رسالة الدعم أولاً' });
  }
  try {
    await SupportMessage.create({
      user: req.user?._id,
      name: req.user?.name || '',
      email: req.user?.email || '',
      phone: req.user?.phone || '',
      message,
    });
    return res.status(201).json({ success: true, message: 'استلم فريق الدعم رسالتك، سنعاود التواصل معك قريباً' });
  } catch {
    return res.status(500).json({ success: false, message: 'تعذر إرسال رسالتك حالياً' });
  }
};

/**
 * @desc Get customer orders
 * @route GET /api/v1/client/orders
 */
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ clientId: req.user._id }).sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders: orders.map(serializeOrder),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'تعذر تحميل طلباتك من قاعدة البيانات',
      details: error.message,
    });
  }
};
