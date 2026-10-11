import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MarketingContent } from '../models/MarketingContent.js';
import { createImageUploader, resolveUploadedUrl, IMAGE_MIME_ERROR } from '../utils/imageUpload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MARKETING_KEY = 'marketing';
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'marketing');

/* ------------------------------------------------------------------ *
 *  المحتوى الافتراضي (يُستخدم عند غياب وثيقة في قاعدة البيانات)
 * ------------------------------------------------------------------ */
export const DEFAULT_MARKETING_CONTENT = {
  key: MARKETING_KEY,
  seo: {
    title: 'DealBox عُمان | سلتك المفضّلة.. بنصف السعر!',
    description:
      'منصة عُمانية لحفظ النعمة والاستهلاك الذكي — صناديق مفاجآت من أشهر المخابز والمقاهي في الخوض ومسقط بخصومات تصل إلى 70%. كل حجز يعني سلة طعام حُميت من الهدر.',
    keywords: 'DealBox, عُمان, الخوض, مسقط, سلات مفاجآت, خصومات, حفظ النعمة, مخابز, مقاهي',
    ogImage: '',
  },
  hero: {
    badgeText: 'منصة عُمانية لحفظ النعمة والاستهلاك الذكي',
    tagline: '«سلتك المفضّلة.. بنصف السعر!»',
    subtitle:
      'تجربة جديدة للاستهلاك والإنقاذ الذكي للطعام في عُمان — استمتع بصناديق مفاجآت من أشهر المخابز والمقاهي في الخوض ومسقط بخصومات تصل إلى 70%.',
    highlightLine: 'كل حجز تقوم به يعني سلة طعام حُميت من الهدر.',
    ctaClientText: 'حمّل التطبيق واكتشف سلال اليوم',
    ctaStoreText: 'سجّل مخبزك/مقهىك معنا',
    chips: ['مخبوزات طازجة يومياً', 'أسعار تبدأ من نصف السعر', 'صفر هدر غذائي'],
    imageUrl: '',
  },
  offers: [
    { emoji: '🥐', store: 'مخبز مسقط النور — الخوض', title: 'صندوق مفاجآت المخبوزات الطازجة', newPrice: '1.200 ر.ع', oldPrice: '2.500 ر.ع', save: 'وفر 52%', tag: 'عرض اليوم' },
    { emoji: '🍰', store: 'مقهى الواحة — المعبيلة', title: 'صندوق الحلويات اليومية', newPrice: '0.800 ر.ع', oldPrice: '1.800 ر.ع', save: 'وفر 55%', tag: 'كمية محدودة' },
    { emoji: '🥬', store: 'سوبر ماركت الخوض', title: 'صندوق الخضار والفواكه الطازجة', newPrice: '1.500 ر.ع', oldPrice: '3.000 ر.ع', save: 'وفر 50%', tag: 'طازج اليوم' },
  ],
  valueBand: [
    { icon: 'bakery_dining', title: 'طازج يومياً', desc: 'إنتاج اليوم فقط' },
    { icon: 'savings', title: 'بنصف السعر', desc: 'توفير حقيقي يومي' },
    { icon: 'volunteer_activism', title: 'نعمة محفوظة', desc: 'كل حجز ينقذ سلة' },
    { icon: 'bolt', title: 'حجز في ثوانٍ', desc: 'كود فوري DB-XXXX' },
  ],
  features: {
    sectionTitle: 'توفير مالي.. وأثر يستمر',
    sectionSub: 'DealBox يجمع بين التوفير المالي والمساهمة في الاستدامة — تجربة مصمّمة لتنقذ طعامك ومالك معاً.',
    items: [
      { icon: 'map', title: 'خريطة حية للمتاجر', desc: 'اكتشف المخابز والمقاهي المتوفرة حولك في الخوض ومسقط لحظة بلحظة.' },
      { icon: 'notifications_active', title: 'تنبيهات فورية', desc: 'أشعار فوري عند توفر صندوق جديد في متجرك المفضّل — لن تفوّت أي عرض.' },
      { icon: 'bolt', title: 'احجز بنقرة واحدة', desc: 'احجز صندوقك المفضّل خلال ثوانٍ واحصل على كود الاستلام DB-XXXX فوراً.' },
      { icon: 'confirmation_number', title: 'كود استلام رقمي', desc: 'كود فوري يُمسح عند الاستلام من الفرع — تجربة سلسة بدون انتظار.' },
      { icon: 'auto_stories', title: 'قصص المخابز والمقاهي', desc: 'تعرّف على أصحاب المخابز وقصصهم قبل أن تختار صندوقك اليومي.' },
      { icon: 'local_offer', title: 'أسعار تبدأ من نصف السعر', desc: 'تذوق أفضل المخبوزات والوجبات الطازجة يومياً بأسعار تبدأ من نصف السعر الأصلي.' },
    ],
  },
  steps: {
    sectionTitle: 'ثلاث خطوات.. وصندوق مفاجآتك جاهز',
    items: [
      { icon: 'travel_explore', title: 'أبحر واكتشف', desc: 'افتح التطبيق واستكشف صناديق المفاجآت المتاحة بالقرب منك في الخوض ومسقط.' },
      { icon: 'shopping_bag', title: 'احجز بنقرة', desc: 'احجز صندوقك المفضّل واحصل على كود الاستلام الفوري (DB-XXXX) في ثوانٍ.' },
      { icon: 'storefront', title: 'استلم واستمتع', desc: 'زُر الفرع، استلم صندوقك الطازج، وادفع في الكاونتر — كاش أو بالبطاقة.' },
    ],
  },
  growthHacks: [
    { icon: 'group_add', title: 'برنامج التوصية', headline: 'شارك.. ووفّر أكثر', desc: 'شارك تطبيق DealBox مع صديقك، واحصل على خصم إضافي عند إتمامه لأول حجز — وفّرا معاً وكل سلة تنقذ نعمة مضاعفة.' },
    { icon: 'flash_on', title: 'إشعارات الاستوري التفاعلية', headline: 'الفلاش سيلز.. الكمية محدودة!', desc: 'الساعة 8 مساءً: إشعار منبثق لكل من هم حولك — «سلال مخبوزات الخوض جاهزة الآن في الاستوري.. الكمية محدودة!»' },
  ],
  impact: {
    sectionTitle: 'كل حجز يعني سلة طعام حُميت من الهدر',
    sectionSub: 'لأن الفكرة تجمع بين التوفير المالي والمساهمة في الاستدامة — هذه حصيلة ما حققناه معاً في الخوض ومسقط.',
    stats: [
      { icon: 'inventory_2', value: 5000, decimals: 0, label: 'سلة تم إنقاذها من الهدر' },
      { icon: 'storefront', value: 30, decimals: 0, label: 'مخبزاً ومقهى شريكاً في الخوض ومسقط' },
      { icon: 'scale', value: 12.5, decimals: 1, label: 'طن من الطعام الطازج المحفوظ' },
    ],
  },
  campaigns: {
    sectionBadge: 'استراتيجية الإطلاق',
    sectionTitle: 'حملات مصمّمة خصيصاً لسوق الخوض ومسقط',
    sectionSub: 'إطلاق احترافي يربط جميع أطراف المعادلة — الزبائن، المخابز والمقاهي، والمجتمع — عبر قنوات وصول دقيقة ومحلية.',
    items: [
      { icon: 'person_search', channel: 'المؤثرون المحليون', name: 'Micro-Influencer Marketing', desc: 'صنّاع محتوى من الخوض ومسقط يزورون المقهى، يفتحون تطبيق DealBox، ويصورون لحظة فتح «صندوق المفاجآت» ويقارنون قيمته بسعره شبه المجاني — تحدي #صندوق_النعمة.', audience: 'التجارب الغذائية · التوفير · الاستدامة' },
      { icon: 'campaign', channel: 'ميديا مدفوعة', name: 'Instagram & TikTok Ads', desc: 'استهداف جغرافي دقيق: الخوض والسيب والموالح أولاً. فيديوهات UGC سريعة للمخبوزات الطازجة مع العبارة: «ليش تشتري بسعر كامل.. ونفس المخبوزات الطازجة بنصف السعر في الخوض؟»', audience: 'داخل نطاق الخوض · السيب · الموالح' },
      { icon: 'qr_code_2', channel: 'التسويق الميداني', name: 'In-Store Marketing', desc: 'ملصق وستاند صغير بجانب كاونتر كل مخبز شريك مع QR Code: «هل تعلم؟ يمكنك حجز سلالنا التوفيرية اليومية عبر تطبيق DealBox بخصم 50%!»', audience: 'زبائن الفروع في لحظة الشراء' },
    ],
  },
  partners: {
    badge: 'للمخابز والمقاهي',
    title: 'حوّل فائضك اليومي إلى مصدر دخل إضافي',
    intro: 'حوّل فائض المخبوزات والمنتجات اليومية إلى مصدر دخل إضافي بدلاً من خسارتها — واكتسب زبائن جدد من سكان الخوض يزورون فرعك يومياً لاستلام سلالهم.',
    bullets: [
      { icon: 'trending_up', title: 'ربحية إضافية يومية', desc: 'دخل من السلال الفائضة كان سيُهدر — بدون تكاليف تخزين إضافية.' },
      { icon: 'groups', title: 'زبائن جدد كل يوم', desc: 'سكان الخوض ومسقط يزورون فرعك يومياً لاستلام سلالهم — ويعودون كزبائن دائمين.' },
      { icon: 'receipt_long', title: 'تقارير واضحة', desc: 'كشف يومي بالكميات والمبيعات والأرباح المستحقة من لوحة عمليات بسيطة.' },
    ],
    ctaText: 'سجّل مخبزك/مقهىك معنا',
    equationTitle: 'معادلة رابحة للجميع',
    equationText: 'الزبون يوفّر حتى 70% · المتجر يبيع فائضه بدل هدره · المجتمع يحتفظ بنعمته وبيئته — منصة واحدة تربط الأطراف الثلاثة.',
    guideTitle: 'دليل الشريك السريع',
    guideItems: [
      '1 — سجّل متجرك من بوابة الشركاء وادخل بيانات الفرع',
      '2 — أضف صناديق الفائض اليومية وحدّد كمياتها وسعرها',
      '3 — الصق ملصق QR على الكاونتر وابدأ باستقبال الحجوزات',
    ],
  },
  download: {
    title: 'حمّل التطبيق واكتشف سلال اليوم',
    subtitle: 'متوفر على أندرويد وآيفون — صندوق مفاجآتك الطازج من الخوض ومسقط في انتظارك بنصف السعر.',
    note: 'إن كنت متجراً شريكاً وتستخدم التابلت؟ ادخل لوحة الشركاء من الويب عبر بوابة الدخول.',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=om.dealbox.app',
    appStoreUrl: 'https://apps.apple.com/app/id0000000000',
  },
  footer: {
    about: 'منصة عُمانية لحفظ النعمة — سلال طعام فائضة بجودة عالية بأسعار تبدأ من نصف السعر، حجز فوري، استلام ذاتي، وإدارة مركزية بصلاحيات ميدانية دقيقة.',
    copyright: '© 2026 DealBox عُمان — جميع الحقوق محفوظة · صُنع بحب لحفظ النعمة 💚',
  },
  images: {
    logoUrl: '',
    heroImageUrl: '',
    downloadImageUrl: '',
  },
};

