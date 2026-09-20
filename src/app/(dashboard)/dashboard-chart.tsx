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
      <div className="bg-popover/95 backdrop-blur-xl border border-border/80 px-3.5 py-2.5 rounded-2xl shadow-xl text-xs space-y-1 ring-1 ring-black/5 dark:ring-white/10">
        <p className="font-semibold text-muted-foreground">{label}</p>
        <p className="text-primary font-black text-base tabular-num">
          ₹{Number(value).toLocaleString('en-IN')}
        </p>
        <p className="text-[10px] text-muted-foreground/80">Daily Collections</p>
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
    return <div className="h-[260px] w-full bg-muted/10 animate-pulse rounded-2xl" />
  }

  return (
    <div className="h-[260px] w-full min-w-0 pt-2">
      <ResponsiveContainer width="99%" height="100%">
        <BarChart data={data} margin={{ top: 15, right: 10, left: -15, bottom: 0 }}>
          <defs>
            <linearGradient id="artisanRevenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.58 0.16 192)" stopOpacity={1} />
              <stop offset="100%" stopColor="oklch(0.46 0.15 220)" stopOpacity={0.75} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.12} />
          <XAxis 
            dataKey="day" 
            tickLine={false} 
            axisLine={false} 
            tick={{ fontSize: 11, fill: 'currentColor' }}
            className="text-muted-foreground font-semibold"
            dy={8}
          />
          <YAxis 
            tickLine={false} 
            axisLine={false} 
            tick={{ fontSize: 11, fill: 'currentColor' }}
            className="text-muted-foreground font-semibold tabular-num"
            tickFormatter={(val) => val >= 1000 ? `₹${(val / 1000).toFixed(1)}k` : `₹${val}`}
            domain={[0, Math.ceil(maxRevenue * 1.15)]}
          />
          <Tooltip 
            cursor={{ fill: 'oklch(0.55 0.16 192 / 8%)' }}
            content={<CustomTooltip />}
          />
          <Bar 
            dataKey="revenue" 
            fill="url(#artisanRevenueGradient)" 
            radius={[8, 8, 2, 2]} 
            maxBarSize={38}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
