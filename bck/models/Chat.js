const mongoose = require('mongoose');
const { getNextSequenceValue } = require('./Counter');

const chatSchema = new mongoose.Schema({
  _id: { type: Number },
  user_id: { type: Number, ref: 'User' },
  booking_id: { type: Number, ref: 'Booking', default: null },
  created_at: { type: Date, default: Date.now },
});

chatSchema.pre('validate', async function () {
  if (this.isNew && this._id === undefined) {
    this._id = await getNextSequenceValue('chatId');
  }
});

chatSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

module.exports = mongoose.model('Chat', chatSchema);
