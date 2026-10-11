import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    bookingCode: {
      type: String,
      required: true,
      unique: true, // e.g., DB-8492
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    clientName: {
      type: String,
      required: true,
      default: 'زبون DealBox',
    },
    clientPhone: {
      type: String,
      default: '+968 9000 0000',
    },
    boxId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Box',
      required: true,
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
    boxTitle: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    pricePaidOmr: {
      type: Number,
      required: true,
    },
    originalPriceOmr: {
      type: Number,
      required: true,
    },
    platformCommissionOmr: {
      type: Number,
      required: true,
    },
    storeNetPayoutOmr: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'collected', 'cancelled'],
      default: 'pending',
    },
    pickupWindow: {
      type: String,
      required: true,
    },
    collectedAt: {
      type: Date,
      default: null,
    },
    settlementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Settlement',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
export default Order;
