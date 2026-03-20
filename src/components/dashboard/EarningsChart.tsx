'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'

import { formatCurrency } from '@/lib/currency'

interface EarningsChartProps {
  data: { date: string; earnings: number }[]
  dict: any
  currency?: string
}

export default function EarningsChart({ data, dict, currency = 'USD' }: EarningsChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 rounded-[var(--radius-xl)] bg-white/[0.02] border border-white/[0.06] flex flex-col h-[350px]"
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[var(--accent)]/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">
              {dict?.dashboard?.yield_chart_title || 'Yield Performance'}
            </h3>
            <p className="text-[10px] text-[#555] uppercase font-black tracking-widest mt-0.5">
              Protocol Settlement (7D)
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#555', fontSize: 10, fontWeight: 700 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#555', fontSize: 10, fontWeight: 700 }}
              tickFormatter={(value) => formatCurrency(value, currency)}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.02)' }}
              contentStyle={{ 
                backgroundColor: '#16161f', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#fff'
              }}
              formatter={(value: any) => [formatCurrency(Number(value || 0), currency), 'Earnings']}
              itemStyle={{ color: 'var(--accent)' }}
              labelStyle={{ color: '#888', marginBottom: '4px', fontSize: '10px' }}
            />
            <Bar 
              dataKey="earnings" 
              fill="var(--accent)" 
              radius={[4, 4, 0, 0]} 
              barSize={32}
              opacity={0.8}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
