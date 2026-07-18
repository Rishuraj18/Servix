const mongoose = require('mongoose');
const { getNextSequenceValue } = require('./Counter');

const paymentSchema = new mongoose.Schema({
  _id: { type: Number },
  booking_id: { type: Number, ref: 'Booking' },
  user_id: { type: Number, ref: 'User' },
  amount: { type: Number, required: true },
  razorpay_order_id: { type: String, default: null },
  razorpay_payment_id: { type: String, default: null },
  razorpay_signature: { type: String, default: null },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

paymentSchema.pre('validate', async function () {
  if (this.isNew && this._id === undefined) {
    this._id = await getNextSequenceValue('paymentId');
  }
});

paymentSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

module.exports = mongoose.model('Payment', paymentSchema);
