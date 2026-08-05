/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

interface ChartDataPoint {
  day: string
  date?: string
  revenue: number
}

interface DashboardChartProps {
  data: ChartDataPoint[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value
    return (
      <div className="bg-popover/95 backdrop-blur-md border border-border px-3 py-2 rounded-xl shadow-xl text-xs space-y-1">
        <p className="font-bold text-popover-foreground">{label}</p>
        <p className="text-sky-600 dark:text-sky-400 font-extrabold text-sm">
          ₹{Number(value).toLocaleString('en-IN')}
        </p>
      </div>
    )
  }
  return null
}

export default function DashboardChart({ data }: DashboardChartProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line
    setMounted(true)
  }, [])

  const maxRevenue = Math.max(...data.map(d => d.revenue), 100)

  if (!mounted) {
    return <div className="h-[260px] w-full bg-muted/10 animate-pulse rounded-xl" />
  }

  return (
    <div className="h-[260px] w-full min-w-0 pt-2">
      <ResponsiveContainer width="99%" height="100%">
        <BarChart data={data} margin={{ top: 15, right: 10, left: -15, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity={1} />
              <stop offset="100%" stopColor="#0284c7" stopOpacity={0.7} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
          <XAxis 
            dataKey="day" 
            tickLine={false} 
            axisLine={false} 
            tick={{ fontSize: 11, fill: 'currentColor' }}
            className="text-muted-foreground font-medium"
            dy={8}
          />
          <YAxis 
            tickLine={false} 
            axisLine={false} 
            tick={{ fontSize: 11, fill: 'currentColor' }}
            className="text-muted-foreground font-medium"
            tickFormatter={(val) => val >= 1000 ? `₹${(val / 1000).toFixed(1)}k` : `₹${val}`}
            domain={[0, Math.ceil(maxRevenue * 1.15)]}
          />
          <Tooltip 
            cursor={{ fill: 'rgba(14, 165, 233, 0.08)' }}
            content={<CustomTooltip />}
          />
          <Bar 
            dataKey="revenue" 
            fill="url(#revenueGradient)" 
            radius={[6, 6, 0, 0]} 
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

