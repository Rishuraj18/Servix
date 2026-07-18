const Service = require('../models/Service');

// @desc    Get all active services
// @route   GET /api/services
// @access  Public
const getServices = async (req, res) => {
  try {
    const services = await Service.find({ is_active: true });
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

    const newService = new Service({
      name,
      description,
      category,
      base_price: base_price || 0,
      icon_image: icon_image || ''
    });

    await newService.save();

    res.status(201).json({ success: true, data: { id: newService._id, name, category } });
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
    
    await Service.findByIdAndUpdate(req.params.id, {
      name,
      description,
      category,
      base_price,
      icon_image,
      is_active
    });

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
