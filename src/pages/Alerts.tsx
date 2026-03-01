import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, Navigation, Loader2, RefreshCw, MapPin, AlertCircle } from 'lucide-react'
import { TabPage } from '../components/PageTransition'
import { useApp } from '../lib/store'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Place {
  id: number
  name: string
  lat: number
  lon: number
  phone?: string
  openingHours?: string
  distance: number
}

interface Contact {
  name: string
  phone: string
  desc: string
}

interface CityContacts {
  label: string
  sos: Contact[]
  authority: Contact[]
}

// ─── Curated contacts ─────────────────────────────────────────────────────────

const NATIONAL_SOS: Contact[] = [
  { name: 'Animal Welfare Board of India', phone: '044-26617620',     desc: 'National animal welfare authority — report cruelty' },
  { name: 'PETA India',                    phone: '+91 98201 22602',  desc: 'Emergency rescue & cruelty investigation' },
  { name: 'People for Animals (PFA)',      phone: '+91 11 2332 0027', desc: 'Nation-wide animal welfare network' },
  { name: 'Blue Cross of India',           phone: '+91 44 2235 1000', desc: 'Rescue, treatment & adoption — Chennai HQ' },
  { name: 'Friendicoes SECA',              phone: '+91 98113 15062',  desc: '24/7 rescue & rehabilitation across India' },
  { name: 'World For All Animal Care',     phone: '+91 98205 70702',  desc: 'Emergency animal rescue network' },
]

const NATIONAL_AUTHORITY: Contact[] = [
  { name: 'National Animal Disease Helpline', phone: '1962',  desc: 'Report disease outbreaks, bites, stray dog menace' },
  { name: 'Police Emergency',                 phone: '100',   desc: 'For aggressive dog attacks or animal cruelty' },
  { name: 'National Emergency Helpline',      phone: '112',   desc: 'All emergencies — police, fire, ambulance' },
  { name: 'Ambulance',                        phone: '102',   desc: 'If you or anyone is injured by an animal' },
]

