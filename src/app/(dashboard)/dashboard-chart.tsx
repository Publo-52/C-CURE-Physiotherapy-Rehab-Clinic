'use client'

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

interface ChartDataPoint {
  day: string
  revenue: number
  visits: number
}

interface DashboardChartProps {
  data: ChartDataPoint[]
}

export default function DashboardChart({ data }: DashboardChartProps) {
  return (
    <div className="h-[260px] w-full pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} className="text-xs text-muted-foreground" />
          <YAxis tickLine={false} axisLine={false} className="text-xs text-muted-foreground" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--card)', 
              borderColor: 'var(--border)', 
              borderRadius: '8px',
              fontSize: '12px',
              color: 'var(--foreground)'
            }}
            labelStyle={{ color: 'var(--muted-foreground)' }}
            formatter={(value: any, name: any) => [
              name === 'revenue' ? `₹${value}` : `${value} visits`,
              name === 'revenue' ? 'Revenue' : 'Visits'
            ]}
          />
          <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
