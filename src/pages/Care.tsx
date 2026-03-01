import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TabPage } from '../components/PageTransition'

// ─── Data ────────────────────────────────────────────────────────────────────

const SAFE_FOODS = [
  { emoji: '🍚', name: 'Plain rice',       desc: 'Cooked, no salt or oil. Easy on stomach, great filler.',        tip: '2–3 cups per meal'         },
  { emoji: '🍗', name: 'Boiled chicken',   desc: 'Boneless only, zero spices. High protein, easy to digest.',     tip: 'Mix with rice'             },
  { emoji: '🫓', name: 'Plain roti',       desc: 'No butter or ghee. Cheap, filling, totally safe.',              tip: '2–3 rotis per meal'        },
  { emoji: '🥚', name: 'Boiled egg',       desc: 'Excellent protein. Remove shell. One egg per day max.',         tip: '1/day maximum'             },
  { emoji: '🥕', name: 'Carrot / cucumber', desc: 'Raw or cooked. Good for teeth and hydration.',                 tip: 'As a treat'                },
  { emoji: '🍌', name: 'Banana',           desc: 'Small pieces only. Good energy source.',                        tip: 'Half banana max'           },
  { emoji: '🥥', name: 'Coconut water',    desc: 'Natural electrolytes. Great for hot days and sick dogs.',       tip: '100–200 ml'                },
]

const GLUCOSE_TIP = {
  emoji: '⭐',
  title: 'Glucose-D water > Parle-G biscuits',
  body: 'Most people give biscuits but they\'re loaded with sugar, salt, and maida — bad for dogs. Instead, mix 2 tsp of Glucose-D powder in 500 ml water. Costs ₹35 for a 500g pack, gives energy and hydration. Even better: add an Electral ORS sachet (₹10) for sick or dehydrated dogs.',
}

const UNSAFE_FOODS = [
  { emoji: '🧅', name: 'Onion & Garlic',       reason: 'Destroys red blood cells — causes anaemia even in small amounts' },
  { emoji: '🍫', name: 'Chocolate',             reason: 'Theobromine is highly toxic. Can cause seizures and death'        },
  { emoji: '🍇', name: 'Grapes & Raisins',      reason: 'Causes acute kidney failure even in tiny amounts'                },
  { emoji: '🥛', name: 'Milk',                  reason: 'Most dogs are lactose intolerant — causes diarrhoea'             },
  { emoji: '🌶️', name: 'Spicy or fried food',  reason: 'Irritates stomach and intestines, causes vomiting'               },
  { emoji: '🍪', name: 'Marie / Parle-G',       reason: 'High sugar + salt + maida. People mean well but it harms dogs'   },
  { emoji: '🦴', name: 'Cooked bones',          reason: 'Splinter easily and can puncture the intestine — never give'     },
  { emoji: '🍬', name: 'Xylitol (sugar-free)', reason: 'Found in chewing gum, causes fatal blood sugar drop'              },
]

const MEDICINES = [
  {
    condition: 'Ticks & Fleas',
    emoji: '🦟',
    color: '#EF4444',
    products: [
      { name: 'Himalaya Erina Anti-Tick Shampoo', use: 'Bath once a week during tick season', price: 85, badge: '₹100' },
      { name: 'Neem oil diluted in water', use: 'Spray on coat, safe and natural tick repellent', price: 40, badge: '₹50' },
      { name: 'Tick-Off Powder (Cipla Vet)', use: 'Dust on coat and bedding area', price: 45, badge: '₹50' },
      { name: 'Tick Collar (generic)', use: 'Lasts 2–3 months, put on if dog is semi-owned', price: 80, badge: '₹100' },
    ],
  },
  {
    condition: 'Mange / Hair Loss / Itching',
    emoji: '🐕',
    color: '#F59E0B',
    products: [
      { name: 'Betadine scrub (Povidone-Iodine)', use: 'Dilute 1:10 in water, scrub mange patches gently', price: 50, badge: '₹50' },
      { name: 'Coconut oil (cold-pressed)', use: 'Massage on dry, itchy skin. Relieves redness', price: 60, badge: '₹100' },
      { name: 'Himalaya Skin Care Ointment', use: 'Apply on red, itchy, or scabby areas twice daily', price: 80, badge: '₹100' },
      { name: 'Ivermectin injection', use: 'For severe mange — needs a vet but very affordable', price: 40, badge: '₹50' },
    ],
  },
  {
    condition: 'Wounds & Cuts',
    emoji: '🩹',
    color: '#3B82F6',
    products: [
      { name: 'Normal Saline 500 ml (Baxter)', use: 'Best way to flush and clean any wound', price: 25, badge: '₹50' },
      { name: 'Betadine solution 30 ml', use: 'Apply after washing wound. Don\'t use on deep wounds', price: 30, badge: '₹50' },
      { name: 'Soframycin cream 25g', use: 'Antibiotic cream for cuts and abrasions', price: 35, badge: '₹50' },
      { name: 'Gauze + adhesive bandage roll', use: 'Cover wound after cleaning. Change daily', price: 40, badge: '₹50' },
    ],
  },
  {
    condition: 'Dehydration / Weakness',
    emoji: '💧',
    color: '#10B981',
    products: [
      { name: 'Glucose-D 500g (Heinz/Zydus)', use: 'Mix 2 tsp in 500 ml water. Better than biscuits!', price: 35, badge: '₹50' },
      { name: 'Electral ORS sachet', use: 'Mix 1 sachet in 1L water. Ideal for sick/dehydrated dog', price: 15, badge: '₹50' },
      { name: 'Coconut water (tetra pack)', use: 'Natural electrolytes. Pour in a bowl during summer', price: 30, badge: '₹50' },
    ],
  },
  {
    condition: 'Worms / Deworming',
    emoji: '💊',
    color: '#8B5CF6',
    products: [
      { name: 'Albendazole 400mg tablet', use: 'Crush and mix in food. Deworm every 3 months', price: 5, badge: '₹50' },
      { name: 'Zentel 400mg (GSK)', use: 'Same as above, trusted brand, widely available', price: 10, badge: '₹50' },
      { name: 'Piperazine Syrup (generic)', use: 'Pour on food. Good for puppies and small dogs', price: 40, badge: '₹50' },
    ],
  },
]

