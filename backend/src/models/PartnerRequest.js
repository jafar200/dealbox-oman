import mongoose from 'mongoose';

/**
 * طلبات انضمام الشركاء — استمارة «سجّل مخبزك/مقهىك معنا» في الموقع التسويقي.
 * تُملأ من الزوار (بدون مصادقة) ويراجعها الآدمن من قسم «طلبات انضمام الشركاء»
 * في لوحة الآدمن (صلاحية المتاجر) للتواصل مع مقدم الطلب.
 */
const partnerRequestSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'اسم مقدم الطلب مطلوب'],
      trim: true,
      maxlength: 80,
    },
    storeName: {
      type: String,
      required: [true, 'اسم المتجر مطلوب'],
      trim: true,
      maxlength: 80,
    },
    phone: {
      type: String,
      required: [true, 'رقم الهاتف مطلوب'],
      trim: true,
      maxlength: 20,
    },
    wilayah: {
      type: String,
      trim: true,
      default: 'السيب',
      maxlength: 30,
    },
    area: {
      type: String,
      trim: true,
      default: '',
      maxlength: 60,
    },
    category: {
      type: String,
      enum: ['bakery', 'supermarket', 'restaurant', 'cafe', 'produce', 'cooked', 'other'],
      default: 'bakery',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'approved', 'rejected'],
      default: 'new',
      index: true,
    },
  },
  { timestamps: true }
);

export const PartnerRequest = mongoose.models.PartnerRequest
  || mongoose.model('PartnerRequest', partnerRequestSchema);
export default PartnerRequest;
