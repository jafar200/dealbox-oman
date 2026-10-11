import mongoose from 'mongoose';

const settlementSchema = new mongoose.Schema(
  {
    settlementNumber: {
      type: String,
      required: true,
      unique: true, // e.g. STL-OM-2026-001
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },
    storeName: {
      type: String,
      required: true,
    },
    period: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
    },
    totalOrdersCount: {
      type: Number,
      required: true,
      default: 0,
    },
    grossSalesOmr: {
      type: Number,
      required: true,
      default: 0,
    },
    platformCommissionOmr: {
      type: Number,
      required: true,
      default: 0,
    },
    netPayoutOmr: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'processed', 'transferred'],
      default: 'pending',
    },
    bankDetails: {
      bankName: { type: String, default: 'بنك مسقط (Bank Muscat)' },
      iban: { type: String, default: '' },
    },
    transferredAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: 'تسوية أسبوعية لمبيعات الصناديق الفائضة في الخوض',
    },
  },
  {
    timestamps: true,
  }
);

export const Settlement = mongoose.models.Settlement || mongoose.model('Settlement', settlementSchema);
export default Settlement;
