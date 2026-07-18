const mongoose = require('mongoose');
const { getNextSequenceValue } = require('./Counter');

const adminSchema = new mongoose.Schema({
  _id: { type: Number },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'manager'], default: 'manager' },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

adminSchema.pre('validate', async function () {
  if (this.isNew && this._id === undefined) {
    this._id = await getNextSequenceValue('adminId');
  }
});

adminSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

module.exports = mongoose.model('Admin', adminSchema);
