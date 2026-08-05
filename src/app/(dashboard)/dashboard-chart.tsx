'use client'

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

interface ChartDataPoint {
  day: string
  date?: string
  revenue: number
}

interface DashboardChartProps {
  data: ChartDataPoint[]
}

export default function DashboardChart({ data }: DashboardChartProps) {
  const maxRevenue = Math.max(...data.map(d => d.revenue), 100)

  return (
    <div className="h-[260px] w-full min-w-0 pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 15, right: 10, left: -15, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity={1} />
              <stop offset="100%" stopColor="#0284c7" stopOpacity={0.8} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
          <XAxis 
            dataKey="day" 
            tickLine={false} 
            axisLine={false} 
            className="text-xs text-muted-foreground font-medium" 
          />
          <YAxis 
            tickLine={false} 
            axisLine={false} 
            className="text-xs text-muted-foreground font-medium"
            tickFormatter={(val) => val >= 1000 ? `₹${(val / 1000).toFixed(1)}k` : `₹${val}`}
            domain={[0, Math.ceil(maxRevenue * 1.15)]}
          />
          <Tooltip 
            cursor={{ fill: 'rgba(0, 0, 0, 0.04)' }}
            contentStyle={{ 
              backgroundColor: 'var(--popover)', 
              borderColor: 'var(--border)', 
              borderRadius: '12px',
              fontSize: '12px',
              color: 'var(--popover-foreground)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
            labelStyle={{ fontWeight: 'bold', color: 'var(--foreground)', marginBottom: '4px' }}
            formatter={(value: any) => [
              `₹${Number(value).toLocaleString('en-IN')}`,
              'Revenue'
            ]}
          />
          <Bar 
            dataKey="revenue" 
            fill="url(#revenueGradient)" 
            radius={[6, 6, 0, 0]} 
            maxBarSize={44}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
