const Razorpay = require('razorpay');
const crypto = require('crypto');
const db = require('../config/db');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create a Razorpay order
// @route   POST /api/payments/create-order
// @access  Private (User)
const createOrder = async (req, res) => {
  try {
    const { amount, booking_id } = req.body;

    if (!amount || !booking_id) {
      return res.status(400).json({ success: false, message: 'Amount and Booking ID are required' });
    }

    const options = {
      amount: amount * 100, // amount in smallest currency unit (paise)
      currency: 'INR',
      receipt: `receipt_order_${booking_id}_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).json({ success: false, message: 'Error creating Razorpay order' });
    }

    // Save initial payment record as pending
    await db.query(
      'INSERT INTO payments (booking_id, user_id, amount, razorpay_order_id, status) VALUES (?, ?, ?, ?, ?)',
      [booking_id, req.user.id, amount, order.id, 'pending']
    );

    res.json({ success: true, order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Verify Razorpay payment signature
// @route   POST /api/payments/verify
// @access  Private (User)
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature === expectedSign) {
      // Payment is successful, update database
      await db.query(
        'UPDATE payments SET razorpay_payment_id = ?, razorpay_signature = ?, status = ? WHERE razorpay_order_id = ?',
        [razorpay_payment_id, razorpay_signature, 'completed', razorpay_order_id]
      );

      return res.json({ success: true, message: 'Payment verified successfully' });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid signature sent!' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  createOrder,
  verifyPayment
};
