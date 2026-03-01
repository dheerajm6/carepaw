import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Plus, Camera, Video, X, Clock, AlertTriangle, Sparkles, Loader2 } from 'lucide-react'
import { doc, getDoc, collection, addDoc, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { uploadToCloudinary } from '../lib/cloudinary'
import { useApp } from '../lib/store'
import { Dog, Observation, ObservationType, BiteSeverity, AgeGroup } from '../lib/types'
import { OBS_TYPES } from '../lib/constants'
import { PHYSICAL_MARKERS } from '../lib/markers'
import { analyzeMedia, extractVideoFrame, fileToBase64, AGGRESSION_BEHAVIOURS } from '../lib/ai'

function Chip<T extends string>({ options, value, onChange }: {
  options: { v: T; label: string; emoji?: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button key={o.v} onClick={() => onChange(o.v)}
          className={`chip ${value === o.v ? 'chip-active' : ''}`}>
          {o.emoji && <span>{o.emoji}</span>}{o.label}
        </button>
      ))}
    </div>
  )
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1)  return 'just now'
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const STATUS_CONFIG: Record<Dog['status'], { bg: string; label: string; icon: string }> = {
  safe:    { bg: 'bg-success',  label: 'Safe',    icon: '🟢' },
  caution: { bg: 'bg-warning',  label: 'Caution', icon: '🟡' },
  alert:   { bg: 'bg-danger',   label: 'Alert',   icon: '🔴' },
}

const RISK_COLOR = (score: number) =>
  score >= 60 ? 'text-danger' : score >= 30 ? 'text-warning' : 'text-success'