const CITY_CONTACTS: Record<string, CityContacts> = {
  bengaluru: {
    label: 'Bengaluru',
    sos: [
      { name: 'BBMP Veterinary Helpline',     phone: '1533',              desc: 'Municipal animal welfare — ABC programme' },
      { name: 'Cessna Lifeline Vet Hospital', phone: '+91 80 4093 4093',  desc: '24/7 emergency vet hospital, Bengaluru' },
      { name: 'CARE Animal Rescue',           phone: '+91 98459 97059',   desc: 'Citizens Against Animal Cruelty & Exploitation' },
      { name: 'Karuna Animal Welfare',        phone: '+91 98444 73839',   desc: 'Rescue & rehabilitation' },
    ],
    authority: [
      { name: 'BBMP Control Room',         phone: '1533',              desc: 'Bruhat Bengaluru Mahanagara Palike' },
      { name: 'BBMP Animal Husbandry',     phone: '+91 80 2221 7831',  desc: 'Stray dog management & ABC complaints' },
      { name: 'Bengaluru Police',          phone: '100',               desc: 'Dog attack, cruelty & nuisance complaints' },
    ],
  },
  chennai: {
    label: 'Chennai',
    sos: [
      { name: 'Blue Cross of India',  phone: '+91 44 2235 1000', desc: 'Rescue, treatment, adoption — HQ Chennai' },
      { name: 'AWBI Chennai',         phone: '+91 44 2819 1705', desc: 'Animal Welfare Board — regional office' },
      { name: 'WSD Chennai',          phone: '+91 98410 60000',  desc: 'Stray dog welfare & rescue' },
    ],
    authority: [
      { name: 'GCC Control Room',      phone: '1913',              desc: 'Greater Chennai Corporation helpline' },
      { name: 'GCC Animal Husbandry',  phone: '+91 44 2538 3050', desc: 'ABC programme & stray dog complaints' },
      { name: 'Chennai Police',        phone: '100',               desc: 'Dog attack & cruelty complaints' },
    ],
  },
  mumbai: {
    label: 'Mumbai',
    sos: [
      { name: 'Welfare of Stray Dogs (WSD)', phone: '+91 22 2386 0062',  desc: 'Rescue, TNR, feeding drives across Mumbai' },
      { name: 'BSPCA Mumbai',                phone: '+91 22 2308 0061',  desc: 'Bombay SPCA — rescue & hospital' },
      { name: 'PAWS Mumbai',                 phone: '+91 77 100 28 100', desc: 'Emergency animal ambulance' },
      { name: 'In Defense of Animals',       phone: '+91 98204 78787',   desc: 'Rescue, treatment & legal support' },
    ],
    authority: [
      { name: 'BMC Control Room',      phone: '1916',              desc: 'Brihanmumbai Municipal Corporation' },
      { name: 'BMC Animal Husbandry',  phone: '+91 22 2265 1551',  desc: 'Stray dog management & ABC programme' },
      { name: 'Mumbai Police',         phone: '100',               desc: 'Dog attack & cruelty complaints' },
    ],
  },
  delhi: {
    label: 'Delhi',
    sos: [
      { name: 'Friendicoes SECA',  phone: '+91 98113 15062',  desc: '24/7 rescue across Delhi-NCR' },
      { name: 'PFA Delhi',         phone: '+91 11 2332 0027', desc: 'People for Animals — Delhi chapter' },
      { name: 'Wildlife SOS',      phone: '+91 98713 71635',  desc: 'Handles injured street dogs & wildlife' },
    ],
    authority: [
      { name: 'SDMC Animal Husbandry', phone: '011-23325786',     desc: 'South Delhi Municipal Corp' },
      { name: 'MCD Animal Husbandry',  phone: '011-23236118',     desc: 'ABC programme & stray dog complaints' },
      { name: 'Delhi Police',          phone: '100',              desc: 'Dog attack & cruelty complaints' },
    ],
  },
  hyderabad: {
    label: 'Hyderabad',
    sos: [
      { name: 'GHMC Animal Husbandry', phone: '040-23225141',     desc: 'Municipal animal helpline' },
      { name: 'Blue Cross Hyderabad',  phone: '+91 40 2780 7999', desc: 'Rescue & treatment' },
      { name: 'CUPA Hyderabad',        phone: '+91 98491 65363',  desc: 'Compassion Unlimited Plus Action' },
    ],
    authority: [
      { name: 'GHMC Control Room',     phone: '040-21111111',     desc: 'Greater Hyderabad Municipal Corporation' },
      { name: 'GHMC Animal Husbandry', phone: '040-23225141',     desc: 'ABC programme & stray dog complaints' },
      { name: 'Hyderabad Police',      phone: '100',              desc: 'Dog attack & cruelty complaints' },
    ],
  },
  kolkata: {
    label: 'Kolkata',
    sos: [
      { name: 'SPCA Kolkata',      phone: '+91 33 2239 2173', desc: 'Society for Prevention of Cruelty to Animals' },
      { name: 'Kolkata SPCA',      phone: '033-24766071',     desc: 'Animal hospital & rescue centre' },
      { name: 'PFA Kolkata',       phone: '+91 98301 47889',  desc: 'People for Animals — Kolkata chapter' },
    ],
    authority: [
      { name: 'KMC Control Room',    phone: '+91 33 2286 1212', desc: 'Kolkata Municipal Corporation' },
      { name: 'KMC Animal Division', phone: '+91 33 2289 5046', desc: 'Stray dog management' },
      { name: 'Kolkata Police',      phone: '100',              desc: 'Dog attack & cruelty complaints' },
    ],
  },
  pune: {
    label: 'Pune',
    sos: [
      { name: 'SPCA Pune',              phone: '+91 20 2612 3017', desc: 'Rescue, treatment & adoption' },
      { name: 'Abandoned Animals Pune', phone: '+91 98222 37877',  desc: 'Rescue & rehabilitation' },
      { name: 'In Paws We Trust',       phone: '+91 95956 44800',  desc: 'Emergency animal rescue, Pune' },
    ],
    authority: [
      { name: 'PMC Control Room',    phone: '020-26127733', desc: 'Pune Municipal Corporation helpline' },
      { name: 'PMC Animal Division', phone: '020-25506800', desc: 'ABC programme & stray dog complaints' },
      { name: 'Pune Police',         phone: '100',          desc: 'Dog attack & cruelty complaints' },
    ],
  },
  ahmedabad: {
    label: 'Ahmedabad',
    sos: [
      { name: 'AMC Animal Husbandry',  phone: '079-25390984',     desc: 'Ahmedabad Municipal Corporation' },
      { name: 'PETA India (Gujarat)',  phone: '+91 98201 22602',  desc: 'Emergency rescue — Gujarat region' },
      { name: 'Street Dog Foundation', phone: '+91 96010 24449',  desc: 'Rescue & care in Ahmedabad' },
    ],
    authority: [
      { name: 'AMC Control Room',    phone: '079-25391818',     desc: 'Ahmedabad Municipal Corporation' },
      { name: 'AMC Animal Division', phone: '079-25390984',     desc: 'Stray dog complaints & ABC' },
      { name: 'Ahmedabad Police',    phone: '100',              desc: 'Dog attack & cruelty complaints' },
    ],
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

function formatDist(m: number) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`
}

function detectCity(data: any): string {
  const raw = [
    data?.address?.city,
    data?.address?.town,
    data?.address?.county,
    data?.address?.state_district,
  ].filter(Boolean).join(' ').toLowerCase()

  if (raw.includes('bengaluru') || raw.includes('bangalore'))  return 'bengaluru'
  if (raw.includes('chennai')   || raw.includes('madras'))     return 'chennai'
  if (raw.includes('mumbai')    || raw.includes('bombay'))     return 'mumbai'
  if (raw.includes('delhi'))                                    return 'delhi'
  if (raw.includes('hyderabad'))                                return 'hyderabad'
  if (raw.includes('kolkata')   || raw.includes('calcutta'))   return 'kolkata'
  if (raw.includes('pune'))                                     return 'pune'
  if (raw.includes('ahmedabad'))                                return 'ahmedabad'
  return ''
}

async function fetchOverpass(amenity: string, lat: number, lon: number): Promise<Place[]> {
  const q = `[out:json][timeout:20];(node["amenity"="${amenity}"](around:5000,${lat},${lon});way["amenity"="${amenity}"](around:5000,${lat},${lon}););out center tags;`
  const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: q })
  if (!res.ok) throw new Error('Request failed')
  const data = await res.json()
  return (data.elements as any[])
    .map((el: any) => {
      const eLat = el.lat ?? el.center?.lat
      const eLon = el.lon ?? el.center?.lon
      if (!eLat || !eLon) return null
      return {
        id:           el.id,
        name:         el.tags?.name || el.tags?.['name:en'] || 'Unnamed',
        lat:          eLat,
        lon:          eLon,
        phone:        el.tags?.phone || el.tags?.['contact:phone'] || el.tags?.['contact:mobile'],
        openingHours: el.tags?.opening_hours,
        distance:     haversine(lat, lon, eLat, eLon),
      } as Place
    })
    .filter(Boolean)
    .sort((a, b) => a!.distance - b!.distance)
    .slice(0, 15) as Place[]
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="ios-card p-4 flex gap-3 animate-pulse">
      <div className="w-10 h-10 rounded-ios bg-border flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2 justify-center">
        <div className="h-3.5 bg-border rounded w-3/4" />
        <div className="h-3 bg-border rounded w-1/2" />
      </div>
    </div>
  )
}

function PlaceCard({ place, accent, emoji }: { place: Place; accent: string; emoji: string }) {
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}`
  return (
    <div className="ios-card p-4 flex gap-3">
      <div
        className="w-10 h-10 rounded-ios flex items-center justify-center flex-shrink-0 text-lg"
        style={{ background: accent + '18' }}
      >
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <p className="text-sm font-semibold text-text leading-snug flex-1">{place.name}</p>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: accent + '18', color: accent }}
          >
            {formatDist(place.distance)}
          </span>
        </div>
        {place.openingHours && (
          <p className="text-[11px] text-muted">🕐 {place.openingHours}</p>
        )}
        {place.phone && (
          <p className="text-[11px] text-muted mt-0.5">{place.phone}</p>
        )}
        <div className="flex gap-2 mt-2.5">
          {place.phone && (
            <a
              href={`tel:${place.phone}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-white text-xs font-semibold text-text active:bg-bg"
            >
              <Phone size={11} /> Call
            </a>
          )}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white active:opacity-80"
            style={{ background: accent }}
          >
            <Navigation size={11} /> Directions
          </a>
        </div>
      </div>
    </div>
  )
}

function ContactCard({ contact, accent }: { contact: Contact; accent: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: accent + '18' }}
      >
        <Phone size={14} style={{ color: accent }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text leading-snug">{contact.name}</p>
        <p className="text-xs text-muted mt-0.5 leading-relaxed">{contact.desc}</p>
        <a
          href={`tel:${contact.phone}`}
          className="text-sm font-bold mt-1 inline-block active:opacity-70"
          style={{ color: accent }}
        >
          {contact.phone}
        </a>
      </div>
    </div>
  )
}

function NoGPS({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-6">
      <div className="w-14 h-14 rounded-full bg-muted/10 flex items-center justify-center">
        <MapPin size={24} className="text-muted" />
      </div>
      <p className="font-semibold text-text">Location required</p>
      <p className="text-sm text-muted leading-relaxed">
        Enable GPS to find the {label} nearest to you.
      </p>
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-6">
      <AlertCircle size={28} className="text-danger" />
      <p className="font-semibold text-text">Could not load results</p>
      <p className="text-sm text-muted">Check your connection and try again.</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-white text-sm font-semibold active:bg-bg"
      >
        <RefreshCw size={14} /> Retry
      </button>
    </div>
  )
}

// ─── Tab content ─────────────────────────────────────────────────────────────

function LocationTab({
  places, loading, error, coords, label, accent, emoji, onRetry,
}: {
  places: Place[]
  loading: boolean
  error: string
  coords: { lat: number; lng: number } | null
  label: string
  accent: string
  emoji: string
  onRetry: () => void
}) {
  if (!coords) return <NoGPS label={label} />

  return (
    <div className="flex flex-col gap-3">
      {loading ? (
        <>
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </>
      ) : error ? (
        <ErrorState onRetry={onRetry} />
      ) : places.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-6">
          <span className="text-4xl">{emoji}</span>
          <p className="font-semibold text-text">No {label} found within 5 km</p>
          <p className="text-sm text-muted leading-relaxed">
            OpenStreetMap data may be incomplete in your area. Try searching on Google Maps.
          </p>
          <a
            href={`https://www.google.com/maps/search/${encodeURIComponent(label)}/@${coords.lat},${coords.lng},14z`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white active:opacity-80"
            style={{ background: accent }}
          >
            <Navigation size={14} /> Search on Google Maps
          </a>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted px-1">{places.length} found within 5 km · Tap for directions</p>
          {places.map(p => (
            <PlaceCard key={p.id} place={p} accent={accent} emoji={emoji} />
          ))}
          <p className="text-[10px] text-muted text-center px-4 pb-2">
            Data sourced from OpenStreetMap. Results may be incomplete.
          </p>
        </>
      )}
    </div>
  )
}

