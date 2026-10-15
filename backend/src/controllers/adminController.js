import bcrypt from 'bcryptjs';
import Store from '../models/Store.js';
import User from '../models/User.js';
import SupportMessage from '../models/SupportMessage.js';
import PlatformSetting from '../models/PlatformSetting.js';
import Order from '../models/Order.js';
import { getMailStatus } from '../utils/mailer.js';
import { sendAnnouncementPush } from '../utils/webPush.js';
import { sendAnnouncementFcm } from '../utils/fcm.js';
import { createImageUploader, resolveUploadedUrl, IMAGE_MIME_ERROR } from '../utils/imageUpload.js';
import { ENV } from '../config/env.js';
import {
  ADMIN_ROLE_KEYS,
  ADMIN_ROLE_CATALOG,
  adminRoleInfo,
  permissionsForRole,
} from '../config/adminRoles.js';

const LOYALTY_KEY = 'loyalty';
const ANNOUNCEMENT_KEY = 'announcement';
const PASSWORD_RESET_KEY = 'password-reset';
const BRANDING_KEY = 'branding';
// الحد الأقصى لحجم الشعار عند تخزينه داخل قاعدة البيانات (احتياطي بدون تخزين خارجي).
const MAX_INLINE_LOGO_BYTES = 1_500_000;

/**
 * Super Admin Controller for DealBox Sultanate of Oman
 * Oversees all partner stores, platform commission, user roles, and weekly settlements
 */

export const getAdminOverview = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      totalStoresOman: 28,
      activeStoresInKhoudh: 12,
      totalOrdersToday: 142,
      totalGrossSalesOmr: 1240.5,
      dealboxCommissionOmr: 186.075, // 15% platform take rate
      foodSavedTotalKg: 890.4,
      co2AvoidedKg: 2226.0,
      pendingSettlementsCount: 4,
    },
  });
};

/**
 * إحصائيات حقيقية للوحة الأدمن المركزية تُشتق مباشرة من قاعدة البيانات
 * (Orders / Stores / SupportMessages) بدلاً من أرقام وهمية ثابتة.
 * @route GET /api/v1/admin/analytics
 */
export const getAdminAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(startOfToday);
    weekStart.setDate(weekStart.getDate() - 6);

    const [orders, stores] = await Promise.all([
      Order.find({}).lean(),
      Store.find({}).lean(),
    ]);

    const nonCancelled = orders.filter((o) => o.status !== 'cancelled');
    const todayOrders = orders.filter((o) => o.createdAt && o.createdAt >= startOfToday);
    const nonCancelledPct =
      orders.length > 0 ? Math.round((nonCancelled.length / orders.length) * 1000) / 10 : 0;

    // مبيعات المتاجر الكاملة: كل الطلبات غير الملغاة
    const grossSalesOmr = nonCancelled.reduce((sum, o) => sum + (o.pricePaidOmr || 0), 0);
    const platformCommissionOmr = nonCancelled.reduce((sum, o) => sum + (o.platformCommissionOmr || 0), 0);
    const mealsRescued = nonCancelled.reduce((sum, o) => sum + (o.quantity || 0), 0);

    // توزيع طلبات آخر 7 أيام (للرسم البياني الأسبوعي)
    const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const weekly = [];
    for (let i = 0; i < 7; i += 1) {
      const dayStart = new Date(weekStart);
      dayStart.setDate(weekStart.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);
      const dayOrders = orders.filter((o) => o.createdAt && o.createdAt >= dayStart && o.createdAt < dayEnd);
      const daySales = dayOrders
        .filter((o) => o.status !== 'cancelled')
        .reduce((sum, o) => sum + (o.pricePaidOmr || 0), 0);
      weekly.push({
        day: dayNames[dayStart.getDay()],
        salesOmr: Math.round(daySales * 1000) / 1000,
        ordersCount: dayOrders.length,
        isPeak: false,
      });
    }
    const maxDay = weekly.reduce((a, b) => (b.salesOmr > a.salesOmr ? b : a), weekly[0]);
    if (maxDay) maxDay.isPeak = true;

    // طلبات اليوم حسب الحالة
    const todayStats = {
      total: todayOrders.length,
      collected: todayOrders.filter((o) => o.status === 'collected').length,
      pending: todayOrders.filter((o) => o.status === 'pending').length,
      cancelled: todayOrders.filter((o) => o.status === 'cancelled').length,
    };

    // آخر الحجوزات للجدول اللحظي
    const recentOrders = orders
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6)
      .map((o) => ({
        id: o.bookingCode,
        storeName: o.storeName,
        beneficiary: o.clientName,
        beneficiaryNote: o.boxTitle,
        windowTime: o.pickupWindow,
        status: o.status,
        statusText:
          o.status === 'collected' ? 'مكتمل الاستلام'
            : o.status === 'cancelled' ? 'ملغي (أعيد طرح السلة)' : 'بانتظار الحضور',
        phone: o.clientPhone,
        items: o.boxTitle,
        priceOmr: o.pricePaidOmr,
      }));

    const activeStores = stores.filter((s) => s.status === 'active').length;

    return res.status(200).json({
      success: true,
      data: {
        totalStores: stores.length,
        activeStores,
        pendingStores: stores.length - activeStores,
        grossSalesOmr: Math.round(grossSalesOmr * 1000) / 1000,
        platformCommissionOmr: Math.round(platformCommissionOmr * 1000) / 1000,
        mealsRescued,
        totalOrders: orders.length,
        nonCancelledPct,
        todayStat: todayStats,
        weekly,
        recentOrders,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'تعذر حساب إحصائيات العمليات',
      details: error.message,
    });
  }
};

