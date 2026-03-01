import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TabPage } from '../components/PageTransition';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useApp } from '../lib/store';
const LEVEL_CONFIG = {
    medium: { bg: 'bg-warning/10', border: 'border-warning/30', badge: 'bg-warning text-white', label: 'Medium' },
    high: { bg: 'bg-danger/10', border: 'border-danger/30', badge: 'bg-danger text-white', label: 'High' },
    critical: { bg: 'bg-red-900/10', border: 'border-red-900/30', badge: 'bg-red-900 text-white', label: 'Critical' },
};
function timeAgo(ts) {
    const diff = Date.now() - new Date(ts).getTime();
    const h = Math.floor(diff / 3600000);
    return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}
export default function Alerts() {
    const { coords } = useApp();
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    useEffect(() => {
        // Fetch unresolved alerts
        const q = query(collection(db, 'alerts'), where('resolved', '==', false));
        getDocs(q).then(snap => {
            setAlerts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }).finally(() => setLoading(false));
    }, []);
    return (_jsxs(TabPage, { className: "flex flex-col bg-bg", children: [_jsxs("div", { className: "bg-white border-b border-border px-4", style: { paddingTop: `calc(env(safe-area-inset-top, 0px) + 12px)`, paddingBottom: 12 }, children: [_jsx("h1", { className: "text-lg font-bold text-text", children: "\uD83D\uDD14 Alerts" }), _jsx("p", { className: "text-xs text-muted", children: "Community risk notifications" })] }), _jsxs("div", { className: "flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3", style: { marginBottom: 'calc(60px + env(safe-area-inset-bottom,0px))' }, children: [loading ? (_jsxs("div", { className: "flex-1 flex flex-col items-center justify-center gap-3 pt-20", children: [_jsx("span", { className: "text-4xl animate-pulse", children: "\uD83D\uDD14" }), _jsx("p", { className: "text-muted text-sm", children: "Loading alerts\u2026" })] })) : alerts.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center gap-3 pt-20 text-center px-6", children: [_jsx("span", { className: "text-5xl", children: "\u2705" }), _jsx("p", { className: "font-bold text-text", children: "No active alerts" }), _jsx("p", { className: "text-muted text-sm", children: "The community is safe. Alerts appear here when a dog's risk score exceeds the threshold." })] })) : (alerts.map(alert => {
                        const cfg = LEVEL_CONFIG[alert.level];
                        return (_jsxs("button", { onClick: () => navigate(`/dog/${alert.dogId}`), className: `w-full ios-card p-4 flex gap-3 text-left ${cfg.bg} ${cfg.border} active:scale-[0.98] transition-transform`, children: [_jsx("div", { className: "w-12 h-12 rounded-ios bg-white flex-shrink-0 overflow-hidden", children: alert.dogPhotoURL
                                        ? _jsx("img", { src: alert.dogPhotoURL, className: "w-full h-full object-cover", alt: "" })
                                        : _jsx("div", { className: "w-full h-full flex items-center justify-center text-xl", children: "\uD83D\uDC36" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("span", { className: `text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badge}`, children: cfg.label }), _jsx("span", { className: "text-xs text-muted", children: alert.triggeredAt ? timeAgo(alert.triggeredAt) : 'recently' })] }), _jsx("p", { className: "font-semibold text-text text-sm", children: alert.dogName }), _jsx("p", { className: "text-xs text-muted mt-0.5 line-clamp-2", children: alert.reason })] })] }, alert.id));
                    })), _jsxs("div", { className: "ios-card p-4 mt-2", children: [_jsx("p", { className: "font-bold text-text text-sm mb-2", children: "How alerts work" }), _jsx("div", { className: "flex flex-col gap-1.5", children: [
                                    '🟡 Medium — risk score 40–59',
                                    '🔴 High — risk score 60–79 or 2+ aggression confirmations',
                                    '🚨 Critical — severe bite report or risk score 80+',
                                ].map(t => _jsx("p", { className: "text-xs text-muted", children: t }, t)) })] })] })] }));
}
