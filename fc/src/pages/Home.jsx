import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  Droplets,
  PaintRoller,
  PenTool,
  Search,
  Shield,
  Snowflake,
  Sparkles,
  Star,
  Wrench,
  Zap,
  Bug,
  Quote,
  CheckCircle,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import Footer from '../components/footer';

const serviceCards = [
  { name: 'Electrician', icon: Zap, tone: 'bg-amber-50 text-amber-600', copy: 'Wiring, switches, faults' },
  { name: 'Plumbing', icon: Droplets, tone: 'bg-sky-50 text-sky-600', copy: 'Leaks, fittings, blocks' },
  { name: 'AC Repair', icon: Snowflake, tone: 'bg-cyan-50 text-cyan-600', copy: 'Cooling, cleaning, service' },
  { name: 'Carpenter', icon: PenTool, tone: 'bg-orange-50 text-orange-600', copy: 'Furniture and fixtures' },
  { name: 'Painting', icon: PaintRoller, tone: 'bg-violet-50 text-violet-600', copy: 'Rooms and full homes' },
  { name: 'Cleaning', icon: Sparkles, tone: 'bg-emerald-50 text-emerald-600', copy: 'Deep cleaning experts' },
  { name: 'Pest Control', icon: Bug, tone: 'bg-rose-50 text-rose-600', copy: 'Safe pest treatments' },
  
];

