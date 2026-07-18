const mongoose = require('mongoose');
const { getNextSequenceValue } = require('./Counter');

const bannerSchema = new mongoose.Schema({
  _id: { type: Number },
  title: { type: String, required: true },
  subtitle: { type: String, default: null },
  eyebrow: { type: String, default: null },
  image_url: { type: String, required: true },
  cta_text: { type: String, default: null },
  cta_link: { type: String, default: null },
  sort_order: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

bannerSchema.pre('validate', async function () {
  if (this.isNew && this._id === undefined) {
    this._id = await getNextSequenceValue('bannerId');
  }
});

bannerSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

module.exports = mongoose.model('Banner', bannerSchema);
