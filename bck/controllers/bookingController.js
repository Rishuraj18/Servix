const Booking = require('../models/Booking');
const Service = require('../models/Service');
const User = require('../models/User');
const Review = require('../models/Review');
const Complaint = require('../models/Complaint');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Payment = require('../models/Payment');
const { uploadOnCloudinary } = require('../utils/cloudinary');
const path = require('path');
const fs = require('fs');

const buildScheduledAt = (date, time) => {
  if (!date) return null;
  return `${date} ${time || '09:00'}:00`;
};

const createBooking = async (req, res) => {
  try {
    const {
      service_id,
      category,
      description,
      budget,
      urgency_level,
      urgency,
      address,
      lat,
      lng,
      date,
      time,
      scheduled_at,
      contact_phone,
      payment_method,
      payment_status
    } = req.body;

    if (!description || !address || (!service_id && !category)) {
      return res.status(400).json({
        success: false,
        message: 'Service, description, and address are required'
      });
    }

    let resolvedServiceId = service_id;
    if (!resolvedServiceId && category) {
      const service = await Service.findOne({
        $or: [{ category }, { name: category }],
        is_active: true
      }).sort({ _id: 1 });
      
      if (!service) {
        return res.status(404).json({ success: false, message: 'Selected service was not found' });
      }
      resolvedServiceId = service._id;
    }

    const token = Math.random().toString(36).slice(2, 8).toUpperCase();
    const plannedAt = scheduled_at || buildScheduledAt(date, time);

    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        if (process.env.CLOUDINARY_CLOUD_NAME === 'your_cloudinary_name' || !process.env.CLOUDINARY_CLOUD_NAME) {
          const relativeUrl = `/public/temp/${file.filename}`;
          imageUrls.push(relativeUrl);
        } else {
          const result = await uploadOnCloudinary(file.path);
          if (result && result.secure_url) {
            imageUrls.push(result.secure_url);
          } else {
            const relativeUrl = `/public/temp/${file.filename}`;
            imageUrls.push(relativeUrl);
          }
        }
      }
    }

    const newBooking = new Booking({
      user_id: req.user.id,
      service_id: resolvedServiceId,
      description,
      issue_images: imageUrls,
      budget: budget || null,
      urgency_level: urgency_level || urgency || 'medium',
      service_token: token,
      address,
      lat: lat || null,
      lng: lng || null,
      scheduled_at: plannedAt ? new Date(plannedAt) : null,
      contact_phone: contact_phone || null,
      payment_method: payment_method || 'cod',
      payment_status: payment_status || 'pending',
      status: 'pending',
      status_history: [{
        status: 'pending',
        updated_by_user_id: req.user.id,
        notes: 'Booking created'
      }]
    });

    await newBooking.save();

    const populatedBooking = await Booking.findById(newBooking._id)
      .populate('service_id', 'name category')
      .lean();

    const data = {
      ...populatedBooking,
      id: populatedBooking._id,
      service_name: populatedBooking.service_id ? populatedBooking.service_id.name : null,
      category: populatedBooking.service_id ? populatedBooking.service_id.category : null
    };

    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getMyBookings = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const query = isAdmin ? {} : { user_id: req.user.id };

    const bookings = await Booking.find(query)
      .populate('service_id', 'name category')
      .populate('user_id', 'name phone address')
      .sort({ created_at: -1 })
      .lean();

    const mappedBookings = bookings.map(b => ({
      ...b,
      id: b._id,
      service_name: b.service_id ? b.service_id.name : null,
      category: b.service_id ? b.service_id.category : null,
      user_name: b.user_id ? b.user_id.name : null,
      user_phone: b.user_id ? b.user_id.phone : null,
      user_address: b.user_id ? b.user_id.address : null,
      worker_name: b.assigned_worker
    }));

    res.json({ success: true, count: mappedBookings.length, data: mappedBookings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { status, notes, assigned_worker, assigned_worker_phone, assigned_worker_email, payment_status } = req.body;
    const allowed = ['pending', 'accepted', 'on_the_way', 'working', 'completed', 'cancelled'];

    if (status && !allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid booking status' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    let hasUpdates = false;

    if (status) {
      booking.status = status;
      if (status === 'completed') {
        booking.completed_at = new Date();
      }
      hasUpdates = true;
    }

    if (assigned_worker !== undefined) {
      booking.assigned_worker = assigned_worker;
      hasUpdates = true;
    }

    if (assigned_worker_phone !== undefined) {
      booking.assigned_worker_phone = assigned_worker_phone;
      hasUpdates = true;
    }

    if (assigned_worker_email !== undefined) {
      booking.assigned_worker_email = assigned_worker_email;
      hasUpdates = true;
    }

    if (payment_status !== undefined) {
      booking.payment_status = payment_status;
      hasUpdates = true;
    }

    if (!hasUpdates && !notes) {
      return res.status(400).json({ success: false, message: 'Nothing to update' });
    }

    if (req.user.role === 'user' && booking.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can update only your own bookings' });
    }

    if (hasUpdates || notes) {
      booking.status_history.push({
        status: status || booking.status,
        updated_by_user_id: req.user.role === 'user' ? req.user.id : null,
        notes: notes || (assigned_worker ? `Worker assigned: ${assigned_worker}` : `Booking updated`)
      });
      await booking.save();
    }

    res.json({ success: true, message: 'Booking updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const bookingId = req.params.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating (1-5 stars) is required' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You cannot review a booking that does not belong to you' });
    }

    if (booking.status !== 'completed' && booking.status !== 'cancelled') {
      return res.status(400).json({ 
        success: false, 
        message: 'You can only leave feedback/reviews after the service job has been completed or cancelled.' 
      });
    }

    const review = new Review({
      booking_id: bookingId,
      user_id: req.user.id,
      rating,
      comment: comment || null
    });
    await review.save();

    res.status(201).json({ success: true, message: 'Review posted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const createComplaint = async (req, res) => {
  try {
    const { description } = req.body;
    const bookingId = req.params.id;

    if (!description) {
      return res.status(400).json({ success: false, message: 'Description is required for complaints' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You cannot complain about a booking that does not belong to you' });
    }

    if (booking.status !== 'completed' && booking.status !== 'cancelled') {
      return res.status(400).json({ 
        success: false, 
        message: 'You can only lodge formal complaints after the service job has been completed or cancelled.' 
      });
    }

    const complaint = new Complaint({
      booking_id: bookingId,
      raised_by_type: 'user',
      raised_by_id: req.user.id,
      description,
      status: 'open'
    });
    await complaint.save();

    res.status(201).json({ success: true, message: 'Complaint registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate({
        path: 'booking_id',
        select: 'service_token service_id user_id',
        populate: [
          { path: 'user_id', select: 'name email phone' },
          { path: 'service_id', select: 'name' }
        ]
      })
      .sort({ created_at: -1 })
      .lean();

    const mapped = complaints.map(c => ({
      ...c,
      id: c._id,
      user_name: c.booking_id && c.booking_id.user_id ? c.booking_id.user_id.name : null,
      user_email: c.booking_id && c.booking_id.user_id ? c.booking_id.user_id.email : null,
      user_phone: c.booking_id && c.booking_id.user_id ? c.booking_id.user_id.phone : null,
      service_token: c.booking_id ? c.booking_id.service_token : null,
      service_name: c.booking_id && c.booking_id.service_id ? c.booking_id.service_id.name : null
    }));

    res.json({ success: true, count: mapped.length, data: mapped });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('user_id', 'name')
      .populate({
        path: 'booking_id',
        select: 'service_token service_id',
        populate: { path: 'service_id', select: 'name' }
      })
      .sort({ created_at: -1 })
      .lean();

    const mapped = reviews.map(r => ({
      ...r,
      id: r._id,
      user_name: r.user_id ? r.user_id.name : null,
      service_name: r.booking_id && r.booking_id.service_id ? r.booking_id.service_id.name : null,
      service_token: r.booking_id ? r.booking_id.service_token : null
    }));

    res.json({ success: true, count: mapped.length, data: mapped });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getBookingMessages = async (req, res) => {
  try {
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (req.user.role !== 'admin' && booking.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to chat' });
    }

    const chat = await Chat.findOne({ booking_id: bookingId });
    if (!chat) {
      return res.json({ success: true, messages: [] });
    }

    const messages = await Message.find({ chat_id: chat._id })
      .populate('sender_id', 'name')
      .sort({ created_at: 1 })
      .lean();

    const mapped = messages.map(m => ({
      ...m,
      id: m._id,
      sender_name: m.sender_type === 'admin' ? 'Support Admin' : (m.sender_id ? m.sender_id.name : 'Customer')
    }));

    res.json({ success: true, messages: mapped });
  } catch (error) {
    console.error('Error in getBookingMessages:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const sendBookingMessage = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (req.user.role !== 'admin' && booking.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to post messages' });
    }

    let chat = await Chat.findOne({ booking_id: bookingId });
    if (!chat) {
      chat = new Chat({ user_id: booking.user_id, booking_id: bookingId });
      await chat.save();
    }

    const senderType = req.user.role === 'admin' ? 'admin' : 'user';

    const newMsg = new Message({
      chat_id: chat._id,
      sender_type: senderType,
      sender_id: req.user.id,
      message
    });
    await newMsg.save();

    const populatedMsg = await Message.findById(newMsg._id)
      .populate('sender_id', 'name')
      .lean();

    const resultMsg = {
      ...populatedMsg,
      id: populatedMsg._id,
      sender_name: senderType === 'admin' ? 'Support Admin' : (populatedMsg.sender_id ? populatedMsg.sender_id.name : 'Customer')
    };

    res.status(201).json({ success: true, message: resultMsg });
  } catch (error) {
    console.error('Error in sendBookingMessage:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { cancellationReason } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (req.user.role === 'user' && booking.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only cancel your own bookings' });
    }

    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel a booking that is already ${booking.status}` });
    }

    booking.status = 'cancelled';
    const notes = cancellationReason || (req.user.role === 'user' ? 'Cancelled by customer' : 'Cancelled by admin');
    booking.status_history.push({
      status: 'cancelled',
      updated_by_user_id: req.user.id,
      notes
    });
    
    await booking.save();

    if (booking.payment_status === 'pending') {
      await Payment.updateMany({ booking_id: bookingId, status: 'pending' }, { status: 'failed' });
    }

    const updatedBooking = await Booking.findById(bookingId)
      .populate('service_id', 'name category')
      .lean();
      
    const data = {
      ...updatedBooking,
      id: updatedBooking._id,
      service_name: updatedBooking.service_id ? updatedBooking.service_id.name : null,
      category: updatedBooking.service_id ? updatedBooking.service_id.category : null
    };

    res.json({ success: true, message: 'Booking cancelled successfully', data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  updateBookingStatus,
  createReview,
  createComplaint,
  getAllComplaints,
  getAllReviews,
  getBookingMessages,
  sendBookingMessage,
  cancelBooking
};