/* ------------------------------------------------------------------ *
 *  أدوات مساعدة
 * ------------------------------------------------------------------ */
const asStr = (v) => (typeof v === 'string' ? v.trim() : '');
const asNum = (v, fallback = 0) => (Number.isFinite(Number(v)) ? Number(v) : fallback);

/** تنظيف عميق للمحتوى الوارد مع سقف للعناصر ومنع حقول غير معروفة. */
const sanitizeSection = (input, shape) => {
  if (input == null || typeof input !== 'object') return undefined;
  const out = {};
  for (const [field, def] of Object.entries(shape)) {
    if (!(field in input)) continue;
    const v = input[field];
    if (typeof def === 'string') {
      out[field] = asStr(v);
    } else if (def === 'number') {
      out[field] = asNum(v);
    } else if (Array.isArray(def)) {
      if (!Array.isArray(v)) continue;
      out[field] = v.slice(0, 12).map((item) => sanitizeSection(item, def[0] ?? {}));
    } else if (typeof def === 'object') {
      if (v == null || typeof v !== 'object') continue;
      out[field] = sanitizeSection(v, def);
    }
  }
  return out;
};

const CONTENT_SHAPE = {
  seo: { title: '', description: '', keywords: '', ogImage: '' },
  hero: { badgeText: '', tagline: '', subtitle: '', highlightLine: '', ctaClientText: '', ctaStoreText: '', chips: [''], imageUrl: '' },
  offers: [{ emoji: '', store: '', title: '', newPrice: '', oldPrice: '', save: '', tag: '' }],
  valueBand: [{ icon: '', title: '', desc: '' }],
  features: { sectionTitle: '', sectionSub: '', items: [{ icon: '', title: '', desc: '' }] },
  steps: { sectionTitle: '', items: [{ icon: '', title: '', desc: '' }] },
  growthHacks: [{ icon: '', title: '', headline: '', desc: '' }],
  impact: { sectionTitle: '', sectionSub: '', stats: [{ icon: '', value: 'number', decimals: 'number', label: '' }] },
  campaigns: { sectionBadge: '', sectionTitle: '', sectionSub: '', items: [{ icon: '', channel: '', name: '', desc: '', audience: '' }] },
  partners: { badge: '', title: '', intro: '', bullets: [{ icon: '', title: '', desc: '' }], ctaText: '', equationTitle: '', equationText: '', guideTitle: '', guideItems: [''] },
  download: { title: '', subtitle: '', note: '', playStoreUrl: '', appStoreUrl: '' },
  footer: { about: '', copyright: '' },
  images: { logoUrl: '', heroImageUrl: '', downloadImageUrl: '' },
};

