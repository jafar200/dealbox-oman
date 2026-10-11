import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'اسم المتجر أو المخبز مطلوب'],
      trim: true,
    },
    crNumber: {
      type: String,
      required: [true, 'رقم السجل التجاري في سلطنة عُمان مطلوب'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['bakery', 'supermarket', 'restaurant', 'cafe', 'produce', 'cooked'],
      required: true,
    },
    wilayah: {
      type: String,
      enum: ['السيب', 'بوشر', 'مطرح', 'العامرات', 'صحار', 'صلالة', 'نزوى', 'بركاء'],
      default: 'السيب',
    },
    area: {
      type: String,
      required: true,
      default: 'الخوض',
    },
    address: {
      type: String,
      required: true,
    },
    coordinates: {
      lat: { type: Number, default: 23.6139 },
      lng: { type: Number, default: 58.1963 },
    },
    phone: {
      type: String,
      required: true,
    },
    logoUrl: {
      type: String,
      default: '',
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    commissionRate: {
      type: Number,
      default: 0.15, // 15%
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'suspended'],
      default: 'active',
    },
    // إعدادات القصص المدفوعة لكل متجر (تُدار من لوحة الآدمن)
    storySettings: {
      enabled: { type: Boolean, default: true },
      feeOmr: { type: Number, min: 0, max: 1000, default: 0 },
      period: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'weekly' },
    },
    bankDetails: {
      bankName: { type: String, default: 'بنك مسقط (Bank Muscat)' },
      accountHolder: { type: String, default: '' },
      iban: { type: String, default: 'OM00BMUS0000000000000000' },
    },
    rating: {
      type: Number,
      default: 4.8,
    },
    totalBoxesSold: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Store = mongoose.models.Store || mongoose.model('Store', storeSchema);
export default Store;
