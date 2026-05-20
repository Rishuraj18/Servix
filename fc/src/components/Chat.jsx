// import { useState, useEffect, useRef } from 'react';
// import { useSelector } from 'react-redux';
// import { io } from 'socket.io-client';
// import { Send, X, Phone, MoreVertical } from 'lucide-react';
// import api from '../api/client';

// let socket = null;

// const Chat = ({ bookingId, onClose, recipientName = 'Support' }) => {
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [isOnline, setIsOnline] = useState(false);
//   const messagesEndRef = useRef(null);
//   const { user } = useSelector((state) => state.auth);

//   // Scroll to bottom of messages
//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   // Initialize socket connection and load messages
//   useEffect(() => {
//     const initChat = async () => {
//       try {
//         // Load existing messages from API
//         const response = await api.get(`/bookings/${bookingId}/messages`);
//         if (response.data.success) {
//           setMessages(response.data.messages || []);
//         }
//         setLoading(false);
//       } catch (error) {
//         console.error('Error loading messages:', error);
//         setLoading(false);
//       }
//     };

//     initChat();

//     // Initialize socket connection if not already connected
//     if (!socket) {
//       const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
//       socket = io(socketUrl);
//     }

//     // Join chat room
//     socket.emit('join_chat', {
//       bookingId,
//       userId: user?.id,
//       userRole: user?.role,
//       senderName: user?.name
//     });

//     // Listen for incoming messages
//     const handleReceiveMessage = (message) => {
//       setMessages((prev) => [...prev, message]);
//     };

//     const handleBookingStatusChange = (data) => {
//       console.log('Booking status changed:', data);
//     };

//     socket.on('receive_message', handleReceiveMessage);
//     socket.on('booking_status_changed', handleBookingStatusChange);
//     socket.on('connect', () => setIsOnline(true));
//     socket.on('disconnect', () => setIsOnline(false));

//     return () => {
//       socket.off('receive_message', handleReceiveMessage);
//       socket.off('booking_status_changed', handleBookingStatusChange);
//       socket.emit('leave_chat', { bookingId });
//     };
//   }, [bookingId, user]);

//   const sendMessage = (e) => {
//     e.preventDefault();
//     if (input.trim() && user) {
//       socket.emit('send_message', {
//         bookingId,
//         message: input,
//         userId: user.id,
//         userRole: user.role,
//         senderName: user.name
//       });
//       setInput('');
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex flex-col h-full glass-card">
//         <div className="flex items-center justify-center h-full">
//           <div className="animate-pulse text-gray-400">Loading messages...</div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col h-full bg-white dark:bg-dark-light rounded-lg shadow-lg overflow-hidden">
//       {/* Header */}
//       <div className="bg-gradient-to-r from-primary to-primary/80 text-white px-4 md:px-6 py-3 md:py-4 flex justify-between items-center">
//         <div className="flex items-center space-x-3 flex-1">
//           <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
//             <span className="text-lg font-bold">{recipientName.charAt(0)}</span>
//           </div>
//           <div className="flex-1 min-w-0">
//             <h3 className="font-bold text-sm md:text-base truncate">{recipientName}</h3>
//             <p className="text-xs text-white/70">
//               {isOnline ? '🟢 Online' : '⚫ Offline'}
//             </p>
//           </div>
//         </div>
//         <div className="flex items-center space-x-2">
//           <button className="p-2 hover:bg-white/10 rounded-full transition">
//             <Phone size={18} />
//           </button>
//           <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition md:hidden">
//             <X size={18} />
//           </button>
//         </div>
//       </div>

//       {/* Messages Container */}
//       <div className="flex-1 p-3 md:p-6 overflow-y-auto space-y-3 md:space-y-4 bg-slate-50 dark:bg-dark/30">
//         {messages.length === 0 ? (
//           <div className="text-center text-slate-400 h-full flex items-center justify-center">
//             <div className="space-y-2">
//               <p className="text-sm">No messages yet</p>
//               <p className="text-xs">Start a conversation</p>
//             </div>
//           </div>
//         ) : (
//           <>
//             {messages.map((msg, idx) => (
//               <div
//                 key={idx}
//                 className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
//               >
//                 <div
//                   className={`max-w-xs md:max-w-md lg:max-w-lg rounded-2xl px-4 py-2 text-sm break-words ${
//                     msg.senderId === user?.id
//                       ? 'bg-primary text-white rounded-br-none'
//                       : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-bl-none text-slate-800 dark:text-slate-200'
//                   }`}
//                 >
//                   {msg.senderType !== user?.role && (
//                     <p className="text-xs font-semibold mb-1 opacity-70">{msg.senderName}</p>
//                   )}
//                   <p className="break-words">{msg.message}</p>
//                   <p
//                     className={`text-[10px] mt-1 text-right ${
//                       msg.senderId === user?.id
//                         ? 'text-white/70'
//                         : 'text-slate-400 dark:text-slate-500'
//                     }`}
//                   >
//                     {new Date(msg.timestamp || msg.created_at).toLocaleTimeString([], {
//                       hour: '2-digit',
//                       minute: '2-digit'
//                     })}
//                   </p>
//                 </div>
//               </div>
//             ))}
//             <div ref={messagesEndRef} />
//           </>
//         )}
//       </div>

//       {/* Input Form */}
//       <form
//         onSubmit={sendMessage}
//         className="p-3 md:p-4 bg-white dark:bg-dark-light border-t border-slate-200 dark:border-slate-700 flex gap-2 md:gap-3"
//       >
//         <input
//           type="text"
//           value={input}
//           onChange={(e) => setInput(e.target.value)}
//           placeholder="Type a message..."
//           className="flex-1 px-3 md:px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary/50 outline-none text-sm placeholder:text-slate-400"
//         />
//         <button
//           type="submit"
//           disabled={!input.trim()}
//           className="p-2 md:p-3 bg-primary hover:bg-primary/90 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-full transition duration-200 flex items-center justify-center"
//         >
//           <Send size={18} />
//         </button>
//       </form>
//     </div>
//   );
// };

// export default Chat;
        
