/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { logout } from "../features/authSlice";
import { 
  Users, 
  IndianRupee, 
  Settings, 
  CheckCircle, 
  MapPin, 
  Phone, 
  UserCheck,
  ChevronRight,
  TrendingUp,
  FileText,
  LogOut,
  X,
  Menu,
  Shield,
  Layers,
  Wrench,
  Star,
  AlertTriangle,
  CreditCard,
  CheckSquare,
  Image as LucideImageIcon,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Loader2,
  Check,
  RefreshCw
} from 'lucide-react';
import api from '../api/client';
import ChatWidget from '../components/ChatWidget';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Custom API Data states
  const [complaints, setComplaints] = useState([]);
  const [reviews, setReviews] = useState([]);
  
  // Issue Editor Drawer State
  const [editingBooking, setEditingBooking] = useState(null);
  const [assignName, setAssignName] = useState('');
  const [assignPhone, setAssignPhone] = useState('');
  const [assignEmail, setAssignEmail] = useState('');
  const [updateStatus, setUpdateStatus] = useState('');
  const [updatePaymentStatus, setUpdatePaymentStatus] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Lightbox State
  const [previewImage, setPreviewImage] = useState(null);

  // Chat Widget integration states
  const [chatBookingIdObj, setChatBookingIdObj] = useState(null);

  // Complaint resolution state
  const [resolvingComplaint, setResolvingComplaint] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionStatus, setResolutionStatus] = useState('resolved');

  // Mobile table view states
  const [expandedRows, setExpandedRows] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
