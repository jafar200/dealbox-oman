import mongoose from 'mongoose';

/**
 * توكن جهاز لتطبيق الجوال (Firebase Cloud Messaging).
 * يُخزَّن توكن FCM لكل جهاز، ويُستخدم لإرسال التنبيه العام كإشعار نظام
 * يظهر على شاشة القفل حتى لو كان التطبيق مغلقاً أو الهاتف في وضع السكون.
 */
const deviceTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true, trim: true },
    platform: { type: String, enum: ['android', 'ios', 'web'], default: 'android' },
    userAgent: { type: String, trim: true, default: '' },
    /** آخر مرة تأكدنا أن التوكن ما زال مسجّلاً */
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const DeviceToken = mongoose.models.DeviceToken
  || mongoose.model('DeviceToken', deviceTokenSchema);

export default DeviceToken;