/**
 * دليل المستخدمين وحجوزاتهم (GET /api/v1/admin/users-analytics — أدمن فقط)
 * يعيد لكل مستخدم عدد حجوزاته (إجمالي + اليوم/الأسبوع/الشهر/السنة) وتوزيعها على المتاجر،
 * ولكل متجر عدد حجوزاته ومن هم المستخدمون الذين حجزوا (مع عدادات الفترات الزمنية).
 * البيانات لحظية ومشتقة مباشرة من Orders + User.
 */
export const getUsersAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(startOfToday);
    weekStart.setDate(weekStart.getDate() - 6);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const [orders, registeredClients] = await Promise.all([
      Order.find({}).lean(),
      User.find({ role: 'client' }).select('name email phone active').lean(),
    ]);

    const emptyCounts = () => ({ all: 0, day: 0, week: 0, month: 0, year: 0 });
    const countPeriods = (date, counts) => {
      if (!date) return;
      const t = new Date(date).getTime();
      counts.all += 1;
      if (t >= startOfToday.getTime()) counts.day += 1;
      if (t >= weekStart.getTime()) counts.week += 1;
      if (t >= monthStart.getTime()) counts.month += 1;
      if (t >= yearStart.getTime()) counts.year += 1;
    };

    // مفتاح التجميع: clientId عند وجوده وإلا (الاسم||الهاتف) للزوار غير المسجلين
    const keyOf = (o) => (o.clientId ? String(o.clientId) : `${o.clientName}||${o.clientPhone}`);

    const clients = new Map();
    for (const u of registeredClients) {
      clients.set(String(u._id), {
        clientId: String(u._id),
        clientName: u.name || 'مستفيد',
        clientPhone: u.phone || '',
        email: u.email || null,
        registered: true,
        totals: emptyCounts(),
        lastBookingAt: null,
        byStore: {},
      });
    }

    for (const o of orders) {
      const key = keyOf(o);
      let entry = clients.get(key);
      if (!entry) {
        entry = {
          clientId: o.clientId ? String(o.clientId) : null,
          clientName: o.clientName || 'مستفيد',
          clientPhone: o.clientPhone || '',
          email: null,
          registered: false,
          totals: emptyCounts(),
          lastBookingAt: null,
          byStore: {},
        };
        clients.set(key, entry);
      }

      countPeriods(o.createdAt, entry.totals);
      const storeKey = o.storeId ? String(o.storeId) : o.storeName || 'متجر';
      let storeEntry = entry.byStore[storeKey];
      if (!storeEntry) {
        storeEntry = {
          storeId: o.storeId ? String(o.storeId) : null,
          storeName: o.storeName || 'متجر',
          count: emptyCounts(),
        };
        entry.byStore[storeKey] = storeEntry;
      }
      countPeriods(o.createdAt, storeEntry.count);
      if (!entry.lastBookingAt || new Date(o.createdAt) > new Date(entry.lastBookingAt)) {
        entry.lastBookingAt = o.createdAt;
      }
    }

    const users = [...clients.values()]
      .map((c) => ({
        clientId: c.clientId,
        clientName: c.clientName,
        clientPhone: c.clientPhone,
        email: c.email,
        registered: c.registered,
        totals: c.totals,
        lastBookingAt: c.lastBookingAt,
        byStore: Object.values(c.byStore)
          .sort((a, b) => b.count.all - a.count.all)
          .map((s) => ({ storeId: s.storeId, storeName: s.storeName, count: s.count })),
      }))
      .sort((a, b) => b.totals.all - a.totals.all || a.clientName.localeCompare(b.clientName, 'ar'));

    // تجميع حجوزات المتاجر ومن حجز من المستخدمين (مع عدادات الفترات)
    const storeMap = new Map();
    for (const o of orders) {
      const key = o.storeId ? String(o.storeId) : o.storeName || 'متجر';
      let s = storeMap.get(key);
      if (!s) {
        s = {
          storeId: o.storeId ? String(o.storeId) : null,
          storeName: o.storeName || 'متجر',
          totals: emptyCounts(),
          userMap: new Map(),
        };
        storeMap.set(key, s);
      }
      countPeriods(o.createdAt, s.totals);

      const uKey = keyOf(o);
      let user = s.userMap.get(uKey);
      if (!user) {
        user = { clientName: o.clientName || 'مستفيد', phone: o.clientPhone || '', count: emptyCounts() };
        s.userMap.set(uKey, user);
      }
      countPeriods(o.createdAt, user.count);
    }

    const stores = [...storeMap.values()]
      .map((s) => ({
        storeId: s.storeId,
        storeName: s.storeName,
        totals: s.totals,
        users: [...s.userMap.values()]
          .sort((a, b) => b.count.all - a.count.all)
          .map((u) => ({ clientName: u.clientName, phone: u.phone, count: u.count })),
      }))
      .sort((a, b) => b.totals.all - a.totals.all);

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalUsers: users.length,
          totalBookings: orders.length,
          activeToday: users.filter((u) => u.totals.day > 0).length,
          totalStores: stores.length,
        },
        users,
        stores,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'تعذر حساب تحليلات المستخدمين والحجوزات',
      details: error.message,
    });
  }
};