const [toast, setToast] = useState(null);
  const getBackendUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const base = api.defaults.baseURL || 'http://localhost:5000/api';
    const root = base.replace(/\/api$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${root}${cleanPath}`;
  };

  const loadDashboard = () => {
    setLoading(true);
    api.get('/admin/dashboard')
      .then((res) => {
        setDashboard(res.data.data);
        setLoading(false);
      })
      .catch(() => {
        setDashboard(null);
        setLoading(false);
      });
  };

  const loadComplaints = () => {
    api.get('/bookings/admin/complaints')
      .then((res) => setComplaints(res.data.data || []))
      .catch(() => setComplaints([]));
  };

  const loadReviews = () => {
    api.get('/bookings/admin/reviews')
      .then((res) => setReviews(res.data.data || []))
      .catch(() => setReviews([]));
  };

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') return;
    loadDashboard();
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    if (activeTab === 'complaints') {
      loadComplaints();
    } else if (activeTab === 'reviews') {
      loadReviews();
    }
  }, [activeTab]);

const handleUpdateBooking = async (e) => {
  e.preventDefault();
  if (!editingBooking) return;
  
  setActionLoading(true);
  
  try {
    await api.patch(`/bookings/${editingBooking.id}/status`, {
      status: updateStatus,
      assigned_worker: assignName,
      assigned_worker_phone: assignPhone,
      assigned_worker_email: assignEmail,
      payment_status: updatePaymentStatus,
      notes: `Updated by Admin: Assigned worker details updated.`
    });
    
    setToast({ type: 'success', message: '✓ Booking updated successfully!' });
    setTimeout(() => setToast(null), 3000);
    
    setEditingBooking(null);
    setAssignName('');
    setAssignPhone('');
    setAssignEmail('');
    setUpdateStatus('');
    setUpdatePaymentStatus('');
    
    await Promise.all([loadDashboard(), loadComplaints(), loadReviews()]);
    
  } catch (err) {
    setToast({ type: 'error', message: '✗ Failed to update booking' });
    setTimeout(() => setToast(null), 3000);
  } finally {
    setActionLoading(false);
  }
};

  // Fixed complaint resolution function
  const handleResolveComplaint = async (complaint) => {
    setResolvingComplaint(complaint);
    setResolutionNotes('');
    setResolutionStatus('resolved');
  };

  const submitComplaintResolution = async () => {
    if (!resolvingComplaint) return;
    
    setActionLoading(true);
    try {
      // Update complaint status via API
      const response = await api.patch(`/complaints/${resolvingComplaint.id}/resolve`, {
        status: resolutionStatus,
        resolution_notes: resolutionNotes
      });
      
      if (response.data.success) {
        // Refresh complaints list
        await loadComplaints();
        // Close modal
        setResolvingComplaint(null);
        setResolutionNotes('');
      } else {
        alert('Failed to resolve complaint. Please try again.');
      }
    } catch (err) {
      console.error('Error resolving complaint:', err);
      alert(err.response?.data?.message || 'Failed to resolve complaint. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleRowExpand = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/login" />;
  }

  const stats = dashboard?.stats || {};
  const recentBookings = dashboard?.recentBookings || [];

  // Filter bookings based on search and status
  const filteredBookings = recentBookings.filter(booking => {
    const matchesSearch = searchTerm === '' || 
      booking.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.service_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.service_token?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || booking.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const statCards = [
    { 
      label: 'Registered Customers', 
      value: stats.users || 0, 
      icon: Users, 
      gradient: 'from-blue-500/5 to-transparent',
      border: 'border-blue-100',
      iconTone: 'bg-blue-50 text-blue-650' 
    },
    { 
      label: 'Total Job Tickets', 
      value: stats.bookings || 0, 
      icon: FileText, 
      gradient: 'from-amber-500/5 to-transparent',
      border: 'border-amber-100',
      iconTone: 'bg-amber-50 text-amber-655' 
    },
    { 
      label: 'Completed Service Jobs', 
      value: stats.completedBookings || 0, 
      icon: CheckCircle, 
      gradient: 'from-emerald-500/5 to-transparent',
      border: 'border-emerald-100',
      iconTone: 'bg-emerald-50 text-emerald-655' 
    },
    { 
      label: 'Total Platform Revenue', 
      value: `₹${stats.revenue || 0}`, 
      icon: IndianRupee, 
      gradient: 'from-violet-500/5 to-transparent',
      border: 'border-violet-100',
      iconTone: 'bg-violet-50 text-violet-655' 
    },
  ];

  const sidebarItems = [
    { id: 'overview', label: 'Executive Overview', icon: Layers, mobileLabel: 'Overview' },
    { id: 'issues', label: 'User Issues & Tasks', icon: Wrench, mobileLabel: 'Issues' },
    { id: 'ledgers', label: 'Transaction Ledgers', icon: CreditCard, mobileLabel: 'Ledgers' },
    { id: 'complaints', label: 'Complaints Center', icon: AlertTriangle, mobileLabel: 'Complaints' },
    { id: 'reviews', label: 'Client Feedback', icon: Star, mobileLabel: 'Reviews' },
    { id: 'settings', label: 'Core Prefs', icon: Settings, mobileLabel: 'Settings' },
  ];

  const parseImages = (jsonStr) => {
    try {
      if (!jsonStr) return [];
      const parsed = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case 'high':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      default:
        return 'bg-sky-50 text-sky-700 border border-sky-200';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'cancelled':
        return 'bg-slate-100 text-slate-700 border border-slate-200';
      case 'pending':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
      default:
        return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
    }
  };

  const getComplaintStatusBadge = (status) => {
    switch (status) {
      case 'resolved':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'in_progress':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'closed':
        return 'bg-slate-100 text-slate-700 border border-slate-200';
      default:
        return 'bg-rose-50 text-rose-700 border border-rose-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 text-slate-800 flex flex-col md:flex-row relative overflow-hidden font-sans">
      
      {/* Background Blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-500/5 blur-[120px] pointer-events-none" />

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="flex items-center justify-between p-4">
          <Link to="/" className="flex items-center gap-2 hover:opacity-85 transition">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white shadow-lg">S</div>
            <span className="text-lg font-extrabold  text-gradient">SERVIX</span>
          </Link>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-650 hover:text-slate-900 transition rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-72 bg-white shadow-2xl flex flex-col md:hidden"
            >
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center font-bold text-white shadow-xl">S</div>
                    <div>
                      <span className="text-xl font-extrabold text-gradient">SERVIX</span>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-600">Control Tower</p>
                    </div>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                    <X size={20} />
                  </button>
                </div>
              </div>
              <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all relative group cursor-pointer ${
                        isActive 
                          ? 'text-indigo-600 bg-indigo-50 shadow-sm border border-indigo-100' 
                          : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon size={18} />
                      {item.mobileLabel || item.label}
                    </button>
                  );
                })}
              </nav>
              <div className="p-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700">
                      {user?.name?.[0]?.toUpperCase() || 'A'}
                    </div>
                    <div className="max-w-[140px]">
                      <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
                      <p className="text-[10px] text-slate-500 truncate capitalize">{user?.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      dispatch(logout());
                      window.location.href = "/login";
                    }}
                    className="p-2 text-slate-500 hover:text-rose-600 transition rounded-lg hover:bg-rose-50"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 lg:w-72 bg-white/95 backdrop-blur-xl border-r border-slate-200 p-6 flex-col justify-between sticky top-0 h-screen">
        <div className="space-y-8">
          <Link to="/" className="flex items-center gap-3 hover:opacity-85 transition">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center font-bold text-white shadow-xl shadow-indigo-500/10">S</div>
            <div>
              <span className="text-xl font-extrabold text-gradient">SERVIX</span>
              <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-600/85">Control Tower</p>
            </div>
          </Link>

          <nav className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-3">Management</p>
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all relative group cursor-pointer ${
                    isActive 
                      ? 'text-indigo-600 bg-indigo-50 shadow-sm border border-indigo-100/50' 
                      : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50/50'
                  }`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="sidebarActiveBg"
                      className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-indigo-100/40 rounded-xl border border-indigo-100/60 -z-10"
                    />
                  )}
                  <Icon size={18} className={isActive ? 'text-indigo-650' : 'text-slate-400 group-hover:text-indigo-650'} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="max-w-[120px]">
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-500 truncate capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={() => {
              dispatch(logout());
              window.location.href = "/login";
            }}
            className="p-2 text-slate-500 hover:text-rose-600 transition rounded-lg hover:bg-rose-50 cursor-pointer"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 h-screen overflow-y-auto p-4 md:p-8 pt-20 md:pt-8 relative z-20">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 bg-clip-text text-transparent">
              {activeTab === 'overview' && 'Executive Overview'}
              {activeTab === 'issues' && 'Issue Resolution Center'}
              {activeTab === 'ledgers' && 'Transactions & Revenue Ledgers'}
              {activeTab === 'complaints' && 'Complaints Manager'}
              {activeTab === 'reviews' && 'Customer Review Grid'}
              {activeTab === 'settings' && 'System Preferences'}
            </h1>
            <p className="text-xs md:text-sm text-slate-550 mt-1">
              {activeTab === 'overview' && 'Real-time performance index and global platform status metrics.'}
              {activeTab === 'issues' && 'Address user-submitted complaints, assign agents, and monitor tasks.'}
              {activeTab === 'ledgers' && 'Detailed invoice log of Cash on Delivery and online payment receipts.'}
              {activeTab === 'complaints' && 'Evaluate user complaints, audit feedback, and track service errors.'}
              {activeTab === 'reviews' && 'Ratings and written feedback left by clients for completed jobs.'}
              {activeTab === 'settings' && 'Manage core API parameters and credentials.'}
            </p>
          </div>

          <button 
            onClick={() => {
              loadDashboard();
              loadComplaints();
              loadReviews();
            }}
            className="w-full md:w-auto px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-650 hover:text-indigo-650 bg-white border border-slate-200 hover:border-indigo-100 rounded-xl transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
          >
            <RefreshCw size={14} />
            REFRESH METRICS
          </button>
        </div>

        {loading ? (
          <div className="h-[60vh] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6 md:space-y-8"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {statCards.map((card, i) => {
                    const Icon = card.icon;
                    return (
                      <motion.div 
                        key={card.label} 
                        whileHover={{ y: -4, scale: 1.01 }}
                        className="relative overflow-hidden bg-white rounded-2xl p-4 md:p-6 border border-slate-200 shadow-sm"
                      >
                        <div className={`absolute inset-0 bg-gradient-to-b ${card.gradient} pointer-events-none`} />
                        <div className="flex items-center justify-between mb-3 md:mb-4 relative z-10">
                          <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-slate-500">{card.label}</span>
                          <div className={`w-8 h-8 md:w-9 md:h-9 ${card.iconTone} rounded-xl flex items-center justify-center`}>
                            <Icon size={16} className="md:w-[18px] md:h-[18px]" />
                          </div>
                        </div>
                        <div className="relative z-10">
                          <p className="text-2xl md:text-3xl font-extrabold text-slate-900">{card.value}</p>
                          {i === 3 && <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-1"><TrendingUp size={10} /> +12%</span>}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Recent Bookings and Summary */}
                <div className="grid lg:grid-cols-5 gap-6">
                  <div className="lg:col-span-3 bg-white rounded-2xl p-4 md:p-6 border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4 md:mb-6 flex-wrap gap-2">
                      <div>
                        <h3 className="text-base md:text-lg font-bold text-slate-800">Recent Service Requests</h3>
                        <p className="text-xs text-slate-400">Immediate actions recommended on pending requests.</p>
                      </div>
                      <button 
                        onClick={() => setActiveTab('issues')}
                        className="text-xs font-semibold text-indigo-650 hover:text-indigo-500 flex items-center gap-1 transition cursor-pointer"
                      >
                        Manage All Tasks <ChevronRight size={14} />
                      </button>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {recentBookings.slice(0, 5).map((booking) => (
                       <div
  key={booking.id}
  className="py-4 flex items-start justify-between gap-3"
>
  
  {/* Left Side */}
  <div className="min-w-0 flex-1 overflow-hidden">

    <p
      className="
        font-semibold sm:font-bold
        text-sm sm:text-[15px]
        text-slate-800
        truncate
      "
    >
      {booking.service_name ||
        booking.category ||
        'Home Repair'}
    </p>

    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
      
      <p className="text-[11px] sm:text-sm text-slate-500 truncate">
        Client:{' '}
        <span className="font-semibold text-slate-700">
          {booking.user_name}
        </span>
      </p>

      <span className="text-slate-300 hidden sm:block">•</span>

      <p className="text-[11px] sm:text-sm text-slate-500">
        Status:{' '}
        <span className="capitalize font-medium text-slate-700">
          {booking.status}
        </span>
      </p>
    </div>
  </div>

  {/* Right Side */}
  <div className="flex items-center gap-2 shrink-0">

    {/* Badge */}
    <span
      className={`
        px-2.5 py-1
        rounded-full
        text-[9px] xs:text-[10px]
        font-bold uppercase tracking-wide
        whitespace-nowrap
        max-w-[80px]
        truncate
        text-center
        ${getUrgencyBadge(booking.urgency_level)}
      `}
    >
      {booking.urgency_level || 'medium'}
    </span>

    {/* Settings Button */}
    <button
      onClick={() => {
        setEditingBooking(booking);
        setAssignName(booking.worker_name || '');
        setAssignPhone(booking.assigned_worker_phone || '');
        setAssignEmail(booking.assigned_worker_email || '');
        setUpdateStatus(booking.status);
        setUpdatePaymentStatus(booking.payment_status);
      }}
      className="
        flex items-center justify-center
        h-8 w-8
        rounded-xl
        border border-slate-200
        bg-slate-50
        hover:bg-slate-100
        hover:border-slate-300
        text-slate-600 hover:text-slate-900
        transition
        shrink-0
      "
    >
      <Users size={14} />
    </button>
  </div>
</div>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-2 bg-white rounded-2xl p-4 md:p-6 border border-slate-200 shadow-sm">
                    <h3 className="text-base md:text-lg font-bold text-slate-800 mb-1">Operational Summary</h3>
                    <p className="text-xs text-slate-400 mb-4 md:mb-6">Aggregated service KPIs.</p>

                    <div className="space-y-4">
                      {[
                        { label: 'Issue Resolution Speed', pct: '94%', color: 'from-emerald-500 to-teal-500' },
                        { label: 'Customer Satisfaction Score', pct: '4.8 / 5', color: 'from-indigo-500 to-violet-500' },
                        { label: 'Cloud Gateway Status', pct: 'Active', color: 'from-sky-500 to-blue-500' },
                      ].map((stat) => (
                        <div key={stat.label} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-500">{stat.label}</span>
                            <span className="text-slate-800">{stat.pct}</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full bg-gradient-to-r ${stat.color} rounded-full`} style={{ width: '85%' }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 md:pt-6 border-t border-slate-100 mt-4 md:mt-6 text-center text-xs text-slate-550 flex items-center justify-center gap-1.5">
                      <Shield size={14} className="text-indigo-600" />
                      Platform Security Active
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ISSUES TAB - Fully Responsive */}
            {activeTab === 'issues' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-4 md:space-y-6"
              >
                {/* Search and Filter Bar */}
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text"
                        placeholder="Search by customer, service, or token..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-slate-50"
                      />
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="w-full sm:w-auto px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Filter size={16} />
                        Filter
                        {filterStatus !== 'all' && (
                          <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                        )}
                      </button>
                      {showFilters && (
                        <div className="absolute top-full right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-10 min-w-[150px]">
                          {['all', 'pending', 'accepted', 'on_the_way', 'working', 'completed', 'cancelled'].map(status => (
                            <button
                              key={status}
                              onClick={() => {
                                setFilterStatus(status);
                                setShowFilters(false);
                              }}
                              className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 first:rounded-t-xl last:rounded-b-xl ${
                                filterStatus === status ? 'text-indigo-600 font-semibold bg-indigo-50' : 'text-slate-600'
                              }`}
                            >
                              {status === 'all' ? 'All Status' : status.replace('_', ' ').toUpperCase()}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-slate-150 bg-slate-50/50">
                    <h3 className="text-lg font-bold text-slate-800">Platform Job Registry</h3>
                    <p className="text-xs text-slate-400 mt-1">Manage every requested task, update tracking steps, and record offline worker assignments.</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-550 font-bold bg-slate-50 text-xs tracking-wider uppercase">
                          <th className="p-4">Customer Details</th>
                          <th className="p-4">Service Details</th>
                          <th className="p-4">Problem Description</th>
                          <th className="p-4">Urgency & Payment</th>
                          <th className="p-4">Assigned Agent Log</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredBookings.map((booking) => {
                          const images = parseImages(booking.issue_images);
                          return (
                            <tr key={booking.id} className="hover:bg-slate-50/50 transition">
                              <td className="p-4">
                                <p className="font-bold text-slate-800">{booking.user_name}</p>
                                <div className="space-y-0.5 mt-1.5 text-xs text-slate-500">
                                  <p className="flex items-center gap-1.5"><Phone size={12} className="text-indigo-600" /> {booking.contact_phone || booking.user_phone}</p>
                                  <p className="flex items-start gap-1.5 max-w-[200px] mt-1"><MapPin size={12} className="text-amber-600 mt-0.5 flex-shrink-0" /> <span className="truncate">{booking.address}</span></p>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className="font-semibold text-slate-700">{booking.service_name || booking.category}</span>
                                <p className="text-xs text-slate-400 mt-0.5 capitalize">{booking.category || 'Service'}</p>
                              </td>
                              <td className="p-4 max-w-[280px]">
                                <p className="text-slate-650 line-clamp-2 leading-relaxed">{booking.description}</p>
                                {images.length > 0 && (
                                  <div className="flex gap-2 mt-3">
                                    {images.slice(0, 3).map((img, i) => (
                                      <div 
                                        key={i} 
                                        onClick={() => setPreviewImage(img)}
                                        className="w-10 h-10 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden cursor-pointer hover:border-indigo-500 hover:scale-105 transition flex-shrink-0 relative group"
                                      >
                                        <img src={getBackendUrl(img)} alt="Issue" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                          <LucideImageIcon size={10} className="text-white" />
                                        </div>
                                      </div>
                                    ))}
                                    {images.length > 3 && (
                                      <div className="w-10 h-10 rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                        +{images.length - 3}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="p-4">
                                <div className="flex flex-col gap-1.5 w-fit">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-center ${getUrgencyBadge(booking.urgency_level)}`}>
                                    {booking.urgency_level}
                                  </span>
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-center ${getStatusBadge(booking.status)}`}>
                                    {booking.status.replaceAll('_', ' ')}
                                  </span>
                                  <span className="text-[10px] text-slate-500 capitalize mt-1 text-center">
                                    {booking.payment_method} · <span className={booking.payment_status === 'completed' ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>{booking.payment_status}</span>
                                  </span>
                                </div>
                              </td>
                              <td className="p-4">
                                {booking.worker_name ? (
                                  <div className="space-y-1 text-xs">
                                    <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                                      <UserCheck size={12} />
                                      <span>{booking.worker_name}</span>
                                    </div>
                                    {booking.assigned_worker_phone && <p className="text-[10px] text-slate-500">Phone: {booking.assigned_worker_phone}</p>}
                                    {booking.assigned_worker_email && <p className="text-[10px] text-slate-500 truncate max-w-[130px]">Email: {booking.assigned_worker_email}</p>}
                                  </div>
                                ) : (
                                  <span className="text-xs text-rose-600 font-semibold bg-rose-50 px-2 py-1 rounded-lg border border-rose-100">Unassigned</span>
                                )}
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => setChatBookingIdObj({ id: booking.id, timestamp: Date.now() })}
                                    className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow cursor-pointer"
                                  >
                                    Chat
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingBooking(booking);
                                      setAssignName(booking.worker_name || '');
                                      setAssignPhone(booking.assigned_worker_phone || '');
                                      setAssignEmail(booking.assigned_worker_email || '');
                                      setUpdateStatus(booking.status);
                                      setUpdatePaymentStatus(booking.payment_status);
                                    }}
                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow cursor-pointer"
                                  >
                                    Update
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-4">
                  {filteredBookings.map((booking) => {
                    const images = parseImages(booking.issue_images);
                    const isExpanded = expandedRows[booking.id];
                    return (
                      <div key={booking.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-bold text-slate-800">{booking.user_name}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{booking.service_token}</p>
                            </div>
                            <button
                              onClick={() => toggleRowExpand(booking.id)}
                              className="p-1.5 hover:bg-slate-100 rounded-lg"
                            >
                              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500">Service:</span>
                              <span className="font-semibold text-slate-800">{booking.service_name || booking.category}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500">Status:</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(booking.status)}`}>
                                {booking.status.replaceAll('_', ' ')}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500">Urgency:</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getUrgencyBadge(booking.urgency_level)}`}>
                                {booking.urgency_level}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2 mt-4">
                            <button
                              onClick={() => setChatBookingIdObj({ id: booking.id, timestamp: Date.now() })}
                              className="flex-1 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow flex items-center justify-center gap-2"
                            >
                              <MessageCircle size={14} />
                              Chat
                            </button>
                            <button
                              onClick={() => {
                                setEditingBooking(booking);
                                setAssignName(booking.worker_name || '');
                                setAssignPhone(booking.assigned_worker_phone || '');
                                setAssignEmail(booking.assigned_worker_email || '');
                                setUpdateStatus(booking.status);
                                setUpdatePaymentStatus(booking.payment_status);
                              }}
                              className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow flex items-center justify-center gap-2"
                            >
                              <Users size={14} />
                              Update
                            </button>
                          </div>

                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                              <div>
                                <p className="text-xs font-semibold text-slate-500 mb-1">Contact Info</p>
                                <p className="text-sm flex items-center gap-2"><Phone size={12} className="text-indigo-600" /> {booking.contact_phone || booking.user_phone}</p>
                                <p className="text-sm flex items-start gap-2 mt-1"><MapPin size={12} className="text-amber-600 mt-0.5" /> {booking.address}</p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-slate-500 mb-1">Problem Description</p>
                                <p className="text-sm text-slate-650">{booking.description}</p>
                                {images.length > 0 && (
                                  <div className="flex gap-2 mt-2 flex-wrap">
                                    {images.map((img, i) => (
                                      <div 
                                        key={i} 
                                        onClick={() => setPreviewImage(img)}
                                        className="w-16 h-16 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden cursor-pointer hover:border-indigo-500 transition"
                                      >
                                        <img src={getBackendUrl(img)} alt="Issue" className="w-full h-full object-cover" />
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-slate-500 mb-1">Payment</p>
                                <p className="text-sm">Method: {booking.payment_method} · Status: <span className={booking.payment_status === 'completed' ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>{booking.payment_status}</span></p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-slate-500 mb-1">Assigned Agent</p>
                                {booking.worker_name ? (
                                  <div className="text-sm">
                                    <p className="font-semibold text-emerald-600">{booking.worker_name}</p>
                                    {booking.assigned_worker_phone && <p>Phone: {booking.assigned_worker_phone}</p>}
                                    {booking.assigned_worker_email && <p>Email: {booking.assigned_worker_email}</p>}
                                  </div>
                                ) : (
                                  <span className="text-sm text-rose-600 font-semibold">Unassigned</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {filteredBookings.length === 0 && (
                    <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
                      <p className="text-slate-500">No bookings found</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* LEDGERS TAB - Responsive */}
            {activeTab === 'ledgers' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-4 md:p-6 border-b border-slate-150 bg-slate-50/50">
                    <h3 className="text-base md:text-lg font-bold text-slate-800">Platform Invoice & Transaction Registry</h3>
                    <p className="text-xs text-slate-400 mt-1">Audit online Razorpay payments and Cash on Delivery service collections.</p>
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-550 font-bold bg-slate-50 text-xs tracking-wider uppercase">
                          <th className="p-4">Service Token</th>
                          <th className="p-4">Customer Details</th>
                          <th className="p-4">Service Category</th>
                          <th className="p-4">Billing Amount</th>
                          <th className="p-4">Payment Method</th>
                          <th className="p-4">Billing Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {recentBookings.map((booking) => (
                          <tr key={booking.id} className="hover:bg-slate-50/50 transition">
                            <td className="p-4 font-mono font-bold text-indigo-600 text-xs md:text-sm">
                              {booking.service_token}
                            </td>
                            <td className="p-4">
                              <p className="font-bold text-slate-800">{booking.user_name}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{booking.user_phone}</p>
                            </td>
                            <td className="p-4">
                              <p className="font-semibold text-slate-700 text-xs md:text-sm">{booking.service_name || booking.category}</p>
                            </td>
                            <td className="p-4 font-bold text-emerald-600">
                              ₹{booking.budget || '500'}
                            </td>
                            <td className="p-4">
                              <span className="uppercase text-xs font-semibold px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-650">
                                {booking.payment_method}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                                booking.payment_status === 'completed' 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                  : 'bg-amber-50 text-amber-700 border border-amber-100'
                              }`}>
                                {booking.payment_status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden divide-y divide-slate-100">
                    {recentBookings.map((booking) => (
                      <div key={booking.id} className="p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="font-mono font-bold text-indigo-600 text-xs">{booking.service_token}</span>
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                            booking.payment_status === 'completed' 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            {booking.payment_status}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{booking.user_name}</p>
                          <p className="text-xs text-slate-500">{booking.user_phone}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Service</p>
                          <p className="text-sm font-semibold text-slate-700">{booking.service_name || booking.category}</p>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          <div>
                            <p className="text-xs text-slate-500">Amount</p>
                            <p className="font-bold text-emerald-600">₹{booking.budget || '500'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Method</p>
                            <p className="text-xs font-semibold uppercase">{booking.payment_method}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {recentBookings.length === 0 && (
                    <div className="p-8 text-center text-slate-500">
                      No invoices recorded yet.
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* COMPLAINTS TAB - With Fixed Resolution */}
            {activeTab === 'complaints' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-4 md:space-y-6"
              >
                <div className="grid grid-cols-1 gap-4">
                  {complaints.map((comp) => (
                    <div key={comp.id} className="bg-white p-4 md:p-6 border border-slate-200 rounded-2xl shadow-sm space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-150 text-[10px] font-bold uppercase tracking-wider rounded">Ticket #{comp.id}</span>
                            <span className="text-xs text-slate-500">Token: <span className="font-bold text-slate-700">{comp.service_token}</span></span>
                          </div>
                          <h4 className="font-bold text-base md:text-lg text-slate-800 mt-1.5">{comp.service_name || 'General Complaint'}</h4>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getComplaintStatusBadge(comp.status)}`}>
                          {comp.status.replace('_', ' ')}
                        </span>
                      </div>

                      <p className="text-sm text-slate-700 bg-slate-50 p-3 md:p-4 rounded-xl border border-slate-100 italic">
                        "{comp.description}"
                      </p>

                      <div className="pt-2 border-t border-slate-150 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-slate-550">
                        <div>
                          <p>Customer: <span className="font-semibold text-slate-700">{comp.user_name}</span></p>
                          <p className="mt-1">Phone: {comp.user_phone} · Email: {comp.user_email}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => setChatBookingIdObj({ id: comp.booking_id, timestamp: Date.now() })}
                            className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-wider rounded-xl transition shadow text-[10px] cursor-pointer flex items-center justify-center gap-2"
                          >
                            <MessageCircle size={12} />
                            Chat
                          </button>
                          {comp.status !== 'resolved' && comp.status !== 'closed' && (
                            <button
                              onClick={() => handleResolveComplaint(comp)}
                              className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider rounded-xl transition shadow text-[10px] cursor-pointer flex items-center justify-center gap-2"
                            >
                              <Check size={12} />
                              Resolve
                            </button>
                          )}
                          {comp.status === 'resolved' && (
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold flex items-center gap-1">
                              <CheckCircle size={12} />
                              Resolved
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {complaints.length === 0 && (
                    <div className="bg-white p-8 md:p-12 text-center text-slate-550 border border-slate-200 rounded-2xl shadow-sm">
                      <CheckSquare className="mx-auto mb-3 text-emerald-600" size={42} />
                      <h4 className="text-base md:text-lg font-bold text-slate-800">Clean Slate!</h4>
                      <p className="text-sm mt-1">No pending customer complaints or tickets lodged.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* REVIEWS TAB - Responsive */}
            {activeTab === 'reviews' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
              >
                {reviews.map((rev) => (
                  <div key={rev.id} className="bg-white p-4 md:p-6 flex flex-col justify-between border border-slate-200 rounded-2xl shadow-sm">
                    <div>
                      <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                        <span className="text-xs text-indigo-650 font-mono font-bold">{rev.service_token}</span>
                        <div className="flex gap-0.5 text-amber-500">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star 
                              key={s} 
                              size={14} 
                              fill={s <= rev.rating ? 'currentColor' : 'none'} 
                              className="md:w-4 md:h-4"
                            />
                          ))}
                        </div>
                      </div>

                      <h4 className="font-bold text-slate-800 text-sm md:text-base">{rev.service_name || 'Home Repair Job'}</h4>
                      <p className="text-sm text-slate-650 mt-3 italic">
                        "{rev.comment || 'No written comments provided.'}"
                      </p>
                    </div>

                    <div className="pt-4 mt-4 md:mt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-slate-500">
                      <span>Posted by: <span className="font-semibold text-slate-700">{rev.user_name}</span></span>
                      <span>{new Date(rev.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
                {reviews.length === 0 && (
                  <div className="col-span-1 md:col-span-2 bg-white p-8 md:p-12 text-center text-slate-550 border border-slate-200 rounded-2xl shadow-sm">
                    <Star className="mx-auto mb-3 text-amber-500" size={42} />
                    <h4 className="text-base md:text-lg font-bold text-slate-800">No Reviews Recorded</h4>
                    <p className="text-sm mt-1">Feedback is captured immediately when customers complete their services.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="max-w-2xl bg-white border border-slate-200 rounded-2xl p-4 md:p-8 shadow-sm mx-auto md:mx-0"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Settings size={20} />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-slate-800">Global Preferences</h3>
                    <p className="text-xs text-slate-400">Configure Razorpay credentials and system fallbacks.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Gateway Key Status</label>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Razorpay Secure Mode (Live Verification)</p>
                        <p className="text-xs text-slate-400 mt-0.5">Signature validation checks match secure SHA256 hashes.</p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-250 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">Connected</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        )}
      </main>

      {/* COMPLAINT RESOLUTION MODAL */}
      <AnimatePresence>
        {resolvingComplaint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setResolvingComplaint(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm cursor-pointer"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden relative z-10 shadow-2xl"
            >
              <div className="p-4 md:p-6 border-b border-slate-150 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800">Resolve Complaint</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Ticket #{resolvingComplaint.id}</p>
                  </div>
                  <button 
                    onClick={() => setResolvingComplaint(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="p-4 md:p-6 space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Complaint Description:</p>
                  <p className="text-sm text-slate-700">{resolvingComplaint.description}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600">Resolution Status</label>
                  <select
                    value={resolutionStatus}
                    onChange={(e) => setResolutionStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition"
                  >
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                    <option value="in_progress">In Progress</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600">Resolution Notes</label>
                  <textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Add resolution details here..."
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition resize-none"
                  />
                </div>

                <button
                  onClick={submitComplaintResolution}
                  disabled={actionLoading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold uppercase tracking-wider transition shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Resolve Complaint
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT BOOKING MODAL */}
      <AnimatePresence>
        {editingBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingBooking(null)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs cursor-pointer"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden relative z-10 shadow-2xl"
            >
              <div className="p-4 md:p-6 border-b border-slate-150 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800">Manage Service Ticket</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Booking Token: {editingBooking.service_token}</p>
                </div>
                <button 
                  onClick={() => setEditingBooking(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleUpdateBooking} className="p-4 md:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs text-slate-550">
                  <p className="font-bold text-slate-800 text-sm mb-1">Client: {editingBooking.user_name}</p>
                  <p className="truncate">Service: {editingBooking.service_name}</p>
                  <p>Budget: ₹{editingBooking.budget} · Method: <span className="uppercase font-bold">{editingBooking.payment_method}</span></p>
                </div>

                <div className="space-y-3.5 border-t border-slate-150 pt-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Assign Offline Agent details</p>
                  
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500">Agent Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Painter"
                      value={assignName}
                      onChange={(e) => setAssignName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500">Agent Phone</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 9988776655"
                      value={assignPhone}
                      onChange={(e) => setAssignPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500">Agent Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. ramesh@gmail.com"
                      value={assignEmail}
                      onChange={(e) => setAssignEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                <div className="space-y-3.5 border-t border-slate-150 pt-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status Controls</p>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500">Job Tracking Status</label>
                    <select
                      value={updateStatus}
                      onChange={(e) => setUpdateStatus(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition cursor-pointer"
                    >
                      <option value="pending">Pending Review</option>
                      <option value="accepted">Accepted / Approved</option>
                      <option value="on_the_way">On The Way</option>
                      <option value="working">Working In Progress</option>
                      <option value="completed">Completed / Solved</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-550">Invoice Payment Status</label>
                    <select
                      value={updatePaymentStatus}
                      onChange={(e) => setUpdatePaymentStatus(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition cursor-pointer"
                    >
                      <option value="pending">Pending Payment</option>
                      <option value="completed">Completed / Received</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold uppercase tracking-wider transition shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Commit Status Updates'
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* IMAGE LIGHTBOX */}
      <AnimatePresence>
        {previewImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewImage(null)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm cursor-pointer"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-[95vw] max-h-[85vh] relative z-10 rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-2xl p-2"
            >
              <button 
                onClick={() => setPreviewImage(null)}
                className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-full transition z-20 shadow cursor-pointer"
              >
                <X size={20} />
              </button>
              <img 
                src={getBackendUrl(previewImage)} 
                alt="Issue Preview" 
                className="w-full max-h-[80vh] object-contain rounded-xl" 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CHAT WIDGET */}
      <ChatWidget 
        bookingsList={recentBookings} 
        isAdmin={true} 
        defaultBookingId={chatBookingIdObj?.id}
        triggerOpen={chatBookingIdObj?.timestamp}
      />
      {toast && (
  <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-right-5">
    <div className={`px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 ${
      toast.type === 'success' 
        ? 'bg-emerald-500 text-white' 
        : 'bg-rose-500 text-white'
    }`}>
      {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
      <span className="text-sm font-medium">{toast.message}</span>
    </div>
  </div>
)}
    </div>
  );
};

export default AdminDashboard;