function SOSTab({ city, cityData }: { city: string; cityData: CityContacts | null }) {
  return (
    <div className="flex flex-col gap-4">

      {/* City-specific */}
      {cityData ? (
        <div className="ios-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-danger/10 flex items-center justify-center">
              <span className="text-sm">📍</span>
            </div>
            <p className="font-bold text-text text-sm">{cityData.label} — Local Rescuers</p>
          </div>
          {cityData.sos.map(c => <ContactCard key={c.name} contact={c} accent="#DC2626" />)}
        </div>
      ) : (
        !city && (
          <div className="rounded-ios-lg p-3 border border-border bg-white flex gap-2 items-center">
            <MapPin size={14} className="text-muted flex-shrink-0" />
            <p className="text-xs text-muted">Enable GPS for city-specific rescue contacts.</p>
          </div>
        )
      )}

      {/* National */}
      <div className="ios-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm">🇮🇳</span>
          </div>
          <p className="font-bold text-text text-sm">National Animal Rescue</p>
        </div>
        {NATIONAL_SOS.map(c => <ContactCard key={c.name} contact={c} accent="#1E3A2F" />)}
      </div>

    </div>
  )
}

function AuthorityTab({ city, cityData }: { city: string; cityData: CityContacts | null }) {
  return (
    <div className="flex flex-col gap-4">

      {/* City-specific */}
      {cityData ? (
        <div className="ios-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-warning/10 flex items-center justify-center">
              <span className="text-sm">📍</span>
            </div>
            <p className="font-bold text-text text-sm">{cityData.label} — Municipal Authorities</p>
          </div>
          {cityData.authority.map(c => <ContactCard key={c.name} contact={c} accent="#D97706" />)}
        </div>
      ) : (
        !city && (
          <div className="rounded-ios-lg p-3 border border-border bg-white flex gap-2 items-center">
            <MapPin size={14} className="text-muted flex-shrink-0" />
            <p className="text-xs text-muted">Enable GPS for city corporation and municipal contacts.</p>
          </div>
        )
      )}

      {/* National helplines */}
      <div className="ios-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm">🏛</span>
          </div>
          <p className="font-bold text-text text-sm">National Helplines</p>
        </div>
        {NATIONAL_AUTHORITY.map(c => <ContactCard key={c.name} contact={c} accent="#1E3A2F" />)}
      </div>

      {/* How to file complaint */}
      <div className="ios-card p-4 bg-primary/5 border-primary/20">
        <p className="font-bold text-primary text-sm mb-2">How to file a complaint</p>
        {[
          'Call your municipal corporation helpline and state your area/ward number',
          'Describe the incident — number of dogs, location, aggressive behaviour',
          'Quote the Animal Birth Control (Dogs) Rules, 2001 if ABC not being followed',
          'Follow up with an email to the Animal Husbandry department for a written record',
          'You can also file an RTI to track action taken on your complaint',
        ].map((tip, i) => (
          <div key={i} className="flex gap-2 items-start py-1.5 border-b border-primary/10 last:border-0">
            <span className="text-primary font-bold text-sm flex-shrink-0">{i + 1}.</span>
            <p className="text-xs text-primary/80 leading-relaxed">{tip}</p>
          </div>
        ))}
      </div>

    </div>
  )
}

