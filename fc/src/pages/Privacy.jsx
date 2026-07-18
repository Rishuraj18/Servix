import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText } from 'lucide-react';

const Privacy = () => {
  return (
    <div className="min-h-screen py-8 md:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10 md:mb-16"
      >
        <div className="flex justify-center mb-4 md:mb-6">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-primary rotate-3">
            <Shield className="w-6 h-6 md:w-8 md:h-8" />
          </div>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-3 md:mb-4 tracking-tight">
          Privacy <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Policy</span>
        </h1>
        <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto px-2">
          Your privacy is critically important to us. Learn how we collect, use, and protect your personal information.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8 mb-10 md:mb-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/50 dark:border-white/10 shadow-lg shadow-slate-200/20 dark:shadow-black/20"
        >
          <Lock className="text-primary mb-4" size={28} />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Secure Data</h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm">We use enterprise-grade encryption to ensure your data is always safe and secure.</p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/50 dark:border-white/10 shadow-lg shadow-slate-200/20 dark:shadow-black/20"
        >
          <Eye className="text-primary mb-4" size={28} />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Total Transparency</h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm">We are completely open about what data we collect and why we need it.</p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/50 dark:border-white/10 shadow-lg shadow-slate-200/20 dark:shadow-black/20"
        >
          <FileText className="text-primary mb-4" size={28} />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Your Rights</h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm">You have complete control over your data. You can delete or modify it anytime.</p>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-3xl p-5 sm:p-8 md:p-12 rounded-2xl md:rounded-3xl border border-white/20 shadow-2xl shadow-slate-200/30 dark:shadow-black/30"
      >
        <div className="prose prose-sm sm:prose-base md:prose-lg prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white prose-p:text-slate-600 dark:prose-p:text-slate-300">
          <h2>1. Information We Collect</h2>
          <p>
            When you use Servix, we collect information you provide directly to us, such as when you create or modify your account, request services, contact customer support, or otherwise communicate with us. This may include your name, email address, phone number, postal address, and profile picture.
          </p>
          
          <h2>2. How We Use Your Information</h2>
          <p>
            We use the information we collect to provide, maintain, and improve our services, including to facilitate payments, send receipts, provide products and services you request (and send related information), develop new features, provide customer support, and develop safety features.
          </p>

          <h2>3. Sharing of Information</h2>
          <p>
            We may share the information we collect about you with service providers who need access to such information to carry out work on our behalf. We may also share it in response to a request for information if we believe disclosure is in accordance with, or required by, any applicable law or legal process.
          </p>

          <h2>4. Security</h2>
          <p>
            We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Privacy;
