import { motion } from 'framer-motion';
import { FileCheck, BookOpen, AlertCircle, Scale } from 'lucide-react';

const Terms = () => {
  return (
    <div className="min-h-screen py-8 md:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10 md:mb-16"
      >
        <div className="flex justify-center mb-4 md:mb-6">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-primary -rotate-3">
            <FileCheck className="w-6 h-6 md:w-8 md:h-8" />
          </div>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-3 md:mb-4 tracking-tight">
          Terms of <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Service</span>
        </h1>
        <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto px-2">
          Please read these terms carefully before using our platform. They contain important information about your rights and obligations.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8 mb-10 md:mb-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/50 dark:border-white/10 shadow-lg shadow-slate-200/20 dark:shadow-black/20"
        >
          <BookOpen className="text-primary mb-4" size={28} />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Usage Rules</h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Clear guidelines on what constitutes acceptable use of our service platform.</p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/50 dark:border-white/10 shadow-lg shadow-slate-200/20 dark:shadow-black/20"
        >
          <Scale className="text-primary mb-4" size={28} />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Fair Resolutions</h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Structured processes for dispute resolution and maintaining fairness for everyone.</p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/50 dark:border-white/10 shadow-lg shadow-slate-200/20 dark:shadow-black/20"
        >
          <AlertCircle className="text-primary mb-4" size={28} />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Liability</h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Understanding our responsibilities and limitations as a platform provider.</p>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-3xl p-5 sm:p-8 md:p-12 rounded-2xl md:rounded-3xl border border-white/20 shadow-2xl shadow-slate-200/30 dark:shadow-black/30"
      >
        <div className="prose prose-sm sm:prose-base md:prose-lg prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white prose-p:text-slate-600 dark:prose-p:text-slate-300">
          <h2>1. Agreement to Terms</h2>
          <p>
            By accessing or using our Services, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Services.
          </p>
          
          <h2>2. The Platform</h2>
          <p>
            Servix provides a platform that connects users seeking home services with independent service professionals. Servix does not provide these services itself and is not responsible for the work performed by the service professionals.
          </p>

          <h2>3. User Accounts</h2>
          <p>
            You must create an account to use most features of the Services. You are responsible for safeguarding your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
          </p>

          <h2>4. Payments</h2>
          <p>
            Users are required to pay for the services booked through the platform. Prices are displayed upfront, and we use secure third-party payment processors. Servix may charge a service fee for facilitating the transaction.
          </p>

          <h2>5. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Servix shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Terms;
