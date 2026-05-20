const db = require('../config/db');

const getDashboard = async (req, res) => {
  try {
    const [[users]] = await db.query('SELECT COUNT(*) AS total FROM users');
    const [[bookings]] = await db.query('SELECT COUNT(*) AS total FROM bookings');
    const [[completedBookings]] = await db.query("SELECT COUNT(*) AS total FROM bookings WHERE status = 'completed'");
    const [[revenue]] = await db.query("SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'completed'");

    const [recentBookings] = await db.query(
      `SELECT b.id, b.status, b.budget, b.created_at, s.name AS service_name, s.category, u.name AS user_name, b.assigned_worker AS worker_name,
              u.phone AS user_phone, b.address, b.description, b.issue_images, b.urgency_level,
              b.payment_method, b.payment_status, b.contact_phone, b.assigned_worker_phone, b.assigned_worker_email, b.service_token
       FROM bookings b
       LEFT JOIN services s ON s.id = b.service_id
       LEFT JOIN users u ON u.id = b.user_id
       ORDER BY b.created_at DESC`
    );

    res.json({
      success: true,
      data: {
        stats: {
          users: users.total,
          bookings: bookings.total,
          completedBookings: completedBookings.total,
          revenue: Number(revenue.total)
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
