import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, User, Shield, Info, Phone, History, Loader2 } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../api/client';

let socket = null;

const ChatWidget = ({ defaultBookingId = null, bookingsList = [], isAdmin = false, triggerOpen = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeBookings, setActiveBookings] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState(defaultBookingId);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isConnected, setIsConnected] = useState(true); // Changed to true by default
  const [showHistory, setShowHistory] = useState(false);
  const [oldMessages, setOldMessages] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const { user } = useSelector((state) => state.auth);
  
  const chatBottomRef = useRef(null);
  const socketInitialized = useRef(false);
  const inputRef = useRef(null);

  // Initialize socket connection (optional - for real-time features)
  useEffect(() => {
    // Only initialize socket if not already initialized and user exists
    if (!socket && user && !socketInitialized.current) {
      const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
      
      try {
        socket = io(socketUrl, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          autoConnect: true
        });
        
        socket.on('connect', () => {
          console.log('Socket connected successfully');
          setIsConnected(true);
        });
        
        socket.on('disconnect', () => {
          console.log('Socket disconnected');
          setIsConnected(false);
        });
        
        socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          // Don't set isConnected to false here - REST API still works
          console.log('Socket connection failed but REST API is still available');
        });

        socket.on('message_error', (error) => {
          console.error('Message error:', error);
        });
        
        socketInitialized.current = true;
      } catch (error) {
        console.error('Failed to initialize socket:', error);
        // Keep isConnected as true because REST API works
      }
    }

    return () => {
      if (socket && socketInitialized.current) {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('connect_error');
        socket.off('message_error');
      }
    };
  }, [user]);

  // Handle socket events for messages (only if socket exists and is connected)
  useEffect(() => {
    if (!socket || !selectedBookingId || !isOpen) return;

    // Only join room if socket is connected
    if (socket.connected) {
      socket.emit('join_chat', {
        bookingId: selectedBookingId,
        userId: user?.id,
        userRole: user?.role
      });
    }

    const handleReceiveMessage = (message) => {
      console.log('New message received from socket:', message);
      setMessages((prev) => {
        const exists = prev.some(m => m.id === message.id);
        if (!exists) {
          return [...prev, {
            id: message.id,
            message: message.message,
            sender_id: message.senderId,
            sender_type: message.senderType,
            sender_name: message.senderName,
            created_at: message.timestamp
          }];
        }
        return prev;
      });
    };

    const handleBookingStatusChange = (data) => {
      console.log('Booking status changed:', data);
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('booking_status_changed', handleBookingStatusChange);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('booking_status_changed', handleBookingStatusChange);
      if (socket && socket.connected && selectedBookingId) {
        socket.emit('leave_chat', { bookingId: selectedBookingId });
      }
    };
  }, [selectedBookingId, isOpen, user]);

  // Sync incoming bookings
  useEffect(() => {
    let list = [];
    if (bookingsList && bookingsList.length > 0) {
      list = [...bookingsList];
    }

    let filtered = list.filter(b => isAdmin ? true : !['completed', 'cancelled'].includes(b.status));

    if (defaultBookingId) {
      const exists = filtered.some(b => Number(b.id) === Number(defaultBookingId));
      if (!exists) {
        const found = list.find(b => Number(b.id) === Number(defaultBookingId));
        if (found) {
          filtered.push(found);
        }
      }
    }

    setActiveBookings(filtered);
    if (defaultBookingId) {
      setSelectedBookingId(Number(defaultBookingId));
    } else if (filtered.length > 0 && !selectedBookingId) {
      setSelectedBookingId(filtered[0].id);
    }
  }, [bookingsList, defaultBookingId, isAdmin]);

  // Handle default selection updates
  useEffect(() => {
    if (defaultBookingId) {
      setSelectedBookingId(Number(defaultBookingId));
    }
  }, [defaultBookingId]);

  // Handle trigger open updates
  useEffect(() => {
    if (triggerOpen) {
      setIsOpen(true);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 300);
    }
  }, [triggerOpen]);

  // Load messages from API (always works via REST)
  const loadMessages = useCallback(async (bookingId, loadAllHistory = false) => {
    if (!bookingId) return;
    
    if (loadAllHistory) {
      setLoadingHistory(true);
    } else {
      setLoadingMessages(true);
    }
    
    try {
      const res = await api.get(`/bookings/${bookingId}/messages`);
      
      if (res.data.success) {
        const allMessages = res.data.messages || [];
        
        if (loadAllHistory) {
          setOldMessages(allMessages);
        } else {
          const recentMessages = allMessages.slice(-50);
          setMessages(recentMessages);
        }
      }
    } catch (err) {
      console.error('Error fetching chat messages:', err);
    } finally {
      if (loadAllHistory) {
        setLoadingHistory(false);
      } else {
        setLoadingMessages(false);
      }
    }
  }, []);

  // Load messages when chat opens or booking changes
  useEffect(() => {
    if (isOpen && selectedBookingId) {
      loadMessages(selectedBookingId, false);
    }
  }, [isOpen, selectedBookingId, loadMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatBottomRef.current) {
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages, oldMessages]);

  // Send message via REST API (always works)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    if (!selectedBookingId) return;
    if (!user) return;

    const messageText = inputValue.trim();
    setInputValue('');
    setSendingMessage(true);

    try {
      const res = await api.post(`/bookings/${selectedBookingId}/messages`, {
        message: messageText
      });
      
      if (res.data.success && res.data.message) {
        const newMessage = res.data.message;
        
        const messageToAdd = {
          id: newMessage.id,
          message: newMessage.message,
          sender_id: newMessage.sender_id || user.id,
          sender_type: newMessage.sender_type || (user.role === 'admin' ? 'admin' : 'user'),
          sender_name: user.role === 'admin' ? `Admin (${user.name})` : user.name,
          created_at: newMessage.created_at || new Date().toISOString()
        };
        
        setMessages(prev => [...prev, messageToAdd]);
        
        // Try to send via socket if connected (for real-time updates)
        if (socket && socket.connected) {
          socket.emit('send_message', {
            bookingId: selectedBookingId,
            message: messageText,
            userId: user.id,
            userRole: user.role,
            senderName: user.role === 'admin' ? `Admin (${user.name})` : user.name
          });
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      // Show error to user
      alert('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  // Handle booking change
  const handleBookingChange = (bookingId) => {
    setSelectedBookingId(Number(bookingId));
    setShowHistory(false);
    setOldMessages([]);
    setMessages([]);
  };

  // Toggle chat history
  const toggleHistory = async () => {
    if (!showHistory && selectedBookingId) {
      await loadMessages(selectedBookingId, true);
    }
    setShowHistory(!showHistory);
  };

  const currentBooking = activeBookings.find(b => b.id === Number(selectedBookingId));

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Today at ${formatTime(timestamp)}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${formatTime(timestamp)}`;
    } else {
      return date.toLocaleDateString() + ' at ' + formatTime(timestamp);
    }
  };

  // Hide widget completely if there are no active service requests to chat about
  if (activeBookings.length === 0 && !defaultBookingId && !isAdmin) return null;

  const displayMessages = showHistory ? oldMessages : messages;

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 300);
          }
        }}
        className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/30 transition relative cursor-pointer"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        {!isOpen && activeBookings.length > 0 && (
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-950 animate-pulse" />
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-24 right-4 left-4 sm:absolute sm:bottom-16 sm:right-0 sm:left-auto w-[calc(100vw-2rem)] sm:w-[450px] h-[600px] rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <MessageSquare size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">
                    {currentBooking?.service_name || currentBooking?.category || 'Live Support Chat'}
                  </h4>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${socket?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                    {socket?.connected ? 'Real-time Connected' : 'Chat Active'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={toggleHistory}
                  className={`p-1.5 rounded-lg transition ${showHistory ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
                  title={showHistory ? "Back to live chat" : "View chat history"}
                >
                  <History size={16} />
                </button>
                <button 
                  onClick={() => {
                    setIsOpen(false);
                    setShowHistory(false);
                  }}
                  className="p-1.5 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {activeBookings.length > 1 && !showHistory && (
              <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Select Task:</span>
                <select
                  value={selectedBookingId || ''}
                  onChange={(e) => handleBookingChange(e.target.value)}
                  className="bg-slate-900 text-xs font-semibold text-white border border-slate-800 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {activeBookings.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.service_name || b.category} ({b.service_token})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {showHistory && (
              <div className="px-4 py-2 bg-indigo-500/10 border-b border-indigo-500/20 flex items-center justify-between">
                <span className="text-[10px] text-indigo-400 font-semibold flex items-center gap-1">
                  <History size={12} />
                  Full Chat History ({oldMessages.length} messages)
                </span>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  Back to Live Chat
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-950/20">
              {loadingMessages || loadingHistory ? (
                <div className="text-center text-slate-500 py-10 text-xs">
                  <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                  <div>Loading messages...</div>
                </div>
              ) : (
                <>
                  {currentBooking && !showHistory && (
                    <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl flex gap-2 text-[11px] text-slate-400">
                      <Info size={14} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-white block">Booking Token: {currentBooking.service_token}</span>
                        Chat live here with {isAdmin ? `customer ${currentBooking.user_name}` : 'our Admin support team'} regarding the job details.
                      </div>
                    </div>
                  )}

                  {displayMessages.length === 0 ? (
                    <div className="text-center text-slate-500 py-10 text-xs">
                      <p className="font-semibold">No messages yet.</p>
                      <p className="mt-0.5">Type your query below to start instant chat.</p>
                    </div>
                  ) : (
                    displayMessages.map((msg, idx) => {
                      const isAdminMsg = msg.sender_type === 'admin';
                      const isCurrentUserAdmin = user?.role === 'admin';
                      const isCurrentUser = msg.sender_id === user?.id;
                      
                      // Set sender display name
                      let displayName = msg.sender_name || (isAdminMsg ? 'Support Admin' : 'Customer');
                      if (isAdminMsg && displayName === 'Support Admin') {
                        displayName = 'Admin';
                      }
                      
                      const timestamp = msg.created_at;
                      
                      // Determine alignment
                      let alignment = '';
                      let messageStyle = '';
                      
                      if (isAdmin) {
                        // ADMIN DASHBOARD
                        if (isAdminMsg) {
                          alignment = 'justify-end'; // Admin message - RIGHT
                          messageStyle = 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-tr-none shadow-md shadow-indigo-600/10';
                        } else {
                          alignment = 'justify-start'; // User message - LEFT
                          messageStyle = 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none';
                        }
                      } else {
                        // USER DASHBOARD
                        if (isAdminMsg) {
                          alignment = 'justify-start'; // Admin message - LEFT
                          messageStyle = 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none';
                        } else {
                          alignment = 'justify-end'; // User message - RIGHT
                          messageStyle = 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-tr-none shadow-md shadow-indigo-600/10';
                        }
                      }
                      
                      return (
                        <div 
                          key={msg.id || idx} 
                          className={`flex w-full ${alignment === 'justify-end' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex flex-col max-w-[75%] ${alignment === 'justify-end' ? 'items-end' : 'items-start'}`}>
                            <span className="text-[9px] text-slate-500 mb-0.5 px-1 font-semibold flex items-center gap-1 uppercase tracking-wider">
                              {isAdminMsg ? <Shield size={8} className="text-indigo-400" /> : <User size={8} className="text-slate-400" />}
                              
                              {/* Display Name Logic */}
                              {isAdminMsg ? (
                                // If message is from admin
                                <span>Admin</span>
                              ) : (
                                // If message is from user
                                <span>{displayName === 'Customer' ? 'Customer' : displayName}</span>
                              )}
                              
                              {showHistory && timestamp && (
                                <span className="text-[8px] text-slate-600 ml-1">
                                  {formatDate(timestamp)}
                                </span>
                              )}
                            </span>
                            <div className={`rounded-2xl px-4 py-2.5 text-xs ${messageStyle}`}>
                              <p className="leading-relaxed break-words whitespace-pre-wrap">{msg.message}</p>
                              {!showHistory && timestamp && (
                                <span className={`text-[8px] block text-right mt-1 ${alignment === 'justify-end' ? 'text-indigo-200' : 'text-slate-500'}`}>
                                  {formatTime(timestamp)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              )}
              <div ref={chatBottomRef} />
            </div>

            {!showHistory && (
              <form 
                onSubmit={handleSendMessage}
                className="p-3.5 bg-slate-900/80 border-t border-slate-800 flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
                  disabled={sendingMessage}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || sendingMessage}
                  className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white flex items-center justify-center transition shadow shadow-indigo-600/20"
                >
                  {sendingMessage ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} className="ml-[-1px]" />
                  )}
                </button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatWidget;