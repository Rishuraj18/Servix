const mongoose = require('mongoose');
const { getNextSequenceValue } = require('./Counter');

const notificationSchema = new mongoose.Schema({
  _id: { type: Number },
  user_id: { type: Number, ref: 'User', default: null },
  admin_id: { type: Number, ref: 'Admin', default: null },
  title: { type: String, default: null },
  message: { type: String, default: null },
  type: { type: String, default: null },
  is_read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});

notificationSchema.pre('validate', async function () {
  if (this.isNew && this._id === undefined) {
    this._id = await getNextSequenceValue('notificationId');
  }
});

notificationSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

module.exports = mongoose.model('Notification', notificationSchema);
