import { useAqiHistory, getAqiStatus } from "@/hooks/use-aqi";
import { useFirebaseAqi } from "@/hooks/use-firebase-aqi";
import { format } from "date-fns";
import { ResponsiveContainer, Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Loader2, TrendingUp, Calendar, Wifi, WifiOff } from "lucide-react";
import { motion } from "framer-motion";

export default function History() {
  const { data: apiHistory, isLoading } = useAqiHistory();
  const firebaseData = useFirebaseAqi();

  const useFirebase = firebaseData.isConnected && firebaseData.history.length > 0;
  const history = useFirebase 
    ? firebaseData.history.map(h => ({ id: 0, value: h.value, timestamp: new Date(h.timestamp) }))
    : apiHistory;

  const latest = history?.[history.length - 1];
  const average = history ? Math.round(history.reduce((acc, curr) => acc + curr.value, 0) / history.length) : 0;
  const max = history ? Math.max(...history.map(h => h.value)) : 0;

  if (isLoading && !useFirebase) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const chartData = history?.map(reading => ({
    ...reading,
    formattedTime: format(new Date(reading.timestamp), 'HH:mm'),
  })).slice(-20);

  const status = latest ? getAqiStatus(latest.value) : { color: 'text-slate-500' };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pt-20">
      <div className="max-w-md mx-auto px-6 py-8 md:max-w-4xl">
        
        {/* Connection Status */}
        <div className="flex items-center justify-end mb-4">
          {useFirebase ? (
            <div className="flex items-center gap-1.5 text-green-600 bg-green-100 px-3 py-1 rounded-full text-xs font-medium">
              <Wifi size={12} />
              <span>Firebase Data</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-500 bg-slate-100 px-3 py-1 rounded-full text-xs font-medium">
              <WifiOff size={12} />
              <span>Local Data</span>
            </div>
          )}
        </div>

        <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-slate-900">AQI Trends</h1>
            <p className="text-slate-500 mt-1">
              {useFirebase ? "Real-time data from Firebase" : "Historical readings from database"}
            </p>
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
                <div className="text-3xl font-bold text-slate-800" data-testid="text-average-aqi">{average}</div>
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
                <div className="text-3xl font-bold text-slate-800" data-testid="text-peak-aqi">{max}</div>
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
                {chartData && chartData.length > 0 ? (
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
                              domain={[0, 'auto']}
                          />
                          <Tooltip 
                              contentStyle={{ 
                                  backgroundColor: '#fff', 
                                  borderRadius: '12px', 
                                  border: 'none', 
                                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                              }}
                              cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                              formatter={(value: number) => [`AQI: ${value}`, '']}
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
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    No data available
                  </div>
                )}
            </div>
        </motion.div>
      </div>
    </div>
  );
}
