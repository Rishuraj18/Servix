const mongoose = require('mongoose');
const { getNextSequenceValue } = require('./Counter');

const messageSchema = new mongoose.Schema({
  _id: { type: Number },
  chat_id: { type: Number, ref: 'Chat' },
  sender_type: { type: String, enum: ['user', 'admin'] },
  sender_id: { type: Number }, // Could be User ID or Admin ID
  message: { type: String, required: true },
  is_read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});

messageSchema.pre('validate', async function () {
  if (this.isNew && this._id === undefined) {
    this._id = await getNextSequenceValue('messageId');
  }
});

messageSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

module.exports = mongoose.model('Message', messageSchema);