/* ------------------------------------------------------------------ *
 *  واجهة الزوار (عامة — بدون مصادقة)
 * ------------------------------------------------------------------ */
export const getPublicMarketing = async (req, res) => {
  try {
    const doc = await MarketingContent.findOne({ key: MARKETING_KEY }).lean();
    const content = doc ? { ...DEFAULT_MARKETING_CONTENT, ...doc } : DEFAULT_MARKETING_CONTENT;
    delete content._id;
    delete content.__v;
    return res.status(200).json({ success: true, content });
  } catch {
    return res.status(500).json({ success: false, message: 'تعذر تحميل المحتوى التسويقي' });
  }
};

/* ------------------------------------------------------------------ *
 *  لوحة الآدمن (مصادقة + صلاحية الإعدادات)
 * ------------------------------------------------------------------ */
export const getAdminMarketing = async (req, res) => {
  try {
    const doc = await MarketingContent.findOne({ key: MARKETING_KEY }).lean();
    const content = doc ? { ...DEFAULT_MARKETING_CONTENT, ...doc } : DEFAULT_MARKETING_CONTENT;
    delete content._id;
    delete content.__v;
    return res.status(200).json({ success: true, content });
  } catch {
    return res.status(500).json({ success: false, message: 'تعذر تحميل المحتوى التسويقي' });
  }
};

