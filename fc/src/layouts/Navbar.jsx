import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../features/authSlice';
import { Menu, X, User as UserIcon } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <nav className="sticky top-0 z-50 glass">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-extrabold text-gradient">
              Servix
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">Home</Link>
            <Link to="/services" className="text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">Services</Link>
            {isAuthenticated && user?.role === 'user' && (
              <Link to="/post-task" className="text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">Post Task</Link>
            )}
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link to={`/dashboard/${user?.role}`} className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">
                  <UserIcon size={20} />
                  <span>Dashboard</span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="btn-ghost px-4 py-2 text-rose-600"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-primary hover:text-primary/80 transition-colors font-medium">Login</Link>
                <Link to="/register" className="btn-primary px-5 py-2">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-600 dark:text-slate-300 hover:text-primary focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden bg-white/95 dark:bg-dark-light/95 backdrop-blur-xl border-t border-slate-100 dark:border-white/5 shadow-xl absolute top-16 w-full left-0 right-0 z-40"
          >
            <div className="px-5 pt-3 pb-7 space-y-4">
              <Link 
                onClick={() => setIsOpen(false)}
                to="/" 
                className="block text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary transition-colors py-1 border-b border-slate-50 dark:border-slate-800/40"
              >
                Home
              </Link>
              <Link 
                onClick={() => setIsOpen(false)}
                to="/services" 
                className="block text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary transition-colors py-1 border-b border-slate-50 dark:border-slate-800/40"
              >
                Services
              </Link>
              {isAuthenticated && user?.role === 'user' && (
                <Link 
                  onClick={() => setIsOpen(false)}
                  to="/post-task" 
                  className="block text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary transition-colors py-1 border-b border-slate-50 dark:border-slate-800/40"
                >
                  Post Task
                </Link>
              )}
              {isAuthenticated ? (
                <>
                  <Link 
                    onClick={() => setIsOpen(false)}
                    to={`/dashboard/${user?.role}`} 
                    className="block text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary transition-colors py-1 border-b border-slate-50 dark:border-slate-800/40"
                  >
                    Dashboard
                  </Link>
                  <button 
                    onClick={() => {
                      setIsOpen(false);
                      handleLogout();
                    }} 
                    className="block w-full text-left text-sm font-bold text-rose-650 hover:text-rose-500 transition-colors py-1 cursor-pointer"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="pt-2 space-y-3">
                  <Link 
                    onClick={() => setIsOpen(false)}
                    to="/login" 
                    className="block text-center text-sm font-bold text-primary hover:text-blue-705 transition-colors py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30"
                  >
                    Login
                  </Link>
                  <Link 
                    onClick={() => setIsOpen(false)}
                    to="/register" 
                    className="block text-center text-sm font-bold bg-primary hover:bg-blue-700 text-white transition-all py-3 rounded-xl shadow-md shadow-primary/10"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
