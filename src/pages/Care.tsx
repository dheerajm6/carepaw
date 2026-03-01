import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'

const FOOD_GUIDE = [
  { emoji: '🍚', name: 'Plain rice', desc: 'Cooked, no salt — easy to digest', safe: true },
  { emoji: '🍗', name: 'Boiled chicken', desc: 'No bones, no seasoning', safe: true },
  { emoji: '🥕', name: 'Carrots', desc: 'Good for teeth, vitamin A', safe: true },
  { emoji: '🥚', name: 'Boiled egg', desc: 'High protein, once a day max', safe: true },
  { emoji: '🍌', name: 'Banana', desc: 'Occasional treat, small amounts', safe: true },
  { emoji: '🧅', name: 'Onion / Garlic', desc: 'Toxic — causes anaemia', safe: false },
  { emoji: '🍫', name: 'Chocolate', desc: 'Highly toxic — never feed', safe: false },
  { emoji: '🥛', name: 'Milk', desc: 'Most dogs are lactose intolerant', safe: false },
  { emoji: '🍇', name: 'Grapes / Raisins', desc: 'Can cause kidney failure', safe: false },
]

export default function Care() {
  return (
    <motion.div
      className="fixed inset-0 flex flex-col bg-bg"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    >
      <div className="bg-white border-b border-border px-4"
        style={{ paddingTop: `calc(env(safe-area-inset-top, 0px) + 12px)`, paddingBottom: 12 }}>
        <h1 className="text-lg font-bold text-text">❤️ Care Guide</h1>
        <p className="text-xs text-muted">Feeding & health tips for street dogs</p>
      </div>

      <div
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4"
        style={{ marginBottom: 'calc(60px + env(safe-area-inset-bottom,0px))' }}
      >
        {/* Feeding tips */}
        <div className="ios-card p-4">
          <p className="font-bold text-text mb-3">🍽 Feeding Tips</p>
          <div className="flex flex-col gap-1">
            {['Feed at the same time daily — builds trust',
              'Always provide fresh water nearby',
              'Avoid overfeeding — 1–2 meals/day is ideal',
              'Wash hands after feeding',
              'Don\'t feed near traffic or busy roads',
            ].map((tip, i) => (
              <div key={i} className="flex gap-2 py-1.5 border-b border-border last:border-0">
                <span className="text-primary font-bold text-sm">✓</span>
                <p className="text-sm text-muted">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Food guide */}
        <div className="ios-card p-4">
          <p className="font-bold text-text mb-3">What to Feed (and NOT feed)</p>
          {FOOD_GUIDE.map(f => (
            <div key={f.name} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
              <span className="text-2xl">{f.emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-text">{f.name}</p>
                <p className="text-xs text-muted">{f.desc}</p>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                f.safe ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                {f.safe ? '✓ Safe' : '✗ Avoid'}
              </span>
            </div>
          ))}
        </div>

        {/* Health signs */}
        <div className="ios-card p-4">
          <p className="font-bold text-text mb-3">🩺 Signs to Watch For</p>
          {[
            { emoji: '🔴', label: 'Seek vet immediately', items: ['Seizures', 'Unable to walk', 'Severe bleeding', 'Difficulty breathing'] },
            { emoji: '🟡', label: 'Monitor closely', items: ['Loss of appetite (>2 days)', 'Swollen limbs', 'Excessive scratching', 'Discharge from eyes/nose'] },
            { emoji: '🟢', label: 'Good signs', items: ['Alert and responsive', 'Shiny coat', 'Normal appetite', 'Active movement'] },
          ].map(section => (
            <div key={section.label} className="mb-3 last:mb-0">
              <p className="text-xs font-semibold text-muted mb-1">{section.emoji} {section.label}</p>
              {section.items.map(item => (
                <p key={item} className="text-sm text-text py-0.5 pl-3 border-l-2 border-border mb-1">
                  {item}
                </p>
              ))}
            </div>
          ))}
        </div>

        {/* Emergency */}
        <div className="ios-card p-4 bg-primary/5 border-primary/20">
          <p className="font-bold text-primary mb-2">📞 Emergency Contacts</p>
          {[
            { name: 'Animal Helpline', number: '1962' },
            { name: 'Blue Cross of India', number: '+91 44 2235 1000' },
            { name: 'PETA India', number: '+91 98201 22602' },
          ].map(c => (
            <div key={c.name} className="flex justify-between py-1.5 border-b border-primary/10 last:border-0">
              <span className="text-sm text-text">{c.name}</span>
              <a href={`tel:${c.number}`} className="text-sm font-semibold text-primary">{c.number}</a>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
