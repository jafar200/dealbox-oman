import mongoose from 'mongoose';

/**
 * ملاحظة سير العمل: الـ inbox هنا هو رقم واحد (new/read)، لذا تُعالج كل رسائل المستفيدين كدعوة.
 * القرار الفعلي على التسجيل/الموافقة يأتي من الوحدة المالكة (comms team / ops).
 */
const platformSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    storyPromotionFeeOmr: { type: Number, min: 0, default: 0 },
    loyaltyDiscountPercent: { type: Number, min: 0, max: 80, default: 5 },
    // تنبيه عام ينشره الأدمن ويظهر لكل المستفيدين على هواتفهم
    announcementTitle: { type: String, trim: true, default: '' },
    announcementBody: { type: String, trim: true, default: '' },
    announcementActive: { type: Boolean, default: false },
    announcementPublishedAt: { type: Date, default: null },
    // استعادة كلمة المرور («نسيت كلمة المرور») — تفعيل/إيقاف من إعدادات النظام
    passwordResetEnabled: { type: Boolean, default: true },
    // شعار المنظومة الموحّد — يُحفظ على الخادم ليظهر على كل الأجهزة (موقع/تطبيق)
    projectLogoUrl: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

export const PlatformSetting = mongoose.models.PlatformSetting
  || mongoose.model('PlatformSetting', platformSettingSchema);
export default PlatformSetting;