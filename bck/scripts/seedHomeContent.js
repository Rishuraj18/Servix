const db = require('../config/db');

const banners = [
  [
    'Premium home services, delivered by approved experts',
    'Book verified electricians, painters, cleaners, plumbers, and repair professionals with live status tracking from request to completion.',
    'Servix verified care',
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1600&q=80',
    'Book a service',
    '/services',
    1
  ],
  [
    'Upgrade your home without chasing contractors',
    'Transparent service pricing, matched professionals, admin-approved workers, and a clean booking experience built for modern households.',
    'Trusted by urban homes',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1600&q=80',
    'Post a task',
    '/post-task',
    2
  ],
  [
    'Professionals grow faster with verified requests',
    'Add your professions, get approved by admin, and receive work requests that match your skills and service area.',
    'For skilled professionals',
    'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=80',
    'Join as professional',
    '/register?role=worker',
    3
  ]
];

const testimonials = [
  [
    'Aarav Mehta',
    'Homeowner',
    'The electrician arrived on time, explained the issue clearly, and fixed our wiring without any hidden cost. The booking status made the whole process feel very premium.',
    5,
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80',
    'Bangalore',
    1
  ],
  [
    'Nisha Kapoor',
    'Working professional',
    'I booked deep cleaning before a family event. The professional was verified, polite, and the dashboard updates were genuinely useful.',
    5,
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80',
    'Mumbai',
    2
  ],
  [
    'Rohan Iyer',
    'Apartment owner',
    'Servix feels far more organized than calling random contractors. Painter selection, pricing, and job updates were all smooth.',
    5,
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=240&q=80',
    'Pune',
    3
  ]
];

const seed = async () => {
  await db.query('DELETE FROM banners');
  await db.query('DELETE FROM testimonials');

  await db.query(
    `INSERT INTO banners
      (title, subtitle, eyebrow, image_url, cta_text, cta_link, sort_order, is_active)
     VALUES ?`,
    [banners.map((banner) => [...banner, true])]
  );

  await db.query(
    `INSERT INTO testimonials
      (customer_name, customer_role, comment, rating, avatar_url, city, sort_order, is_active)
     VALUES ?`,
    [testimonials.map((testimonial) => [...testimonial, true])]
  );

  console.log('Homepage banners and testimonials seeded');
  process.exit(0);
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
