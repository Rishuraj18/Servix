const mongoose = require('mongoose');
const { getNextSequenceValue } = require('./Counter');

const testimonialSchema = new mongoose.Schema({
  _id: { type: Number },
  customer_name: { type: String, required: true },
  customer_role: { type: String, default: null },
  comment: { type: String, required: true },
  rating: { type: Number, default: 5, min: 1, max: 5 },
  avatar_url: { type: String, default: null },
  city: { type: String, default: null },
  is_active: { type: Boolean, default: true },
  sort_order: { type: Number, default: 0 },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

testimonialSchema.pre('validate', async function () {
  if (this.isNew && this._id === undefined) {
    this._id = await getNextSequenceValue('testimonialId');
  }
});

testimonialSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

module.exports = mongoose.model('Testimonial', testimonialSchema);