const Home = () => {
  const [query, setQuery] = useState('');
  const [content, setContent] = useState({ banners: [], testimonials: [] });
  const [loading, setLoading] = useState(true);
  const [activeBanner, setActiveBanner] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/content/home')
      .then((res) => {
        let bannersData = [];
        let testimonialsData = [];
        
        const data = res.data?.data || res.data || {};
        
        // Handle banners
        if (data.banners && Array.isArray(data.banners) && data.banners.length > 0) {
          bannersData = data.banners;
        } else if (data.banner && Array.isArray(data.banner) && data.banner.length > 0) {
          bannersData = data.banner;
        }
        
        // Handle testimonials
        if (data.testimonials && Array.isArray(data.testimonials) && data.testimonials.length > 0) {
          testimonialsData = data.testimonials;
        } else if (data.reviews && Array.isArray(data.reviews) && data.reviews.length > 0) {
          testimonialsData = data.reviews.map(review => ({
            customer_name: review.name || review.customer_name,
            customer_role: review.role || review.customer_role || 'Customer',
            comment: review.comment || review.message || review.text,
            rating: review.rating || 5,
            city: review.city || 'Unknown',
            avatar_url: review.avatar_url || review.avatar,
          }));
        }
        
        setContent({
          banners: bannersData,
          testimonials: testimonialsData,
        });
      })
      .catch((error) => {
        console.error('Error fetching home content:', error);
        setContent({ 
          banners: [], 
          testimonials: [] 
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (content.banners.length > 0) {
      const timer = setInterval(() => {
        setActiveBanner((current) => (current + 1) % content.banners.length);
      }, 5200);
      return () => clearInterval(timer);
    }
  }, [content.banners.length]);

  const banner = content.banners[activeBanner];
  const metrics = useMemo(() => [
    { value: '4.9/5', label: 'Average service rating' },
    { value: '30 min', label: 'Typical first response' },
    { value: '100%', label: 'Admin-approved pros' },
  ], []);

  const search = (e) => {
    e.preventDefault();
    navigate(query.trim() ? `/services?search=${encodeURIComponent(query.trim())}` : '/services');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-2">
      {/* Desktop Layout (visible on lg screens and above) */}
      <div className="hidden lg:block">
        {banner && (
          <section className="relative min-h-[560px] overflow-hidden ">
            <img
              src={banner.image_url}
              alt={banner.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/75 to-slate-950/25" />

            <div className="relative z-10 grid min-h-[560px] lg:grid-cols-[1.05fr_0.95fr] gap-8 items-end p-5 md:p-10">
              <motion.div
                key={banner.title}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="max-w-3xl pb-4 md:pb-8"
              >
                <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-sm font-semibold text-white ring-1 ring-white/20">
                  <BadgeCheck size={16} />
                  {banner.eyebrow}
                </div>
                <h1 className="mt-5 text-4xl md:text-6xl font-extrabold leading-tight text-white">
                  {banner.title}
                </h1>
                <p className="mt-5 max-w-2xl text-base md:text-lg text-slate-200">
                  {banner.subtitle}
                </p>

                <form onSubmit={search} className="mt-7 flex max-w-2xl items-center rounded-xl bg-white p-2 shadow-2xl">
                  <Search className="ml-3 shrink-0 text-slate-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search electrician, painting, cleaning..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-transparent px-3 py-3 text-slate-900 outline-none"
                  />
                  <button className="btn-primary px-5 py-3" type="submit">
                    Search
                  </button>
                </form>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link to={banner.cta_link || '/services'} className="btn-primary px-5 py-3">
                    {banner.cta_text || 'Book a service'} <ArrowRight size={18} />
                  </Link>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="hidden lg:block"
              >
                <div className="rounded-2xl bg-white/12 p-4 backdrop-blur-md ring-1 ring-white/20">
                  <div className="grid grid-cols-3 gap-3">
                    {metrics.map((metric) => (
                      <div key={metric.label} className="rounded-xl bg-white p-4">
                        <p className="text-2xl font-extrabold text-slate-950">{metric.value}</p>
                        <p className="mt-1 text-xs font-medium text-slate-500">{metric.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-xl bg-slate-950/70 p-4 text-white">
                    <p className="text-sm font-semibold">Live workflow</p>
                    <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
                      {['Request', 'Approve', 'Assign', 'Complete'].map((step) => (
                        <span key={step} className="rounded-lg bg-white/10 px-3 py-2 text-center">
                          {step}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
              {content.banners.map((item, index) => (
                <button
                  key={item.id || item.title}
                  onClick={() => setActiveBanner(index)}
                  className={`h-2.5 rounded-full transition-all ${activeBanner === index ? 'w-8 bg-white' : 'w-2.5 bg-white/45 hover:bg-white/70'}`}
                  aria-label={`Show banner ${index + 1}`}
                />
              ))}
            </div>
          </section>
        )}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 py-5 px-4">
          {[
            { icon: Shield, title: 'Admin-approved professionals', text: 'Workers can accept jobs only after verification.' },
            { icon: Clock, title: 'Live booking status', text: 'Track request, accepted, working, and completed stages.' },
            { icon: Star, title: 'Premium service standard', text: 'Skill matching keeps every job relevant and accountable.' },
          ].map(({ icon: Icon, title, text }) => (
            <motion.div key={title} whileHover={{ y: -3 }} className="glass-card p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-primary">
                  <Icon size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-950 dark:text-white">{title}</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{text}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </section>

        <section className="py-5 px-4">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-primary">Most booked</p>
              <h2 className="section-title mt-1">Premium services for every room</h2>
            </div>
            <Link to="/services" className="hidden sm:inline-flex items-center gap-1 font-semibold text-primary">
              View all <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {serviceCards.map(({ name, icon: Icon, tone, copy }, index) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ delay: index * 0.03 }}
              >
                <Link to={`/services?search=${encodeURIComponent(name)}`} className="glass-card group block h-full p-5 hover:-translate-y-1 hover:shadow-md transition-all">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${tone}`}>
                    <Icon size={24} />
                  </div>
                  <h3 className="mt-5 font-bold text-slate-950 dark:text-white">{name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{copy}</p>
                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-semibold text-primary dark:border-slate-800">
                    <span>Explore</span>
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="grid lg:grid-cols-[0.9fr_1.1fr] gap-5 py-5 px-2">
          <div className="glass-card overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1200&q=80"
              alt="Premium home cleaning and repair service"
              className="h-36 w-full object-cover lg:h-full"
            />
          </div>
          <div className="glass-card p-6 md:p-8">
            <p className="text-sm font-semibold text-primary">How Servix works</p>
            <h2 className="section-title mt-1">A service flow that feels organized from the first click</h2>
            <div className="mt-6 space-y-4">
              {[
                ['Choose the right profession', 'Pick the service category and tell us the actual issue.'],
                ['Get matched with approved professionals', 'Only verified workers with matching skills can accept the request.'],
                ['Track every stage', 'See pending, accepted, on-the-way, working, and completed updates.'],
              ].map(([title, text], index) => (
                <div key={title} className="flex gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-950 dark:text-white">{title}</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{text}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/services" className="btn-primary mt-7 px-5 py-3">
              Start booking <ArrowRight size={18} />
            </Link>
          </div>
        </section>

        <section className="py-5 px-4">
          <div className="mb-5 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-primary">Customer stories</p>
              <h2 className="section-title mt-1">People trust Servix for work that needs care</h2>
            </div>
            <div className="flex items-center gap-1 text-amber-500">
              {[1, 2, 3, 4, 5].map((item) => <Star key={item} size={18} fill="currentColor" />)}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {content.testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id || testimonial.customer_name}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="glass-card p-5"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={testimonial.avatar_url}
                    alt={testimonial.customer_name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-bold text-slate-950 dark:text-white">{testimonial.customer_name}</p>
                    <p className="text-xs text-slate-500">{testimonial.customer_role} · {testimonial.city}</p>
                  </div>
                </div>
                <div className="mt-4 flex text-amber-500">
                  {Array.from({ length: testimonial.rating || 5 }).map((_, item) => (
                    <Star key={item} size={15} fill="currentColor" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  "{testimonial.comment}"
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="relative mt-5 overflow-hidden  bg-slate-950 p-6 md:p-8 text-white">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 md:block">
            <img
              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"
              alt="Modern premium home interior"
              className="h-full w-full object-cover opacity-55"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 to-transparent" />
          </div>
          <div className="relative z-10 max-w-xl">
            <p className="text-sm font-semibold text-blue-200">Ready when your home needs attention</p>
            <h2 className="mt-2 text-3xl font-extrabold">Book approved help without the contractor chaos</h2>
            <p className="mt-3 text-slate-300">Create a request, see updates live, and track the job until completion.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/services" className="btn-primary px-5 py-3">Book now</Link>
            </div>
          </div>
        </section>
      </div>

      {/* Mobile Layout (visible on screens smaller than lg) */}
      <div className="block lg:hidden">
        {banner && (
          <>
            {/* Premium Hero Section for Mobile */}
            <section className="relative overflow-hidden">
              <div className="absolute inset-0">
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#fefaf5] via-transparent to-transparent" />
              </div>

              <div className="relative px-5 pt-12 pb-20">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeBanner}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-5"
                  >
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-md px-4 py-2 border border-white/30">
                      <BadgeCheck size={16} className="text-white" />
                      <span className="text-xs font-semibold tracking-wide text-white">{banner.eyebrow}</span>
                    </div>
                    
                    <h1 className="text-3xl font-bold leading-tight text-white whitespace-pre-line">
                      {banner.title.length > 50 ? banner.title.substring(0, 50) + '...' : banner.title}
                    </h1>
                    
                    <p className="text-sm text-white/90 leading-relaxed">
                      {banner.subtitle.length > 100 ? banner.subtitle.substring(0, 100) + '...' : banner.subtitle}
                    </p>

                    <form onSubmit={search} className="mt-6">
                      <div className="relative flex items-center bg-white rounded-2xl shadow-2xl overflow-hidden border border-white/20">
                        <Search className="absolute left-4 text-gray-400" size={18} />
                        <input
                          type="text"
                          placeholder="Search electrician, plumber..."
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          className="w-full bg-transparent pl-11 pr-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none text-sm"
                        />
                        <button 
                          type="submit"
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#1a2c2e] text-white px-4 py-1.5 rounded-xl font-semibold text-xs"
                        >
                          Search
                        </button>
                      </div>
                    </form>

                    <Link 
                      to={banner.cta_link || '/services'} 
                      className="inline-flex items-center gap-2 bg-white text-gray-900 px-5 py-2.5 rounded-full font-semibold shadow-lg text-sm"
                    >
                      {banner.cta_text || 'Book a service'} 
                      <ArrowRight size={16} />
                    </Link>
                  </motion.div>
                </AnimatePresence>

                <div className="grid grid-cols-3 gap-2 mt-6">
                  {metrics.map((metric) => (
                    <div key={metric.label} className="bg-white/95 backdrop-blur-sm rounded-xl p-2.5 shadow-lg border border-white/40">
                      <p className="text-base font-black text-gray-900">{metric.value}</p>
                      <p className="text-[10px] text-gray-600 mt-0.5 font-medium">{metric.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                {content.banners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveBanner(index)}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      activeBanner === index 
                        ? 'w-6 bg-white' 
                        : 'w-1 bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </section>
          </>
        )}

        {/* Features Section for Mobile */}
        <section className="px-4 py-6">
          <div className="space-y-3">
            <div className="bg-blue-50 rounded-xl p-3.5 border border-blue-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Shield size={18} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    Verified professionals
                  </h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Background-checked and insured
                  </p>
                </div>
                <CheckCircle size={16} className="text-blue-500" />
              </div>
            </div>

            <div className="bg-amber-50 rounded-xl p-3.5 border border-amber-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Clock size={18} className="text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    Real-time tracking
                  </h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Live updates from booking to completion
                  </p>
                </div>
                <CheckCircle size={16} className="text-amber-500" />
              </div>
            </div>

            <div className="bg-emerald-50 rounded-xl p-3.5 border border-emerald-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Star size={18} className="text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    Premium guarantee
                  </h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    100% satisfaction or money back
                  </p>
                </div>
                <CheckCircle size={16} className="text-emerald-500" />
              </div>
            </div>
          </div>
        </section>

        {/* Services Grid for Mobile */}
        <section className="px-4 py-4">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-[11px] font-semibold text-[#1a2c2e] uppercase tracking-wider">Most booked</p>
              <h2 className="text-xl font-bold text-gray-900 mt-0.5">Premium services</h2>
            </div>
            <Link to="/services" className="text-xs font-semibold text-[#1a2c2e] flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {serviceCards.map(({ name, icon: Icon, tone, copy }) => (
              <Link 
                key={name}
                to={`/services?search=${encodeURIComponent(name)}`}
                className="block bg-white rounded-xl p-3 shadow-sm border border-gray-100"
              >
                <div className={`inline-flex p-2 rounded-lg ${tone} mb-2`}>
                  <Icon size={18} />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">{name}</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">{copy}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* How It Works for Mobile */}
        <section className="px-4 py-6">
          <div className="rounded-2xl overflow-hidden shadow-md border border-gray-100">
            <img
              src="https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1200&q=80"
              alt="Premium home cleaning and repair service"
              className="h-40 w-full object-cover"
            />
          </div>

          <div className="mt-4 rounded-2xl p-5 text-white bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 shadow-xl border border-white/10">
            <p className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider">
              Simple process
            </p>
            <h2 className="text-xl font-bold mt-1 mb-5">
              How Servix works
            </h2>

            <div className="space-y-4">
              {[
                { step: '01', title: 'Describe your need', text: 'Tell us what service you need' },
                { step: '02', title: 'Get matched', text: 'We connect you with verified experts' },
                { step: '03', title: 'Track & relax', text: 'Live updates until completion' },
              ].map((item, idx) => (
                <div key={idx} className="flex gap-3 items-start group">
                  <div className="text-3xl font-black text-amber-300/40 w-10 leading-none">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm group-hover:text-amber-200 transition">
                      {item.title}
                    </h3>
                    <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                  <ArrowRight size={14} className="text-amber-300/70 mt-1 group-hover:translate-x-1 transition" />
                </div>
              ))}
            </div>

            <Link
              to="/services"
              className="block text-center mt-6 py-3 rounded-xl font-semibold text-sm bg-white text-gray-900 hover:bg-gray-100 transition active:scale-[0.98]"
            >
              Start booking
            </Link>
          </div>
        </section>

        {/* Testimonials for Mobile - Using backend data */}
        {content.testimonials.length > 0 && (
          <section className="px-4 py-4">
            <div className="mb-4">
              <p className="text-[11px] font-semibold text-[#1a2c2e] uppercase tracking-wider">Testimonials</p>
              <h2 className="text-xl font-bold text-gray-900 mt-0.5">What our customers say</h2>
            </div>

            <div className="space-y-3">
              {content.testimonials.slice(0, 3).map((testimonial, index) => (
                <div key={testimonial.id || testimonial.customer_name || index} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <Quote size={20} className="text-[#1a2c2e]/20 mb-2" />
                  <p className="text-gray-700 leading-relaxed text-xs">
                    "{testimonial.comment && testimonial.comment.length > 100 
                      ? testimonial.comment.substring(0, 100) + '...' 
                      : testimonial.comment}"
                  </p>
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100">
                    <img 
                      src={testimonial.avatar_url} 
                      alt={testimonial.customer_name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-gray-900 text-xs">{testimonial.customer_name}</p>
                      <p className="text-[10px] text-gray-500">{testimonial.city}</p>
                    </div>
                    <div className="flex ml-auto text-amber-400 gap-0.5">
                      {[...Array(testimonial.rating || 5)].map((_, i) => (
                        <Star key={i} size={10} fill="currentColor" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA Banner for Mobile */}
        <section className="px-4 py-3">
          <div className="bg-gradient-to-r from-[#1a2c2e] to-[#2a3e40] rounded-2xl p-5 text-white shadow-xl">
            <h3 className="text-lg font-bold mb-1">Ready for premium service?</h3>
            <p className="text-white/80 text-xs mb-4">Join thousands of happy homeowners</p>
            <Link to="/services" className="inline-flex items-center gap-2 bg-white text-gray-900 px-5 py-2.5 rounded-full font-semibold shadow-lg text-sm">
              Book now <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      </div>
      <Footer/>
    </div>
  );
};

export default Home;