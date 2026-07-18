require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Service = require('../models/Service');
const Banner = require('../models/Banner');
const Testimonial = require('../models/Testimonial');
const User = require('../models/User');
const { Counter } = require('../models/Counter');

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/servix_db';

async function seedData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // Clear existing data (optional, but good for a fresh seed)
    console.log('Clearing old data...');
    await Admin.deleteMany();
    await Service.deleteMany();
    await Banner.deleteMany();
    await Testimonial.deleteMany();
    await User.deleteMany();
    await Counter.deleteMany();
    console.log('Old data cleared.');

    // Function to get specific sequence (simulating auto-increment)
    const setSeq = async (name, val) => {
      await Counter.findOneAndUpdate({ _id: name }, { seq: val }, { upsert: true });
      return val;
    };

    console.log('Seeding Admins...');
    const admin = new Admin({
      name: 'Super Admin',
      email: 'admin@servix.com',
      password: '$2b$10$ngLBdyHnWClphLxXejnXEeV1v2CLsW5D/.iSwyKP2XXiSIh/emZJ6', // admin123
      role: 'superadmin'
    });
    await admin.save();
    console.log('Admins seeded.');

    console.log('Seeding Services...');
    const services = [
      { name: 'House Wiring Repair', description: 'Complete diagnostic and repair of house electrical wiring.', category: 'Electrician', base_price: 299.00, icon_image: 'zap' },
      { name: 'AC Deep Cleaning', description: 'Comprehensive cleaning of indoor and outdoor AC units.', category: 'AC Repair', base_price: 499.00, icon_image: 'snowflake' },
      { name: 'Washing Machine Repair', description: 'Diagnostic and repair of fully automatic/semi-automatic machines.', category: 'Appliance Repair', base_price: 349.00, icon_image: 'wrench' },
      { name: 'Bathroom Plumbing', description: 'Fixing leaks, blockages, and installing new fixtures.', category: 'Plumbing', base_price: 199.00, icon_image: 'droplets' },
      { name: 'Furniture Assembly', description: 'Assembly of IKEA, Pepperfry, or custom furniture pieces.', category: 'Carpenter', base_price: 249.00, icon_image: 'pen-tool' },
      { name: 'Full Home Painting', description: 'Interior painting for 1BHK/2BHK/3BHK using premium paints.', category: 'Painting', base_price: 4999.00, icon_image: 'paint-roller' },
      { name: 'Deep Home Cleaning', description: 'Intensive cleaning of all rooms, bathrooms, and kitchen.', category: 'Cleaning', base_price: 999.00, icon_image: 'sparkles' },
      { name: 'General Pest Control', description: 'Elimination of cockroaches, ants, and general pests.', category: 'Pest Control', base_price: 599.00, icon_image: 'bug' }
    ];
    for (const s of services) {
      const newService = new Service(s);
      await newService.save();
    }
    console.log('Services seeded.');

    console.log('Seeding Banners...');
    const banners = [
      { title: 'Premium home services, delivered by approved experts', subtitle: 'Book verified electricians, painters, cleaners, plumbers, and repair professionals with live status tracking from request to completion.', eyebrow: 'Servix verified care', image_url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1600&q=80', cta_text: 'Book a service', cta_link: '/services', sort_order: 1, is_active: true },
      { title: 'Upgrade your home without chasing contractors', subtitle: 'Transparent service pricing, matched professionals, admin-approved workers, and a clean booking experience built for modern households.', eyebrow: 'Trusted by urban homes', image_url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1600&q=80', cta_text: 'Post a task', cta_link: '/post-task', sort_order: 2, is_active: true },
      { title: 'Safe, reliable assistance just a few clicks away', subtitle: 'Select your repair services and let our background-checked partners handle the job with speed and care.', eyebrow: '100% Satisfaction Gurantee', image_url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1600&q=80', cta_text: 'Browse services', cta_link: '/services', sort_order: 3, is_active: true }
    ];
    for (const b of banners) {
      const newBanner = new Banner(b);
      await newBanner.save();
    }
    console.log('Banners seeded.');

    console.log('Seeding Testimonials...');
    const testimonials = [
      { customer_name: 'Aarav Mehta', customer_role: 'Homeowner', comment: 'The electrician arrived on time, explained the issue clearly, and fixed our wiring without any hidden cost. The booking status made the whole process feel very premium.', rating: 5, avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80', city: 'Bangalore', sort_order: 1, is_active: true },
      { customer_name: 'Nisha Kapoor', customer_role: 'Working professional', comment: 'I booked deep cleaning before a family event. The professional was verified, polite, and the dashboard updates were genuinely useful.', rating: 5, avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80', city: 'Mumbai', sort_order: 2, is_active: true },
      { customer_name: 'Rohan Iyer', customer_role: 'Apartment owner', comment: 'Servix feels far more organized than calling random contractors. Painter selection, pricing, and job updates were all smooth.', rating: 5, avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=240&q=80', city: 'Pune', sort_order: 3, is_active: true }
    ];
    for (const t of testimonials) {
      const newTestimonial = new Testimonial(t);
      await newTestimonial.save();
    }
    console.log('Testimonials seeded.');

    console.log('Seeding User...');
    const user = new User({
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      phone: '9876543210',
      password: '$2b$10$ngLBdyHnWClphLxXejnXEeV1v2CLsW5D/.iSwyKP2XXiSIh/emZJ6', // admin123
      address: '123 Main St, Tech Park, Bangalore',
      status: 'active'
    });
    await user.save();
    console.log('User seeded.');

    console.log('Database successfully seeded with MongoDB models!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedData();
