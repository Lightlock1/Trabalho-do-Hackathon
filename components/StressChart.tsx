
import React from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { CheckInData } from '../types';

interface Props {
  history: CheckInData[];
  isDarkMode?: boolean;
}

const StressChart: React.FC<Props> = ({ history, isDarkMode }) => {
  const data = history.slice(-7).map(h => ({
    name: new Date(h.timestamp).toLocaleDateString('pt-PT', { weekday: 'short' }),
    score: h.stressScore
  }));

  const strokeColor = isDarkMode ? '#6366f1' : '#3b82f6';
  const gridColor = isDarkMode ? '#1e293b' : '#f1f5f9';
  const textColor = isDarkMode ? '#94a3b8' : '#64748b';

  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={strokeColor} stopOpacity={0.4}/>
              <stop offset="95%" stopColor={strokeColor} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="0" vertical={false} stroke={gridColor} />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: textColor, fontWeight: 'bold' }} 
          />
          <YAxis hide domain={[0, 100]} />
          <Tooltip 
            contentStyle={{ 
              borderRadius: '16px', 
              border: 'none', 
              backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              color: isDarkMode ? '#f8fafc' : '#1e293b'
            }}
          />
          <Area 
            type="monotone" 
            dataKey="score" 
            stroke={strokeColor} 
            strokeWidth={4}
            fillOpacity={1} 
            fill="url(#colorScore)" 
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StressChart;