/**
 * التقرير المحاسبي الشامل (GET /api/v1/admin/accounting — أدمن فقط)
 * لكل متجر: عدد الحجوزات (الإجمالي/المؤكدة/الملغية/قيد الاستلام/المكتملة) والمبالغ
 * (المبيعات/عمولة المنصة/صافي التحويل) حسب الفترة (الكل/اليوم/الأسبوع/الشهر/السنة)،
 * مع قائمة المستخدمين الحاجزين لكل متجر وجدول كل الحجوزات للبحث والتصفية والتصدير.
 */
export const getAccountingReport = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(startOfToday);
    weekStart.setDate(weekStart.getDate() - 6);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const orders = await Order.find({}).lean();

    const emptyCounts = () => ({ all: 0, day: 0, week: 0, month: 0, year: 0 });
    const round3 = (n) => Math.round((n || 0) * 1000) / 1000;
    const emptyPeriod = () => ({ bookings: 0, confirmed: 0, cancelled: 0, pending: 0, collected: 0, gross: 0, commission: 0, net: 0 });

    // الفترات التي ينتمي إليها الطلب حسب تاريخ إنشائه (كلها متداخلة)
    const periodsOf = (date) => {
      const list = ['all'];
      if (!date) return list;
      const t = new Date(date).getTime();
      if (t >= startOfToday.getTime()) list.push('day');
      if (t >= weekStart.getTime()) list.push('week');
      if (t >= monthStart.getTime()) list.push('month');
      if (t >= yearStart.getTime()) list.push('year');
      return list;
    };

    const summaryPeriods = { all: emptyPeriod(), day: emptyPeriod(), week: emptyPeriod(), month: emptyPeriod(), year: emptyPeriod() };
    const storeMap = new Map();
    const keyOfUser = (o) => (o.clientId ? String(o.clientId) : `${o.clientName}||${o.clientPhone}`);

    for (const o of orders) {
      const storeKey = o.storeId ? String(o.storeId) : o.storeName || 'متجر';
      let s = storeMap.get(storeKey);
      if (!s) {
        s = {
          storeId: o.storeId ? String(o.storeId) : null,
          storeName: o.storeName || 'متجر',
          counts: emptyCounts(),
          confirmed: emptyCounts(),
          cancelled: emptyCounts(),
          pending: emptyCounts(),
          collected: emptyCounts(),
          gross: emptyCounts(),
          commission: emptyCounts(),
          net: emptyCounts(),
          userMap: new Map(),
        };
        storeMap.set(storeKey, s);
      }

      const periods = periodsOf(o.createdAt);
      const isCancelled = o.status === 'cancelled';
      for (const p of periods) {
        const sp = summaryPeriods[p];
        s.counts[p] += 1;
        sp.bookings += 1;
        if (isCancelled) {
          s.cancelled[p] += 1;
          sp.cancelled += 1;
        } else {
          s.confirmed[p] += 1;
          sp.confirmed += 1;
          if (o.status === 'collected') {
            s.collected[p] += 1;
            sp.collected += 1;
          }
          if (o.status === 'pending') {
            s.pending[p] += 1;
            sp.pending += 1;
          }
          const gross = o.pricePaidOmr || 0;
          const comm = o.platformCommissionOmr || 0;
          s.gross[p] += gross;
          s.commission[p] += comm;
          s.net[p] += o.storeNetPayoutOmr || 0;
          sp.gross += gross;
          sp.commission += comm;
          sp.net += o.storeNetPayoutOmr || 0;
        }
      }

      const uKey = keyOfUser(o);
      let u = s.userMap.get(uKey);
      if (!u) {
        u = { clientName: o.clientName || 'مستفيد', phone: o.clientPhone || '', count: emptyCounts(), confirmed: emptyCounts(), cancelled: emptyCounts() };
        s.userMap.set(uKey, u);
      }
      for (const p of periods) {
        u.count[p] += 1;
        if (isCancelled) u.cancelled[p] += 1;
        else u.confirmed[p] += 1;
      }
    }

    for (const p of Object.keys(summaryPeriods)) {
      const sp = summaryPeriods[p];
      sp.gross = round3(sp.gross);
      sp.commission = round3(sp.commission);
      sp.net = round3(sp.net);
    }

    const stores = [...storeMap.values()]
      .map((s) => ({
        storeId: s.storeId,
        storeName: s.storeName,
        counts: s.counts,
        confirmed: s.confirmed,
        cancelled: s.cancelled,
        pending: s.pending,
        collected: s.collected,
        gross: Object.fromEntries(Object.entries(s.gross).map(([k, v]) => [k, round3(v)])),
        commission: Object.fromEntries(Object.entries(s.commission).map(([k, v]) => [k, round3(v)])),
        net: Object.fromEntries(Object.entries(s.net).map(([k, v]) => [k, round3(v)])),
        users: [...s.userMap.values()]
          .sort((a, b) => b.count.all - a.count.all)
          .map((u) => ({ clientName: u.clientName, phone: u.phone, count: u.count, confirmed: u.confirmed, cancelled: u.cancelled })),
      }))
      .sort((a, b) => b.counts.all - a.counts.all);

    const uniqueUsers = new Set(orders.map(keyOfUser));

    const bookings = orders
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((o) => ({
        id: o.bookingCode,
        orderNumber: o.orderNumber,
        storeName: o.storeName,
        clientName: o.clientName,
        clientPhone: o.clientPhone,
        quantity: o.quantity,
        priceOmr: round3(o.pricePaidOmr),
        commissionOmr: round3(o.platformCommissionOmr),
        netOmr: round3(o.storeNetPayoutOmr),
        status: o.status,
        statusText:
          o.status === 'collected' ? 'مكتمل الاستلام'
            : o.status === 'cancelled' ? 'ملغي (أعيد طرح السلة)' : 'بانتظار الحضور',
        windowTime: o.pickupWindow,
        createdAt: o.createdAt,
      }));

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          periods: summaryPeriods,
          totalStores: stores.length,
          totalUsers: uniqueUsers.size,
        },
        stores,
        bookings,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'تعذر حساب التقرير المحاسبي الشامل',
      details: error.message,
    });
  }
};

