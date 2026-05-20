// /* eslint-disable react-hooks/set-state-in-effect */
// import { useState, useEffect } from 'react';
// import { useSearchParams, useNavigate } from 'react-router-dom';
// import { useSelector } from 'react-redux';
// import { motion } from 'framer-motion';
// import { MapPin, IndianRupee, Send, Phone, CreditCard, Sparkles } from 'lucide-react';
// import api from '../api/client';

// const PostTask = () => {
//   const [searchParams] = useSearchParams();
//   const categoryParams = searchParams.get('category');
//   const serviceIdParam = searchParams.get('serviceId');
//   const { isAuthenticated, user } = useSelector((state) => state.auth);
//   const navigate = useNavigate();
//   const [services, setServices] = useState([]);
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);

//   const [formData, setFormData] = useState({
//     service_id: serviceIdParam || '',
//     category: categoryParams || '',
//     description: '',
//     address: user?.address || '',
//     budget: '',
//     urgency: 'medium',
//     date: '',
//     time: '',
//     contact_phone: user?.phone || '',
//     payment_method: 'cod'
//   });

//   useEffect(() => {
//     if (!isAuthenticated) navigate('/login');
//   }, [isAuthenticated, navigate]);

//   useEffect(() => {
//     api.get('/services')
//       .then((res) => setServices(res.data.data || []))
//       .catch(() => setServices([]));
//   }, []);

//   useEffect(() => {
//     if (user?.phone && !formData.contact_phone) {
//       setFormData((prev) => ({ ...prev, contact_phone: user.phone }));
//     }
//     if (user?.address && !formData.address) {
//       setFormData((prev) => ({ ...prev, address: user.address }));
//     }
//   }, [user]);

//   const selectedService = services.find((service) => String(service.id) === String(formData.service_id));

