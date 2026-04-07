import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { ReactNode } from 'react'

interface AdminQuickActionCardProps {
  title: string
  description: string
  to: string
  icon: ReactNode
}

const AdminQuickActionCard = ({ title, description, to, icon }: AdminQuickActionCardProps) => {
  return (
    <Link
      to={to}
      className="group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:border-emerald-200 hover:shadow-md"
    >
      <div className="inline-flex w-fit rounded-lg bg-emerald-50 p-2 text-emerald-700">{icon}</div>
      <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{description}</p>

      <span className="mt-auto inline-flex items-center gap-2 pt-4 text-sm font-semibold text-emerald-700">
        Open
        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
      </span>
    </Link>
  )
}

export default AdminQuickActionCard
