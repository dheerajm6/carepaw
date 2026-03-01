import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Map, PawPrint, Heart, Bell } from 'lucide-react'

const tabs = [
  { to: '/discover', icon: Map,      label: 'Discover' },
  { to: '/register', icon: PawPrint, label: 'Register' },
  { to: '/care',     icon: Heart,    label: 'Care'     },
  { to: '/alerts',   icon: Bell,     label: 'Alerts'   },
]

export default function TabBar() {
  return (
    <nav className="tab-bar">
      {tabs.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className="relative flex flex-col items-center justify-center gap-0.5 flex-1 py-2 outline-none"
        >
          {({ isActive }) => (
            <>
              {/* Pill background slides between tabs via layoutId spring */}
              {isActive && (
                <motion.div
                  layoutId="tab-pill"
                  className="absolute inset-x-1 inset-y-0.5 rounded-xl bg-primary/8"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}

              {/* Icon — bounces up slightly on activation */}
              <motion.div
                animate={{ y: isActive ? -1 : 0, scale: isActive ? 1.08 : 1 }}
                transition={{ type: 'spring', stiffness: 600, damping: 35 }}
                className="relative z-10"
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.3 : 1.6}
                  className={isActive ? 'text-primary' : 'text-muted'}
                />
              </motion.div>

              <span className={`text-[10px] font-medium relative z-10 transition-colors ${
                isActive ? 'text-primary' : 'text-muted'
              }`}>
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
