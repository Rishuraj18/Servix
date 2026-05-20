const db = require('../config/db');

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
    const [bannerRows] = await db.query(
      `SELECT id, title, subtitle, eyebrow, image_url, cta_text, cta_link
       FROM banners
       WHERE is_active = TRUE
       ORDER BY sort_order ASC, id ASC`
    );

    const [testimonialRows] = await db.query(
      `SELECT id, customer_name, customer_role, comment, rating, avatar_url, city
       FROM testimonials
       WHERE is_active = TRUE
       ORDER BY sort_order ASC, id ASC`
    );

    const banners = uniqueBy(bannerRows, (banner) => banner.title);
    const testimonials = uniqueBy(
      testimonialRows,
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
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getHomeContent
};
