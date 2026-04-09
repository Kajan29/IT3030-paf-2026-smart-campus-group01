import { Building2, CalendarCheck2, LayoutDashboard, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import AdminStatCard from '../../components/admin/AdminStatCard'
import AdminQuickActionCard from '../../components/admin/AdminQuickActionCard'

const AdminPage = () => {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50/40">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-14">
        <section className="rounded-2xl border border-emerald-100 bg-white/90 p-6 shadow-sm md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Admin Center</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Welcome to the admin workspace</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600 md:text-base">
            Use this area to monitor platform activity and quickly jump into management screens.
          </p>
          <div className="mt-6">
            <Link
              to="/admin"
              className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Open Full Dashboard
            </Link>
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminStatCard label="Active Users" value="1,248" hint="All verified user accounts" icon={<Users className="h-5 w-5" />} />
          <AdminStatCard label="Buildings" value="12" hint="Campus facilities managed" icon={<Building2 className="h-5 w-5" />} />
          <AdminStatCard label="Today Bookings" value="89" hint="Current day reservations" icon={<CalendarCheck2 className="h-5 w-5" />} />
          <AdminStatCard label="Dashboard Modules" value="10" hint="Management areas available" icon={<LayoutDashboard className="h-5 w-5" />} />
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-slate-900">Quick Actions</h2>
          <p className="mt-2 text-sm text-slate-600">Jump directly to frequently used admin workflows.</p>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <AdminQuickActionCard
              title="User Management"
              description="Review students and staff, manage account status, and control role-based access."
              to="/admin"
              icon={<Users className="h-5 w-5" />}
            />
            <AdminQuickActionCard
              title="Facility Setup"
              description="Maintain buildings, floors, and rooms used by the reservation system."
              to="/admin"
              icon={<Building2 className="h-5 w-5" />}
            />
            <AdminQuickActionCard
              title="Booking Operations"
              description="Track booking activity and handle operational booking decisions."
              to="/admin"
              icon={<CalendarCheck2 className="h-5 w-5" />}
            />
          </div>
        </section>
      </div>
    </main>
  )
}

export default AdminPage
