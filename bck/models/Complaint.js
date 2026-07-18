const mongoose = require('mongoose');
const { getNextSequenceValue } = require('./Counter');

const complaintSchema = new mongoose.Schema({
  _id: { type: Number },
  booking_id: { type: Number, ref: 'Booking' },
  raised_by_type: { type: String, enum: ['user'] },
  raised_by_id: { type: Number, ref: 'User' },
  description: { type: String, default: null },
  status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
  resolution_notes: { type: String, default: null },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

complaintSchema.pre('validate', async function () {
  if (this.isNew && this._id === undefined) {
    this._id = await getNextSequenceValue('complaintId');
  }
});

complaintSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

module.exports = mongoose.model('Complaint', complaintSchema);
