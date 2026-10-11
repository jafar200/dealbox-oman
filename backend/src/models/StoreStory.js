import mongoose from 'mongoose';

const storeStorySchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    imageData: {
      type: String,
      required: true,
      maxlength: 4_500_000,
    },
    caption: {
      type: String,
      trim: true,
      maxlength: 180,
      default: '',
    },
    feeOmr: {
      type: Number,
      required: true,
      min: 0.001,
    },
    feePeriod: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'weekly',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'submitted', 'confirmed'],
      default: 'unpaid',
      index: true,
    },
    paymentReference: {
      type: String,
      trim: true,
      maxlength: 100,
      default: '',
    },
    reviewStatus: {
      type: String,
      enum: ['pending_payment', 'pending_review', 'approved', 'rejected'],
      default: 'pending_payment',
      index: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    paidAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

export const StoreStory = mongoose.models.StoreStory || mongoose.model('StoreStory', storeStorySchema);
export default StoreStory;