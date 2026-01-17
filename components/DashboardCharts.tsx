
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart, TooltipProps 
} from 'recharts';
import { formatCurrency, formatNumber } from '../utils.ts';

// --- CONFIGURATION & STYLES ---

// High-contrast, distinct palette (Tailwind 600/700 shades) for better accessibility
const COLORS = [
  '#2563eb', // Blue 600
  '#16a34a', // Green 600
  '#d97706', // Amber 600
  '#dc2626', // Red 600
  '#9333ea', // Purple 600
  '#db2777', // Pink 600
  '#0891b2', // Cyan 600
  '#4f46e5', // Indigo 600
];

interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
}

const ChartContainer: React.FC<ChartContainerProps> = ({ title, children }) => (
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[400px] hover:shadow-md transition-shadow">
    <h3 className="text-sm font-bold text-slate-600 mb-6 uppercase tracking-wider flex items-center gap-2 border-l-4 border-blue-600 pl-3">
      {title}
    </h3>
    <div className="flex-1 w-full min-h-0 text-xs">
      {children}
    </div>
  </div>
);

// --- CUSTOM COMPONENTS ---

const CustomTooltip = ({ active, payload, label, formatType = 'number' }: TooltipProps<any, any> & { formatType?: 'currency' | 'number' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-lg min-w-[200px] animate-in fade-in zoom-in-95 duration-200 z-50">
        <p className="font-bold text-slate-800 mb-2 pb-2 border-b border-slate-100">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 py-1">
            <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.payload.fill }} />
                <span className="text-slate-500 font-medium">{entry.name}:</span>
            </div>
            <span className="font-bold text-slate-700" style={{ color: entry.color || entry.payload.fill }}>
              {formatType === 'currency' 
                ? formatCurrency(Number(entry.value)) 
                : formatNumber(Number(entry.value))}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Global Gradients Definition
const ChartGradients = () => (
  <defs>
    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.1}/>
    </linearGradient>
    <linearGradient id="colorCost" x1="0" y1="0" x2="1" y2="0">
      <stop offset="5%" stopColor="#d97706" stopOpacity={0.9}/>
      <stop offset="95%" stopColor="#d97706" stopOpacity={0.4}/>
    </linearGradient>
    <linearGradient id="colorBarBlue" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#2563eb" />
      <stop offset="100%" stopColor="#60a5fa" />
    </linearGradient>
    <linearGradient id="colorBarPurple" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#9333ea" />
      <stop offset="100%" stopColor="#c084fc" />
    </linearGradient>
  </defs>
);

// --- TAB 1: OVERVIEW CHARTS ---

