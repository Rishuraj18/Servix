const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  updateBookingStatus,
  createReview,
  createComplaint,
  getAllComplaints,
  getAllReviews,
  getBookingMessages,
  sendBookingMessage,
  cancelBooking
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/multer');

router.route('/')
  .get(protect, authorize('user', 'admin'), getMyBookings)
  .post(protect, authorize('user'), upload.array('issue_images', 5), createBooking);

router.get('/admin/complaints', protect, authorize('admin'), getAllComplaints);
router.get('/admin/reviews', protect, authorize('admin'), getAllReviews);

router.patch('/:id/status', protect, authorize('user', 'admin'), updateBookingStatus);
router.patch('/:id/cancel', protect, authorize('user', 'admin'), cancelBooking);

router.post('/:id/reviews', protect, authorize('user'), createReview);
router.post('/:id/complaints', protect, authorize('user'), createComplaint);

router.get('/:id/messages', protect, getBookingMessages);
router.post('/:id/messages', protect, sendBookingMessage);
// In your backend routes file (e.g., complaintRoutes.js or similar)
router.patch('/complaints/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution_notes } = req.body;
    
    const query = `
      UPDATE complaints 
      SET status = ?, 
          resolution_notes = ?,
          updated_at = NOW()
      WHERE id = ?
    `;
    
    const [result] = await db.execute(query, [status, resolution_notes, id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }
    
    res.json({ success: true, message: 'Complaint resolved successfully' });
  } catch (error) {
    console.error('Error resolving complaint:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
module.exports = router;
