const db = require('../config/db');

// @desc    Get all active services
// @route   GET /api/services
// @access  Public
const getServices = async (req, res) => {
  try {
    const [services] = await db.query('SELECT * FROM services WHERE is_active = TRUE');
    res.json({ success: true, count: services.length, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create a service
// @route   POST /api/services
// @access  Private (Admin)
const createService = async (req, res) => {
  try {
    const { name, description, category, base_price, icon_image } = req.body;
    
    if (!name || !category) {
      return res.status(400).json({ success: false, message: 'Name and category are required' });
    }

    const [result] = await db.query(
      'INSERT INTO services (name, description, category, base_price, icon_image) VALUES (?, ?, ?, ?, ?)',
      [name, description, category, base_price || 0, icon_image || '']
    );

    res.status(201).json({ success: true, data: { id: result.insertId, name, category } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update a service
// @route   PUT /api/services/:id
// @access  Private (Admin)
const updateService = async (req, res) => {
  try {
    const { name, description, category, base_price, icon_image, is_active } = req.body;
    
    await db.query(
      'UPDATE services SET name=?, description=?, category=?, base_price=?, icon_image=?, is_active=? WHERE id=?',
      [name, description, category, base_price, icon_image, is_active, req.params.id]
    );

    res.json({ success: true, message: 'Service updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getServices,
  createService,
  updateService
};