const BITE_STEPS = [
  {
    step: '1',
    title: 'Stay calm & move away',
    body: 'Don\'t run or shout — it may provoke the dog further. Back away slowly. Panic causes delayed treatment decisions.',
    urgent: false,
  },
  {
    step: '2',
    title: 'Wash the wound — this saves your life',
    body: 'Immediately wash under running water for 10–15 full minutes. Scrub gently with soap. This single step can flush out the virus. Do not skip or shorten this — it is more important than any medicine.',
    urgent: true,
  },
  {
    step: '3',
    title: 'Apply antiseptic',
    body: 'After washing, apply Betadine (Povidone-Iodine) or Dettol. Cover loosely with a clean bandage. Don\'t tie tightly.',
    urgent: false,
  },
  {
    step: '4',
    title: 'Go to hospital NOW — don\'t wait',
    body: 'Even if the wound looks minor. Anti-Rabies Vaccine (ARV) must be started within 24 hours. All government hospitals give it FREE. You need 5 doses: Day 0, 3, 7, 14, and 28. Do NOT miss any dose.',
    urgent: true,
  },
  {
    step: '5',
    title: 'Complete all 5 vaccine doses',
    body: 'Even if you feel completely fine after the first dose — the virus has a long incubation period (weeks to months). Completing all 5 doses is what keeps you safe. Never stop midway.',
    urgent: false,
  },
  {
    step: '6',
    title: 'Log the dog on CarePaw',
    body: 'Go to the dog\'s profile and log an Aggression or Bite report. This alerts others in your neighbourhood and helps track the dog\'s risk level.',
    urgent: false,
  },
]

const DONT_DO = [
  'Suck or squeeze the wound — spreads bacteria deeper',
  'Apply turmeric, chili, or oil — folk remedies cause infection',
  'Tie the wound very tightly — cuts off blood flow',
  'Skip any ARV dose — even if you feel completely fine',
  'Wait and watch for symptoms — by then it\'s too late',
  'Give the dog Paracetamol/Ibuprofen — these are toxic to dogs',
]

const RABIES_FACTS = [
  { icon: '💀', label: '100% fatal once symptoms appear — no cure exists' },
  { icon: '✅', label: '100% preventable if vaccine is started in time' },
  { icon: '🏥', label: 'ARV vaccine is FREE at all government hospitals' },
  { icon: '⏱️', label: 'Incubation period: 7 days to months — don\'t gamble' },
  { icon: '🐕', label: 'If the biting dog stays healthy for 10 days, risk is low' },
  { icon: '📍', label: 'Even scratches can transmit if there\'s broken skin' },
]

const EMERGENCY_CONTACTS = [
  { name: 'Medical Emergency',         number: '102'            },
  { name: 'National Animal Helpline',  number: '1962'           },
  { name: 'Blue Cross of India',       number: '+91 44 2235 1000' },
  { name: 'PETA India',                number: '+91 98201 22602' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">{children}</p>
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`ios-card p-4 ${className}`}>{children}</div>
}

// ─── Tab content ─────────────────────────────────────────────────────────────

