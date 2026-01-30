import { useAqiHistory, getAqiStatus } from "@/hooks/use-aqi";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Loader2, TrendingUp, Calendar } from "lucide-react";
import { motion } from "framer-motion";

export default function History() {
  const { data: history, isLoading } = useAqiHistory();

  // Create derived statistics
  const latest = history?.[history.length - 1];
  const average = history ? Math.round(history.reduce((acc, curr) => acc + curr.value, 0) / history.length) : 0;
  const max = history ? Math.max(...history.map(h => h.value)) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Format data for chart
  const chartData = history?.map(reading => ({
    ...reading,
    formattedTime: format(new Date(reading.timestamp), 'HH:mm'),
  })).slice(-20); // Last 20 readings for better visualization

  const status = latest ? getAqiStatus(latest.value) : { color: 'text-slate-500' };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pt-20">
      <div className="max-w-md mx-auto px-6 py-8 md:max-w-4xl">
        
        <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-slate-900">Analysis</h1>
            <p className="text-slate-500 mt-1">AQI trends over the last hour</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100"
            >
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                    <TrendingUp size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Average</span>
                </div>
                <div className="text-3xl font-bold text-slate-800">{average}</div>
            </motion.div>
            
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100"
            >
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                    <Calendar size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Peak</span>
                </div>
                <div className="text-3xl font-bold text-slate-800">{max}</div>
            </motion.div>
        </div>

        {/* Chart Card */}
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 h-[400px]"
        >
            <h3 className="font-bold text-lg text-slate-800 mb-6">Real-time Trend</h3>
            <div className="h-[300px] w-full -ml-2">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                            dataKey="formattedTime" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                            dx={-10}
                        />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: '#fff', 
                                borderRadius: '12px', 
                                border: 'none', 
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                            }}
                            cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#6366f1" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorValue)" 
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
      </div>
    </div>
  );
}
