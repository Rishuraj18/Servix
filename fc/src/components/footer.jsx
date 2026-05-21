import { Link } from 'react-router-dom';
import { 
  Mail, 
  Phone, 
  MapPin, 
  ArrowRight,
  Shield,
  Clock,
  Star,
  Zap,
  ChevronRight
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white mt-8">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap size={28} className="text-amber-400" />
              <span className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Servix
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Premium home services delivered by verified professionals. Quality service, guaranteed.
            </p>
            <div className="flex items-center gap-2 text-amber-400 text-sm">
              <Shield size={16} />
              <span>100% Satisfaction Guaranteed</span>
            </div>
          </div>

          {/* Quick Links */}
          {/* <div>
            <h3 className="text-lg font-semibold mb-4 relative inline-block">
              Quick Links
              <span className="absolute -bottom-2 left-0 w-12 h-0.5 bg-amber-400 rounded-full"></span>
            </h3>
            <ul className="space-y-3">
              {['About Us', 'Services', 'How It Works', 'Pricing', 'Contact Us'].map((item) => (
                <li key={item}>
                  <Link 
                    to={`/${item.toLowerCase().replace(/\s+/g, '')}`}
                    className="text-gray-400 hover:text-amber-400 transition-colors duration-300 flex items-center gap-2 text-sm group"
                  >
                    <ChevronRight size={14} className="text-amber-400 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div> */}

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4 relative inline-block">
              Contact Us
              <span className="absolute -bottom-2 left-0 w-12 h-0.5 bg-amber-400 rounded-full"></span>
            </h3>
            <ul className="space-y-4">
              <li>
                <a 
                  href="mailto:support@servix.com"
                  className="flex items-center gap-3 text-gray-400 hover:text-amber-400 transition-colors duration-300 group"
                >
                  <div className="bg-white/10 p-2 rounded-lg group-hover:bg-amber-400 group-hover:text-slate-900 transition-all duration-300">
                    <Mail size={16} />
                  </div>
                  <span className="text-sm">support@servix.com</span>
                </a>
              </li>
              <li>
                <a 
                  href="tel:+917261024952"
                  className="flex items-center gap-3 text-gray-400 hover:text-amber-400 transition-colors duration-300 group"
                >
                  <div className="bg-white/10 p-2 rounded-lg group-hover:bg-amber-400 group-hover:text-slate-900 transition-all duration-300">
                    <Phone size={16} />
                  </div>
                  <span className="text-sm">+91 7261024952</span>
                </a>
              </li>
              <li className="flex items-center gap-3 text-gray-400">
                <div className="bg-white/10 p-2 rounded-lg mt-0.5">
                  <MapPin size={16} />
                </div>
                <span className="text-sm">Ramnagariya, Jagatpura, Jaipur, Rajasthan, India – 302017</span>
              </li>
            </ul>
          </div>

          {/* Business Hours & Trust Badges */}
          <div>
            <h3 className="text-lg font-semibold mb-4 relative inline-block">
              We're Here For You
              <span className="absolute -bottom-2 left-0 w-12 h-0.5 bg-amber-400 rounded-full"></span>
            </h3>
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Monday - Friday:</span>
                <span className="text-white font-medium">8:00 AM - 10:00 PM</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Saturday - Sunday:</span>
                <span className="text-white font-medium">9:00 AM - 8:00 PM</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Emergency Support:</span>
                <span className="text-amber-400 font-medium">24/7 Available</span>
              </div>
            </div>
            
            {/* Trust Badges */}
            {/* <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="bg-white/5 px-2 py-2 rounded-lg text-center hover:bg-white/10 transition-all duration-300">
                <Shield size={18} className="mx-auto mb-1 text-amber-400" />
                <p className="text-[10px] text-gray-400">Verified Pros</p>
              </div>
              <div className="bg-white/5 px-2 py-2 rounded-lg text-center hover:bg-white/10 transition-all duration-300">
                <Clock size={18} className="mx-auto mb-1 text-amber-400" />
                <p className="text-[10px] text-gray-400">On-Time</p>
              </div>
              <div className="bg-white/5 px-2 py-2 rounded-lg text-center hover:bg-white/10 transition-all duration-300">
                <Star size={18} className="mx-auto mb-1 text-amber-400" />
                <p className="text-[10px] text-gray-400">4.9 Rating</p>
              </div>
            </div> */}
          </div>
        </div>

        {/* Newsletter Section */}
        {/* <div className="mt-12 pt-8 border-t border-white/10">
          <div className="max-w-md mx-auto text-center">
            <h3 className="text-lg font-semibold mb-2">Subscribe to our newsletter</h3>
            <p className="text-gray-400 text-sm mb-4">Get exclusive offers and service updates</p>
            <form className="flex flex-col sm:flex-row gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-amber-400 transition-colors"
                required
              />
              <button 
                type="submit"
                className="px-6 py-2.5 bg-amber-400 text-slate-900 rounded-lg font-semibold hover:bg-amber-500 transition-all duration-300 hover:scale-105"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div> */}

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
            <p>© {currentYear} Servix. All rights reserved.</p>
            <div className="flex gap-6">
              <Link to="/privacy" className="hover:text-amber-400 transition-colors duration-300">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-amber-400 transition-colors duration-300">Terms of Service</Link>
              <Link to="/refund" className="hover:text-amber-400 transition-colors duration-300">Refund Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;