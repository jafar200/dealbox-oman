/**
 * Store Manager Controller
 * Handles store inventory, mystery boxes, order redemption via Booking Code, and settlements
 */
import Box from '../models/Box.js';
import Order from '../models/Order.js';
import Store from '../models/Store.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createImageUploader, resolveUploadedUrl, IMAGE_MIME_ERROR } from '../utils/imageUpload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORE_UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'stores');

const uploadStoreImageMiddleware = createImageUploader({
  diskDir: STORE_UPLOAD_DIR,
  filenameFn: (_req, file, cb) => {
    const ext = (path.extname(file.originalname) || '.png').toLowerCase();
    cb(null, `store-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});

/** رفع شعار متجر محدد من لوحة الآدمن. */
export const uploadStoreImage = (req, res) => {
  uploadStoreImageMiddleware.single('image')(req, res, async (err) => {
    if (err) {
      const msg = err.message === IMAGE_MIME_ERROR
        ? err.message
        : 'تعذر رفع الشعار — تأكد أن حجمه أقل من 5 ميغابايت';
      return res.status(400).json({ success: false, message: msg });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'لم يتم اختيار صورة' });
    }
    let url;
    try {
      // تخزين خارجي دائم عند تفعيله، وإلا مسار محلي
      url = await resolveUploadedUrl(req.file, { cloudFolder: 'dealbox/stores', localPrefix: '/uploads/stores' });
    } catch {
      return res.status(500).json({ success: false, message: 'تعذر رفع الشعار إلى التخزين الخارجي' });
    }
    try {
      const store = await Store.findByIdAndUpdate(
        req.params.id,
        { $set: { logoUrl: url } },
        { new: true }
      ).lean();
      if (!store) {
        return res.status(404).json({ success: false, message: 'المتجر غير موجود' });
      }
      return res.status(200).json({ success: true, url, storeId: store._id });
    } catch {
      return res.status(500).json({ success: false, message: 'تعذر حفظ الشعار' });
    }
  });
};

export const getStoreStats = async (req, res) => {
  const storeId = req.user?.storeId || 'st-1';

  try {
    const store = await Store.findById(storeId).lean();
    const activeBoxesCount = await Box.countDocuments({ storeId, active: true });
    const totalOrders = await Order.countDocuments({ storeId });
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayOrders = await Order.countDocuments({ storeId, createdAt: { $gte: todayStart } });
    const pendingPickups = await Order.countDocuments({ storeId, status: 'pending' });
    const collectedToday = await Order.countDocuments({ storeId, status: 'collected', collectedAt: { $gte: todayStart } });
    const revenueAgg = await Order.aggregate([
      { $match: { storeId, status: { $in: ['collected', 'pending'] } } },
      { $group: { _id: null, gross: { $sum: '$pricePaidOmr' } } },
    ]);
    const grossRevenue = revenueAgg[0]?.gross || 0;

    return res.status(200).json({
      success: true,
      data: {
        storeName: store?.name || '',
        activeBoxesCount,
        totalOrders,
        todayOrders,
        todayPendingPickups: pendingPickups,
        todayCollectedCount: collectedToday,
        weeklyGrossRevenueOmr: Math.round(grossRevenue * 1000) / 1000,
        netPayoutPendingOmr: Math.round(grossRevenue * 0.85 * 1000) / 1000,
        foodSavedThisWeekKg: null,
      },
    });
  } catch {
    return res.status(500).json({ success: false, message: 'تعذر تحميل إحصائيات المتجر' });
  }
};

export const getStoreOrders = async (req, res) => {
  const storeId = req.user?.storeId || 'st-1';

  try {
    const orders = await Order.find({ storeId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.status(200).json({
      success: true,
      orders: orders.map((o) => ({
        id: o._id,
        bookingCode: o.bookingCode,
        clientName: o.clientName,
        clientPhone: o.clientPhone,
        boxTitle: o.boxTitle,
        quantity: o.quantity,
        pricePaidOmr: o.pricePaidOmr,
        status: o.status,
        pickupWindow: `${o.pickupStart || '20:00'} - ${o.pickupEnd || '21:30'}`,
        createdAt: o.createdAt,
      })),
    });
  } catch {
    return res.status(500).json({ success: false, message: 'تعذر تحميل طلبات المتجر' });
  }
};

/** سلال المتجر الخاصة فقط — متجر جديد يبدأ فارغاً بدون أي سلال جاهزة. */
export const getStoreBoxes = async (req, res) => {
  if (!req.user?.storeId) {
    return res.status(403).json({ success: false, message: 'حساب مدير المتجر غير مرتبط بمتجر' });
  }

  try {
    const boxes = await Box.find({ storeId: req.user.storeId })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      boxes: boxes.map((b) => ({
        id: b._id,
        storeId: b.storeId,
        title: b.title,
        description: b.description,
        category: b.category,
        imageUrl: b.imageUrl,
        expectedItems: b.expectedItems,
        originalPrice: b.originalPrice,
        discountedPrice: b.discountedPrice,
        currency: b.currency,
        remainingCount: b.remainingCount,
        pickupStart: b.pickupStart,
        pickupEnd: b.pickupEnd,
        pickupDate: b.pickupDate,
        active: b.active,
      })),
    });
  } catch {
    return res.status(500).json({ success: false, message: 'تعذر تحميل سلال المتجر' });
  }
};

export const verifyPickupCode = async (req, res) => {
  const { bookingCode } = req.body;

  if (!bookingCode) {
    return res.status(400).json({
      success: false,
      message: 'كود الاستلام مطلوب',
    });
  }

  // Reconcile the real order in the DB so purchases count only after collection.
  const code = bookingCode.toUpperCase().trim();
  try {
    const order = await Order.findOne({ bookingCode: code });
    if (!order) {
      return res.status(404).json({ success: false, message: 'كود غير صالح — لا يوجد طلب بهذا الرقم لدى المطاعم' });
    }
    if (order.status === 'cancelled') {
      return res.status(409).json({ success: false, message: 'هذا الطلب ملغي ولا يمكن إكمال استلامه' });
    }
    if (order.status !== 'collected') {
      order.status = 'collected';
      order.collectedAt = new Date();
      await order.save();
    }

    return res.status(200).json({
      success: true,
      message: `تم التحقق بنجاح من كود الحجز (${code})! يرجى تسليم الصندوق للزبون الآن.`,
      data: {
        bookingCode: code,
        status: 'collected',
        collectedAt: order.collectedAt,
      },
    });
  } catch {
    return res.status(500).json({ success: false, message: 'تعذر تأكيد الاستلام حالياً' });
  }
};

export const createBox = async (req, res) => {
  const { title, description, category, originalPrice, discountedPrice, remainingCount, pickupStart, pickupEnd } = req.body;
  if (!req.user?.storeId) {
    return res.status(403).json({ success: false, message: 'حساب مدير المتجر غير مرتبط بمتجر' });
  }
  if (!title?.trim() || !description?.trim() || !req.body.imageUrl) {
    return res.status(400).json({ success: false, message: 'عنوان الحقيبة ووصفها وصورتها مطلوبة' });
  }

  const store = await Store.findById(req.user.storeId);
  if (!store || store.status !== 'active') {
    return res.status(403).json({ success: false, message: 'المتجر غير نشط أو غير موجود' });
  }

  try {
    const box = await Box.create({
      storeId: store.id,
      title: title.trim(),
      description: description.trim(),
      category,
      imageUrl: req.body.imageUrl,
      expectedItems: Array.isArray(req.body.expectedItems) ? req.body.expectedItems : [],
      originalPrice: Number(originalPrice),
      discountedPrice: Number(discountedPrice),
      remainingCount: Number.parseInt(remainingCount, 10),
      pickupStart: pickupStart || '20:00',
      pickupEnd: pickupEnd || '21:30',
      pickupDate: req.body.pickupDate || 'اليوم',
      active: true,
    });

    return res.status(201).json({
      success: true,
      message: 'تم إضافة الحقيبة إلى المتجر بنجاح',
      data: {
        ...box.toObject(),
        storeName: store.name,
        storeLogoUrl: store.logoUrl,
      },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'تعذر حفظ الحقيبة' });
  }
};
