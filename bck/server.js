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
].filter(Boolean); // Remove undefined values

// Remove duplicate origins
const uniqueOrigins = [...new Set(allowedOrigins)];

// CORS options for Express
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    if (uniqueOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      // In development, allow all origins
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

// ✅ FIXED: Apply CORS middleware before routes
app.use(cors(corsOptions));

// ✅ FIXED: Handle preflight requests
app.options('*', cors(corsOptions));

// Other middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ FIXED: Helmet configuration (don't block CORS)
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

// ✅ ADDED: Health check endpoint
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

// ✅ FIXED: Socket.io connection handling
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
      
      // Send previous messages
      try {
        const [chats] = await db.query('SELECT id FROM chats WHERE booking_id = ? LIMIT 1', [bookingId]);
        if (chats.length) {
          const [messages] = await db.query(
            `SELECT m.*, u.name as sender_name 
             FROM messages m
             LEFT JOIN users u ON u.id = m.sender_id
             WHERE m.chat_id = ?
             ORDER BY m.created_at ASC`,
            [chats[0].id]
          );
          socket.emit('previous_messages', messages);
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
      
      // Check booking exists
      const [bookings] = await db.query('SELECT id FROM bookings WHERE id = ?', [bookingId]);
      if (!bookings.length) {
        socket.emit('message_error', { message: 'Booking not found' });
        return;
      }

      // Get or create chat
      let [chats] = await db.query('SELECT id FROM chats WHERE booking_id = ? LIMIT 1', [bookingId]);
      let chatId;

      if (!chats.length) {
        const [insertChat] = await db.query(
          'INSERT INTO chats (user_id, booking_id, created_at) VALUES (?, ?, NOW())',
          [userId, bookingId]
        );
        chatId = insertChat.insertId;
      } else {
        chatId = chats[0].id;
      }

      // Save message to database
      const senderType = userRole === 'admin' ? 'admin' : 'user';
      const [insertMsg] = await db.query(
        `INSERT INTO messages (chat_id, sender_type, sender_id, message, created_at) 
         VALUES (?, ?, ?, ?, NOW())`,
        [chatId, senderType, userId, message]
      );

      const [newMessage] = await db.query(
        `SELECT m.*, u.name AS sender_name 
         FROM messages m
         LEFT JOIN users u ON u.id = m.sender_id 
         WHERE m.id = ?`,
        [insertMsg.insertId]
      );

      // Broadcast to all users in this chat room
      io.to(chatRoom).emit('receive_message', {
        id: newMessage[0].id,
        message: newMessage[0].message,
        senderId: userId,
        senderType: senderType,
        senderName: newMessage[0].sender_name || senderName || (senderType === 'admin' ? 'Admin' : 'User'),
        timestamp: newMessage[0].created_at,
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
      await db.query(
        'UPDATE messages SET is_read = 1 WHERE chat_id = ? AND sender_id != ? AND is_read = 0',
        [chatId, userId]
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

// ✅ FIXED: 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl} - Route not found`
  });
});

// ✅ FIXED: Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  // Handle specific error types
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

// ✅ FIXED: Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Graceful shutdown
  server.close(() => {
    process.exit(1);
  });
});

// ✅ FIXED: Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 CORS enabled for:`, uniqueOrigins);
  console.log(`📡 WebSocket server is ready`);
});

// Export for testing purposes
module.exports = { app, server, io };