export const getStoresList = async (req, res) => {
  const stores = await Store.find().populate('managerId', 'name email phone').sort({ createdAt: -1 });
  return res.status(200).json({ success: true, stores });
};

export const createStoreWithManager = async (req, res) => {
  const { store, manager } = req.body;
  if (!store?.name || !store?.crNumber || !store?.category || !store?.area || !store?.address || !store?.phone
    || !manager?.name || !manager?.email || !manager?.password || manager.password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'بيانات المتجر ومدير المتجر مطلوبة، وكلمة المرور يجب ألا تقل عن 8 أحرف',
    });
  }

  const email = manager.email.toLowerCase().trim();
  if (await User.exists({ email })) {
    return res.status(409).json({ success: false, message: 'البريد الإلكتروني لمدير المتجر مسجل مسبقًا' });
  }

  let createdStore;
  let createdManager;
  try {
    createdStore = await Store.create({
      name: store.name.trim(),
      crNumber: store.crNumber.trim(),
      category: store.category,
      wilayah: store.wilayah || 'السيب',
      area: store.area.trim(),
      address: store.address.trim(),
      phone: store.phone.trim(),
      status: 'active',
      commissionRate: 0.15,
    });

    createdManager = await User.create({
      name: manager.name.trim(),
      email,
      phone: manager.phone?.trim() || store.phone.trim(),
      password: await bcrypt.hash(manager.password, 12),
      role: 'store_manager',
      storeId: createdStore.id,
    });

    createdStore.managerId = createdManager.id;
    await createdStore.save();

    return res.status(201).json({
      success: true,
      store: {
        id: createdStore.id,
        name: createdStore.name,
        crNumber: createdStore.crNumber,
        status: createdStore.status,
        manager: { id: createdManager.id, name: createdManager.name, email: createdManager.email },
      },
    });
  } catch (error) {
    if (createdManager) await User.deleteOne({ _id: createdManager.id }).catch(() => {});
    if (createdStore) await Store.deleteOne({ _id: createdStore.id }).catch(() => {});
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'تعذر إنشاء الحساب بسبب بريد أو سجل تجاري مكرر' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'تعذر إضافة المتجر ومديره' });
  }
};

export const getSettlements = async (req, res) => {
  res.status(200).json({
    success: true,
    settlements: [
      {
        id: 'stl-1',
        settlementNumber: 'STL-OM-2026-042',
        storeName: 'مخبز مسقط النور - الخوض',
        period: '15 - 21 سبتمبر 2026',
        totalOrders: 38,
        grossSalesOmr: 57.0,
        platformCommissionOmr: 8.55,
        netPayoutOmr: 48.45,
        status: 'processed',
        bankName: 'بنك مسقط',
        iban: 'OM48BMUS01234567890123',
      },
      {
        id: 'stl-2',
        settlementNumber: 'STL-OM-2026-043',
        storeName: 'أسواق البركة العُمانية',
        period: '15 - 21 سبتمبر 2026',
        totalOrders: 22,
        grossSalesOmr: 39.6,
        platformCommissionOmr: 5.94,
        netPayoutOmr: 33.66,
        status: 'pending',
        bankName: 'بنك ظفار',
        iban: 'OM52BDHF09876543210987',
      },
    ],
  });
};

export const updateSettlementStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  res.status(200).json({
    success: true,
    message: `تم تحويل حالة التسوية (${id}) إلى ${status} بنجاح عبر النظام المصرفي`,
  });
};

/**
 * @desc Live support inbox for the admin dashboard (newest first).
 * @route GET /api/v1/admin/support-messages
 */
export const getSupportMessages = async (req, res) => {
  try {
    const messages = await SupportMessage.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return res.status(200).json({ success: true, messages });
  } catch {
    return res.status(500).json({ success: false, message: 'تعذر تحميل رسائل الدعم' });
  }
};

/** قراءة نسبة خصم الولاء (تكافأ بعد 10 مشتريات). */
export const getLoyaltySettings = async (req, res) => {
  try {
    const settings = await PlatformSetting.findOne({ key: LOYALTY_KEY }).lean();
    return res.status(200).json({ success: true, loyaltyDiscountPercent: settings?.loyaltyDiscountPercent ?? 5 });
  } catch {
    return res.status(500).json({ success: false, message: 'تعذر تحميل إعدادات الولاء' });
  }
};

