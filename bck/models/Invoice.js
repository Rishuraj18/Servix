const mongoose = require('mongoose');
const { getNextSequenceValue } = require('./Counter');

const invoiceSchema = new mongoose.Schema({
  _id: { type: Number },
  booking_id: { type: Number, ref: 'Booking' },
  payment_id: { type: Number, ref: 'Payment' },
  invoice_url: { type: String, default: null },
  created_at: { type: Date, default: Date.now },
});

invoiceSchema.pre('validate', async function () {
  if (this.isNew && this._id === undefined) {
    this._id = await getNextSequenceValue('invoiceId');
  }
});

invoiceSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

module.exports = mongoose.model('Invoice', invoiceSchema);
