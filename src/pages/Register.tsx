import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Camera, MapPin } from 'lucide-react'
import { PHYSICAL_MARKERS, MARKER_GROUPS } from '../lib/markers'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useApp } from '../lib/store'
import { uploadToCloudinary } from '../lib/cloudinary'

type Gender      = 'male' | 'female' | 'unknown'
type Size        = 'small' | 'medium' | 'large'
type YNU         = 'yes' | 'no' | 'unknown'
type Temperament = 'friendly' | 'neutral' | 'alert'

function Chip<T extends string>({
  options, value, onChange,
}: { options: { v: T; label: string; emoji: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={`chip ${value === o.v ? 'chip-active' : ''}`}
        >
          <span>{o.emoji}</span>{o.label}
        </button>
      ))}
    </div>
  )
}

function Label({ text }: { text: string }) {
  return <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">{text}</p>
}

function MarkerPicker({
  selected, onChange,
}: { selected: string[]; onChange: (ids: string[]) => void }) {
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id])

  return (
    <div className="flex flex-col gap-3">
      {MARKER_GROUPS.map(group => (
        <div key={group}>
          <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1.5">{group}</p>
          <div className="flex flex-wrap gap-2">
            {PHYSICAL_MARKERS.filter(m => m.group === group).map(m => {
              const active = selected.includes(m.id)
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggle(m.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                    active
                      ? 'bg-primary/10 border-primary text-primary font-semibold'
                      : 'bg-white border-border text-muted'
                  }`}
                >
                  <span>{m.emoji}</span>{m.label}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Register() {
  const { user, coords } = useApp()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [photo, setPhoto]           = useState<File | null>(null)
  const [preview, setPreview]       = useState<string | null>(null)
  const [name, setName]             = useState('')
  const [markers, setMarkers]       = useState<string[]>([])
  const [markerNotes, setMarkerNotes] = useState('')
  const [gender, setGender]         = useState<Gender>('unknown')
  const [size, setSize]             = useState<Size>('medium')
  const [vaccinated, setVaccinated] = useState<YNU>('unknown')
  const [sterilized, setSterilized] = useState<YNU>('unknown')
  const [temperament, setTemperament] = useState<Temperament>('neutral')
  const [notes, setNotes]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async () => {
    if (!photo) { setError('Photo is required.'); return }
    if (!coords) { setError('Location not available. Please enable GPS.'); return }
    if (!user) return

    setLoading(true)
    setError('')
    try {
      const photoURL = await uploadToCloudinary(photo)

      await addDoc(collection(db, 'dogs'), {
        name: name.trim() || 'Unknown',
        ...(markers.length > 0  && { physicalMarkers: markers }),
        ...(markerNotes.trim()  && { markerNotes: markerNotes.trim() }),
        photoURL,
        latitude: coords.lat,
        longitude: coords.lng,
        gender, size, vaccinated, sterilized, temperament,
        notes: notes.trim(),
        registeredBy: user.uid,
        registeredAt: serverTimestamp(),
        riskScore: temperament === 'alert' ? 20 : 0,
        status: temperament === 'alert' ? 'caution' : 'safe',
        observationCount: 0,
        biteCount: 0,
        aggressionConfirmations: 0,
      })

      navigate('/discover')
    } catch (e: any) {
      setError(e?.message ?? 'Registration failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      className="fixed inset-0 flex flex-col bg-bg"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="bg-white border-b border-border px-4 flex items-center"
        style={{ paddingTop: `calc(env(safe-area-inset-top, 0px) + 12px)`, paddingBottom: 12 }}>
        <div>
          <h1 className="text-lg font-bold text-text">Register a Dog</h1>
          <p className="text-xs text-muted">Help the community keep track</p>
        </div>
      </div>

      {/* Form */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5"
        style={{ marginBottom: 'calc(60px + env(safe-area-inset-bottom,0px))' }}
      >
        {/* Photo */}
        <div>
          <Label text="Photo *" />
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full h-48 rounded-ios-xl border-2 border-dashed border-border bg-white flex flex-col items-center justify-center gap-2 active:bg-bg transition-colors relative overflow-hidden"
          >
            {preview ? (
              <>
                <img src={preview} className="absolute inset-0 w-full h-full object-cover" alt="preview" />
                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Camera size={12} /> Retake
                </div>
              </>
            ) : (
              <>
                <Camera size={36} className="text-muted" />
                <p className="text-sm text-muted font-medium">Tap to take photo</p>
                <p className="text-xs text-muted/70">Required</p>
              </>
            )}
          </button>
        </div>

        {/* GPS */}
        <div>
          <Label text="Location" />
          <div className={`flex items-center gap-3 p-3 rounded-ios-lg border ${coords ? 'border-border bg-white' : 'border-danger/30 bg-danger/5'}`}>
            <MapPin size={20} className={coords ? 'text-success' : 'text-danger'} />
            <div className="flex-1">
              {coords ? (
                <>
                  <p className="text-sm font-semibold text-success">GPS auto-tagged</p>
                  <p className="text-xs text-muted font-mono">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</p>
                </>
              ) : (
                <p className="text-sm font-semibold text-danger">Location unavailable — enable GPS</p>
              )}
            </div>
          </div>
        </div>

        {/* Name */}
        <div>
          <Label text="Name / Nickname" />
          <input
            className="ios-input"
            placeholder="e.g. Bruno, Tommy… (optional)"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        {/* Physical identification */}
        <div>
          <Label text="Physical Identification" />
          <p className="text-xs text-muted mb-3 -mt-1">
            Select visible traits to help others recognise this specific dog.
          </p>
          <MarkerPicker selected={markers} onChange={setMarkers} />
          {markers.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-muted mb-1.5">Additional details (optional)</p>
              <input
                className="ios-input"
                placeholder="e.g. large scar on left shoulder, one blue eye…"
                value={markerNotes}
                onChange={e => setMarkerNotes(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Gender */}
        <div>
          <Label text="Gender (optional)" />
          <Chip
            options={[{ v: 'male', label: 'Male', emoji: '♂️' }, { v: 'female', label: 'Female', emoji: '♀️' }, { v: 'unknown', label: 'Unknown', emoji: '❓' }]}
            value={gender} onChange={setGender}
          />
        </div>

        {/* Sterilized */}
        <div>
          <Label text="Sterilized" />
          <Chip
            options={[{ v: 'yes', label: 'Yes', emoji: '✂️' }, { v: 'no', label: 'No', emoji: '❌' }, { v: 'unknown', label: 'Unknown', emoji: '❓' }]}
            value={sterilized} onChange={setSterilized}
          />
        </div>

        {/* Vaccinated */}
        <div>
          <Label text="Vaccinated" />
          <Chip
            options={[{ v: 'yes', label: 'Yes', emoji: '💉' }, { v: 'no', label: 'No', emoji: '❌' }, { v: 'unknown', label: 'Unknown', emoji: '❓' }]}
            value={vaccinated} onChange={setVaccinated}
          />
        </div>

        {/* Size */}
        <div>
          <Label text="Approx Size" />
          <Chip
            options={[{ v: 'small', label: 'Small', emoji: '🐩' }, { v: 'medium', label: 'Medium', emoji: '🐕' }, { v: 'large', label: 'Large', emoji: '🦮' }]}
            value={size} onChange={setSize}
          />
        </div>

        {/* Temperament */}
        <div>
          <Label text="Temperament" />
          <Chip
            options={[{ v: 'friendly', label: 'Friendly', emoji: '😊' }, { v: 'neutral', label: 'Neutral', emoji: '😐' }, { v: 'alert', label: 'Reactive', emoji: '⚠️' }]}
            value={temperament} onChange={setTemperament}
          />
        </div>

        {/* Notes */}
        <div>
          <Label text="Notes (optional)" />
          <textarea
            className="ios-input resize-none"
            rows={3}
            placeholder="Any other details…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        {error && <p className="text-danger text-sm">{error}</p>}

        <button
          className="ios-btn-primary"
          onClick={handleSubmit}
          disabled={!photo || !coords || loading}
        >
          {loading ? 'Registering…' : 'Register Dog'}
        </button>

        <p className="text-center text-xs text-muted pb-2">
          By submitting, you confirm this is an accurate report.
        </p>
      </div>
    </motion.div>
  )
}
