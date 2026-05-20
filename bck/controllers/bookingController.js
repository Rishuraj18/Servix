const db = require('../config/db');
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
      const [services] = await db.query(
        'SELECT id FROM services WHERE (category = ? OR name = ?) AND is_active = TRUE ORDER BY id LIMIT 1',
        [category, category]
      );
      if (!services.length) {
        return res.status(404).json({ success: false, message: 'Selected service was not found' });
      }
      resolvedServiceId = services[0].id;
    }

    const token = Math.random().toString(36).slice(2, 8).toUpperCase();
    const plannedAt = scheduled_at || buildScheduledAt(date, time);

    // Process optional image uploads
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

    const [result] = await db.query(
      `INSERT INTO bookings
        (user_id, service_id, description, issue_images, budget, urgency_level, service_token, address, lat, lng,
         scheduled_at, contact_phone, payment_method, payment_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        resolvedServiceId,
        description,
        JSON.stringify(imageUrls),
        budget || null,
        urgency_level || urgency || 'medium',
        token,
        address,
        lat || null,
        lng || null,
        plannedAt,
        contact_phone || null,
        payment_method || 'cod',
        payment_status || 'pending'
      ]
    );

    await db.query(
      'INSERT INTO booking_status (booking_id, status, updated_by_user_id, notes) VALUES (?, ?, ?, ?)',
      [result.insertId, 'pending', req.user.id, 'Booking created']
    );

    const [rows] = await db.query(
      `SELECT b.*, s.name AS service_name, s.category
       FROM bookings b
       LEFT JOIN services s ON s.id = b.service_id
       WHERE b.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getMyBookings = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const whereClause = isAdmin ? '1 = 1' : 'b.user_id = ?';
    const params = isAdmin ? [] : [req.user.id];

    const [bookings] = await db.query(
      `SELECT b.*, s.name AS service_name, s.category, u.name AS user_name, u.phone AS user_phone, u.address AS user_address,
              b.assigned_worker AS worker_name
       FROM bookings b
       LEFT JOIN services s ON s.id = b.service_id
       LEFT JOIN users u ON u.id = b.user_id
       WHERE ${whereClause}
       ORDER BY b.created_at DESC`,
      params
    );

    res.json({ success: true, count: bookings.length, data: bookings });
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

    const [rows] = await db.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const booking = rows[0];
    const updates = [];
    const values = [];

    if (status) {
      updates.push('status = ?');
      values.push(status);
      if (status === 'completed') {
        updates.push('completed_at = NOW()');
      }
    }

    if (assigned_worker !== undefined) {
      updates.push('assigned_worker = ?');
      values.push(assigned_worker);
    }

    if (assigned_worker_phone !== undefined) {
      updates.push('assigned_worker_phone = ?');
      values.push(assigned_worker_phone);
    }

    if (assigned_worker_email !== undefined) {
      updates.push('assigned_worker_email = ?');
      values.push(assigned_worker_email);
    }

    if (payment_status !== undefined) {
      updates.push('payment_status = ?');
      values.push(payment_status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'Nothing to update' });
    }

    // Role checks
    if (req.user.role === 'user' && booking.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can update only your own bookings' });
    }

    values.push(req.params.id);
    await db.query(`UPDATE bookings SET ${updates.join(', ')} WHERE id = ?`, values);

    // Add status history update
    await db.query(
      `INSERT INTO booking_status
        (booking_id, status, updated_by_user_id, notes)
       VALUES (?, ?, ?, ?)`,
      [
        req.params.id,
        status || booking.status,
        req.user.role === 'user' ? req.user.id : null,
        notes || (assigned_worker ? `Worker assigned: ${assigned_worker}` : `Booking updated`)
      ]
    );

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

    const [rows] = await db.query('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const booking = rows[0];
    if (booking.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You cannot review a booking that does not belong to you' });
    }

    // GATING: Only completed or cancelled/rejected tasks can be reviewed
    if (booking.status !== 'completed' && booking.status !== 'cancelled') {
      return res.status(400).json({ 
        success: false, 
        message: 'You can only leave feedback/reviews after the service job has been completed or cancelled.' 
      });
    }

    await db.query(
      'INSERT INTO reviews (booking_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
      [bookingId, req.user.id, rating, comment || null]
    );

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

    const [rows] = await db.query('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const booking = rows[0];
    if (booking.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You cannot complain about a booking that does not belong to you' });
    }

    // GATING: Only completed or cancelled/rejected tasks can have complaints filed
    if (booking.status !== 'completed' && booking.status !== 'cancelled') {
      return res.status(400).json({ 
        success: false, 
        message: 'You can only lodge formal complaints after the service job has been completed or cancelled.' 
      });
    }

    await db.query(
      "INSERT INTO complaints (booking_id, raised_by_type, raised_by_id, description, status) VALUES (?, 'user', ?, ?, 'open')",
      [bookingId, req.user.id, description]
    );

    res.status(201).json({ success: true, message: 'Complaint registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getAllComplaints = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone,
              b.service_token, s.name AS service_name
       FROM complaints c
       LEFT JOIN bookings b ON b.id = c.booking_id
       LEFT JOIN users u ON u.id = b.user_id
       LEFT JOIN services s ON s.id = b.service_id
       ORDER BY c.created_at DESC`
    );

    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getAllReviews = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, u.name AS user_name, s.name AS service_name, b.service_token
       FROM reviews r
       LEFT JOIN bookings b ON b.id = r.booking_id
       LEFT JOIN users u ON u.id = r.user_id
       LEFT JOIN services s ON s.id = b.service_id
       ORDER BY r.created_at DESC`
    );

    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// --- CHAT SYSTEM ENDPOINTS (WORKING WITH YOUR SCHEMA) ---

const getBookingMessages = async (req, res) => {
  try {
    const bookingId = req.params.id;

    // Check if booking exists
    const [bookings] = await db.query('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (!bookings.length) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const booking = bookings[0];
    
    // Check if user has permission
    if (req.user.role !== 'admin' && booking.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to chat' });
    }

    // Find chat
    const [chats] = await db.query('SELECT id FROM chats WHERE booking_id = ? LIMIT 1', [bookingId]);
    
    if (!chats.length) {
      // No chat exists yet, return empty messages
      return res.json({ success: true, messages: [] });
    }

    const chatId = chats[0].id;

    // Fetch messages - matching your schema exactly
    const [messages] = await db.query(
      `SELECT 
        m.id,
        m.chat_id,
        m.sender_type,
        m.sender_id,
        m.message,
        m.is_read,
        m.created_at,
        COALESCE(u.name, 
          CASE 
            WHEN m.sender_type = 'admin' THEN 'Support Admin'
            ELSE 'Customer'
          END
        ) AS sender_name
       FROM messages m
       LEFT JOIN users u ON u.id = m.sender_id
       WHERE m.chat_id = ?
       ORDER BY m.created_at ASC`,
      [chatId]
    );

    res.json({ success: true, messages: messages || [] });
    
  } catch (error) {
    console.error('Error in getBookingMessages:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error',
      error: error.message 
    });
  }
};

const sendBookingMessage = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    // Check if booking exists
    const [bookings] = await db.query('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (!bookings.length) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const booking = bookings[0];
    
    // Check if user has permission
    if (req.user.role !== 'admin' && booking.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to post messages' });
    }

    // Retrieve or create chat entry
    let [chats] = await db.query('SELECT id FROM chats WHERE booking_id = ? LIMIT 1', [bookingId]);
    let chatId;

    if (!chats.length) {
      const [insertChat] = await db.query(
        'INSERT INTO chats (user_id, booking_id) VALUES (?, ?)', 
        [booking.user_id, bookingId]
      );
      chatId = insertChat.insertId;
    } else {
      chatId = chats[0].id;
    }

    const senderType = req.user.role === 'admin' ? 'admin' : 'user';

    // Insert message record
    const [insertMsg] = await db.query(
      `INSERT INTO messages (chat_id, sender_type, sender_id, message)
       VALUES (?, ?, ?, ?)`,
      [chatId, senderType, req.user.id, message]
    );

    // Fetch the newly created message
    const [newMessage] = await db.query(
      `SELECT 
        m.id,
        m.chat_id,
        m.sender_type,
        m.sender_id,
        m.message,
        m.is_read,
        m.created_at,
        COALESCE(u.name, 
          CASE 
            WHEN m.sender_type = 'admin' THEN 'Support Admin'
            ELSE 'Customer'
          END
        ) AS sender_name
       FROM messages m
       LEFT JOIN users u ON u.id = m.sender_id
       WHERE m.id = ?`,
      [insertMsg.insertId]
    );

    res.status(201).json({ success: true, message: newMessage[0] });
    
  } catch (error) {
    console.error('Error in sendBookingMessage:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error',
      error: error.message 
    });
  }
};

// --- BOOKING CANCELLATION ---

const cancelBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { cancellationReason } = req.body;

    // Fetch booking details
    const [rows] = await db.query('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const booking = rows[0];

    // Authorization: User can only cancel their own bookings, admin can cancel any
    if (req.user.role === 'user' && booking.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only cancel your own bookings' });
    }

    // Validate cancellation: Cannot cancel already completed or cancelled bookings
    const cancelledStatuses = ['completed', 'cancelled'];
    if (cancelledStatuses.includes(booking.status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot cancel a booking that is already ${booking.status}` 
      });
    }

    // Update booking status to cancelled
    await db.query(
      'UPDATE bookings SET status = ?, updated_at = NOW() WHERE id = ?',
      ['cancelled', bookingId]
    );

    // Record status change in history
    const notes = cancellationReason || (req.user.role === 'user' ? 'Cancelled by customer' : 'Cancelled by admin');
    await db.query(
      `INSERT INTO booking_status (booking_id, status, updated_by_user_id, notes)
       VALUES (?, ?, ?, ?)`,
      [bookingId, 'cancelled', req.user.id, notes]
    );

    // If payment was not completed, mark as failed
    if (booking.payment_status === 'pending') {
      await db.query(
        'UPDATE payments SET status = ? WHERE booking_id = ? AND status = ?',
        ['failed', bookingId, 'pending']
      );
    }

    // Get updated booking details
    const [updatedBooking] = await db.query(
      `SELECT b.*, s.name AS service_name, s.category
       FROM bookings b
       LEFT JOIN services s ON s.id = b.service_id
       WHERE b.id = ?`,
      [bookingId]
    );

    res.json({ 
      success: true, 
      message: 'Booking cancelled successfully',
      data: updatedBooking[0]
    });

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