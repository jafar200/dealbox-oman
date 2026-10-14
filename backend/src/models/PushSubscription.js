import mongoose from 'mongoose';

/**
 * اشتراك Web Push لمتصفح/جهاز مستفيد.
 * يُخزَّن endpoint فريد + مفاتيح التشفير، ويُستخدم لإرسال التنبيه العام
 * كإشعار حقيقي في شريط إشعارات المتصفح/الهاتف.
 */
const pushSubscriptionSchema = new mongoose.Schema(
  {
    endpoint: { type: String, required: true, unique: true, trim: true },
    keys: {
      p256dh: { type: String, required: true, trim: true },
      auth: { type: String, required: true, trim: true },
    },
    userAgent: { type: String, trim: true, default: '' },
    /** آخر مرة تأكدنا أن الاشتراك ما زال صالحاً */
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const PushSubscription = mongoose.models.PushSubscription
  || mongoose.model('PushSubscription', pushSubscriptionSchema);

export default PushSubscription;
