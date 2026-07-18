const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config();

const db = require('./config/db');

const app = express();
const server = http.createServer(app);

// ✅ FIXED: Remove spaces from CORS origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'https://servix1.netlify.app',
  process.env.FRONTEND_URL
].filter(Boolean);

// Remove duplicate origins
const uniqueOrigins = [...new Set(allowedOrigins)];

// CORS options for Express
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (uniqueOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      if (process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization']
};

// Socket.io CORS configuration
const io = new Server(server, {
  cors: {
    origin: uniqueOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Apply CORS middleware
app.use(cors(corsOptions));

// ✅ FIXED: Remove the problematic line - this causes the error
// app.options('*', cors(corsOptions));  // ← COMMENT THIS LINE OR REMOVE IT

// Other middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helmet configuration
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
  })
);

app.use(morgan('dev'));

// Static files
app.use('/public', express.static(path.join(__dirname, 'public')));

// Routes
const authRoutes = require('./routes/authRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const contentRoutes = require('./routes/contentRoutes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/content', contentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    allowedOrigins: uniqueOrigins
  });
});

// Basic Route for testing
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Servix API',
    version: '1.0.0',
    status: 'active'
  });
});

// ✅ FIXED: 404 handler - use specific path instead of '*'
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl} - Route not found`
  });
});

const Booking = require('./models/Booking');
const Chat = require('./models/Chat');
const Message = require('./models/Message');

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  console.log('Total connected clients:', io.engine.clientsCount);

  socket.on('join_chat', async (data) => {
    try {
      const { bookingId, userId, userRole } = data;
      
      if (!bookingId || !userId) {
        socket.emit('error', { message: 'Invalid join data' });
        return;
      }
      
      const chatRoom = `booking_${bookingId}`;
      socket.join(chatRoom);
      socket.userData = { userId, userRole, bookingId };
      
      console.log(`User ${socket.id} (${userRole}) joined chat room: ${chatRoom}`);
      
      try {
        const chat = await Chat.findOne({ booking_id: bookingId });
        if (chat) {
          const messages = await Message.find({ chat_id: chat._id })
            .populate('sender_id', 'name')
            .sort({ created_at: 1 })
            .lean();
            
          const mappedMessages = messages.map(m => ({
            ...m,
            sender_name: m.sender_type === 'admin' ? 'Support Admin' : (m.sender_id ? m.sender_id.name : 'Customer')
          }));
          socket.emit('previous_messages', mappedMessages);
        }
      } catch (err) {
        console.error('Error fetching previous messages:', err);
      }
      
      socket.emit('joined_chat', { success: true, room: chatRoom });
    } catch (error) {
      console.error('Error joining chat:', error);
      socket.emit('error', { message: 'Failed to join chat' });
    }
  });

  socket.on('send_message', async (data) => {
    try {
      const { bookingId, message, userId, userRole, senderName } = data;
      
      if (!bookingId || !message || !userId) {
        socket.emit('message_error', { message: 'Invalid message data' });
        return;
      }
      
      const chatRoom = `booking_${bookingId}`;
      
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        socket.emit('message_error', { message: 'Booking not found' });
        return;
      }

      let chat = await Chat.findOne({ booking_id: bookingId });
      if (!chat) {
        chat = new Chat({ user_id: userId, booking_id: bookingId });
        await chat.save();
      }

      const senderType = userRole === 'admin' ? 'admin' : 'user';
      const newMsg = new Message({
        chat_id: chat._id,
        sender_type: senderType,
        sender_id: userId,
        message
      });
      await newMsg.save();

      const populatedMsg = await Message.findById(newMsg._id)
        .populate('sender_id', 'name')
        .lean();

      io.to(chatRoom).emit('receive_message', {
        id: populatedMsg._id,
        message: populatedMsg.message,
        senderId: userId,
        senderType: senderType,
        senderName: populatedMsg.sender_name || senderName || (senderType === 'admin' ? 'Admin' : 'User'),
        timestamp: populatedMsg.created_at,
        isRead: false
      });

    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('message_error', { message: 'Failed to send message' });
    }
  });

  socket.on('booking_update', (data) => {
    const { bookingId, status, message, updatedBy } = data;
    const chatRoom = `booking_${bookingId}`;
    
    io.to(chatRoom).emit('booking_status_changed', {
      bookingId,
      status,
      message: message || `Booking status updated to ${status}`,
      updatedBy,
      timestamp: new Date()
    });
    
    console.log(`Booking ${bookingId} status updated to ${status} by ${updatedBy}`);
  });

  socket.on('mark_messages_read', async (data) => {
    try {
      const { chatId, userId } = data;
      await Message.updateMany(
        { chat_id: chatId, sender_id: { $ne: userId }, is_read: false },
        { is_read: true }
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });

  socket.on('leave_chat', (data) => {
    const { bookingId } = data;
    const chatRoom = `booking_${bookingId}`;
    socket.leave(chatRoom);
    console.log(`User ${socket.id} left chat room: ${chatRoom}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    console.log('Remaining connected clients:', io.engine.clientsCount);
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON payload'
    });
  }
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  server.close(() => {
    process.exit(1);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const PORT = process.env.PORT || 5000;

db.getConnection().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 CORS enabled for:`, uniqueOrigins);
    console.log(`📡 WebSocket server is ready`);
  });
}).catch(err => {
  console.error('Failed to connect to database. Server not started.', err);
  process.exit(1);
});

module.exports = { app, server, io };