export const CostByTimeLineChart = ({ data }: { data: any[] }) => (
  <ChartContainer title="Xu hướng Chi phí & Số lượt">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <ChartGradients />
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis 
            dataKey="date" 
            tick={{fontSize: 11, fill: '#64748b'}} 
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
            dy={10}
        />
        <YAxis 
            yAxisId="left"
            tickFormatter={(val) => `${(val / 1000000).toFixed(0)}Tr`} 
            width={50} 
            tick={{fontSize: 11, fill: '#64748b'}} 
            tickLine={false}
            axisLine={false}
        />
        <YAxis 
            yAxisId="right"
            orientation="right"
            width={40}
            tick={{fontSize: 11, fill: '#64748b'}}
            tickLine={false}
            axisLine={false}
        />
        <Tooltip content={<CustomTooltip formatType="currency" />} />
        <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
        <Area 
            yAxisId="left" 
            type="monotone" 
            dataKey="totalCost" 
            name="Tổng chi phí" 
            stroke="#2563eb" 
            fillOpacity={1} 
            fill="url(#colorVisits)" 
            strokeWidth={2}
        />
        <Line 
            yAxisId="right" 
            type="monotone" 
            dataKey="totalVisits" 
            name="Số lượt" 
            stroke="#d97706" 
            strokeWidth={3} 
            dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} 
            activeDot={{ r: 6 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  </ChartContainer>
);

export const CostByDeptBarChart = ({ data }: { data: any[] }) => (
  <ChartContainer title="Top Khoa theo Chi phí">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
        <ChartGradients />
        <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="#e2e8f0" />
        <XAxis type="number" tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`} hide />
        <YAxis 
            type="category" 
            dataKey="name" 
            width={140} 
            tick={{fontSize: 11, fill: '#475569', fontWeight: 500}} 
            interval={0} 
            tickLine={false}
            axisLine={false}
        />
        <Tooltip content={<CustomTooltip formatType="currency" />} />
        <Bar 
            dataKey="value" 
            name="Chi phí" 
            fill="url(#colorBarBlue)" 
            radius={[0, 4, 4, 0]} 
            barSize={24}
        />
      </BarChart>
    </ResponsiveContainer>
  </ChartContainer>
);

export const VisitsByDeptBarChart = ({ data }: { data: any[] }) => (
  <ChartContainer title="Top Khoa theo Số lượt">
    {/* Switched to Vertical Layout for better readability of long Dept names */}
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
        <ChartGradients />
        <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="#e2e8f0" />
        <XAxis type="number" hide />
        <YAxis 
            type="category" 
            dataKey="name" 
            width={140} 
            tick={{fontSize: 11, fill: '#475569', fontWeight: 500}} 
            interval={0} 
            tickLine={false}
            axisLine={false}
        />
        <Tooltip content={<CustomTooltip formatType="number" />} />
        <Bar 
            dataKey="value" 
            name="Số lượt" 
            fill="url(#colorBarPurple)" 
            radius={[0, 4, 4, 0]} 
            barSize={24}
        />
      </BarChart>
    </ResponsiveContainer>
  </ChartContainer>
);

export const CostByObjectPieChart = ({ data }: { data: any[] }) => (
  <ChartContainer title="Cơ cấu chi phí">
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60} // Donut chart
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip formatType="currency" />} />
        <Legend 
            layout="vertical" 
            verticalAlign="middle" 
            align="right" 
            wrapperStyle={{fontSize: '11px', fontWeight: 500}} 
            iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  </ChartContainer>
);

export const RevenueStructureChart = ({ data }: { data: any[] }) => {
  const COLORS_MAP: Record<string, string> = {
    'Thuốc': '#10b981', // Green
    'Cận Lâm Sàng': '#3b82f6', // Blue
    'Tiền Giường': '#f59e0b', // Amber
    'Khác': '#64748b' // Slate
  };

  // Sort data descending to make the bar chart look like a leaderboard
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  return (
    <ChartContainer title="Tỉ lệ Doanh thu (Chi tiết)">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sortedData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
          <XAxis type="number" tickFormatter={(val) => `${(val/1000000).toFixed(0)}M`} tick={{fontSize: 10, fill: '#94a3b8'}} />
          <YAxis 
            type="category" 
            dataKey="name" 
            width={100} 
            tick={{fontSize: 11, fill: '#475569', fontWeight: 600}} 
            interval={0} 
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip formatType="currency" />} />
          <Bar dataKey="value" name="Doanh thu" radius={[0, 4, 4, 0]} barSize={28}>
            {sortedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS_MAP[entry.name] || '#8884d8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};


// --- GENERIC CHARTS FOR OTHER TABS ---

export const GenericBarChart = ({ data, title, dataKey, name, color = "#2563eb", format = "number" }: any) => (
    <ChartContainer title={title}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="#e2e8f0"/>
          <XAxis type="number" hide />
          <YAxis 
            type="category" 
            dataKey="name" 
            width={150} 
            tick={{fontSize: 11, fill: '#475569', fontWeight: 500}} 
            interval={0} 
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip formatType={format} />} />
          <Bar 
            dataKey={dataKey} 
            name={name} 
            fill={color} 
            radius={[0, 4, 4, 0]} 
            barSize={20} 
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
);

export const GenericLineChart = ({ data, title, xKey, lineKey, name, color = "#d97706" }: any) => (
    <ChartContainer title={title}>
        <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey={xKey} tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} dy={10} />
            <YAxis width={60} tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            <Line type="monotone" dataKey={lineKey} name={name} stroke={color} strokeWidth={3} dot={{r:4}} />
        </LineChart>
        </ResponsiveContainer>
    </ChartContainer>
);

export const MultiLineChart = ({ data, lines }: { data: any[], lines: string[] }) => {
  // Matching the global COLORS palette for consistency
  const LINE_COLORS = ['#2563eb', '#d97706', '#16a34a', '#dc2626', '#9333ea'];
  return (
    <ChartContainer title="So sánh xu hướng (Số lượt)">
       <ResponsiveContainer width="100%" height="100%">
         <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
           <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} dy={10} />
           <YAxis width={40} tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} />
           <Tooltip content={<CustomTooltip formatType="number" />} />
           <Legend wrapperStyle={{ paddingTop: '10px' }} />
           {lines.map((key, idx) => (
             <Line 
                key={key} 
                type="monotone" 
                dataKey={key} 
                stroke={LINE_COLORS[idx % LINE_COLORS.length]} 
                strokeWidth={3} 
                dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} 
                activeDot={{ r: 6 }}
             />
           ))}
         </LineChart>
       </ResponsiveContainer>
    </ChartContainer>
  )
};

export const GenericPieChart = ({ data, title, formatType = 'currency' }: { data: any[], title: string, formatType?: 'currency' | 'number' }) => (
    <ChartContainer title={title}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip formatType={formatType} />} />
          <Legend 
            layout="vertical" 
            verticalAlign="middle" 
            align="right" 
            wrapperStyle={{fontSize: '11px', fontWeight: 500}} 
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
