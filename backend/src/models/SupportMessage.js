import mongoose from 'mongoose';

/**
 * رسالة الدعم الفني/مساعدة المستفيدين من العميل، تصل لوحة تحكم الأدمن مباشرة.
 */
const supportMessageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: { type: String, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    message: {
      type: String,
      required: [true, 'محتوى الرسالة مطلوب'],
      trim: true,
      maxlength: 1000,
    },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const SupportMessage = mongoose.models.SupportMessage
  || mongoose.model('SupportMessage', supportMessageSchema);
export default SupportMessage;