/** تحديث نسبة خصم الولاء من لوحة الأدمن. */
export const updateLoyaltySettings = async (req, res) => {
  const percent = Number(req.body.loyaltyDiscountPercent);
  if (!Number.isFinite(percent) || percent < 0 || percent > 80) {
    return res.status(400).json({ success: false, message: 'نسبة الخصم يجب أن تكون بين 0 و80' });
  }
  try {
    const settings = await PlatformSetting.findOneAndUpdate(
      { key: LOYALTY_KEY },
      { $set: { loyaltyDiscountPercent: percent } },
      { new: true, upsert: true },
    );
    return res.status(200).json({ success: true, loyaltyDiscountPercent: settings.loyaltyDiscountPercent });
  } catch {
    return res.status(500).json({ success: false, message: 'تعذر حفظ إعدادات الولاء' });
  }
};

/** قراءة التنبيه العام المنشور (للتحقق من الحالة قبل إعادة النشر). */
export const getAnnouncement = async (req, res) => {
  try {
    const settings = await PlatformSetting.findOne({ key: ANNOUNCEMENT_KEY }).lean();
    return res.status(200).json({
      success: true,
      announcementTitle: settings?.announcementTitle ?? '',
      announcementBody: settings?.announcementBody ?? '',
      announcementActive: settings?.announcementActive ?? false,
      announcementPublishedAt: settings?.announcementPublishedAt ?? null,
    });
  } catch {
    return res.status(500).json({ success: false, message: 'تعذر تحميل التنبيه العام' });
  }
};

/**
 * نشر/تعديل/إيقاف التنبيه العام الذي يظهر لكل المستفيدين على هواتفهم.
 * النشر يحدّث announcementPublishedAt ليصل التنبيه كجديد في التطبيق.
 */
export const updateAnnouncement = async (req, res) => {
  const { announcementTitle, announcementBody, announcementActive } = req.body || {};
  const title = typeof announcementTitle === 'string' ? announcementTitle.trim() : '';
  const body = typeof announcementBody === 'string' ? announcementBody.trim() : '';
  const active = announcementActive === true;

  if (active && (!title || !body)) {
    return res.status(400).json({ success: false, message: 'عنوان التنبيه ونصّه مطلوبان للنشر' });
  }
  if (title.length > 120 || body.length > 600) {
    return res.status(400).json({ success: false, message: 'العنوان حتى 120 حرفاً والنص حتى 600 حرف' });
  }

  try {
    const current = await PlatformSetting.findOne({ key: ANNOUNCEMENT_KEY }).lean();
    const wasActive = current?.announcementActive === true;
    const contentChanged = current?.announcementTitle !== title || current?.announcementBody !== body;
    const publishNow = active && (!wasActive || contentChanged);

    const settings = await PlatformSetting.findOneAndUpdate(
      { key: ANNOUNCEMENT_KEY },
      {
        $set: {
          announcementTitle: title,
          announcementBody: body,
          announcementActive: active,
          ...(publishNow ? { announcementPublishedAt: new Date() } : {}),
        },
      },
      { new: true, upsert: true },
    );

    if (publishNow) {
      // إشعار الأجهزة المشتركة (Web Push) — الفشل لا يعطّل نشر التنبيه
      try {
        await sendAnnouncementPush({
          title: settings.announcementTitle,
          body: settings.announcementBody,
          url: `${ENV.FRONTEND_URL}/?portal=client`,
        });
      } catch (pushError) {
        console.warn('[DealBox] announcement push failed:', pushError?.message || pushError);
      }
      // إشعار تطبيق الجوال (FCM) — يظهر على شاشة القفل حتى لو التطبيق مغلق
      try {
        await sendAnnouncementFcm({
          title: settings.announcementTitle,
          body: settings.announcementBody,
          url: `${ENV.FRONTEND_URL}/?portal=client`,
        });
      } catch (fcmError) {
        console.warn('[DealBox] announcement FCM failed:', fcmError?.message || fcmError);
      }
    }

    return res.status(200).json({
      success: true,
      announcementTitle: settings.announcementTitle,
      announcementBody: settings.announcementBody,
      announcementActive: settings.announcementActive,
      announcementPublishedAt: settings.announcementPublishedAt,
    });
  } catch {
    return res.status(500).json({ success: false, message: 'تعذر حفظ التنبيه العام' });
  }
};

/**
 * قراءة إعدادات «نسيت كلمة المرور»: التفعيل + حالة مرسل البريد.
 * تُستخدم في تبويب «التكامل» ضمن إعدادات النظام وإدارة الصلاحيات.
 */
export const getPasswordResetSettings = async (req, res) => {
  try {
    const settings = await PlatformSetting.findOne({ key: PASSWORD_RESET_KEY }).lean();
    const mail = getMailStatus();
    return res.status(200).json({
      success: true,
      passwordResetEnabled: settings?.passwordResetEnabled !== false, // الافتراضي مفعّل
      smtpConfigured: mail.smtpConfigured,
      mailFrom: mail.fromAddress,
      mailMode: mail.mode,
    });
  } catch {
    return res.status(500).json({ success: false, message: 'تعذر تحميل إعدادات استعادة كلمة المرور' });
  }
};

/**
 * تفعيل/إيقاف خاصية «نسيت كلمة المرور» من إعدادات النظام.
 * عند الإيقاف ترفض نقطة /auth/forgot-password الطلبات برسالة واضحة.
 */
