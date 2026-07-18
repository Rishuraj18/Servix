const mongoose = require('mongoose');
const { getNextSequenceValue } = require('./Counter');

const serviceSchema = new mongoose.Schema({
  _id: { type: Number },
  name: { type: String, required: true },
  description: { type: String, default: null },
  icon_image: { type: String, default: null },
  category: { type: String, required: true },
  base_price: { type: Number, default: 0.00 },
  is_active: { type: Boolean, default: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

serviceSchema.pre('validate', async function () {
  if (this.isNew && this._id === undefined) {
    this._id = await getNextSequenceValue('serviceId');
  }
});

serviceSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

module.exports = mongoose.model('Service', serviceSchema);
