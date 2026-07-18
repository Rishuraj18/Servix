const mongoose = require('mongoose');
const { getNextSequenceValue } = require('./Counter');

// Embedded schema for booking status history to replace booking_status table
const statusHistorySchema = new mongoose.Schema({
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'on_the_way', 'working', 'completed', 'cancelled'] 
  },
  updated_by_user_id: { type: Number, default: null },
  notes: { type: String, default: null },
  created_at: { type: Date, default: Date.now }
});

const bookingSchema = new mongoose.Schema({
  _id: { type: Number },
  user_id: { type: Number, ref: 'User' },
  service_id: { type: Number, ref: 'Service' },
  description: { type: String, default: null },
  issue_images: [{ type: String }], // Array of strings (JSON equivalent)
  budget: { type: Number, default: null },
  urgency_level: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'on_the_way', 'working', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  service_token: { type: String, unique: true, sparse: true },
  address: { type: String, default: null },
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
  assigned_worker: { type: String, default: null },
  assigned_worker_phone: { type: String, default: null },
  assigned_worker_email: { type: String, default: null },
  contact_phone: { type: String, default: null },
  payment_method: { type: String, enum: ['cod', 'razorpay'], default: 'cod' },
  payment_status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  scheduled_at: { type: Date, default: null },
  completed_at: { type: Date, default: null },
  status_history: [statusHistorySchema], // Embedded document array
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

statusHistorySchema.pre('validate', async function () {
  if (this.isNew && this._id === undefined) {
    this._id = await getNextSequenceValue('bookingId');
  }
});

statusHistorySchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

module.exports = mongoose.model('Booking', statusHistorySchema);