function FoodTab() {
  return (
    <div className="flex flex-col gap-4">

      {/* Glucose tip — highlight card */}
      <div className="rounded-ios-lg p-4 border border-accent/40 bg-accent/8">
        <div className="flex gap-2 items-start">
          <span className="text-xl mt-0.5">⭐</span>
          <div>
            <p className="font-bold text-[#8B5A00] text-sm mb-1">{GLUCOSE_TIP.title}</p>
            <p className="text-xs text-[#6B4500] leading-relaxed">{GLUCOSE_TIP.body}</p>
          </div>
        </div>
      </div>

      {/* Safe foods */}
      <Card>
        <SectionTitle>✅ Safe to feed</SectionTitle>
        <div className="flex flex-col">
          {SAFE_FOODS.map(f => (
            <div key={f.name} className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
              <span className="text-2xl">{f.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-text">{f.name}</p>
                  <span className="text-[10px] text-muted bg-bg border border-border px-2 py-0.5 rounded-full flex-shrink-0">{f.tip}</span>
                </div>
                <p className="text-xs text-muted mt-0.5 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Feeding tips */}
      <Card>
        <SectionTitle>🕐 Feeding tips</SectionTitle>
        <div className="flex flex-col gap-2">
          {[
            'Feed at the same time each day — builds trust over time',
            'Always leave fresh water nearby, especially in summer',
            '1–2 meals a day is ideal. Overfeeding causes stomach issues',
            'Feed in a quiet spot, away from traffic',
            'Wash your hands before and after handling food',
          ].map((tip, i) => (
            <div key={i} className="flex gap-2.5 items-start">
              <div className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 flex-shrink-0" />
              <p className="text-sm text-muted leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Unsafe foods */}
      <Card>
        <SectionTitle>❌ Never feed these</SectionTitle>
        <div className="flex flex-col">
          {UNSAFE_FOODS.map(f => (
            <div key={f.name} className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
              <span className="text-2xl">{f.emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-danger">{f.name}</p>
                <p className="text-xs text-muted mt-0.5 leading-relaxed">{f.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function MedicineTab() {
  return (
    <div className="flex flex-col gap-4">

      {/* Warning */}
      <div className="rounded-ios-lg p-3 border border-warning/40 bg-warning/8 flex gap-2">
        <span className="text-lg">⚠️</span>
        <p className="text-xs text-[#7A4F00] leading-relaxed">
          <strong>Never give Paracetamol, Ibuprofen, or Aspirin to a dog.</strong> These are toxic. For pain or fever, always consult a vet. The medicines below are for external care and basic support only.
        </p>
      </div>

      {MEDICINES.map(section => (
        <Card key={section.condition}>
          {/* Section header */}
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-8 h-8 rounded-ios flex items-center justify-center text-base flex-shrink-0"
              style={{ background: section.color + '18' }}
            >
              {section.emoji}
            </div>
            <p className="font-bold text-text text-sm">{section.condition}</p>
          </div>

          <div className="flex flex-col gap-2">
            {section.products.map(p => (
              <div key={p.name} className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-text leading-snug flex-1">{p.name}</p>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{
                        background: section.color + '18',
                        color: section.color,
                      }}
                    >
                      Under {p.badge}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-0.5 leading-relaxed">{p.use}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}

      {/* Where to buy */}
      <Card className="bg-primary/5 border-primary/20">
        <SectionTitle>🛒 Where to buy</SectionTitle>
        {[
          { store: 'Medical stores (chemist)', note: 'Betadine, saline, ORS, Albendazole, Soframycin' },
          { store: 'Kirana / grocery store',   note: 'Glucose-D, coconut oil, coconut water, neem oil' },
          { store: 'Pet shops',                note: 'Tick shampoo, tick collar, Himalaya vet products' },
          { store: 'Vet clinic',               note: 'Ivermectin injection, prescription medicines' },
        ].map(r => (
          <div key={r.store} className="py-2 border-b border-primary/10 last:border-0">
            <p className="text-sm font-semibold text-primary">{r.store}</p>
            <p className="text-xs text-muted mt-0.5">{r.note}</p>
          </div>
        ))}
      </Card>
    </div>
  )
}

function BiteTab() {
  return (
    <div className="flex flex-col gap-4">

      {/* Panic banner */}
      <div className="rounded-ios-lg p-4 border border-danger/30 bg-danger/5">
        <p className="font-bold text-danger text-base mb-1">Got bitten? Don't panic.</p>
        <p className="text-sm text-danger/80 leading-relaxed">
          Rabies is 100% preventable — but only if you act fast. Follow these steps calmly and in order.
        </p>
      </div>

      {/* Steps */}
      <Card>
        <SectionTitle>🚨 What to do immediately</SectionTitle>
        <div className="flex flex-col gap-0">
          {BITE_STEPS.map((s, i) => (
            <div key={s.step} className="flex gap-3 pb-4 last:pb-0 relative">
              {/* Connector line */}
              {i < BITE_STEPS.length - 1 && (
                <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-border" />
              )}
              {/* Step circle */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold z-10 ${
                s.urgent
                  ? 'bg-danger text-white'
                  : 'bg-primary/10 text-primary'
              }`}>
                {s.step}
              </div>
              <div className="flex-1 pt-1">
                <p className={`text-sm font-bold mb-1 ${s.urgent ? 'text-danger' : 'text-text'}`}>{s.title}</p>
                <p className="text-xs text-muted leading-relaxed">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Don'ts */}
      <Card>
        <SectionTitle>🚫 Never do these</SectionTitle>
        <div className="flex flex-col gap-2">
          {DONT_DO.map((d, i) => (
            <div key={i} className="flex gap-2.5 items-start py-1.5 border-b border-border last:border-0">
              <span className="text-danger font-bold text-sm flex-shrink-0">✗</span>
              <p className="text-sm text-muted leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Rabies facts */}
      <Card>
        <SectionTitle>🧠 Know about rabies</SectionTitle>
        <div className="flex flex-col gap-3">
          {RABIES_FACTS.map(f => (
            <div key={f.label} className="flex gap-3 items-start">
              <span className="text-xl flex-shrink-0">{f.icon}</span>
              <p className="text-sm text-text leading-relaxed">{f.label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* ARV schedule */}
      <Card className="border-primary/20 bg-primary/5">
        <SectionTitle>💉 Anti-Rabies Vaccine schedule</SectionTitle>
        <p className="text-xs text-muted mb-3 leading-relaxed">
          5 doses total. <strong className="text-primary">FREE at all government hospitals.</strong> Start on the day of bite (Day 0).
        </p>
        <div className="flex gap-2 flex-wrap">
          {['Day 0', 'Day 3', 'Day 7', 'Day 14', 'Day 28'].map((d, i) => (
            <div key={d} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                {i + 1}
              </div>
              <span className="text-[10px] text-primary font-semibold">{d}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-danger mt-3 font-medium">
          ⚠️ Do not skip any dose — even if the wound heals or you feel fine.
        </p>
      </Card>

      {/* Emergency contacts */}
      <Card className="border-danger/20 bg-danger/5">
        <SectionTitle>📞 Emergency contacts</SectionTitle>
        {EMERGENCY_CONTACTS.map(c => (
          <div key={c.name} className="flex justify-between items-center py-2.5 border-b border-danger/10 last:border-0">
            <span className="text-sm text-text">{c.name}</span>
            <a
              href={`tel:${c.number}`}
              className="text-sm font-bold text-danger active:opacity-70"
            >
              {c.number}
            </a>
          </div>
        ))}
      </Card>
    </div>
  )
}

// ─── Tabs config ──────────────────────────────────────────────────────────────

const TABS = [
  { id: 'food',     label: 'Food',     emoji: '🍽' },
  { id: 'medicine', label: 'Medicine', emoji: '💊' },
  { id: 'bite',     label: 'Bite Care', emoji: '🩹' },
] as const

type TabId = typeof TABS[number]['id']

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Care() {
  const [activeTab, setActiveTab] = useState<TabId>('food')
  const [prevTab, setPrevTab]     = useState<TabId>('food')

  const tabIndex    = TABS.findIndex(t => t.id === activeTab)
  const prevIndex   = TABS.findIndex(t => t.id === prevTab)
  const direction   = tabIndex >= prevIndex ? 1 : -1

  const handleTab = (id: TabId) => {
    if (id === activeTab) return
    setPrevTab(activeTab)
    setActiveTab(id)
  }

  return (
    <TabPage className="flex flex-col bg-bg">

      {/* Header */}
      <div className="bg-white border-b border-border flex-shrink-0"
        style={{ paddingTop: `calc(env(safe-area-inset-top, 0px) + 12px)` }}>
        <div className="px-4 pb-2">
          <h1 className="text-lg font-bold text-text">Care Guide</h1>
          <p className="text-xs text-muted">Feeding · Medicine · Bite first aid</p>
        </div>

        {/* Segmented tab bar */}
        <div className="flex px-4 pb-0 gap-0">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => handleTab(t.id)}
              className="relative flex-1 flex flex-col items-center gap-1 py-2.5 outline-none"
            >
              <span className={`text-sm font-semibold transition-colors duration-150 ${
                activeTab === t.id ? 'text-primary' : 'text-muted'
              }`}>
                {t.emoji} {t.label}
              </span>

              {/* Sliding active underline */}
              {activeTab === t.id && (
                <motion.div
                  layoutId="care-tab-underline"
                  className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary"
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
            {activeTab === 'food'     && <FoodTab />}
            {activeTab === 'medicine' && <MedicineTab />}
            {activeTab === 'bite'     && <BiteTab />}
            {/* Bottom padding so last card clears the tab bar */}
            <div className="h-4" />
          </motion.div>
        </AnimatePresence>
      </div>

    </TabPage>
  )
}
