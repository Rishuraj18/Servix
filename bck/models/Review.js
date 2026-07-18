const mongoose = require('mongoose');
const { getNextSequenceValue } = require('./Counter');

const reviewSchema = new mongoose.Schema({
  _id: { type: Number },
  booking_id: { type: Number, ref: 'Booking' },
  user_id: { type: Number, ref: 'User' },
  rating: { type: Number, min: 1, max: 5 },
  comment: { type: String, default: null },
  created_at: { type: Date, default: Date.now },
});

reviewSchema.pre('validate', async function () {
  if (this.isNew && this._id === undefined) {
    this._id = await getNextSequenceValue('reviewId');
  }
});

reviewSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

module.exports = mongoose.model('Review', reviewSchema);
