const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const db = require('./config/db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || ' http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

const path = require('path');

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.FRONTEND_URL || ' http://localhost:5173',
  credentials: true
}));

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(morgan('dev'));
app.use('/public', express.static('public'));
// app.use('/public', express.static(path.join(__dirname, 'public')));

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

// Socket.io for Real-time chat and booking updates
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join_chat', (data) => {
    // data should contain { bookingId, userId, userRole }
    const chatRoom = `booking_${data.bookingId}`;
    socket.join(chatRoom);
    socket.userRole = data.userRole;
    socket.userId = data.userId;
    console.log(`User ${socket.id} (${data.userRole}) joined chat for booking ${data.bookingId}`);
  });

  socket.on('send_message', async (data) => {
    try {
      // data should contain { bookingId, message, userId, userRole, senderName }
      const bookingId = data.bookingId;
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
        const [insertChat] = await db.query('INSERT INTO chats (user_id, booking_id) VALUES (?, ?)', [data.userId, bookingId]);
        chatId = insertChat.insertId;
      } else {
        chatId = chats[0].id;
      }

      // Save message to database
      const senderType = data.userRole === 'admin' ? 'admin' : 'user';
      const [insertMsg] = await db.query(
        `INSERT INTO messages (chat_id, sender_type, sender_id, message) VALUES (?, ?, ?, ?)`,
        [chatId, senderType, data.userId, data.message]
      );

      const [newMessage] = await db.query(
        `SELECT m.*, u.name AS sender_name FROM messages m
         LEFT JOIN users u ON u.id = m.sender_id WHERE m.id = ?`,
        [insertMsg.insertId]
      );

      // Broadcast to all users in this chat room
      io.to(chatRoom).emit('receive_message', {
        id: newMessage[0].id,
        message: newMessage[0].message,
        senderId: data.userId,
        senderType: senderType,
        senderName: newMessage[0].sender_name || data.senderName,
        timestamp: newMessage[0].created_at,
        isRead: newMessage[0].is_read
      });

    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('message_error', { message: 'Failed to send message' });
    }
  });

  socket.on('booking_update', (data) => {
    // data should contain { bookingId, status, message }
    const chatRoom = `booking_${data.bookingId}`;
    io.to(chatRoom).emit('booking_status_changed', {
      bookingId: data.bookingId,
      status: data.status,
      message: data.message,
      timestamp: new Date()
    });
    console.log(`Booking ${data.bookingId} status updated to ${data.status}`);
  });

  socket.on('leave_chat', (data) => {
    const chatRoom = `booking_${data.bookingId}`;
    socket.leave(chatRoom);
    console.log(`User ${socket.id} left chat for booking ${data.bookingId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Basic Route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Servix API' });
});

// Basic Error Handler Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
