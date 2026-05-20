// socket.js
const { Server } = require('socket.io');
const db = require('./config/db');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

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

        // Broadcast to all users in this chat room
        io.to(chatRoom).emit('receive_message', {
          id: newMessage[0].id,
          message: newMessage[0].message,
          senderId: data.userId,
          senderType: senderType,
          senderName: newMessage[0].sender_name,
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

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = { initializeSocket, getIO };