export const updatePasswordResetSettings = async (req, res) => {
  const enabled = req.body?.passwordResetEnabled === true;
  try {
    await PlatformSetting.findOneAndUpdate(
      { key: PASSWORD_RESET_KEY },
      { $set: { passwordResetEnabled: enabled } },
      { new: true, upsert: true },
    );
    const mail = getMailStatus();
    return res.status(200).json({
      success: true,
      passwordResetEnabled: enabled,
      smtpConfigured: mail.smtpConfigured,
      mailFrom: mail.fromAddress,
      mailMode: mail.mode,
    });
  } catch {
    return res.status(500).json({ success: false, message: 'تعذر حفظ إعدادات استعادة كلمة المرور' });
  }
};

/** رافع شعار المنظومة (شعار واحد فقط). */
const brandingLogoUpload = createImageUploader({
  diskDir: 'uploads/branding',
  filenameFn: (_req, file, cb) => {
    const ext = (file.originalname.match(/\.[a-z0-9]+$/i) || ['.png'])[0].toLowerCase();
    cb(null, `dealbox-logo-${Date.now()}${ext}`);
  },
});

/**
 * @desc جلب شعار المنظومة المحفوظ على الخادم.
 * @route GET /api/v1/admin/branding
 */
export const getBrandingSettings = async (req, res) => {
  try {
    const settings = await PlatformSetting.findOne({ key: BRANDING_KEY }).lean();
    return res.status(200).json({ success: true, logoUrl: settings?.projectLogoUrl || '' });
  } catch {
    return res.status(500).json({ success: false, message: 'تعذر جلب شعار المنظومة' });
  }
};

/**
 * @desc رفع/حفظ شعار المنظومة على الخادم (يظهر على كل الأجهزة).
 * @route POST /api/v1/admin/branding/logo   (multipart: image)
 */
export const uploadBrandingLogo = (req, res) => {
  brandingLogoUpload.single('image')(req, res, async (err) => {
    if (err) {
      const msg = err.message === IMAGE_MIME_ERROR
        ? err.message
        : 'تعذر رفع الصورة — تأكد أن حجمها أقل من 5 ميغابايت';
      return res.status(400).json({ success: false, message: msg });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'لم يتم اختيار صورة' });
    }

    let url = '';
    try {
      url = await resolveUploadedUrl(req.file, {
        cloudFolder: 'dealbox/branding',
        localPrefix: '/uploads/branding',
      });
    } catch {
      // التخزين الخارجي (Cloudinary) غير متاح → نكمل بالاحتياطي أدناه.
      url = '';
    }

    // احتياطي: تخزين الشعار داخل قاعدة البيانات (data URL) ليبقى دائماً حتى
    // بدون تخزين خارجي أو عند إعادة نشر الخادم (قرص Render مؤقت).
    if (!url && req.file.buffer) {
      if (req.file.buffer.length > MAX_INLINE_LOGO_BYTES) {
        return res.status(400).json({
          success: false,
          message: 'حجم الصورة كبير — استخدم صورة أصغر (أقل من 1.5 ميجابايت)',
        });
      }
      url = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    if (!url) {
      return res.status(500).json({ success: false, message: 'تعذر حفظ شعار المنظومة' });
    }

    try {
      await PlatformSetting.findOneAndUpdate(
        { key: BRANDING_KEY },
        { $set: { projectLogoUrl: url } },
        { new: true, upsert: true },
      );
      return res.status(200).json({ success: true, logoUrl: url });
    } catch {
      return res.status(500).json({ success: false, message: 'تعذر حفظ شعار المنظومة' });
    }
  });
};

/**
 * @desc استعادة الشعار الافتراضي (حذف شعار المنظومة من الخادم).
 * @route DELETE /api/v1/admin/branding/logo
 */
export const deleteBrandingLogo = async (req, res) => {
  try {
    await PlatformSetting.findOneAndUpdate(
      { key: BRANDING_KEY },
      { $set: { projectLogoUrl: '' } },
      { new: true, upsert: true },
    );
    return res.status(200).json({ success: true, logoUrl: '' });
  } catch {
    return res.status(500).json({ success: false, message: 'تعذر حذف شعار المنظومة' });
  }
};

