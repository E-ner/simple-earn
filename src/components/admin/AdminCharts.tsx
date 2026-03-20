'use client'

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { motion } from 'framer-motion'
import { TrendingUp, Users, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

interface AdminChartsProps {
  userGrowth: { date: string; count: number }[]
  cashflow: { date: string; deposits: number; withdrawals: number }[]
  statusDistribution: { name: string; value: number }[]
}

const COLORS = ['var(--accent)', 'var(--error)']

export default function AdminCharts({ userGrowth, cashflow, statusDistribution }: AdminChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
      {/* User Growth Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-[var(--purple)]/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-[var(--purple)]" />
          </div>
          <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest">User Growth (30D)</h3>
        </div>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#555', fontSize: 10 }} hide />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#555', fontSize: 10 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#16161f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }}
                itemStyle={{ color: 'var(--purple)' }}
              />
              <Line type="monotone" dataKey="count" stroke="var(--purple)" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Cashflow Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest">Platform Cashflow</h3>
        </div>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cashflow}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#555', fontSize: 10 }} hide />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#555', fontSize: 10 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#16161f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Bar dataKey="deposits" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="withdrawals" fill="var(--error)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Second Row: Status & distribution */}
      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 p-6 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
           <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest mb-6">Account Status</h3>
           <div className="h-[200px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={statusDistribution}
                   innerRadius={60}
                   outerRadius={80}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   {statusDistribution.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <Tooltip contentStyle={{ backgroundColor: '#16161f', border: 'none', borderRadius: '8px', fontSize: '10px' }} />
               </PieChart>
             </ResponsiveContainer>
           </div>
           <div className="mt-4 space-y-2">
             {statusDistribution.map((entry, index) => (
               <div key={entry.name} className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                   <span className="text-[var(--text-tertiary)]">{entry.name}</span>
                 </div>
                 <span className="text-[var(--text-primary)]">{entry.value}</span>
               </div>
             ))}
           </div>
        </div>

        <div className="md:col-span-2 p-6 bg-[var(--surface)] border border-[var(--border)] rounded-xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/5 rounded-full blur-3xl -mr-16 -mt-16" />
           <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest mb-8">Platform Health</h3>
           <div className="grid grid-cols-2 gap-8 relative z-10">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[var(--accent)]">
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Inflow Efficiency</span>
                </div>
                <div className="text-3xl font-black text-white tracking-tighter font-mono">98.4%</div>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                   <div className="bg-[var(--accent)] h-full w-[98.4%]" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[var(--purple)]">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Protocol Staking</span>
                </div>
                <div className="text-3xl font-black text-white tracking-tighter font-mono">$1,240.20</div>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                   <div className="bg-[var(--purple)] h-full w-[72%]" />
                </div>
              </div>
           </div>
           <p className="mt-10 text-[10px] text-[var(--text-tertiary)] uppercase font-bold tracking-widest leading-relaxed">
             Protocol health is determined by active node participation and transaction approval latency. Currently performing within optimal parameters.
           </p>
        </div>
      </div>
    </div>
  )
}
