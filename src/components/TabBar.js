import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Map, PawPrint, Heart, Bell } from 'lucide-react';
const tabs = [
    { to: '/discover', icon: Map, label: 'Discover' },
    { to: '/register', icon: PawPrint, label: 'Register' },
    { to: '/care', icon: Heart, label: 'Care' },
    { to: '/alerts', icon: Bell, label: 'Alerts' },
];
export default function TabBar() {
    return (_jsx("nav", { className: "tab-bar", children: tabs.map(({ to, icon: Icon, label }) => (_jsx(NavLink, { to: to, className: "relative flex flex-col items-center justify-center gap-0.5 flex-1 py-2 outline-none", children: ({ isActive }) => (_jsxs(_Fragment, { children: [isActive && (_jsx(motion.div, { layoutId: "tab-pill", className: "absolute inset-x-1 inset-y-0.5 rounded-xl bg-primary/8", transition: { type: 'spring', stiffness: 500, damping: 40 } })), _jsx(motion.div, { animate: { y: isActive ? -1 : 0, scale: isActive ? 1.08 : 1 }, transition: { type: 'spring', stiffness: 600, damping: 35 }, className: "relative z-10", children: _jsx(Icon, { size: 22, strokeWidth: isActive ? 2.3 : 1.6, className: isActive ? 'text-primary' : 'text-muted' }) }), _jsx("span", { className: `text-[10px] font-medium relative z-10 transition-colors ${isActive ? 'text-primary' : 'text-muted'}`, children: label })] })) }, to))) }));
}