/** تحديث بيانات متجر من لوحة الآدمن (الاسم، الهاتف، العنوان، الفئة، الحالة، الشعار، البنك، العمولة). */
export const updateStore = async (req, res) => {
  const storeId = req.params.id;
  if (!storeId) {
    return res.status(400).json({ success: false, message: 'معرف المتجر مطلوب' });
  }

  const allowed = ['name', 'phone', 'address', 'area', 'wilayah', 'category', 'crNumber', 'status', 'commissionRate', 'bankDetails'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  // الشعار المرفوع عبر multer يُخزَّن في الحقل logoUrl
  if (req.file) {
    updates.logoUrl = `/uploads/marketing/${req.file.filename}`;
  } else if (req.body.logoUrl !== undefined) {
    updates.logoUrl = req.body.logoUrl; // شعار موجود مسبقاً أو إزالته بسلسلة فارغة
  }

  if (updates.commissionRate !== undefined) {
    const rate = Number(updates.commissionRate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 0.5) {
      return res.status(400).json({ success: false, message: 'العمولة يجب أن تكون بين 0% و50%' });
    }
    updates.commissionRate = rate;
  }
  if (updates.status !== undefined && !['active', 'pending', 'suspended'].includes(updates.status)) {
    return res.status(400).json({ success: false, message: 'حالة المتجر غير صالحة' });
  }

  try {
    const store = await Store.findByIdAndUpdate(
      storeId,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('managerId', 'name email phone').lean();

    if (!store) {
      return res.status(404).json({ success: false, message: 'المتجر غير موجود' });
    }

    return res.status(200).json({
      success: true,
      message: 'تم تحديث بيانات المتجر بنجاح',
      store: {
        id: store._id,
        name: store.name,
        crNumber: store.crNumber,
        status: store.status,
        manager: store.managerId ? { id: store.managerId._id, name: store.managerId.name, email: store.managerId.email } : null,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'رقم السجل التجاري مسجل لمتجر آخر' });
    }
    return res.status(500).json({ success: false, message: 'تعذر تحديث المتجر' });
  }
};

/** تحديث إعدادات القصص المدفوعة لمتجر محدد (رسوم + فترة الفوترة). */
export const updateStoreStorySettings = async (req, res) => {
  const storeId = req.params.id;
  if (!storeId) {
    return res.status(400).json({ success: false, message: 'معرف المتجر مطلوب' });
  }

  const { storyFeeOmr, storyFeePeriod } = req.body || {};
  const fee = Number(storyFeeOmr);
  if (!Number.isFinite(fee) || fee < 0 || fee > 1000) {
    return res.status(400).json({ success: false, message: 'رسوم القصة يجب أن تكون بين 0 و1000 ر.ع' });
  }
  if (!['daily', 'weekly', 'monthly'].includes(storyFeePeriod)) {
    return res.status(400).json({ success: false, message: 'فترة الفوترة يجب أن تكون يومي أو أسبوعي أو شهري' });
  }

  try {
    const store = await Store.findByIdAndUpdate(
      storeId,
      { $set: { 'storySettings.feeOmr': fee, 'storySettings.period': storyFeePeriod } },
      { new: true, runValidators: true }
    ).lean();
    if (!store) {
      return res.status(404).json({ success: false, message: 'المتجر غير موجود' });
    }
    return res.status(200).json({
      success: true,
      message: 'تم حفظ إعدادات القصص للمتجر',
      storySettings: store.storySettings,
    });
  } catch {
    return res.status(500).json({ success: false, message: 'تعذر حفظ إعدادات القصص' });
  }
};

/* ------------------------------------------------------------------ *
 *  فريق المشرفين والصلاحيات الميدانية (RBAC)
 *  تحديد أدوار المشرفين ومدراء العمليات المصرح لهم بدخول لوحة الآدمن
 * ------------------------------------------------------------------ */

const isSuperAdmin = (user) => (user.adminRole || 'super_admin') === 'super_admin';

const publicTeamMember = (member, currentUserId) => {
  const info = adminRoleInfo(member.adminRole);
  const memberId = member._id ? String(member._id) : String(member.id);
  return {
    id: memberId,
    name: member.name,
    email: member.email,
    phone: member.phone,
    adminRole: member.adminRole || 'super_admin',
    roleTitle: info.title,
    roleShortTitle: info.shortTitle,
    badgeColor: info.color,
    icon: info.icon,
    description: info.description,
    permissions: permissionsForRole(member.adminRole),
    active: member.active,
    lastLoginAt: member.lastLoginAt || null,
    isSelf: String(memberId) === String(currentUserId),
  };
};

/** قائمة مشرفي لوحة الآدمن المركزية (المصرح لهم بدخولها الآن). */
export const getAdminTeam = async (req, res) => {
  try {
    const members = await User.find({ role: 'admin' })
      .select('name email phone adminRole active lastLoginAt')
      .sort({ adminRole: 1, name: 1 })
      .lean();
    const ordered = [...members].sort((a, b) => {
      const ra = a.adminRole || 'super_admin';
      const rb = b.adminRole || 'super_admin';
      if (ra === 'super_admin' && rb !== 'super_admin') return -1;
      if (rb === 'super_admin' && ra !== 'super_admin') return 1;
      return a.name.localeCompare(b.name, 'ar');
    });
    return res.status(200).json({
      success: true,
      count: ordered.length,
      roles: ADMIN_ROLE_KEYS.map((key) => ({
        key,
        title: ADMIN_ROLE_CATALOG[key].title,
        shortTitle: ADMIN_ROLE_CATALOG[key].shortTitle,
        color: ADMIN_ROLE_CATALOG[key].color,
        icon: ADMIN_ROLE_CATALOG[key].icon,
        description: ADMIN_ROLE_CATALOG[key].description,
        permissions: ADMIN_ROLE_CATALOG[key].permissions,
      })),
      members: ordered.map((member) => publicTeamMember(member, req.user.id)),
    });
  } catch {
    return res.status(500).json({ success: false, message: 'تعذر تحميل فريق المشرفين' });
  }
};

/** إنشاء حساب مشرف حقيقي له حق الدخول للوحة الآدمن المركزية بدوره وصلاحياته. */
export const createAdmin = async (req, res) => {
  if (!isSuperAdmin(req.user)) {
    return res.status(403).json({ success: false, message: 'إدارة فريق المشرفين تتطلب دور مدير عام للنظام' });
  }
  const { name, email, phone = '', password = '', adminRole = 'supervisor' } = req.body || {};
  if (!name?.trim() || !email?.trim() || password.length < 6) {
    return res.status(400).json({ success: false, message: 'الاسم والبريد وكلمة مرور من 6 أحرف على الأقل مطلوبة' });
  }
  if (!ADMIN_ROLE_KEYS.includes(adminRole)) {
    return res.status(400).json({ success: false, message: `دور غير معروف، الأدوار المتاحة: ${ADMIN_ROLE_KEYS.join('، ')}` });
  }

  try {
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone,
      password: await bcrypt.hash(password, 12),
      role: 'admin',
      adminRole,
      active: true,
      lastLoginAt: null,
    });
    return res.status(201).json({ success: true, member: publicTeamMember(user, req.user.id) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'هذا البريد الإلكتروني مسجل مسبقاً — اختر بريداً آخر أو فعّل الحساب الحالي' });
    }
    return res.status(500).json({ success: false, message: 'تعذر إنشاء حساب المشرف' });
  }
};

