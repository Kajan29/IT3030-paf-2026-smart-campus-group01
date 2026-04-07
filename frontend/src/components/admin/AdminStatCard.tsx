import { ReactNode } from 'react'

interface AdminStatCardProps {
  label: string
  value: string
  hint: string
  icon: ReactNode
}

const AdminStatCard = ({ label, value, hint, icon }: AdminStatCardProps) => {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          <p className="mt-2 text-xs text-slate-500">{hint}</p>
        </div>
        <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">{icon}</div>
      </div>
    </article>
  )
}

export default AdminStatCard