//   const [selectedFiles, setSelectedFiles] = useState([]);

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleFileChange = (e) => {
//     setSelectedFiles([...e.target.files]);
//   };

//   // Dynamically load Razorpay checkout script
//   const loadRazorpayScript = () => {
//     return new Promise((resolve) => {
//       const script = document.createElement('script');
//       script.src = 'https://checkout.razorpay.com/v1/checkout.js';
//       script.onload = () => resolve(true);
//       script.onerror = () => resolve(false);
//       document.body.appendChild(script);
//     });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     setLoading(true);

//     try {
//       // 1. Prepare form data to send
//       const data = new FormData();
//       data.append('service_id', formData.service_id);
//       data.append('category', formData.category);
//       data.append('description', formData.description);
//       data.append('address', formData.address);
//       data.append('budget', formData.budget);
//       data.append('urgency_level', formData.urgency);
//       data.append('date', formData.date);
//       data.append('time', formData.time);
//       data.append('contact_phone', formData.contact_phone);
//       data.append('payment_method', formData.payment_method);
//       data.append('payment_status', formData.payment_method === 'cod' ? 'pending' : 'pending');

//       selectedFiles.forEach((file) => {
//         data.append('issue_images', file);
//       });

//       // 2. Post Booking to DB
//       const bookingRes = await api.post('/bookings', data, {
//         headers: {
//           'Content-Type': 'multipart/form-data'
//         }
//       });

//       const newBooking = bookingRes.data.data;
//       const bookingId = newBooking.id;

//       // 3. Handle Payment Method Selection
//       if (formData.payment_method === 'cod') {
//         // COD path completes immediately
//         setLoading(false);
//         navigate('/dashboard/user');
//       } else {
//         // Online path triggers Razorpay checkout window
//         const scriptLoaded = await loadRazorpayScript();
//         if (!scriptLoaded) {
//           setError('Failed to load payment gateway checkout window. Please verify your internet connection.');
//           setLoading(false);
//           return;
//         }

//         // Call backend to create Razorpay Order
//         const orderRes = await api.post('/payments/create-order', {
//           amount: Number(formData.budget),
//           booking_id: bookingId
//         });

//         const order = orderRes.data.order;

//         const options = {
//           key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_zO3lS8yFmU0g9O', // Default safe test keys
//           amount: order.amount,
//           currency: order.currency,
//           name: 'Servix Marketplace',
//           description: `Booking token: ${newBooking.service_token}`,
//           order_id: order.id,
//           handler: async (response) => {
//             try {
//               setLoading(true);
//               // Verify razorpay signature on backend
//               const verifyRes = await api.post('/payments/verify', {
//                 razorpay_order_id: response.razorpay_order_id,
//                 razorpay_payment_id: response.razorpay_payment_id,
//                 razorpay_signature: response.razorpay_signature
//               });

//               if (verifyRes.data.success) {
//                 // Update booking status in database to completed payment
//                 await api.patch(`/bookings/${bookingId}/status`, {
//                   payment_status: 'completed'
//                 });
//                 navigate('/dashboard/user');
//               } else {
//                 setError('Payment signature verification failed. Please contact Support.');
//               }
//             } catch (err) {
//               console.error(err);
//               setError('Error verifying payment details with gateway server.');
//             } finally {
//               setLoading(false);
//             }
//           },
//           prefill: {
//             name: user?.name || '',
//             email: user?.email || '',
//             contact: formData.contact_phone || user?.phone || ''
//           },
//           theme: {
//             color: '#4F46E5'
//           }
//         };

//         const rzp = new window.Razorpay(options);
//         rzp.open();
//         setLoading(false);
//       }

//     } catch (err) {
//       setError(err.response?.data?.message || 'Unable to post task. Check fields and try again.');
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="max-w-5xl mx-auto py-4">
//       <div className="grid lg:grid-cols-5 gap-5">
//         <div className="lg:col-span-2">
//           <p className="text-sm font-semibold text-primary">Create booking</p>
//           <h1 className="section-title mt-1">Tell us what needs fixing</h1>
//           <p className="text-slate-600 dark:text-slate-400 mt-2">
//             Add the service, address, and timing. Verified professionals with matching skills will receive the request.
//           </p>

//           <div className="glass-card p-5 mt-5">
//             <p className="text-sm text-slate-500">Selected service</p>
//             <h2 className="text-xl font-bold mt-1">{selectedService?.name || 'Choose from services'}</h2>
//             <p className="text-sm text-slate-500 mt-2">{selectedService?.category || 'Profession category'} · Starts at Rs. {Number(selectedService?.base_price || 0)}</p>
//           </div>
//         </div>

//         <motion.form
//           onSubmit={handleSubmit}
//           initial={{ opacity: 0, y: 14 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="lg:col-span-3 glass-card p-5 space-y-4"
//         >
//           {error && (
//             <div className="bg-rose-50 border border-rose-100 text-rose-700 px-4 py-3 rounded-lg text-sm">
//               {error}
//             </div>
//           )}

//           <div className="grid md:grid-cols-2 gap-4">
//             <label className="block">
//               <span className="text-sm font-medium">Service</span>
//               <select
//                 name="service_id"
//                 value={formData.service_id}
//                 onChange={(e) => {
//                   const selected = services.find((service) => String(service.id) === e.target.value);
//                   setFormData({ ...formData, service_id: e.target.value, category: selected?.category || '' });
//                 }}
//                 required
//                 className="field mt-1"
//               >
//                 <option value="">Select service</option>
//                 {services.map((service) => (
//                   <option key={service.id} value={service.id}>
//                     {service.name} - {service.category}
//                   </option>
//                 ))}
//               </select>
//             </label>

//             <label className="block">
//               <span className="text-sm font-medium">Estimated budget</span>
//               <div className="relative mt-1">
//                 <IndianRupee
//                   className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
//                   size={18}
//                 />
//                 {!formData.budget && (
//                   <span className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
//                     500
//                   </span>
//                 )}
//                 <input
//                   type="number"
//                   name="budget"
//                   value={formData.budget}
//                   onChange={handleChange}
//                   required
//                   className="field pl-10"
//                 />
//               </div>
//             </label>
//           </div>

//           <div className="grid md:grid-cols-2 gap-4">
//             <label className="block">
//               <span className="text-sm font-medium flex items-center gap-1.5"><Phone size={14} className="text-indigo-400" /> Mobile Number</span>
//               <input
//                 type="text"
//                 name="contact_phone"
//                 value={formData.contact_phone}
//                 onChange={handleChange}
//                 required
//                 placeholder="Mobile number for agent updates"
//                 className="field mt-1"
//               />
//             </label>

//             <div className="block">
//               <span className="text-sm font-medium flex items-center gap-1.5"><CreditCard size={14} className="text-violet-400" /> Payment Type</span>
//               <div className="grid grid-cols-2 gap-2 mt-1">
//                 <button
//                   type="button"
//                   onClick={() => setFormData({ ...formData, payment_method: 'cod' })}
//                   className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center transition-all ${formData.payment_method === 'cod' ? 'border-primary bg-primary/10 text-primary shadow-sm' : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-355'}`}
//                 >
//                   COD
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => setFormData({ ...formData, payment_method: 'razorpay' })}
//                   className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center transition-all ${formData.payment_method === 'razorpay' ? 'border-primary bg-primary/10 text-primary shadow-sm' : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-355'}`}
//                 >
//                   Razorpay Online
//                 </button>
//               </div>
//             </div>
//           </div>

