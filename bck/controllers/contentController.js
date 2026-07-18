const Banner = require('../models/Banner');
const Testimonial = require('../models/Testimonial');

const uniqueBy = (rows, getKey) => {
  const seen = new Set();
  return rows.filter((row) => {
    const key = getKey(row);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const getHomeContent = async (req, res) => {
  try {
    const bannerRows = await Banner.find({ is_active: true })
      .select('id title subtitle eyebrow image_url cta_text cta_link')
      .sort({ sort_order: 1, _id: 1 })
      .lean();

    const testimonialRows = await Testimonial.find({ is_active: true })
      .select('id customer_name customer_role comment rating avatar_url city')
      .sort({ sort_order: 1, _id: 1 })
      .lean();

    // Map `_id` to `id` for lean documents
    const mappedBanners = bannerRows.map(b => ({ ...b, id: b._id }));
    const mappedTestimonials = testimonialRows.map(t => ({ ...t, id: t._id }));

    const banners = uniqueBy(mappedBanners, (banner) => banner.title);
    const testimonials = uniqueBy(
      mappedTestimonials,
      (testimonial) => `${testimonial.customer_name}-${testimonial.comment}`
    );

    res.json({
      success: true,
      data: {
        banners,
        testimonials
      }
    });
  } catch (error) {
    console.error('Content Error:', error);
    res.status(500).json({ success: false, message: error.message, stack: error.stack });
  }
};

module.exports = {
  getHomeContent
};
