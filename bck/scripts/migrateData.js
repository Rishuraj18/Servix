require('dotenv').config();
const mysql = require('mysql2/promise');
const mongoose = require('mongoose');

// Mongoose Models
const User = require('../models/User');
const Admin = require('../models/Admin');
const Service = require('../models/Service');
const Banner = require('../models/Banner');
const Testimonial = require('../models/Testimonial');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const Invoice = require('../models/Invoice');
const Coupon = require('../models/Coupon');
const Complaint = require('../models/Complaint');
const { Counter } = require('../models/Counter');

// Replace with your actual MySQL credentials if not in .env
const mysqlConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'servix_db',
};

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/servix_db';

async function migrateData() {
  console.log('--- Starting Migration from MySQL to MongoDB ---');
  let mysqlConnection;
  
  try {
    // 1. Connect to MySQL
    console.log('Connecting to MySQL...');
    mysqlConnection = await mysql.createConnection(mysqlConfig);
    console.log('Connected to MySQL.');

    // 2. Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // 3. Clear existing MongoDB Data
    console.log('Clearing existing MongoDB data (if any)...');
    await mongoose.connection.db.dropDatabase();

    // Utility function to fetch all rows
    const fetchRows = async (table) => {
      const [rows] = await mysqlConnection.query(`SELECT * FROM ${table}`);
      return rows;
    };

    // Migrate Users
    console.log('Migrating Users...');
    const users = await fetchRows('users');
    for (const u of users) {
      await User.create({
        _id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        password: u.password,
        profile_image: u.profile_image,
        address: u.address,
        lat: u.lat,
        lng: u.lng,
        status: u.status,
        created_at: u.created_at,
        updated_at: u.updated_at
      });
    }
    console.log(`Migrated ${users.length} Users.`);

    // Migrate Admins
    console.log('Migrating Admins...');
    const admins = await fetchRows('admins');
    for (const a of admins) {
      await Admin.create({
        _id: a.id,
        name: a.name,
        email: a.email,
        password: a.password,
        role: a.role,
        created_at: a.created_at,
        updated_at: a.updated_at
      });
    }
    console.log(`Migrated ${admins.length} Admins.`);

    // Migrate Services
    console.log('Migrating Services...');
    const services = await fetchRows('services');
    for (const s of services) {
      await Service.create({
        _id: s.id,
        name: s.name,
        description: s.description,
        icon_image: s.icon_image,
        category: s.category,
        base_price: s.base_price,
        is_active: s.is_active,
        created_at: s.created_at,
        updated_at: s.updated_at
      });
    }
    console.log(`Migrated ${services.length} Services.`);

    // Migrate Banners
    console.log('Migrating Banners...');
    const banners = await fetchRows('banners');
    for (const b of banners) {
      await Banner.create({
        _id: b.id,
        title: b.title,
        subtitle: b.subtitle,
        eyebrow: b.eyebrow,
        image_url: b.image_url,
        cta_text: b.cta_text,
        cta_link: b.cta_link,
        sort_order: b.sort_order,
        is_active: b.is_active,
        created_at: b.created_at,
        updated_at: b.updated_at
      });
    }
    console.log(`Migrated ${banners.length} Banners.`);

    // Migrate Testimonials
    console.log('Migrating Testimonials...');
    const testimonials = await fetchRows('testimonials');
    for (const t of testimonials) {
      await Testimonial.create({
        _id: t.id,
        customer_name: t.customer_name,
        customer_role: t.customer_role,
        comment: t.comment,
        rating: t.rating,
        avatar_url: t.avatar_url,
        city: t.city,
        is_active: t.is_active,
        sort_order: t.sort_order,
        created_at: t.created_at,
        updated_at: t.updated_at
      });
    }
    console.log(`Migrated ${testimonials.length} Testimonials.`);

    // Migrate Bookings & Embedded Status
    console.log('Migrating Bookings & Status History...');
    const bookings = await fetchRows('bookings');
    const bookingStatuses = await fetchRows('booking_status');

    for (const b of bookings) {
      // Find all status updates for this booking
      const statusesForBooking = bookingStatuses
        .filter(bs => bs.booking_id === b.id)
        .map(bs => ({
          status: bs.status,
          updated_by_user_id: bs.updated_by_user_id,
          notes: bs.notes,
          created_at: bs.created_at
        }));

      let issue_images = [];
      if (b.issue_images) {
        try {
          issue_images = typeof b.issue_images === 'string' ? JSON.parse(b.issue_images) : b.issue_images;
        } catch(e) {}
      }

      await Booking.create({
        _id: b.id,
        user_id: b.user_id,
        service_id: b.service_id,
        description: b.description,
        issue_images,
        budget: b.budget,
        urgency_level: b.urgency_level,
        status: b.status,
        service_token: b.service_token,
        address: b.address,
        lat: b.lat,
        lng: b.lng,
        assigned_worker: b.assigned_worker,
        assigned_worker_phone: b.assigned_worker_phone,
        assigned_worker_email: b.assigned_worker_email,
        contact_phone: b.contact_phone,
        payment_method: b.payment_method,
        payment_status: b.payment_status,
        scheduled_at: b.scheduled_at,
        completed_at: b.completed_at,
        created_at: b.created_at,
        updated_at: b.updated_at,
        status_history: statusesForBooking
      });
    }
    console.log(`Migrated ${bookings.length} Bookings with their status histories.`);

    // Migrate Payments
    console.log('Migrating Payments...');
    const payments = await fetchRows('payments');
    for (const p of payments) {
      await Payment.create({
        _id: p.id,
        booking_id: p.booking_id,
        user_id: p.user_id,
        amount: p.amount,
        razorpay_order_id: p.razorpay_order_id,
        razorpay_payment_id: p.razorpay_payment_id,
        razorpay_signature: p.razorpay_signature,
        status: p.status,
        created_at: p.created_at,
        updated_at: p.updated_at
      });
    }
    console.log(`Migrated ${payments.length} Payments.`);

    // Migrate Reviews
    console.log('Migrating Reviews...');
    const reviews = await fetchRows('reviews');
    for (const r of reviews) {
      await Review.create({
        _id: r.id,
        booking_id: r.booking_id,
        user_id: r.user_id,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at
      });
    }
    console.log(`Migrated ${reviews.length} Reviews.`);

    // Migrate Chats
    console.log('Migrating Chats...');
    const chats = await fetchRows('chats');
    for (const c of chats) {
      await Chat.create({
        _id: c.id,
        user_id: c.user_id,
        booking_id: c.booking_id,
        created_at: c.created_at
      });
    }
    console.log(`Migrated ${chats.length} Chats.`);

    // Migrate Messages
    console.log('Migrating Messages...');
    const messages = await fetchRows('messages');
    for (const m of messages) {
      await Message.create({
        _id: m.id,
        chat_id: m.chat_id,
        sender_type: m.sender_type,
        sender_id: m.sender_id,
        message: m.message,
        is_read: m.is_read ? true : false,
        created_at: m.created_at
      });
    }
    console.log(`Migrated ${messages.length} Messages.`);

    // Skip less crucial tables if empty, or migrate them directly:
    const notifications = await fetchRows('notifications');
    for (const n of notifications) {
      await Notification.create({ ...n, _id: n.id });
    }
    const invoices = await fetchRows('invoices');
    for (const i of invoices) {
      await Invoice.create({ ...i, _id: i.id });
    }
    const coupons = await fetchRows('coupons');
    for (const c of coupons) {
      await Coupon.create({ ...c, _id: c.id });
    }
    const complaints = await fetchRows('complaints');
    for (const c of complaints) {
      await Complaint.create({ ...c, _id: c.id });
    }
    
    // 4. Update Sequence Counters to Max ID
    console.log('Updating sequence counters...');
    const setSequence = async (name, model) => {
      const highest = await model.findOne().sort({ _id: -1 }).select('_id').lean();
      const seqValue = highest && highest._id ? highest._id : 0;
      await Counter.findByIdAndUpdate(name, { seq: seqValue }, { upsert: true });
    };

    await setSequence('userId', User);
    await setSequence('adminId', Admin);
    await setSequence('serviceId', Service);
    await setSequence('bannerId', Banner);
    await setSequence('testimonialId', Testimonial);
    await setSequence('bookingId', Booking);
    await setSequence('paymentId', Payment);
    await setSequence('reviewId', Review);
    await setSequence('chatId', Chat);
    await setSequence('messageId', Message);
    await setSequence('notificationId', Notification);
    await setSequence('invoiceId', Invoice);
    await setSequence('couponId', Coupon);
    await setSequence('complaintId', Complaint);
    console.log('Counters synchronized.');

    console.log('--- Migration Completed Successfully ---');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    if (mysqlConnection) await mysqlConnection.end();
    await mongoose.disconnect();
    process.exit(0);
  }
}

migrateData();