//           <label className="block">
//             <span className="text-sm font-medium">Task description</span>
//             <textarea
//               name="description"
//               value={formData.description}
//               onChange={handleChange}
//               required
//               rows="3"
//               placeholder="Describe the issue, appliance model, location inside home, or any safety concern."
//               className="field mt-1"
//             />
//           </label>

//           <label className="block">
//             <span className="text-sm font-medium">Service address</span>
//             <div className="field mt-1 flex items-center gap-2 px-3">
//               <MapPin className="text-slate-400" size={18} />
//               <input
//                 type="text"
//                 name="address"
//                 value={formData.address}
//                 onChange={handleChange}
//                 required
//                 placeholder="Complete address"
//                 className="w-full outline-none bg-transparent"
//               />
//             </div>
//           </label>

//           <div className="block">
//             <span className="text-sm font-medium">Issue images (Optional)</span>
//             <div className="mt-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-350 dark:border-slate-700 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900 transition hover:bg-slate-100/50 dark:hover:bg-slate-800">
//               <input
//                 type="file"
//                 multiple
//                 accept="image/*"
//                 onChange={handleFileChange}
//                 className="hidden"
//                 id="issue-images-upload"
//               />
//               <label htmlFor="issue-images-upload" className="cursor-pointer flex flex-col items-center justify-center text-center">
//                 <span className="text-primary font-semibold hover:underline">Upload images</span>
//                 <span className="text-xs text-slate-500 mt-1">PNG, JPG or WEBP (up to 5 images)</span>
//               </label>
//             </div>
//             {selectedFiles.length > 0 && (
//               <div className="mt-2 text-sm text-slate-600 dark:text-slate-400 flex flex-wrap gap-2">
//                 {selectedFiles.map((file, i) => (
//                   <span key={i} className="px-2.5 py-1 bg-slate-200/50 dark:bg-slate-800 rounded-lg text-xs font-medium">
//                     {file.name}
//                   </span>
//                 ))}
//               </div>
//             )}
//           </div>

//           <div className="grid md:grid-cols-3 gap-4">
//             <label className="block">
//               <span className="text-sm font-medium">Urgency</span>
//               <select name="urgency" value={formData.urgency} onChange={handleChange} className="field mt-1">
//                 <option value="low">Flexible</option>
//                 <option value="medium">Normal</option>
//                 <option value="high">Urgent</option>
//               </select>
//             </label>
//             <label className="block">
//               <span className="text-sm font-medium">Date</span>
//               <div className="relative mt-1">
//                 <input type="date" name="date" value={formData.date} onChange={handleChange} required className="field pl-10" />
//               </div>
//             </label>
//             <label className="block">
//               <span className="text-sm font-medium">Time</span>
//               <div className="relative mt-1">
//                 <input type="time" name="time" value={formData.time} onChange={handleChange} required className="field pl-10" />
//               </div>
//             </label>
//           </div>

//           <button type="submit" disabled={loading} className="btn-primary w-full px-4 py-3 flex items-center justify-center gap-2">
//             <Send size={18} />
//             {loading ? 'Processing transaction...' : 'Post task & checkout'}
//           </button>
//         </motion.form>
//       </div>
//     </div>
//   );
// };

// export default PostTask;


/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { MapPin, IndianRupee, Send, Phone, CreditCard, Sparkles } from 'lucide-react';
import api from '../api/client';

