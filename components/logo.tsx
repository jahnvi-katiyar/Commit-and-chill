import { Receipt } from 'lucide-react'

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid size-9 place-items-center rounded-xl bg-[#7657f6] text-white shadow-lg shadow-violet-200">
        <Receipt className="size-5" aria-hidden />
      </div>
      <span className="text-lg font-bold tracking-tight text-slate-900">Bill Baba</span>
    </div>
  )
}
