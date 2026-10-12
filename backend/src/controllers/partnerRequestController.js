import PartnerRequest from '../models/PartnerRequest.js';

const asStr = (v, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

const CATEGORY_LABELS = {
  bakery: 'مخبوزات ومعجنات',
  supermarket: 'سوبرماركت وأغذية',
  restaurant: 'مطاعم وبوفيهات',
  cafe: 'مقاهي وحلويات',
  produce: 'خضار وفواكه مزارع',
  cooked: 'وجبات مطبوخة',
  other: 'أخرى',
};

const STATUS_LABELS = {
  new: 'طلب جديد',
  contacted: 'تم التواصل',
  approved: 'مقبول — أصبح شريكاً',
  rejected: 'مرفوض',
};

const serialize = (r) => ({
  id: String(r._id),
  fullName: r.fullName,
  storeName: r.storeName,
  phone: r.phone,
  wilayah: r.wilayah,
  area: r.area,
  category: r.category,
  categoryLabel: CATEGORY_LABELS[r.category] || r.category,
  notes: r.notes,
  status: r.status,
  statusLabel: STATUS_LABELS[r.status] || r.status,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});

/**
 * استقبال طلب انضمام شريك جديد من استمارة الموقع التسويقي (عام — بدون مصادقة).
 * محمي بمحدد معدل (5/ساعة لكل IP) لمنع الإغراق.
 */
export const createPartnerRequest = async (req, res) => {
  const fullName = asStr(req.body?.fullName, 80);
  const storeName = asStr(req.body?.storeName, 80);
  const phone = asStr(req.body?.phone, 20).replace(/[\s-]/g, '');
  const wilayah = asStr(req.body?.wilayah, 30) || 'السيب';
  const area = asStr(req.body?.area, 60);
  const notes = asStr(req.body?.notes, 500);
  const category = typeof req.body?.category === 'string' && CATEGORY_LABELS[req.body.category]
    ? req.body.category
    : 'bakery';

  if (!fullName || !storeName || phone.replace(/\D/g, '').length < 8) {
    return res.status(400).json({
      success: false,
      message: 'الاسم واسم المتجر ورقم هاتف صحيح (8 أرقام على الأقل) مطلوبة',
    });
  }

  try {
    const created = await PartnerRequest.create({
      fullName, storeName, phone, wilayah, area, category, notes,
    });
    return res.status(201).json({
      success: true,
      message: 'تم استلام طلبك بنجاح — سيتواصل معك فريق DealBox قريباً',
      request: serialize(created),
    });
  } catch {
    return res.status(500).json({ success: false, message: 'تعذر إرسال الطلب حالياً، حاول لاحقاً' });
  }
};

/** قائمة طلبات الانضمام للآدمن (الأحدث أولاً) مع عداد الطلبات الجديدة. */
export const getPartnerRequests = async (req, res) => {
  try {
    const [requests, newCount] = await Promise.all([
      PartnerRequest.find().sort({ createdAt: -1 }).limit(200).lean(),
      PartnerRequest.countDocuments({ status: 'new' }),
    ]);
    return res.status(200).json({
      success: true,
      newCount,
      requests: requests.map(serialize),
    });
  } catch {
    return res.status(500).json({ success: false, message: 'تعذر تحميل طلبات الانضمام' });
  }
};

/** تحديث حالة طلب (تم التواصل / مقبول / مرفوض) من لوحة الآدمن. */
export const updatePartnerRequest = async (req, res) => {
  const { status } = req.body || {};
  if (!['new', 'contacted', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'حالة الطلب غير صالحة' });
  }
  try {
    const updated = await PartnerRequest.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true, runValidators: true }
    ).lean();
    if (!updated) {
      return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    }
    return res.status(200).json({ success: true, request: serialize(updated) });
  } catch {
    return res.status(500).json({ success: false, message: 'تعذر تحديث الطلب' });
  }
};
