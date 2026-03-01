import { NavLink } from 'react-router-dom'
import { Map, PawPrint, Heart, Bell } from 'lucide-react'

const tabs = [
  { to: '/discover', icon: Map,      label: 'Discover' },
  { to: '/register', icon: PawPrint, label: 'Register' },
  { to: '/care',     icon: Heart,    label: 'Care' },
  { to: '/alerts',   icon: Bell,     label: 'Alerts' },
]

export default function TabBar() {
  return (
    <nav className="tab-bar">
      {tabs.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-4 py-2 rounded-ios transition-colors ${
              isActive ? 'text-primary' : 'text-muted'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={24} strokeWidth={isActive ? 2.2 : 1.7} />
              <span className={`text-[10px] font-medium ${isActive ? 'text-primary' : 'text-muted'}`}>
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
