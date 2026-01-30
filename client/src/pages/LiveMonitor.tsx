import { useLiveSimulation } from "@/hooks/use-simulation";
import { getAqiStatus } from "@/hooks/use-aqi";
import { formatDistanceToNow } from "date-fns";
import { Wind, MapPin, Loader2, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LiveMonitor() {
  const reading = useLiveSimulation();

  if (!reading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const status = getAqiStatus(reading.value);

  return (
    <div className={`min-h-screen transition-bg-smooth duration-700 ${status.lightBg} pb-24 md:pt-24`}>
      <div className="max-w-md mx-auto px-6 py-8 md:max-w-2xl">
        
        {/* Header Location */}
        <div className="flex items-center justify-center gap-2 mb-8 opacity-80">
          <MapPin size={18} className="text-slate-600" />
          <span className="font-medium text-slate-700 tracking-wide uppercase text-sm">San Francisco, CA</span>
        </div>

        {/* Main Indicator */}
        <div className="relative flex flex-col items-center justify-center mt-8">
          
          {/* Pulsing Background Circles */}
          <div className="absolute inset-0 flex items-center justify-center z-0">
             <motion.div 
               animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
               transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
               className={`w-64 h-64 rounded-full ${status.bg} opacity-20 blur-3xl`}
             />
             <motion.div 
               animate={{ scale: [1.1, 1.4, 1.1], opacity: [0.2, 0, 0.2] }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
               className={`w-80 h-80 rounded-full ${status.bg} opacity-10 blur-3xl absolute`}
             />
          </div>

          {/* AQI Value Card */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative z-10 bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200/50 border border-white/50 text-center w-full max-w-xs mx-auto"
          >
            <div className="flex items-center justify-center gap-2 text-slate-400 mb-2">
              <Wind size={20} />
              <span className="font-medium text-sm tracking-widest uppercase">Air Quality Index</span>
            </div>
            
            <AnimatePresence mode="wait">
              <motion.h1 
                key={reading.value}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className={`text-[8rem] font-display font-bold leading-none tracking-tighter ${status.color}`}
              >
                {reading.value}
              </motion.h1>
            </AnimatePresence>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={status.label}
              className={`inline-block px-4 py-1.5 rounded-full mt-4 text-sm font-bold tracking-wide uppercase ${status.bg} text-white shadow-lg`}
            >
              {status.label}
            </motion.div>
          </motion.div>
        </div>

        {/* Update Time */}
        <p className="text-center text-slate-500 text-sm mt-8 font-medium">
          Updated {formatDistanceToNow(new Date(reading.timestamp), { addSuffix: true })}
        </p>

        {/* Health Tip Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-12 bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100"
        >
            <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${status.lightBg} shrink-0`}>
                    <Info size={24} className={status.color} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Health Recommendation</h3>
                    <p className="text-slate-600 leading-relaxed text-sm">
                        {status.label === "Good" && "Air quality is great! Perfect time for outdoor activities."}
                        {status.label === "Moderate" && "Air quality is acceptable. Sensitive individuals should limit prolonged outdoor exertion."}
                        {status.label === "Unhealthy" && "Everyone may begin to experience health effects. Limit outdoor time."}
                        {status.label === "Hazardous" && "Emergency conditions. Avoid all outdoor physical activity."}
                    </p>
                </div>
            </div>
        </motion.div>

      </div>
    </div>
  );
}
