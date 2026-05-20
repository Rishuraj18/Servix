import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  ClipboardList, 
  PlusCircle, 
  MapPin, 
  ArrowRight, 
  Star, 
  AlertOctagon, 
  UserCheck, 
  Phone, 
  Mail, 
  CreditCard, 
  CheckCircle2, 
  XCircle,
  Truck,
  Briefcase
} from 'lucide-react';
import api from '../api/client';
import ChatWidget from '../components/ChatWidget';
import BookingCancellation from '../components/BookingCancellation';

const UserDashboard = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [bookings, setBookings] = useState([]);
  
  // Feedback Modal State
  const [selectedBookingForReview, setSelectedBookingForReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(null);
  const [comment, setComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  // Complaint Modal State
  const [selectedBookingForComplaint, setSelectedBookingForComplaint] = useState(null);
  const [complaintDesc, setComplaintDesc] = useState('');
  const [complaintLoading, setComplaintLoading] = useState(false);

  const [message, setMessage] = useState({ text: '', type: '' });
  const [selectedBookingForChat, setSelectedBookingForChat] = useState(null); // Changed from chatBookingIdObj
  const [selectedBookingForCancellation, setSelectedBookingForCancellation] = useState(null);

  const loadBookings = () => {
    api.get('/bookings')
      .then((res) => setBookings(res.data.data || []))
      .catch(() => setBookings([]));
  };

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'user') return;
    loadBookings();
  }, [isAuthenticated, user?.role]);

  const stats = useMemo(() => ({
    active: bookings.filter((booking) => !['completed', 'cancelled'].includes(booking.status)).length,
    completed: bookings.filter((booking) => booking.status === 'completed').length,
    addresses: new Set(bookings.map((booking) => booking.address).filter(Boolean)).size
  }), [bookings]);

  if (!isAuthenticated || user?.role !== 'user') {
    return <Navigate to="/login" />;
  }

  const handlePostReview = async (e) => {
    e.preventDefault();
    if (!selectedBookingForReview) return;
    setReviewLoading(true);
    try {
      await api.post(`/bookings/${selectedBookingForReview.id}/reviews`, {
        rating,
        comment
      });
      setMessage({ text: 'Thank you for your valuable feedback! Review submitted successfully.', type: 'success' });
      setSelectedBookingForReview(null);
      setComment('');
      setRating(5);
      loadBookings();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to submit review.', type: 'error' });
    } finally {
      setReviewLoading(false);
    }
  };

  const handlePostComplaint = async (e) => {
    e.preventDefault();
    if (!selectedBookingForComplaint) return;
    setComplaintLoading(true);
    try {
      await api.post(`/bookings/${selectedBookingForComplaint.id}/complaints`, {
        description: complaintDesc
      });
      setMessage({ text: 'Complaint registered successfully. Support team will contact you shortly.', type: 'success' });
      setSelectedBookingForComplaint(null);
      setComplaintDesc('');
      loadBookings();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to file complaint.', type: 'error' });
    } finally {
      setComplaintLoading(false);
    }
  };

  // Function to open chat for a specific booking
  const openChatForBooking = (bookingId) => {
    setSelectedBookingForChat(bookingId);
  };

  // Function to close chat
  const closeChat = () => {
    setSelectedBookingForChat(null);
  };

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case 'high':
        return 'bg-rose-500/10 text-rose-600 border border-rose-100 dark:border-rose-900/30';
      case 'medium':
        return 'bg-amber-50/60 text-amber-700 border border-amber-100 dark:border-amber-900/30';
      default:
        return 'bg-sky-50 text-sky-700 border border-sky-100 dark:border-sky-900/30';
    }
  };

  const statusSteps = [
    { key: 'pending', label: 'Pending', icon: Clock },
    { key: 'accepted', label: 'Accepted', icon: CheckCircle2 },
    { key: 'on_the_way', label: 'On The Way', icon: Truck },
    { key: 'working', label: 'Working', icon: Briefcase },
    { key: 'completed', label: 'Completed', icon: CheckCircle2 }
  ];

  return (
    <div className="py-4 space-y-6 max-w-6xl mx-auto relative">
      
      {/* Alert Messaging */}
      {message.text && (
        <div className={`p-4 rounded-xl text-sm border flex items-center justify-between ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage({ text: '', type: '' })} className="font-bold">Close</button>
        </div>
      )}

      {/* Premium Welcome Card Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-650 to-indigo-700 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-indigo-600/10">
        <div className="absolute top-[-30%] right-[-10%] w-[300px] h-[300px] rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[20%] w-[200px] h-[200px] rounded-full bg-indigo-400/10 blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-1">
            <span className="px-3 py-1 bg-white/12 text-blue-100 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/20">Customer Portal</span>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-3">Welcome, {user.name}</h1>
            <p className="text-blue-100/90 text-sm max-w-xl font-medium mt-1">Book services, pay online, track process timelines, and manage tasks.</p>
          </div>
          <Link to="/post-task" className="bg-white hover:bg-slate-50 text-indigo-700 px-6 py-3.5 flex items-center justify-center gap-2 rounded-2xl font-bold transition shadow-lg hover:scale-[1.02] active:scale-[0.98] w-full md:w-auto shrink-0 text-sm cursor-pointer">
            <PlusCircle size={18} />
            Post a service task
          </Link>
        </div>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Active Service Bookings', value: stats.active, icon: Clock, tone: 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400', border: 'border-blue-100/50' },
          { label: 'Completed Home Jobs', value: stats.completed, icon: ClipboardList, tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400', border: 'border-emerald-100/50' },
          { label: 'Registered Work Addresses', value: stats.addresses, icon: MapPin, tone: 'bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400', border: 'border-orange-100/50' },
        ].map(({ label, value, icon: Icon, tone, border }) => (
          <motion.div 
            key={label} 
            whileHover={{ y: -4, scale: 1.01 }} 
            className={`bg-white dark:bg-slate-900 border ${border} rounded-2xl p-5 shadow-sm shadow-slate-100/40 flex items-center justify-between`}
          >
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-405">{label}</p>
              <p className="text-3xl font-black mt-2 text-slate-800 dark:text-white">{value}</p>
            </div>
            <div className={`w-12 h-12 ${tone} rounded-2xl flex items-center justify-center shrink-0`}>
              <Icon size={22} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        
        {/* Bookings Tracker Ledger (Left 3 columns) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Your Service Timelines</h2>
              <Link to="/services" className="text-sm font-semibold text-primary inline-flex items-center gap-1">
                Browse services <ArrowRight size={15} />
              </Link>
            </div>

            {bookings.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <p className="font-medium">You have not posted any service requests yet.</p>
                <Link to="/services" className="text-primary font-semibold mt-2 inline-block">Book your first service now</Link>
              </div>
            ) : (
              <div className="space-y-6">
                {bookings.map((booking) => {
                  const currentStatusIndex = statusSteps.findIndex(step => step.key === booking.status);
                  const isCompleted = booking.status === 'completed';
                  const isCancelled = booking.status === 'cancelled';

                  return (
                    <div key={booking.id} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5 hover:shadow-md transition-all">
                      
                      {/* Booking Card Header */}
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-lg text-slate-950 dark:text-white">{booking.service_name || booking.category || 'Home Repair'}</h3>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getUrgencyBadge(booking.urgency_level)}`}>
                              {booking.urgency_level}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">Booking Token: <span className="font-semibold">{booking.service_token}</span></p>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-bold text-primary">Budget: ₹{booking.budget || '500'}</p>
                          <div className="flex items-center gap-1 justify-end text-xs text-slate-400 mt-0.5">
                            <CreditCard size={12} />
                            <span className="uppercase">{booking.payment_method}</span> · 
                            <span className={`capitalize font-semibold ${booking.payment_status === 'completed' ? 'text-emerald-500' : 'text-amber-500'}`}>{booking.payment_status}</span>
                          </div>
                        </div>
                      </div>

                      {/* Timeline step-by-step progress tracking */}
                      {!isCancelled && (
                        <div className="pt-2 space-y-4">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live Service Progress Tracker</p>
                          
                          {/* Desktop Timeline (sm:flex hidden) */}
                          <div className="hidden sm:flex relative justify-between pt-2">
                            <div className="absolute top-4 left-[10%] right-[10%] h-[2px] bg-slate-200 dark:bg-slate-800 -z-10" />
                            {currentStatusIndex >= 0 && (
                              <div 
                                className="absolute top-4 left-[10%] h-[2px] bg-primary transition-all duration-500 -z-10" 
                                style={{ width: `${(currentStatusIndex / (statusSteps.length - 1)) * 80}%` }}
                              />
                            )}

                            {statusSteps.map((step, idx) => {
                              const StepIcon = step.icon;
                              const isPassed = idx <= currentStatusIndex;
                              const isCurrent = idx === currentStatusIndex;
                              return (
                                <div key={step.key} className="flex flex-col items-center max-w-[70px] text-center">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all ${
                                    isPassed 
                                      ? 'bg-blue-600 text-white scale-105 shadow-md shadow-blue-500/20' 
                                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
                                  } ${isCurrent ? 'ring-4 ring-blue-500/20' : ''}`}>
                                    <StepIcon size={14} />
                                  </div>
                                  <span className={`text-[10px] mt-1.5 font-bold ${isPassed ? 'text-slate-800 dark:text-slate-250' : 'text-slate-400 dark:text-slate-650'}`}>{step.label}</span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Mobile Vertical Stepper */}
                          <div className="flex sm:hidden flex-col gap-3.5 pt-2 pl-6 relative">
                            <div className="absolute left-[9px] top-2 bottom-2 w-[1.5px] bg-slate-150 dark:bg-slate-800" />
                            {statusSteps.map((step, idx) => {
                              const StepIcon = step.icon;
                              const isPassed = idx <= currentStatusIndex;
                              const isCurrent = idx === currentStatusIndex;
                              return (
                                <div key={step.key} className="relative flex items-center gap-3">
                                  <div className={`absolute -left-[22px] w-[11px] h-[11px] rounded-full border-2 transition-all ${
                                    isPassed 
                                      ? 'bg-blue-600 border-blue-600 shadow-sm shadow-blue-500/20' 
                                      : 'bg-white border-slate-300 dark:bg-slate-900'
                                  } ${isCurrent ? 'ring-4 ring-blue-500/20 scale-110' : ''}`} />
                                  
                                  <div className="flex items-center gap-2">
                                    <StepIcon size={14} className={isPassed ? 'text-blue-600' : 'text-slate-400'} />
                                    <span className={`text-xs font-bold ${
                                      isCurrent 
                                        ? 'text-blue-600 font-extrabold' 
                                        : isPassed 
                                          ? 'text-slate-850 dark:text-slate-200' 
                                          : 'text-slate-400 dark:text-slate-655'
                                    }`}>{step.label}</span>
                                    {isCurrent && (
                                      <span className="text-[9px] px-1.5 py-0.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-md font-extrabold uppercase tracking-wide animate-pulse">Active Now</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {isCancelled && (
                        <div className="p-3 bg-rose-500/10 text-rose-455 border border-rose-500/20 rounded-xl flex items-center gap-2 text-xs">
                          <XCircle size={16} />
                          <span>This booking request was cancelled/rejected by Admin. For more information, please raise a support ticket.</span>
                        </div>
                      )}

                      {/* Detail specifications */}
                      <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-2 text-xs text-slate-655 dark:text-slate-400">
                        <p><span className="font-semibold text-slate-800 dark:text-slate-300">Desc:</span> {booking.description}</p>
                        <p><span className="font-semibold text-slate-800 dark:text-slate-300">Address:</span> {booking.address}</p>
                        <p><span className="font-semibold text-slate-800 dark:text-slate-300">Scheduled Date/Time:</span> {booking.scheduled_at ? new Date(booking.scheduled_at).toLocaleString() : 'Not Set'}</p>
                        {booking.contact_phone && (
                          <p><span className="font-semibold text-slate-800 dark:text-slate-300">Mobile Contact:</span> {booking.contact_phone}</p>
                        )}
                      </div>

                      {/* Assigned Offline Worker details card */}
                      {booking.worker_name && (
                        <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                          <div className="flex items-center gap-2 mb-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                            <UserCheck size={14} />
                            Assigned Offline Service Partner
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                            <p className="font-semibold text-slate-800 dark:text-white">{booking.worker_name}</p>
                            {booking.assigned_worker_phone && (
                              <p className="flex items-center gap-1.5"><Phone size={12} className="text-primary" /> {booking.assigned_worker_phone}</p>
                            )}
                            {booking.assigned_worker_email && (
                              <p className="flex items-center gap-1.5"><Mail size={12} className="text-indigo-400" /> {booking.assigned_worker_email}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Bottom actions */}
                      <div className="flex flex-col gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        {(isCompleted || isCancelled) ? (
                          <div className="flex justify-end gap-2 flex-wrap">
                            <button
                              onClick={() => setSelectedBookingForComplaint(booking)}
                              className="px-3.5 py-1.5 border border-rose-200 hover:border-rose-350 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-semibold rounded-lg transition cursor-pointer"
                            >
                              Raise Official Complaint
                            </button>
                            <button
                              type="button"
                              onClick={() => openChatForBooking(booking.id)} 
                              className="px-3.5 py-1.5 border border-indigo-200 hover:border-indigo-350 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-xs font-semibold rounded-lg transition cursor-pointer"
                            >
                              Chat about Issue
                            </button>
                            {isCompleted && (
                              <button
                                onClick={() => setSelectedBookingForReview(booking)}
                                className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition shadow-md shadow-amber-500/10 cursor-pointer"
                              >
                                Leave Feedback / Review
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center gap-2">
                              <div className="text-[10px] text-slate-500 italic flex items-center gap-1.5">
                                <Clock size={12} />
                                Active task in progress. Chat live for status updates.
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 flex-wrap">
                              <button
                                onClick={() => setSelectedBookingForCancellation(booking)}
                                className="px-3.5 py-1.5 border border-red-200 hover:border-red-350 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-semibold rounded-lg transition cursor-pointer"
                              >
                                Cancel Booking
                              </button>
                              <button
                                type="button"
                                onClick={() => openChatForBooking(booking.id)} 
                                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition shadow-md shadow-indigo-600/10 cursor-pointer"
                              >
                                Chat Live
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* User Account Sidebar Profile Card */}
        <div className="lg:col-span-2 glass-card p-6 h-fit">
          <h2 className="text-xl font-bold mb-4">Customer Details</h2>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between gap-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Name</span>
              <span className="font-semibold text-slate-850 dark:text-slate-100">{user.name}</span>
            </div>
            <div className="flex justify-between gap-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Email ID</span>
              <span className="font-semibold text-slate-850 dark:text-slate-100 truncate max-w-[160px]">{user.email}</span>
            </div>
            <div className="flex justify-between gap-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Registered Phone</span>
              <span className="font-semibold text-slate-850 dark:text-slate-100">{user.phone || 'Not added'}</span>
            </div>
            <div className="flex justify-between gap-4 py-3">
              <span className="text-slate-500">Status</span>
              <span className="font-semibold text-slate-850 dark:text-slate-100 capitalize">{user.status || 'Active'}</span>
            </div>
          </div>
          <Link to="/services" className="btn-ghost w-full px-4 py-3 mt-6">
            Explore Services Directory
          </Link>
        </div>

      </div>

      {/* FEEDBACK SUBMISSION MODAL */}
      <AnimatePresence>
        {selectedBookingForReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBookingForReview(null)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs cursor-pointer"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden relative z-10 shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/60 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-lg text-slate-800">Leave Job Feedback</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Booking: {selectedBookingForReview.service_name}</p>
                </div>
                <button onClick={() => setSelectedBookingForReview(null)} className="text-slate-400 hover:text-slate-700 font-bold text-xl cursor-pointer">×</button>
              </div>

              <form onSubmit={handlePostReview} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block text-center">Service Rating</label>
                  
                  <div className="flex justify-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="text-amber-400 hover:scale-110 transition p-1 cursor-pointer"
                      >
                        <Star 
                          size={32} 
                          fill={star <= (hoverRating || rating) ? 'currentColor' : 'none'} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Write Your Feedback / Comments</label>
                  <textarea
                    rows="3"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us about the agent's work, professionalism, or cleanup..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl p-3 text-sm focus:outline-none focus:border-primary transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={reviewLoading}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-450 hover:to-orange-450 text-white rounded-xl text-sm font-bold uppercase tracking-wider transition shadow-md shadow-amber-500/10 disabled:opacity-50 cursor-pointer"
                >
                  {reviewLoading ? 'Submitting Review...' : 'Submit Rating'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* COMPLAINT SUBMISSION MODAL */}
      <AnimatePresence>
        {selectedBookingForComplaint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBookingForComplaint(null)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs cursor-pointer"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden relative z-10 shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/60 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-lg flex items-center gap-1.5 text-rose-600"><AlertOctagon size={18} /> Lodge Complaint</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Booking token: {selectedBookingForComplaint.service_token}</p>
                </div>
                <button onClick={() => setSelectedBookingForComplaint(null)} className="text-slate-400 hover:text-slate-700 font-bold text-xl cursor-pointer">×</button>
              </div>

              <form onSubmit={handlePostComplaint} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Describe the Issue</label>
                  <textarea
                    rows="4"
                    required
                    value={complaintDesc}
                    onChange={(e) => setComplaintDesc(e.target.value)}
                    placeholder="Tell us what went wrong (e.g. agent did not show up, damage caused, overcharging)..."
                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-855 rounded-xl p-3 text-sm focus:outline-none focus:border-primary transition"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Our support managers will audit this ticket immediately and respond within 24 hours.</p>
                </div>

                <button
                  type="submit"
                  disabled={complaintLoading}
                  className="w-full py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white rounded-xl text-sm font-bold uppercase tracking-wider transition shadow-md shadow-rose-600/10 disabled:opacity-50 cursor-pointer"
                >
                  {complaintLoading ? 'LODGING TICKET...' : 'FILE TICKET'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLOATING CHAT WIDGET WITH SOCKET.IO */}
      {/* This will always be visible as a floating button */}
      <ChatWidget 
        bookingsList={bookings} 
        isAdmin={false} 
        defaultBookingId={selectedBookingForChat}
        triggerOpen={selectedBookingForChat}
      />

      {/* BOOKING CANCELLATION MODAL */}
      <AnimatePresence>
        {selectedBookingForCancellation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBookingForCancellation(null)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs cursor-pointer"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md relative z-10"
            >
              <BookingCancellation 
                bookingId={selectedBookingForCancellation.id}
                bookingStatus={selectedBookingForCancellation.status}
                onSuccess={() => {
                  setMessage({ 
                    text: 'Booking cancelled successfully.', 
                    type: 'success' 
                  });
                  setSelectedBookingForCancellation(null);
                  loadBookings();
                }}
                onCancel={() => setSelectedBookingForCancellation(null)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default UserDashboard;