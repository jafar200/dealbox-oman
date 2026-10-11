import mongoose from 'mongoose';

const boxSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: [true, 'معرف المتجر مطلوب'],
    },
    title: {
      type: String,
      required: [true, 'عنوان الصندوق مطلوب'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'وصف محتويات الصندوق مطلوب'],
    },
    category: {
      type: String,
      enum: ['bakery', 'supermarket', 'restaurant', 'cafe', 'produce', 'cooked'],
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    expectedItems: {
      type: [String],
      default: [],
    },
    originalPrice: {
      type: Number,
      required: [true, 'السعر الأصلي بالريال العماني مطلوب'],
    },
    discountedPrice: {
      type: Number,
      required: [true, 'السعر المخفض بالريال العماني مطلوب'],
    },
    currency: {
      type: String,
      default: 'ر.ع',
    },
    remainingCount: {
      type: Number,
      required: true,
      min: 0,
      default: 1,
    },
    pickupStart: {
      type: String,
      required: true,
      default: '20:00',
    },
    pickupEnd: {
      type: String,
      required: true,
      default: '22:00',
    },
    pickupDate: {
      type: String,
      default: 'اليوم',
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Box = mongoose.models.Box || mongoose.model('Box', boxSchema);
export default Box;