// ─── Tabs config ──────────────────────────────────────────────────────────────

const TABS = [
  { id: 'vet',       label: 'Vet',       emoji: '🏥', accent: '#10B981' },
  { id: 'pharmacy',  label: 'Pharmacy',  emoji: '💊', accent: '#3B82F6' },
  { id: 'sos',       label: 'SOS',       emoji: '🆘', accent: '#DC2626' },
  { id: 'authority', label: 'Authority', emoji: '🏛', accent: '#D97706' },
] as const

type TabId = typeof TABS[number]['id']

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Alerts() {
  const { coords } = useApp()

  const [activeTab, setActiveTab] = useState<TabId>('vet')
  const [prevTab,   setPrevTab]   = useState<TabId>('vet')
  const [city,      setCity]      = useState('')

  // Location results cache (avoid re-fetching on tab switch)
  const cache    = useRef<Partial<Record<'vet' | 'pharmacy', Place[]>>>({})
  const [places,  setPlaces]  = useState<Place[]>([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  // City detection (runs once when GPS arrives)
  useEffect(() => {
    if (!coords || city) return
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=10&accept-language=en`)
      .then(r => r.json())
      .then(d => setCity(detectCity(d)))
      .catch(() => {})
  }, [coords])

  // Fetch Overpass data for vet / pharmacy tabs
  const doFetch = (tab: 'vet' | 'pharmacy') => {
    if (!coords) return
    setLoading(true)
    setError('')
    const amenity = tab === 'vet' ? 'veterinary' : 'pharmacy'
    fetchOverpass(amenity, coords.lat, coords.lng)
      .then(results => {
        cache.current[tab] = results
        setPlaces(results)
      })
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (activeTab !== 'vet' && activeTab !== 'pharmacy') {
      setPlaces([])
      return
    }
    if (!coords) return
    if (cache.current[activeTab]) {
      setPlaces(cache.current[activeTab]!)
      return
    }
    doFetch(activeTab)
  }, [activeTab, coords])

  const cityData = city ? CITY_CONTACTS[city] ?? null : null

  const tabIndex  = TABS.findIndex(t => t.id === activeTab)
  const prevIndex = TABS.findIndex(t => t.id === prevTab)
  const direction = tabIndex >= prevIndex ? 1 : -1

  const handleTab = (id: TabId) => {
    if (id === activeTab) return
    setPrevTab(activeTab)
    setActiveTab(id)
  }

  const activeConfig = TABS.find(t => t.id === activeTab)!

  return (
    <TabPage className="flex flex-col bg-bg">

      {/* Header */}
      <div
        className="bg-white border-b border-border flex-shrink-0"
        style={{ paddingTop: `calc(env(safe-area-inset-top, 0px) + 12px)` }}
      >
        <div className="px-4 pb-2">
          <h1 className="text-lg font-bold text-text">Help & Resources</h1>
          <p className="text-xs text-muted">
            {city && cityData ? `Showing contacts for ${cityData.label}` : 'Vets · Pharmacy · Rescue · Authorities'}
          </p>
        </div>

        {/* GPS status pill */}
        {coords && (
          <div className="px-4 pb-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-success bg-success/10 border border-success/20 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              GPS active — showing nearest results
            </span>
          </div>
        )}

        {/* Segmented tabs */}
        <div className="flex px-4 pb-0 gap-0">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => handleTab(t.id)}
              className="relative flex-1 flex flex-col items-center gap-0.5 py-2.5 outline-none"
            >
              <span className="text-base">{t.emoji}</span>
              <span
                className="text-[10px] font-semibold transition-colors duration-150"
                style={{ color: activeTab === t.id ? t.accent : '#6B7280' }}
              >
                {t.label}
              </span>
              {activeTab === t.id && (
                <motion.div
                  layoutId="alerts-tab-line"
                  className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                  style={{ background: t.accent }}
                  transition={{ type: 'spring', stiffness: 500, damping: 42 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div
        className="flex-1 overflow-hidden relative"
        style={{ marginBottom: 'calc(60px + env(safe-area-inset-bottom,0px))' }}
      >
        <AnimatePresence mode="popLayout" custom={direction}>
          <motion.div
            key={activeTab}
            custom={direction}
            initial={{ x: direction * 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 40, mass: 0.8 }}
            className="absolute inset-0 overflow-y-auto px-4 py-4"
          >
            {(activeTab === 'vet' || activeTab === 'pharmacy') && (
              <LocationTab
                places={places}
                loading={loading}
                error={error}
                coords={coords}
                label={activeTab === 'vet' ? 'veterinary clinics' : 'pharmacies'}
                accent={activeConfig.accent}
                emoji={activeConfig.emoji}
                onRetry={() => doFetch(activeTab as 'vet' | 'pharmacy')}
              />
            )}
            {activeTab === 'sos'       && <SOSTab       city={city} cityData={cityData} />}
            {activeTab === 'authority' && <AuthorityTab city={city} cityData={cityData} />}
            <div className="h-4" />
          </motion.div>
        </AnimatePresence>

        {/* Loading spinner overlay for location tabs */}
        {loading && (
          <div className="absolute top-4 right-4 z-10">
            <Loader2 size={16} className="text-muted animate-spin" />
          </div>
        )}
      </div>

    </TabPage>
  )
}
