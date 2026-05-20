import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, PenTool, Zap, Wrench, Droplets, Snowflake, PaintRoller, Sparkles, Bug, ArrowRight, BadgeCheck } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';

const iconMap = {
  Electrician: { icon: Zap, tone: 'bg-amber-50 text-amber-600 border-amber-100' },
  Plumbing: { icon: Droplets, tone: 'bg-sky-50 text-sky-600 border-sky-100' },
  'AC Repair': { icon: Snowflake, tone: 'bg-cyan-50 text-cyan-600 border-cyan-100' },
  Carpenter: { icon: PenTool, tone: 'bg-orange-50 text-orange-600 border-orange-100' },
  'Appliance Repair': { icon: Wrench, tone: 'bg-slate-50 text-slate-600 border-slate-200' },
  Painting: { icon: PaintRoller, tone: 'bg-violet-50 text-violet-600 border-violet-100' },
  Cleaning: { icon: Sparkles, tone: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  'Pest Control': { icon: Bug, tone: 'bg-rose-50 text-rose-600 border-rose-100' },
};

const Services = () => {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/services')
      .then((res) => setServices(res.data.data || []))
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredServices = useMemo(() => services.filter((service) =>
    `${service.name} ${service.category}`.toLowerCase().includes(searchTerm.toLowerCase())
  ), [searchTerm, services]);

  return (
    <div className="py-4 px-4">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-7">
        <div>
          <p className="text-sm font-semibold text-primary mb-2">Book verified help</p>
          <h1 className="section-title">Choose a service</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-2xl">
            Clear prices, verified professionals, and live booking status for every home service.
          </p>
        </div>

        <div className="glass-card w-full md:w-[360px] px-4 py-3 flex items-center">
          <Search className="text-slate-400 shrink-0" size={20} />
          <input
            type="text"
            placeholder="Search electrician, painter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none text-slate-800 dark:text-white px-3 outline-none"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredServices.map((service, index) => {
          const style = iconMap[service.category] || iconMap.Electrician;
          const Icon = style.icon;

          return (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="glass-card p-5 flex flex-col min-h-[245px] hover:-translate-y-1 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className={`w-12 h-12 rounded-lg border ${style.tone} flex items-center justify-center`}>
                  <Icon size={24} />
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                  <BadgeCheck size={14} />
                  Verified
                </span>
              </div>

              <div className="mt-5 flex-1">
                <p className="text-xs font-semibold uppercase text-slate-500">{service.category}</p>
                <h3 className="font-bold text-lg mt-1 text-slate-950 dark:text-white">{service.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                  {service.description || 'Professional home service with trusted Servix experts.'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-5 mt-5 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-xs text-slate-500">Starts at</p>
                  <p className="font-bold">Rs. {Number(service.base_price || 0)}</p>
                </div>
                <Link
                  to={`/post-task?serviceId=${service.id}&category=${encodeURIComponent(service.category)}`}
                  className="btn-primary px-4 py-2 text-sm"
                >
                  Book <ArrowRight size={16} />
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>

      {loading && <p className="text-center py-12 text-slate-500">Loading services...</p>}
      {!loading && filteredServices.length === 0 && (
        <div className="glass-card text-center py-12 text-slate-500">
          <p className="text-lg font-semibold">No services found</p>
          <p className="text-sm mt-1">Try searching with another profession name.</p>
        </div>
      )}
    </div>
  );
};

export default Services;