const PostTask = () => {
  const [searchParams] = useSearchParams();
  const categoryParams = searchParams.get('category');
  const serviceIdParam = searchParams.get('serviceId');
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    service_id: serviceIdParam || '',
    category: categoryParams || '',
    description: '',
    address: user?.address || '',
    budget: '',
    urgency: 'medium',
    date: '',
    time: '',
    contact_phone: user?.phone || '',
    payment_method: 'cod'
  });

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    api.get('/services')
      .then((res) => setServices(res.data.data || []))
      .catch(() => setServices([]));
  }, []);

  useEffect(() => {
    if (user?.phone && !formData.contact_phone) {
      setFormData((prev) => ({ ...prev, contact_phone: user.phone }));
    }
    if (user?.address && !formData.address) {
      setFormData((prev) => ({ ...prev, address: user.address }));
    }
  }, [user]);

  const selectedService = services.find((service) => String(service.id) === String(formData.service_id));

  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setSelectedFiles([...e.target.files]);
  };

  // Dynamically load Razorpay checkout script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      // Check if script is already loaded
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate budget is not empty
    if (!formData.budget || formData.budget <= 0) {
      setError('Please enter a valid budget amount');
      return;
    }
    
    setLoading(true);

    try {
      // 1. Prepare form data to send
      const data = new FormData();
      data.append('service_id', formData.service_id);
      data.append('category', formData.category);
      data.append('description', formData.description);
      data.append('address', formData.address);
      data.append('budget', formData.budget);
      data.append('urgency_level', formData.urgency);
      data.append('date', formData.date);
      data.append('time', formData.time);
      data.append('contact_phone', formData.contact_phone);
      data.append('payment_method', formData.payment_method);
      data.append('payment_status', 'pending');

      selectedFiles.forEach((file) => {
        data.append('issue_images', file);
      });

      // 2. Post Booking to DB
      const bookingRes = await api.post('/bookings', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const newBooking = bookingRes.data.data;
      const bookingId = newBooking.id;

      // 3. Handle Payment Method Selection
      if (formData.payment_method === 'cod') {
        // COD path completes immediately
        setLoading(false);
        navigate('/dashboard/user');
      } else if (formData.payment_method === 'razorpay') {
        // Online path triggers Razorpay checkout window
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          setError('Failed to load payment gateway. Please check your internet connection and try again.');
          setLoading(false);
          return;
        }

        try {
          // Call backend to create Razorpay Order
          const orderRes = await api.post('/payments/create-order', {
            amount: Number(formData.budget),
            booking_id: bookingId,
            currency: 'INR'
          });

          const { order } = orderRes.data;
          
          if (!order || !order.id) {
            throw new Error('Invalid order response from server');
          }

          const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_zO3lS8yFmU0g9O',
            amount: order.amount,
            currency: order.currency || 'INR',
            name: 'Servix Marketplace',
            description: `Booking: ${newBooking.service_token || 'Service Booking'}`,
            order_id: order.id,
            handler: async (response) => {
              try {
                setLoading(true);
                // Verify razorpay signature on backend
                const verifyRes = await api.post('/payments/verify', {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  booking_id: bookingId
                });

                if (verifyRes.data.success) {
                  // Update booking payment status
                  await api.patch(`/bookings/${bookingId}/status`, {
                    payment_status: 'completed',
                    payment_id: response.razorpay_payment_id
                  });
                  navigate('/dashboard/user');
                } else {
                  setError('Payment verification failed. Please contact support.');
                  setLoading(false);
                }
              } catch (err) {
                console.error('Verification error:', err);
                setError(err.response?.data?.message || 'Error verifying payment. Please contact support.');
                setLoading(false);
              }
            },
            prefill: {
              name: user?.name || '',
              email: user?.email || '',
              contact: formData.contact_phone || user?.phone || ''
            },
            theme: {
              color: '#4F46E5'
            },
            modal: {
              ondismiss: () => {
                setLoading(false);
                setError('Payment was cancelled. You can try again or choose COD.');
              }
            }
          };

          const rzp = new window.Razorpay(options);
          rzp.on('payment.failed', (response) => {
            console.error('Payment failed:', response);
            setError(`Payment failed: ${response.error.description || 'Please try again'}`);
            setLoading(false);
          });
          rzp.open();
          setLoading(false);
        } catch (err) {
          console.error('Razorpay order creation error:', err);
          setError(err.response?.data?.message || 'Failed to initialize payment. Please try again or choose COD.');
          setLoading(false);
        }
      }

    } catch (err) {
      console.error('Booking creation error:', err);
      setError(err.response?.data?.message || 'Unable to post task. Please check all fields and try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-4 px-2">
      <div className="grid lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2">
          <p className="text-sm font-semibold text-primary">Create booking</p>
          <h1 className="section-title mt-1">Tell us what needs fixing</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Add the service, address, and timing. Verified professionals with matching skills will receive the request.
          </p>

          <div className="glass-card p-5 mt-5">
            <p className="text-sm text-slate-500">Selected service</p>
            <h2 className="text-xl font-bold mt-1">{selectedService?.name || 'Choose from services'}</h2>
            <p className="text-sm text-slate-500 mt-2">{selectedService?.category || 'Profession category'} · Starts at Rs. {Number(selectedService?.base_price || 0)}</p>
          </div>
        </div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-3 glass-card p-5 space-y-4"
        >
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4 ">
            <label className="block">
              <span className="text-sm font-medium">Service</span>
              <select
                name="service_id"
                value={formData.service_id}
                onChange={(e) => {
                  const selected = services.find((service) => String(service.id) === e.target.value);
                  setFormData({ ...formData, service_id: e.target.value, category: selected?.category || '' });
                }}
                required
                className="field mt-1"
              >
                <option value="">Select service</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} - {service.category}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium">Estimated budget (₹)</span>
              <div className="relative mt-1">
                {/* <IndianRupee
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                /> */}
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  required
                  min="1"
                  step="1"
                  placeholder="Enter amount"
                  className="field pl-10"
                />
              </div>
            </label>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium flex items-center gap-1.5"><Phone size={14} className="text-indigo-400" /> Mobile Number</span>
              <input
                type="tel"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleChange}
                required
                pattern="[0-9]{10}"
                placeholder="10-digit mobile number"
                className="field mt-1"
              />
            </label>

            <div className="block">
              <span className="text-sm font-medium flex items-center gap-1.5"><CreditCard size={14} className="text-violet-400" /> Payment Method</span>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, payment_method: 'cod' })}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center transition-all ${formData.payment_method === 'cod' ? 'border-primary bg-primary/10 text-primary shadow-sm' : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300'}`}
                >
                  Cash on Delivery
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, payment_method: 'razorpay' })}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center transition-all ${formData.payment_method === 'razorpay' ? 'border-primary bg-primary/10 text-primary shadow-sm' : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300'}`}
                >
                  Pay Online (Razorpay)
                </button>
              </div>
            </div>
          </div>

          <label className="block">
            <span className="text-sm font-medium">Task description</span>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="3"
              placeholder="Describe the issue, appliance model, location inside home, or any safety concern."
              className="field mt-1"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Service address</span>
            <div className="field mt-1 flex items-center gap-2 px-3">
              <MapPin className="text-slate-400" size={18} />
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                placeholder="Complete address"
                className="w-full outline-none bg-transparent"
              />
            </div>
          </label>

          <div className="block">
            <span className="text-sm font-medium">Issue images (Optional)</span>
            <div className="mt-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-350 dark:border-slate-700 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900 transition hover:bg-slate-100/50 dark:hover:bg-slate-800">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="issue-images-upload"
              />
              <label htmlFor="issue-images-upload" className="cursor-pointer flex flex-col items-center justify-center text-center">
                <span className="text-primary font-semibold hover:underline">Upload images</span>
                <span className="text-xs text-slate-500 mt-1">PNG, JPG or WEBP (up to 5 images)</span>
              </label>
            </div>
            {selectedFiles.length > 0 && (
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-400 flex flex-wrap gap-2">
                {selectedFiles.map((file, i) => (
                  <span key={i} className="px-2.5 py-1 bg-slate-200/50 dark:bg-slate-800 rounded-lg text-xs font-medium">
                    {file.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <label className="block">
              <span className="text-sm font-medium">Urgency</span>
              <select name="urgency" value={formData.urgency} onChange={handleChange} className="field mt-1">
                <option value="low">Flexible</option>
                <option value="medium">Normal</option>
                <option value="high">Urgent</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium">Preferred Date</span>
              <input type="date" name="date" value={formData.date} onChange={handleChange} required className="field mt-1" />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Preferred Time</span>
              <input type="time" name="time" value={formData.time} onChange={handleChange} required className="field mt-1" />
            </label>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="btn-primary w-full px-4 py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
            {loading ? 'Processing...' : formData.payment_method === 'razorpay' ? 'Pay & Post Task' : 'Post Task'}
          </button>
        </motion.form>
      </div>
    </div>
  );
};

export default PostTask;