/** تعديل مشرف: تغيير الدور، التجميد/التنشيط، تعديل الاسم/الهاتف. */
export const updateAdminTeamMember = async (req, res) => {
  if (!isSuperAdmin(req.user)) {
    return res.status(403).json({ success: false, message: 'إدارة فريق المشرفين تتطلب دور مدير عام للنظام' });
  }
  const memberId = req.params.id;
  const { adminRole, active, name, phone } = req.body || {};
  try {
    if (adminRole !== undefined && !ADMIN_ROLE_KEYS.includes(adminRole)) {
      return res.status(400).json({ success: false, message: 'دور غير معروف' });
    }

    const target = await User.findById(memberId);
    if (!target || target.role !== 'admin') {
      return res.status(404).json({ success: false, message: 'المشرف غير موجود' });
    }

    const self = String(target.id) === String(req.user.id);
    const targetRole = target.adminRole || 'super_admin';
    const nextRole = adminRole !== undefined ? adminRole : targetRole;
    const nextActive = active !== undefined ? active === true : target.active;

    // منع إقفال آخر مدير عام للنظام
    if (!self && (targetRole === 'super_admin' || nextRole === 'super_admin')) {
      const losingSuperAdmin = nextRole !== 'super_admin' || !nextActive;
      if (losingSuperAdmin) {
        const otherSuperAdmins = await User.countDocuments({
          role: 'admin',
          adminRole: 'super_admin',
          active: true,
          _id: { $ne: target.id },
        });
        if (otherSuperAdmins === 0) {
          return res.status(409).json({ success: false, message: 'لا يمكن إزالة آخر مدير عام للنظام — فعّل مشرفاً آخر بدور مدير عام أولاً' });
        }
      }
    }
    // منع تجميد أو تخفيض الحساب الحالي
    if (self && (nextActive === false || (adminRole !== undefined && nextRole !== 'super_admin'))) {
      return res.status(409).json({ success: false, message: 'لا يمكنك تجميد حسابك أو تخفيض دورك من داخل الجلسة' });
    }
    // منع «دور غير لائق»: لا يمكن أن يعلّق الأدمن تنشيط نفسه أبداً
    if (self && active !== undefined && active !== true) {
      return res.status(409).json({ success: false, message: 'لا يمكنك تجميد حسابك الحالي' });
    }

    if (adminRole !== undefined) target.adminRole = adminRole;
    if (active !== undefined) target.active = active === true;
    if (name !== undefined && name.trim()) target.name = name.trim();
    if (phone !== undefined) target.phone = phone;
    await target.save();

    return res.status(200).json({ success: true, member: publicTeamMember(target, req.user.id) });
  } catch {
    return res.status(500).json({ success: false, message: 'تعذر تحديث بيانات المشرف' });
  }
};

/** إزالة مشرف من فريق لوحة الآدمن (الحساب يبقى لكنه يفقد صلاحية الدخول للوحة). */
export const deleteAdminTeamMember = async (req, res) => {
  if (!isSuperAdmin(req.user)) {
    return res.status(403).json({ success: false, message: 'إدارة فريق المشرفين تتطلب دور مدير عام للنظام' });
  }
  const memberId = req.params.id;
  try {
    if (String(memberId) === String(req.user.id)) {
      return res.status(409).json({ success: false, message: 'لا يمكنك إزالة حسابك الحالي من الفريق' });
    }
    const target = await User.findById(memberId);
    if (!target || target.role !== 'admin') {
      return res.status(404).json({ success: false, message: 'المشرف غير موجود' });
    }
    if ((target.adminRole || 'super_admin') === 'super_admin') {
      const otherSuperAdmins = await User.countDocuments({
        role: 'admin',
        adminRole: 'super_admin',
        active: true,
        _id: { $ne: target.id },
      });
      if (otherSuperAdmins === 0) {
        return res.status(409).json({ success: false, message: 'لا يمكن إزالة آخر مدير عام للنظام' });
      }
    }
    // إسقاط صلاحية الدخول للوحة مع الإبقاء على الحساب (يفقد رتبة admin)
    target.role = 'client';
    target.adminRole = undefined;
    await target.save();
    return res.status(200).json({ success: true, message: 'أُزيل المشرف من فريق اللوحة — لم يعد يملك حق الدخول للوحة الآدمن' });
  } catch {
    return res.status(500).json({ success: false, message: 'تعذر إزالة المشرف' });
  }
};
