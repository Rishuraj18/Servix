-- Use the Servix database
USE servix_db;

-- Seed Admins
INSERT INTO admins (name, email, password, role) VALUES 
('Super Admin', 'admin@servix.com', '$2b$10$ngLBdyHnWClphLxXejnXEeV1v2CLsW5D/.iSwyKP2XXiSIh/emZJ6', 'superadmin')
ON DUPLICATE KEY UPDATE
name = VALUES(name),
password = VALUES(password),
role = VALUES(role); -- Password is 'admin123' (hashed)

-- Seed Services
INSERT INTO services (name, description, category, base_price, icon_image) VALUES
('House Wiring Repair', 'Complete diagnostic and repair of house electrical wiring.', 'Electrician', 299.00, 'zap'),
('AC Deep Cleaning', 'Comprehensive cleaning of indoor and outdoor AC units.', 'AC Repair', 499.00, 'snowflake'),
('Washing Machine Repair', 'Diagnostic and repair of fully automatic/semi-automatic machines.', 'Appliance Repair', 349.00, 'wrench'),
('Bathroom Plumbing', 'Fixing leaks, blockages, and installing new fixtures.', 'Plumbing', 199.00, 'droplets'),
('Furniture Assembly', 'Assembly of IKEA, Pepperfry, or custom furniture pieces.', 'Carpenter', 249.00, 'pen-tool'),
('Full Home Painting', 'Interior painting for 1BHK/2BHK/3BHK using premium paints.', 'Painting', 4999.00, 'paint-roller'),
('Deep Home Cleaning', 'Intensive cleaning of all rooms, bathrooms, and kitchen.', 'Cleaning', 999.00, 'sparkles'),
('General Pest Control', 'Elimination of cockroaches, ants, and general pests.', 'Pest Control', 599.00, 'bug');

-- Seed Homepage Banners
DELETE FROM banners;
INSERT INTO banners (title, subtitle, eyebrow, image_url, cta_text, cta_link, sort_order, is_active) VALUES
('Premium home services, delivered by approved experts', 'Book verified electricians, painters, cleaners, plumbers, and repair professionals with live status tracking from request to completion.', 'Servix verified care', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1600&q=80', 'Book a service', '/services', 1, TRUE),
('Upgrade your home without chasing contractors', 'Transparent service pricing, matched professionals, admin-approved workers, and a clean booking experience built for modern households.', 'Trusted by urban homes', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1600&q=80', 'Post a task', '/post-task', 2, TRUE),
('Safe, reliable assistance just a few clicks away', 'Select your repair services and let our background-checked partners handle the job with speed and care.', '100% Satisfaction Gurantee', 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1600&q=80', 'Browse services', '/services', 3, TRUE);

-- Seed Homepage Testimonials
DELETE FROM testimonials;
INSERT INTO testimonials (customer_name, customer_role, comment, rating, avatar_url, city, sort_order, is_active) VALUES
('Aarav Mehta', 'Homeowner', 'The electrician arrived on time, explained the issue clearly, and fixed our wiring without any hidden cost. The booking status made the whole process feel very premium.', 5, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80', 'Bangalore', 1, TRUE),
('Nisha Kapoor', 'Working professional', 'I booked deep cleaning before a family event. The professional was verified, polite, and the dashboard updates were genuinely useful.', 5, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80', 'Mumbai', 2, TRUE),
('Rohan Iyer', 'Apartment owner', 'Servix feels far more organized than calling random contractors. Painter selection, pricing, and job updates were all smooth.', 5, 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=240&q=80', 'Pune', 3, TRUE);

-- Seed a dummy User
INSERT INTO users (name, email, phone, password, address, status) VALUES 
('Rahul Sharma', 'rahul@example.com', '9876543210', '$2b$10$ngLBdyHnWClphLxXejnXEeV1v2CLsW5D/.iSwyKP2XXiSIh/emZJ6', '123 Main St, Tech Park, Bangalore', 'active'); -- password: 'admin123'
