// socket.js
const { Server } = require('socket.io');
const Booking = require('./models/Booking');
const Chat = require('./models/Chat');
const Message = require('./models/Message');

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
        const booking = await Booking.findById(bookingId);
        if (!booking) {
          socket.emit('message_error', { message: 'Booking not found' });
          return;
        }

        // Get or create chat
        let chat = await Chat.findOne({ booking_id: bookingId });
        if (!chat) {
          chat = new Chat({ user_id: data.userId, booking_id: bookingId });
          await chat.save();
        }

        // Save message to database
        const senderType = data.userRole === 'admin' ? 'admin' : 'user';
        const newMsg = new Message({
          chat_id: chat._id,
          sender_type: senderType,
          sender_id: data.userId,
          message: data.message
        });
        await newMsg.save();

        const populatedMsg = await Message.findById(newMsg._id)
          .populate('sender_id', 'name')
          .lean();

        const senderName = senderType === 'admin' ? 'Support Admin' : (populatedMsg.sender_id ? populatedMsg.sender_id.name : 'Customer');

        // Broadcast to all users in this chat room
        io.to(chatRoom).emit('receive_message', {
          id: populatedMsg._id,
          message: populatedMsg.message,
          senderId: data.userId,
          senderType: senderType,
          senderName: senderName,
          timestamp: populatedMsg.created_at,
          isRead: populatedMsg.is_read
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