export default function DogProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useApp()

  // Dog + pre-selected log type passed via route state from the list tile
  const stateDog = (location.state as any)?.dog    as Dog | undefined
  const initType = (location.state as any)?.logType as ObservationType | undefined

  const [dog, setDog]             = useState<Dog | null>(stateDog ?? null)
  const [observations, setObs]    = useState<Observation[]>([])
  const [showModal, setShowModal] = useState(!!initType)
  const [loading, setLoading]     = useState(!stateDog)

  // Observation form
  const [obsType, setObsType]         = useState<ObservationType>(initType ?? 'health')
  const [desc, setDesc]               = useState('')
  const [mediaFile, setMediaFile]     = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [isVideo, setIsVideo]         = useState(false)
  const [aiInsight, setAiInsight]     = useState<string | null>(null)
  const [aiLoading, setAiLoading]     = useState(false)
  const [severity, setSeverity]       = useState<BiteSeverity>('scratch')
  const [ageGroup, setAgeGroup]       = useState<AgeGroup>('unknown')
  const [antiRabies, setAntiRabies]   = useState<'yes' | 'no' | 'unknown'>('unknown')
  const [aggrBehaviours, setAggrBehaviours] = useState<string[]>([])
  const [submitting, setSubmitting]   = useState(false)
  const [obsError, setObsError]       = useState('')

  useEffect(() => {
    if (!id) return
    // Always fetch observations fresh from Firestore
    const fetchObs = getDocs(query(collection(db, 'dogs', id, 'observations'), orderBy('timestamp', 'desc')))
      .then(snap => setObs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Observation))))

    // Only fetch dog doc if not passed via route state
    if (stateDog) {
      fetchObs.finally(() => setLoading(false))
      return
    }
    setLoading(true)
    Promise.all([
      getDoc(doc(db, 'dogs', id)),
      fetchObs,
    ]).then(([dogSnap]) => {
      if (dogSnap.exists()) setDog({ id: dogSnap.id, ...dogSnap.data() } as Dog)
    }).finally(() => setLoading(false))
  }, [id])

  const handleMedia = async (e: React.ChangeEvent<HTMLInputElement>, video: boolean) => {
    const file = e.target.files?.[0]
    if (!file) return
    setMediaFile(file)
    setIsVideo(video)
    setMediaPreview(URL.createObjectURL(file))
    setAiInsight(null)

    // Run AI analysis
    setAiLoading(true)
    try {
      const base64 = video ? await extractVideoFrame(file) : await fileToBase64(file)
      const insight = await analyzeMedia(base64, obsType, dog!.name)
      setAiInsight(insight)
    } catch (err: any) {
      setAiInsight(`Could not analyze: ${err?.message ?? 'unknown error'}`)
    } finally {
      setAiLoading(false)
    }
  }

  const clearMedia = () => {
    setMediaFile(null)
    setMediaPreview(null)
    setIsVideo(false)
    setAiInsight(null)
    setAiLoading(false)
  }

  const toggleAggrBehaviour = (id: string) => {
    setAggrBehaviours(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const closeModal = () => {
    setShowModal(false)
    setDesc(''); clearMedia()
    setObsType('health'); setObsError('')
    setAggrBehaviours([])
  }

  const submitObservation = async () => {
    if (!desc.trim()) { setObsError('Description is required.'); return }
    if ((obsType === 'aggression' || obsType === 'bite') && !mediaFile) {
      setObsError(`Photo or video is required for ${obsType} reports.`); return
    }
    if (!user || !id) return

    setSubmitting(true)
    setObsError('')
    try {
      let photoURL: string | undefined
      let videoURL: string | undefined

      if (mediaFile) {
        const url = await uploadToCloudinary(mediaFile)
        if (isVideo) videoURL = url
        else         photoURL = url
      }

      await addDoc(collection(db, 'dogs', id, 'observations'), {
        dogId: id,
        type: obsType,
        description: desc.trim(),
        reportedBy: user.uid,
        timestamp: serverTimestamp(),
        confirmed: false,
        confirmations: 0,
        ...(photoURL && { photoURL }),
        ...(videoURL && { videoURL }),
        ...(aiInsight && { aiInsight }),
        ...(obsType === 'aggression' && aggrBehaviours.length > 0 && { aggrBehaviours }),
        ...(obsType === 'bite' && { biteSeverity: severity, victimAgeGroup: ageGroup, antiRabiesTaken: antiRabies }),
      })

      const snap = await getDocs(query(collection(db, 'dogs', id, 'observations'), orderBy('timestamp', 'desc')))
      setObs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Observation)))
      closeModal()
    } catch (e: any) {
      setObsError(e?.message ?? 'Failed to submit. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-3">
        <span className="text-4xl animate-bounce">🐾</span>
        <p className="text-muted text-sm">Loading profile…</p>
      </div>
    </div>
  )

  if (!dog) return (
    <div className="fixed inset-0 flex items-center justify-center bg-bg">
      <p className="text-muted">Dog not found.</p>
    </div>
  )

  const sc      = STATUS_CONFIG[dog.status]
  const bites   = observations.filter(o => o.type === 'bite')
  const byType  = OBS_TYPES.map(t => ({
    ...t,
    count: observations.filter(o => o.type === t.v).length,
  }))

  return (
    <>
      <motion.div
        className="fixed inset-0 flex flex-col bg-bg overflow-y-auto"
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* ── Hero photo ── */}
        <div className="relative h-72 bg-bg flex-shrink-0">
          {dog.photoURL
            ? <img src={dog.photoURL} className="w-full h-full object-cover" alt={dog.name} />
            : <div className="w-full h-full flex items-center justify-center text-7xl bg-bg">🐶</div>
          }
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <button
            onClick={() => navigate(-1)}
            className="absolute left-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
            style={{ top: `calc(env(safe-area-inset-top, 0px) + 12px)` }}
          >
            <ChevronLeft size={20} className="text-white" />
          </button>
          {/* Name + status over photo */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white drop-shadow">{dog.name}</h1>
                <p className="text-white/70 text-xs mt-0.5">
                  {dog.size.charAt(0).toUpperCase() + dog.size.slice(1)} · {dog.temperament}
                  {dog.vaccinated === 'yes' ? ' · 💉' : ''}
                </p>
              </div>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full text-white ${sc.bg}`}>
                {sc.icon} {sc.label}
              </span>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 flex flex-col gap-4 pb-32">

          {/* ── Risk score + quick stats ── */}
          <div className="ios-card p-4 flex items-center gap-4">
            <div className="text-center flex-shrink-0">
              <p className={`text-4xl font-bold ${RISK_COLOR(dog.riskScore)}`}>{dog.riskScore}</p>
              <p className="text-[9px] text-muted uppercase tracking-wider mt-0.5">Risk Score</p>
            </div>
            <div className="w-px h-12 bg-border flex-shrink-0" />
            <div className="flex gap-5 flex-1">
              <div className="text-center">
                <p className="text-lg font-bold text-text">{dog.observationCount}</p>
                <p className="text-[10px] text-muted">Sightings</p>
              </div>
              <div className="text-center">
                <p className={`text-lg font-bold ${dog.biteCount > 0 ? 'text-danger' : 'text-text'}`}>{dog.biteCount}</p>
                <p className="text-[10px] text-muted">Bites</p>
              </div>
              <div className="text-center">
                <p className={`text-lg font-bold ${dog.aggressionConfirmations > 0 ? 'text-warning' : 'text-text'}`}>
                  {dog.aggressionConfirmations}
                </p>
                <p className="text-[10px] text-muted">Aggression</p>
              </div>
            </div>
          </div>

          {/* ── Log observation type buttons ── */}
          <div className="ios-card p-3">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 px-1">Log an observation</p>
            <div className="flex gap-2">
              {OBS_TYPES.map(t => (
                <button
                  key={t.v}
                  onClick={() => { setObsType(t.v); setShowModal(true) }}
                  className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-ios-lg border border-border bg-bg active:bg-border transition-colors"
                >
                  <span className="text-xl">{t.emoji}</span>
                  <span className="text-[10px] text-muted font-medium leading-none text-center">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Identity + Health ── */}
          <div className="ios-card p-4">
            <p className="font-bold text-text text-sm mb-3">Profile</p>
            {[
              ['Gender',      dog.gender === 'unknown' ? '❓ Unknown' : dog.gender === 'male' ? '♂️ Male' : '♀️ Female'],
              ['Size',        dog.size.charAt(0).toUpperCase() + dog.size.slice(1)],
              ['Temperament', dog.temperament.charAt(0).toUpperCase() + dog.temperament.slice(1)],
              ['Vaccinated',  dog.vaccinated === 'yes' ? '✅ Yes' : dog.vaccinated === 'no' ? '❌ No' : '❓ Unknown'],
              ['Sterilized',  dog.sterilized === 'yes' ? '✅ Yes' : dog.sterilized === 'no' ? '❌ No' : '❓ Unknown'],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-muted">{l}</span>
                <span className="text-sm font-semibold text-text">{v}</span>
              </div>
            ))}
          </div>

          {/* ── Physical Identification ── */}
          {(dog.physicalMarkers?.length || dog.markerNotes) && (
            <div className="ios-card p-4">
              <p className="font-bold text-text text-sm mb-3">Physical Identification</p>
              {dog.physicalMarkers && dog.physicalMarkers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {dog.physicalMarkers.map(id => {
                    const m = PHYSICAL_MARKERS.find(x => x.id === id)
                    if (!m) return null
                    return (
                      <span
                        key={id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary"
                      >
                        <span>{m.emoji}</span>{m.label}
                      </span>
                    )
                  })}
                </div>
              )}
              {dog.markerNotes && (
                <p className="text-xs text-muted leading-relaxed">{dog.markerNotes}</p>
              )}
            </div>
          )}

          {/* ── Incident warning ── */}
          {(bites.length > 0 || dog.aggressionConfirmations >= 2) && (
            <div className="ios-card p-4 border-danger/30 bg-danger/5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-danger" />
                <p className="font-bold text-danger text-sm">Incident Summary</p>
              </div>
              {bites.length > 0 && (
                <div className="flex justify-between py-1.5 border-b border-danger/10">
                  <span className="text-sm text-muted">Confirmed bite reports</span>
                  <span className="text-sm font-bold text-danger">{bites.length}</span>
                </div>
              )}
              {dog.aggressionConfirmations > 0 && (
                <div className="flex justify-between py-1.5">
                  <span className="text-sm text-muted">Aggression confirmations</span>
                  <span className="text-sm font-bold text-warning">{dog.aggressionConfirmations}</span>
                </div>
              )}
            </div>
          )}

          {/* ── Observation type summary ── */}
          <div className="ios-card p-4">
            <p className="font-bold text-text text-sm mb-3">Activity Summary</p>
            <div className="flex gap-2">
              {byType.map(t => (
                <div key={t.v} className="flex-1 flex flex-col items-center gap-1 py-2 rounded-ios bg-bg">
                  <span className="text-lg">{t.emoji}</span>
                  <span className="text-sm font-bold text-text">{t.count}</span>
                  <span className="text-[9px] text-muted leading-none">{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Observation log ── */}
          <div className="ios-card p-4">
            <p className="font-bold text-text text-sm mb-3">
              Observation Log ({observations.length})
            </p>
            {observations.length === 0 ? (
              <p className="text-sm text-muted">No observations logged yet. Be the first!</p>
            ) : (
              observations.map(o => {
                const t = OBS_TYPES.find(x => x.v === o.type)
                return (
                  <div key={o.id} className="flex gap-3 py-3 border-b border-border last:border-0">
                    <div
                      className="w-9 h-9 rounded-ios flex items-center justify-center flex-shrink-0 text-base"
                      style={{ background: t?.color + '18' }}
                    >
                      {t?.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-text">{t?.label}</span>
                        <div className="flex items-center gap-1 text-muted flex-shrink-0">
                          <Clock size={10} />
                          <span className="text-[10px]">{o.timestamp ? timeAgo(o.timestamp) : 'just now'}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted line-clamp-2">{o.description}</p>
                      {o.type === 'bite' && o.biteSeverity && (
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs text-danger font-medium bg-danger/10 px-2 py-0.5 rounded-full">
                            {o.biteSeverity.replace('_', ' ')}
                          </span>
                          {o.victimAgeGroup && o.victimAgeGroup !== 'unknown' && (
                            <span className="text-xs text-muted bg-bg px-2 py-0.5 rounded-full border border-border">
                              Victim: {o.victimAgeGroup}
                            </span>
                          )}
                          {o.antiRabiesTaken === 'yes' && (
                            <span className="text-xs text-success bg-success/10 px-2 py-0.5 rounded-full">
                              💉 Rabies shot
                            </span>
                          )}
                        </div>
                      )}
                      {o.photoURL && (
                        <img src={o.photoURL} className="mt-2 h-24 rounded-ios object-cover" alt="" />
                      )}
                      {o.confirmations > 0 && (
                        <p className="text-[10px] text-muted mt-1">✓ {o.confirmations} confirmation{o.confirmations > 1 ? 's' : ''}</p>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {dog.notes && (
            <div className="ios-card p-4">
              <p className="font-bold text-text text-sm mb-1">Notes</p>
              <p className="text-sm text-muted">{dog.notes}</p>
            </div>
          )}

          <p className="text-center text-xs text-muted">
            Registered {new Date(dog.registeredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>

        {/* FAB */}
        <div className="fixed right-4" style={{ bottom: 'calc(60px + env(safe-area-inset-bottom,0px) + 12px)' }}>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-full shadow-lg font-semibold text-sm active:scale-95 transition-transform"
          >
            <Plus size={18} /> Log Observation
          </button>
        </div>
      </motion.div>

      {/* ── Observation modal ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => { if (e.target === e.currentTarget) closeModal() }}
          >
            <motion.div
              className="bg-bg rounded-t-[24px] flex flex-col max-h-[92vh]"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              {/* Modal header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div>
                  <h2 className="font-bold text-text">Log Observation</h2>
                  <p className="text-xs text-primary font-medium mt-0.5">🐾 {dog.name}</p>
                </div>
                <button onClick={closeModal} className="w-8 h-8 rounded-full bg-bg border border-border flex items-center justify-center">
                  <X size={16} className="text-muted" />
                </button>
              </div>

              <div className="overflow-y-auto px-4 py-4 flex flex-col gap-4" style={{ paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + 16px)` }}>

                {/* ── Observation type ── */}
                <div>
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Type</p>
                  <div className="flex gap-2">
                    {OBS_TYPES.map(t => (
                      <button
                        key={t.v}
                        onClick={() => { setObsType(t.v); setAiInsight(null) }}
                        className="flex-1 flex flex-col items-center gap-1 py-3 rounded-ios-lg border-2 transition-all"
                        style={{
                          borderColor: obsType === t.v ? t.color : '#E8E3DC',
                          background:  obsType === t.v ? t.color + '18' : 'white',
                        }}
                      >
                        <span className="text-xl">{t.emoji}</span>
                        <span className="text-[10px] font-semibold leading-none" style={{ color: obsType === t.v ? t.color : '#6B7280' }}>
                          {t.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Aggression behaviour chips ── */}
                {obsType === 'aggression' && (
                  <div>
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                      What did the dog do? <span className="normal-case font-normal">(select all that apply)</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {AGGRESSION_BEHAVIOURS.map(b => {
                        const active = aggrBehaviours.includes(b.id)
                        return (
                          <button
                            key={b.id}
                            onClick={() => toggleAggrBehaviour(b.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                              active
                                ? 'bg-danger/10 border-danger/40 text-danger'
                                : 'bg-white border-border text-muted'
                            }`}
                          >
                            <span>{b.emoji}</span>{b.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* ── Photo / Video upload ── */}
                <div>
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                    Photo / Video
                    {(obsType === 'aggression' || obsType === 'bite')
                      ? <span className="text-danger"> (required)</span>
                      : <span className="font-normal text-muted"> — AI will analyse</span>
                    }
                  </p>

                  {mediaPreview ? (
                    <div className="relative rounded-ios-lg overflow-hidden bg-black">
                      {isVideo
                        ? <video src={mediaPreview} controls className="w-full max-h-52 object-contain" />
                        : <img  src={mediaPreview} className="w-full max-h-52 object-cover" alt="" />
                      }
                      <button
                        onClick={clearMedia}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center"
                      >
                        <X size={15} className="text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      {/* Photo */}
                      <label className="flex-1">
                        <input
                          type="file" accept="image/*" capture="environment"
                          className="hidden" onChange={e => handleMedia(e, false)}
                        />
                        <div className="flex flex-col items-center gap-1.5 py-4 rounded-ios-lg border-2 border-dashed border-border bg-white cursor-pointer active:bg-bg transition-colors">
                          <Camera size={24} className="text-muted" />
                          <p className="text-xs text-muted font-medium">Photo</p>
                        </div>
                      </label>
                      {/* Video */}
                      <label className="flex-1">
                        <input
                          type="file" accept="video/*" capture="environment"
                          className="hidden" onChange={e => handleMedia(e, true)}
                        />
                        <div className="flex flex-col items-center gap-1.5 py-4 rounded-ios-lg border-2 border-dashed border-border bg-white cursor-pointer active:bg-bg transition-colors">
                          <Video size={24} className="text-muted" />
                          <p className="text-xs text-muted font-medium">Video</p>
                        </div>
                      </label>
                    </div>
                  )}

                  {/* ── AI Insights ── */}
                  {(aiLoading || aiInsight) && (
                    <div className="mt-2 rounded-ios-lg border border-primary/20 bg-primary/5 p-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        {aiLoading
                          ? <Loader2 size={14} className="text-primary animate-spin" />
                          : <Sparkles size={14} className="text-primary" />
                        }
                        <p className="text-xs font-semibold text-primary">AI Insight</p>
                      </div>
                      {aiLoading
                        ? <p className="text-xs text-muted animate-pulse">Analysing your upload…</p>
                        : <p className="text-xs text-text leading-relaxed whitespace-pre-wrap">{aiInsight}</p>
                      }
                    </div>
                  )}
                </div>

                {/* ── Description ── */}
                <div>
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">What did you observe? *</p>
                  <textarea
                    className="ios-input resize-none"
                    rows={3}
                    placeholder={
                      obsType === 'health'     ? "Describe the dog's health condition…" :
                      obsType === 'aggression' ? 'Describe what happened in your own words…' :
                      obsType === 'bite'       ? 'Describe the bite incident…' :
                      obsType === 'injury'     ? 'Describe the injury you saw…' :
                                                 'Describe the feeding pattern / what was fed…'
                    }
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                  />
                </div>

                {/* ── Bite-specific fields ── */}
                {obsType === 'bite' && (
                  <>
                    <div>
                      <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Bite Severity</p>
                      <Chip
                        options={[
                          { v: 'scratch'    as BiteSeverity, label: 'Minor scratch', emoji: '🟡' },
                          { v: 'skin_break' as BiteSeverity, label: 'Skin break',    emoji: '🟠' },
                          { v: 'severe'     as BiteSeverity, label: 'Severe wound',  emoji: '🔴' },
                        ]}
                        value={severity} onChange={setSeverity}
                      />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Victim Age Group</p>
                      <Chip
                        options={[
                          { v: 'child'   as AgeGroup, label: 'Child' },
                          { v: 'adult'   as AgeGroup, label: 'Adult' },
                          { v: 'elderly' as AgeGroup, label: 'Elderly' },
                          { v: 'unknown' as AgeGroup, label: 'Unknown' },
                        ]}
                        value={ageGroup} onChange={setAgeGroup}
                      />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Anti-Rabies Taken?</p>
                      <Chip
                        options={[
                          { v: 'yes'     as const, label: 'Yes',     emoji: '✅' },
                          { v: 'no'      as const, label: 'No',      emoji: '❌' },
                          { v: 'unknown' as const, label: 'Unknown', emoji: '❓' },
                        ]}
                        value={antiRabies} onChange={setAntiRabies}
                      />
                    </div>
                  </>
                )}

                {obsError && (
                  <div className="flex items-start gap-2 p-3 bg-danger/10 rounded-ios-lg border border-danger/20">
                    <AlertTriangle size={14} className="text-danger flex-shrink-0 mt-0.5" />
                    <p className="text-danger text-sm">{obsError}</p>
                  </div>
                )}

                <button className="ios-btn-primary" onClick={submitObservation} disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit Observation'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