export const updateAdminMarketing = async (req, res) => {
  const incoming = req.body?.content;
  if (incoming == null || typeof incoming !== 'object') {
    return res.status(400).json({ success: false, message: 'المحتوى المطلوب حفظه غير صالح' });
  }

  const cleaned = sanitizeSection(incoming, CONTENT_SHAPE) ?? {};
  // سقف أمان للحقول النصية الطويلة
  if (cleaned.seo && cleaned.seo.description && cleaned.seo.description.length > 500) {
    cleaned.seo.description = cleaned.seo.description.slice(0, 500);
  }

  try {
    const saved = await MarketingContent.findOneAndUpdate(
      { key: MARKETING_KEY },
      { $set: cleaned },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();
    const content = { ...DEFAULT_MARKETING_CONTENT, ...saved };
    delete content._id;
    delete content.__v;
    return res.status(200).json({ success: true, content });
  } catch {
    return res.status(500).json({ success: false, message: 'تعذر حفظ المحتوى التسويقي' });
  }
};

/* ------------------------------------------------------------------ *
 *  رفع صور الموقع (شعار / هيدر / قسم التحميل)
 * ------------------------------------------------------------------ */
const upload = createImageUploader({
  diskDir: UPLOAD_DIR,
  filenameFn: (req, file, cb) => {
    const slot = asStr(req.body.slot).replace(/[^a-z0-9_-]/gi, '') || 'file';
    const ext = (path.extname(file.originalname) || '.bin').toLowerCase();
    cb(null, `${slot}-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});

/** رفع صورة للموقع التسويقي (slot: logo | hero | download) */
export const uploadMarketingImage = (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      const msg = err.message === IMAGE_MIME_ERROR
        ? err.message
        : 'تعذر رفع الصورة — تأكد أن حجمها أقل من 5 ميغابايت';
      return res.status(400).json({ success: false, message: msg });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'لم يتم اختيار صورة' });
    }

    const slot = asStr(req.body.slot);
    if (!['logo', 'hero', 'download'].includes(slot)) {
      return res.status(400).json({ success: false, message: 'مكان الصورة غير صالح' });
    }

    let url;
    try {
      // تخزين خارجي دائم عند تفعيله، وإلا مسار محلي
      url = await resolveUploadedUrl(req.file, { cloudFolder: 'dealbox/marketing', localPrefix: '/uploads/marketing' });
    } catch {
      return res.status(500).json({ success: false, message: 'تعذر رفع الصورة إلى التخزين الخارجي' });
    }
    try {
      await MarketingContent.findOneAndUpdate(
        { key: MARKETING_KEY },
        { $set: { [`images.${slot === 'logo' ? 'logoUrl' : slot === 'hero' ? 'heroImageUrl' : 'downloadImageUrl'}`]: url } },
        { new: true, upsert: true }
      );
      return res.status(200).json({ success: true, url, slot });
    } catch {
      return res.status(500).json({ success: false, message: 'تعذر حفظ مسار الصورة' });
    }
  });
};
