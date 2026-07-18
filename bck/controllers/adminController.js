const User = require('../models/User');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

const getDashboard = async (req, res) => {
  try {
    const usersCount = await User.countDocuments();
    const bookingsCount = await Booking.countDocuments();
    const completedBookingsCount = await Booking.countDocuments({ status: 'completed' });
    
    const revenueAggr = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const revenueTotal = revenueAggr.length > 0 ? revenueAggr[0].total : 0;

    const bookings = await Booking.find()
      .populate('service_id', 'name category')
      .populate('user_id', 'name phone')
      .sort({ created_at: -1 })
      .lean();

    const recentBookings = bookings.map(b => ({
      id: b._id,
      status: b.status,
      budget: b.budget,
      created_at: b.created_at,
      service_name: b.service_id ? b.service_id.name : null,
      category: b.service_id ? b.service_id.category : null,
      user_name: b.user_id ? b.user_id.name : null,
      worker_name: b.assigned_worker,
      user_phone: b.user_id ? b.user_id.phone : null,
      address: b.address,
      description: b.description,
      issue_images: b.issue_images,
      urgency_level: b.urgency_level,
      payment_method: b.payment_method,
      payment_status: b.payment_status,
      contact_phone: b.contact_phone,
      assigned_worker_phone: b.assigned_worker_phone,
      assigned_worker_email: b.assigned_worker_email,
      service_token: b.service_token
    }));

    res.json({
      success: true,
      data: {
        stats: {
          users: usersCount,
          bookings: bookingsCount,
          completedBookings: completedBookingsCount,
          revenue: Number(revenueTotal)
        },
        recentBookings
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getDashboard
};
