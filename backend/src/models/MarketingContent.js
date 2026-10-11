import mongoose from 'mongoose';

/**
 * محتوى الموقع التسويقي — وثيقة واحدة تتحكم بكامل صفحة الهبوط.
 * تُدار من لوحة الآدمن (تبويب «الموقع التسويقي» داخل إعدادات النظام)
 * وتُعرض للزوار عبر واجهة برمجة عامة (بدون مصادقة).
 */
const marketingContentSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },

    /* تحسين محركات البحث (SEO) */
    seo: {
      title: { type: String, trim: true, default: '' },
      description: { type: String, trim: true, default: '' },
      keywords: { type: String, trim: true, default: '' },
      ogImage: { type: String, trim: true, default: '' },
    },

    /* الهيدر الرئيسي */
    hero: {
      badgeText: { type: String, trim: true, default: '' },
      tagline: { type: String, trim: true, default: '' },
      subtitle: { type: String, trim: true, default: '' },
      highlightLine: { type: String, trim: true, default: '' },
      ctaClientText: { type: String, trim: true, default: '' },
      ctaStoreText: { type: String, trim: true, default: '' },
      chips: [{ type: String, trim: true }],
      imageUrl: { type: String, trim: true, default: '' },
    },

    /* صناديق العروض اليوم */
    offers: [
      {
        emoji: { type: String, trim: true, default: '' },
        store: { type: String, trim: true, default: '' },
        title: { type: String, trim: true, default: '' },
        newPrice: { type: String, trim: true, default: '' },
        oldPrice: { type: String, trim: true, default: '' },
        save: { type: String, trim: true, default: '' },
        tag: { type: String, trim: true, default: '' },
      },
    ],

    /* شريط القيمة */
    valueBand: [{ icon: { type: String, trim: true, default: '' }, title: { type: String, trim: true, default: '' }, desc: { type: String, trim: true, default: '' } }],

    /* مميزات التطبيق */
    features: {
      sectionTitle: { type: String, trim: true, default: '' },
      sectionSub: { type: String, trim: true, default: '' },
      items: [{ icon: { type: String, trim: true, default: '' }, title: { type: String, trim: true, default: '' }, desc: { type: String, trim: true, default: '' } }],
    },

    /* كيف يعمل */
    steps: {
      sectionTitle: { type: String, trim: true, default: '' },
      items: [{ icon: { type: String, trim: true, default: '' }, title: { type: String, trim: true, default: '' }, desc: { type: String, trim: true, default: '' } }],
    },

    /* محفزات النمو */
    growthHacks: [{ icon: { type: String, trim: true, default: '' }, title: { type: String, trim: true, default: '' }, headline: { type: String, trim: true, default: '' }, desc: { type: String, trim: true, default: '' } }],

    /* الأثر بالأرقام */
    impact: {
      sectionTitle: { type: String, trim: true, default: '' },
      sectionSub: { type: String, trim: true, default: '' },
      stats: [{ icon: { type: String, trim: true, default: '' }, value: { type: Number, min: 0, default: 0 }, decimals: { type: Number, min: 0, max: 2, default: 0 }, label: { type: String, trim: true, default: '' } }],
    },

    /* حملات الإطلاق */
    campaigns: {
      sectionBadge: { type: String, trim: true, default: '' },
      sectionTitle: { type: String, trim: true, default: '' },
      sectionSub: { type: String, trim: true, default: '' },
      items: [{ icon: { type: String, trim: true, default: '' }, channel: { type: String, trim: true, default: '' }, name: { type: String, trim: true, default: '' }, desc: { type: String, trim: true, default: '' }, audience: { type: String, trim: true, default: '' } }],
    },

    /* للمتاجر الشريكة */
    partners: {
      badge: { type: String, trim: true, default: '' },
      title: { type: String, trim: true, default: '' },
      intro: { type: String, trim: true, default: '' },
      bullets: [{ icon: { type: String, trim: true, default: '' }, title: { type: String, trim: true, default: '' }, desc: { type: String, trim: true, default: '' } }],
      ctaText: { type: String, trim: true, default: '' },
      equationTitle: { type: String, trim: true, default: '' },
      equationText: { type: String, trim: true, default: '' },
      guideTitle: { type: String, trim: true, default: '' },
      guideItems: [{ type: String, trim: true }],
    },

    /* تحميل التطبيق */
    download: {
      title: { type: String, trim: true, default: '' },
      subtitle: { type: String, trim: true, default: '' },
      note: { type: String, trim: true, default: '' },
      playStoreUrl: { type: String, trim: true, default: '' },
      appStoreUrl: { type: String, trim: true, default: '' },
    },

    /* التذييل */
    footer: {
      about: { type: String, trim: true, default: '' },
      copyright: { type: String, trim: true, default: '' },
    },

    /* صور مرفوعة (مسارات تحت /uploads) */
    images: {
      logoUrl: { type: String, trim: true, default: '' },
      heroImageUrl: { type: String, trim: true, default: '' },
      downloadImageUrl: { type: String, trim: true, default: '' },
    },
  },
  { timestamps: true }
);

export const MarketingContent = mongoose.models.MarketingContent
  || mongoose.model('MarketingContent', marketingContentSchema);
export default MarketingContent;
