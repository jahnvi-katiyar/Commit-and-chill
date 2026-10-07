interface Props {
  icon: React.ReactNode
  label: string
  value: string
  badge?: string
  warn?: boolean
}

export function StatCard({ icon, label, value, badge, warn }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
      <div className="flex items-start justify-between">
        <div className={`grid size-10 place-items-center rounded-xl ${warn ? 'bg-amber-100 text-amber-600' : 'bg-violet-100 text-[#7657f6]'}`}>{icon}</div>
        {badge && (
          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${warn ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{badge}</span>
        )}
      </div>
      <p className="mt-5 text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  )
}
