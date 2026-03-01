import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TabPage } from '../components/PageTransition'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useApp } from '../lib/store'

// Extend types for local use
interface Alert {
  id: string
  dogId: string
  dogName: string
  dogPhotoURL?: string
  level: 'medium' | 'high' | 'critical'
  reason: string
  triggeredAt: string
  resolved: boolean
}

const LEVEL_CONFIG = {
  medium:   { bg: 'bg-warning/10',  border: 'border-warning/30',  badge: 'bg-warning text-white',   label: 'Medium' },
  high:     { bg: 'bg-danger/10',   border: 'border-danger/30',   badge: 'bg-danger text-white',    label: 'High' },
  critical: { bg: 'bg-red-900/10',  border: 'border-red-900/30',  badge: 'bg-red-900 text-white',   label: 'Critical' },
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const h = Math.floor(diff / 3600000)
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`
}

export default function Alerts() {
  const { coords } = useApp()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Fetch unresolved alerts
    const q = query(collection(db, 'alerts'), where('resolved', '==', false))
    getDocs(q).then(snap => {
      setAlerts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Alert)))
    }).finally(() => setLoading(false))
  }, [])

  return (
    <TabPage className="flex flex-col bg-bg">
      <div className="bg-white border-b border-border px-4"
        style={{ paddingTop: `calc(env(safe-area-inset-top, 0px) + 12px)`, paddingBottom: 12 }}>
        <h1 className="text-lg font-bold text-text">🔔 Alerts</h1>
        <p className="text-xs text-muted">Community risk notifications</p>
      </div>

      <div
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3"
        style={{ marginBottom: 'calc(60px + env(safe-area-inset-bottom,0px))' }}
      >
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 pt-20">
            <span className="text-4xl animate-pulse">🔔</span>
            <p className="text-muted text-sm">Loading alerts…</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 pt-20 text-center px-6">
            <span className="text-5xl">✅</span>
            <p className="font-bold text-text">No active alerts</p>
            <p className="text-muted text-sm">
              The community is safe. Alerts appear here when a dog's risk score exceeds the threshold.
            </p>
          </div>
        ) : (
          alerts.map(alert => {
            const cfg = LEVEL_CONFIG[alert.level]
            return (
              <button
                key={alert.id}
                onClick={() => navigate(`/dog/${alert.dogId}`)}
                className={`w-full ios-card p-4 flex gap-3 text-left ${cfg.bg} ${cfg.border} active:scale-[0.98] transition-transform`}
              >
                <div className="w-12 h-12 rounded-ios bg-white flex-shrink-0 overflow-hidden">
                  {alert.dogPhotoURL
                    ? <img src={alert.dogPhotoURL} className="w-full h-full object-cover" alt="" />
                    : <div className="w-full h-full flex items-center justify-center text-xl">🐶</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                    <span className="text-xs text-muted">
                      {alert.triggeredAt ? timeAgo(alert.triggeredAt) : 'recently'}
                    </span>
                  </div>
                  <p className="font-semibold text-text text-sm">{alert.dogName}</p>
                  <p className="text-xs text-muted mt-0.5 line-clamp-2">{alert.reason}</p>
                </div>
              </button>
            )
          })
        )}

        {/* Info card */}
        <div className="ios-card p-4 mt-2">
          <p className="font-bold text-text text-sm mb-2">How alerts work</p>
          <div className="flex flex-col gap-1.5">
            {[
              '🟡 Medium — risk score 40–59',
              '🔴 High — risk score 60–79 or 2+ aggression confirmations',
              '🚨 Critical — severe bite report or risk score 80+',
            ].map(t => <p key={t} className="text-xs text-muted">{t}</p>)}
          </div>
        </div>
      </div>
    </TabPage>
  )
}
