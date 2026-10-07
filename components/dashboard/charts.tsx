'use client'

import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatMoney } from '@/lib/format'
import type { DashboardStats } from '@/lib/stats'

const COLORS = ['#7c5cff', '#2dd4bf', '#f59e0b', '#fb7185', '#38bdf8', '#a3e635', '#94a3b8']

export function MonthlyChart({ stats }: { stats: DashboardStats }) {
  const empty = stats.monthly.every((m) => m.amount === 0)
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 xl:col-span-3">
      <h3 className="font-bold">Monthly spending</h3>
      <p className="mt-1 text-sm text-slate-500">Your spending over the last 6 months</p>
      {empty ? (
        <p className="grid h-60 place-items-center text-sm text-slate-400">No dated receipts yet.</p>
      ) : (
        <div role="img" aria-label="Bar chart of monthly spending" className="mt-5">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.monthly}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: '#f8f7ff' }}
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
                formatter={(v) => [formatMoney(Number(v), stats.currency), 'Spent']}
              />
              <Bar dataKey="amount" fill="#7657f6" radius={[6, 6, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

export function CategoryChart({ stats }: { stats: DashboardStats }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 xl:col-span-2">
      <h3 className="font-bold">Spending by category</h3>
      <p className="mt-1 text-sm text-slate-500">Where your money goes</p>
      {stats.categories.length === 0 ? (
        <p className="grid h-48 place-items-center text-sm text-slate-400">Nothing to show yet.</p>
      ) : (
        <div className="flex items-center gap-3">
          <div className="h-48 w-1/2" role="img" aria-label="Donut chart of spending by category">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={stats.categories} dataKey="amount" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={3}>
                  {stats.categories.map((c, i) => <Cell key={c.name} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="flex flex-col gap-3 text-xs">
            {stats.categories.map((c, i) => (
              <li key={c.name} className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-slate-500">{c.name}</span>
                <b>{c.value}%</b>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
