const mongoose = require('mongoose');
const { getNextSequenceValue } = require('./Counter');

const couponSchema = new mongoose.Schema({
  _id: { type: Number },
  code: { type: String, required: true, unique: true },
  discount_percentage: { type: Number, default: null },
  max_discount_amount: { type: Number, default: null },
  valid_from: { type: Date, default: null },
  valid_until: { type: Date, default: null },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
});

couponSchema.pre('validate', async function () {
  if (this.isNew && this._id === undefined) {
    this._id = await getNextSequenceValue('couponId');
  }
});

couponSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

module.exports = mongoose.model('Coupon', couponSchema);
