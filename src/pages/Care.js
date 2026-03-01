import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TabPage } from '../components/PageTransition';
// ─── Data ────────────────────────────────────────────────────────────────────
const SAFE_FOODS = [
    { emoji: '🍚', name: 'Plain rice', desc: 'Cooked, no salt or oil. Easy on stomach, great filler.', tip: '2–3 cups per meal' },
    { emoji: '🍗', name: 'Boiled chicken', desc: 'Boneless only, zero spices. High protein, easy to digest.', tip: 'Mix with rice' },
    { emoji: '🫓', name: 'Plain roti', desc: 'No butter or ghee. Cheap, filling, totally safe.', tip: '2–3 rotis per meal' },
    { emoji: '🥚', name: 'Boiled egg', desc: 'Excellent protein. Remove shell. One egg per day max.', tip: '1/day maximum' },
    { emoji: '🥕', name: 'Carrot / cucumber', desc: 'Raw or cooked. Good for teeth and hydration.', tip: 'As a treat' },
    { emoji: '🍌', name: 'Banana', desc: 'Small pieces only. Good energy source.', tip: 'Half banana max' },
    { emoji: '🥥', name: 'Coconut water', desc: 'Natural electrolytes. Great for hot days and sick dogs.', tip: '100–200 ml' },
];
const GLUCOSE_TIP = {
    emoji: '⭐',
    title: 'Glucose-D water > Parle-G biscuits',
    body: 'Most people give biscuits but they\'re loaded with sugar, salt, and maida — bad for dogs. Instead, mix 2 tsp of Glucose-D powder in 500 ml water. Costs ₹35 for a 500g pack, gives energy and hydration. Even better: add an Electral ORS sachet (₹10) for sick or dehydrated dogs.',
};
const UNSAFE_FOODS = [
    { emoji: '🧅', name: 'Onion & Garlic', reason: 'Destroys red blood cells — causes anaemia even in small amounts' },
    { emoji: '🍫', name: 'Chocolate', reason: 'Theobromine is highly toxic. Can cause seizures and death' },
    { emoji: '🍇', name: 'Grapes & Raisins', reason: 'Causes acute kidney failure even in tiny amounts' },
    { emoji: '🥛', name: 'Milk', reason: 'Most dogs are lactose intolerant — causes diarrhoea' },
    { emoji: '🌶️', name: 'Spicy or fried food', reason: 'Irritates stomach and intestines, causes vomiting' },
    { emoji: '🍪', name: 'Marie / Parle-G', reason: 'High sugar + salt + maida. People mean well but it harms dogs' },
    { emoji: '🦴', name: 'Cooked bones', reason: 'Splinter easily and can puncture the intestine — never give' },
    { emoji: '🍬', name: 'Xylitol (sugar-free)', reason: 'Found in chewing gum, causes fatal blood sugar drop' },
];
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
];
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
];
const DONT_DO = [
    'Suck or squeeze the wound — spreads bacteria deeper',
    'Apply turmeric, chili, or oil — folk remedies cause infection',
    'Tie the wound very tightly — cuts off blood flow',
    'Skip any ARV dose — even if you feel completely fine',
    'Wait and watch for symptoms — by then it\'s too late',
    'Give the dog Paracetamol/Ibuprofen — these are toxic to dogs',
];
const RABIES_FACTS = [
    { icon: '💀', label: '100% fatal once symptoms appear — no cure exists' },
    { icon: '✅', label: '100% preventable if vaccine is started in time' },
    { icon: '🏥', label: 'ARV vaccine is FREE at all government hospitals' },
    { icon: '⏱️', label: 'Incubation period: 7 days to months — don\'t gamble' },
    { icon: '🐕', label: 'If the biting dog stays healthy for 10 days, risk is low' },
    { icon: '📍', label: 'Even scratches can transmit if there\'s broken skin' },
];
const EMERGENCY_CONTACTS = [
    { name: 'Medical Emergency', number: '102' },
    { name: 'National Animal Helpline', number: '1962' },
    { name: 'Blue Cross of India', number: '+91 44 2235 1000' },
    { name: 'PETA India', number: '+91 98201 22602' },
];
// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionTitle({ children }) {
    return _jsx("p", { className: "text-xs font-semibold text-muted uppercase tracking-wider mb-3", children: children });
}
function Card({ children, className = '' }) {
    return _jsx("div", { className: `ios-card p-4 ${className}`, children: children });
}
// ─── Tab content ─────────────────────────────────────────────────────────────
function FoodTab() {
    return (_jsxs("div", { className: "flex flex-col gap-4", children: [_jsx("div", { className: "rounded-ios-lg p-4 border border-accent/40 bg-accent/8", children: _jsxs("div", { className: "flex gap-2 items-start", children: [_jsx("span", { className: "text-xl mt-0.5", children: "\u2B50" }), _jsxs("div", { children: [_jsx("p", { className: "font-bold text-[#8B5A00] text-sm mb-1", children: GLUCOSE_TIP.title }), _jsx("p", { className: "text-xs text-[#6B4500] leading-relaxed", children: GLUCOSE_TIP.body })] })] }) }), _jsxs(Card, { children: [_jsx(SectionTitle, { children: "\u2705 Safe to feed" }), _jsx("div", { className: "flex flex-col", children: SAFE_FOODS.map(f => (_jsxs("div", { className: "flex items-start gap-3 py-2.5 border-b border-border last:border-0", children: [_jsx("span", { className: "text-2xl", children: f.emoji }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("p", { className: "text-sm font-semibold text-text", children: f.name }), _jsx("span", { className: "text-[10px] text-muted bg-bg border border-border px-2 py-0.5 rounded-full flex-shrink-0", children: f.tip })] }), _jsx("p", { className: "text-xs text-muted mt-0.5 leading-relaxed", children: f.desc })] })] }, f.name))) })] }), _jsxs(Card, { children: [_jsx(SectionTitle, { children: "\uD83D\uDD50 Feeding tips" }), _jsx("div", { className: "flex flex-col gap-2", children: [
                            'Feed at the same time each day — builds trust over time',
                            'Always leave fresh water nearby, especially in summer',
                            '1–2 meals a day is ideal. Overfeeding causes stomach issues',
                            'Feed in a quiet spot, away from traffic',
                            'Wash your hands before and after handling food',
                        ].map((tip, i) => (_jsxs("div", { className: "flex gap-2.5 items-start", children: [_jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-success mt-1.5 flex-shrink-0" }), _jsx("p", { className: "text-sm text-muted leading-relaxed", children: tip })] }, i))) })] }), _jsxs(Card, { children: [_jsx(SectionTitle, { children: "\u274C Never feed these" }), _jsx("div", { className: "flex flex-col", children: UNSAFE_FOODS.map(f => (_jsxs("div", { className: "flex items-start gap-3 py-2.5 border-b border-border last:border-0", children: [_jsx("span", { className: "text-2xl", children: f.emoji }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm font-semibold text-danger", children: f.name }), _jsx("p", { className: "text-xs text-muted mt-0.5 leading-relaxed", children: f.reason })] })] }, f.name))) })] })] }));
}
function MedicineTab() {
    return (_jsxs("div", { className: "flex flex-col gap-4", children: [_jsxs("div", { className: "rounded-ios-lg p-3 border border-warning/40 bg-warning/8 flex gap-2", children: [_jsx("span", { className: "text-lg", children: "\u26A0\uFE0F" }), _jsxs("p", { className: "text-xs text-[#7A4F00] leading-relaxed", children: [_jsx("strong", { children: "Never give Paracetamol, Ibuprofen, or Aspirin to a dog." }), " These are toxic. For pain or fever, always consult a vet. The medicines below are for external care and basic support only."] })] }), MEDICINES.map(section => (_jsxs(Card, { children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx("div", { className: "w-8 h-8 rounded-ios flex items-center justify-center text-base flex-shrink-0", style: { background: section.color + '18' }, children: section.emoji }), _jsx("p", { className: "font-bold text-text text-sm", children: section.condition })] }), _jsx("div", { className: "flex flex-col gap-2", children: section.products.map(p => (_jsx("div", { className: "flex items-start gap-3 py-2.5 border-b border-border last:border-0", children: _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsx("p", { className: "text-sm font-semibold text-text leading-snug flex-1", children: p.name }), _jsxs("span", { className: "text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0", style: {
                                                    background: section.color + '18',
                                                    color: section.color,
                                                }, children: ["Under ", p.badge] })] }), _jsx("p", { className: "text-xs text-muted mt-0.5 leading-relaxed", children: p.use })] }) }, p.name))) })] }, section.condition))), _jsxs(Card, { className: "bg-primary/5 border-primary/20", children: [_jsx(SectionTitle, { children: "\uD83D\uDED2 Where to buy" }), [
                        { store: 'Medical stores (chemist)', note: 'Betadine, saline, ORS, Albendazole, Soframycin' },
                        { store: 'Kirana / grocery store', note: 'Glucose-D, coconut oil, coconut water, neem oil' },
                        { store: 'Pet shops', note: 'Tick shampoo, tick collar, Himalaya vet products' },
                        { store: 'Vet clinic', note: 'Ivermectin injection, prescription medicines' },
                    ].map(r => (_jsxs("div", { className: "py-2 border-b border-primary/10 last:border-0", children: [_jsx("p", { className: "text-sm font-semibold text-primary", children: r.store }), _jsx("p", { className: "text-xs text-muted mt-0.5", children: r.note })] }, r.store)))] })] }));
}
function BiteTab() {
    return (_jsxs("div", { className: "flex flex-col gap-4", children: [_jsxs("div", { className: "rounded-ios-lg p-4 border border-danger/30 bg-danger/5", children: [_jsx("p", { className: "font-bold text-danger text-base mb-1", children: "Got bitten? Don't panic." }), _jsx("p", { className: "text-sm text-danger/80 leading-relaxed", children: "Rabies is 100% preventable \u2014 but only if you act fast. Follow these steps calmly and in order." })] }), _jsxs(Card, { children: [_jsx(SectionTitle, { children: "\uD83D\uDEA8 What to do immediately" }), _jsx("div", { className: "flex flex-col gap-0", children: BITE_STEPS.map((s, i) => (_jsxs("div", { className: "flex gap-3 pb-4 last:pb-0 relative", children: [i < BITE_STEPS.length - 1 && (_jsx("div", { className: "absolute left-[15px] top-8 bottom-0 w-0.5 bg-border" })), _jsx("div", { className: `w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold z-10 ${s.urgent
                                        ? 'bg-danger text-white'
                                        : 'bg-primary/10 text-primary'}`, children: s.step }), _jsxs("div", { className: "flex-1 pt-1", children: [_jsx("p", { className: `text-sm font-bold mb-1 ${s.urgent ? 'text-danger' : 'text-text'}`, children: s.title }), _jsx("p", { className: "text-xs text-muted leading-relaxed", children: s.body })] })] }, s.step))) })] }), _jsxs(Card, { children: [_jsx(SectionTitle, { children: "\uD83D\uDEAB Never do these" }), _jsx("div", { className: "flex flex-col gap-2", children: DONT_DO.map((d, i) => (_jsxs("div", { className: "flex gap-2.5 items-start py-1.5 border-b border-border last:border-0", children: [_jsx("span", { className: "text-danger font-bold text-sm flex-shrink-0", children: "\u2717" }), _jsx("p", { className: "text-sm text-muted leading-relaxed", children: d })] }, i))) })] }), _jsxs(Card, { children: [_jsx(SectionTitle, { children: "\uD83E\uDDE0 Know about rabies" }), _jsx("div", { className: "flex flex-col gap-3", children: RABIES_FACTS.map(f => (_jsxs("div", { className: "flex gap-3 items-start", children: [_jsx("span", { className: "text-xl flex-shrink-0", children: f.icon }), _jsx("p", { className: "text-sm text-text leading-relaxed", children: f.label })] }, f.label))) })] }), _jsxs(Card, { className: "border-primary/20 bg-primary/5", children: [_jsx(SectionTitle, { children: "\uD83D\uDC89 Anti-Rabies Vaccine schedule" }), _jsxs("p", { className: "text-xs text-muted mb-3 leading-relaxed", children: ["5 doses total. ", _jsx("strong", { className: "text-primary", children: "FREE at all government hospitals." }), " Start on the day of bite (Day 0)."] }), _jsx("div", { className: "flex gap-2 flex-wrap", children: ['Day 0', 'Day 3', 'Day 7', 'Day 14', 'Day 28'].map((d, i) => (_jsxs("div", { className: "flex flex-col items-center gap-1", children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold", children: i + 1 }), _jsx("span", { className: "text-[10px] text-primary font-semibold", children: d })] }, d))) }), _jsx("p", { className: "text-xs text-danger mt-3 font-medium", children: "\u26A0\uFE0F Do not skip any dose \u2014 even if the wound heals or you feel fine." })] }), _jsxs(Card, { className: "border-danger/20 bg-danger/5", children: [_jsx(SectionTitle, { children: "\uD83D\uDCDE Emergency contacts" }), EMERGENCY_CONTACTS.map(c => (_jsxs("div", { className: "flex justify-between items-center py-2.5 border-b border-danger/10 last:border-0", children: [_jsx("span", { className: "text-sm text-text", children: c.name }), _jsx("a", { href: `tel:${c.number}`, className: "text-sm font-bold text-danger active:opacity-70", children: c.number })] }, c.name)))] })] }));
}
// ─── Tabs config ──────────────────────────────────────────────────────────────
const TABS = [
    { id: 'food', label: 'Food', emoji: '🍽' },
    { id: 'medicine', label: 'Medicine', emoji: '💊' },
    { id: 'bite', label: 'Bite Care', emoji: '🩹' },
];
// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Care() {
    const [activeTab, setActiveTab] = useState('food');
    const [prevTab, setPrevTab] = useState('food');
    const tabIndex = TABS.findIndex(t => t.id === activeTab);
    const prevIndex = TABS.findIndex(t => t.id === prevTab);
    const direction = tabIndex >= prevIndex ? 1 : -1;
    const handleTab = (id) => {
        if (id === activeTab)
            return;
        setPrevTab(activeTab);
        setActiveTab(id);
    };
    return (_jsxs(TabPage, { className: "flex flex-col bg-bg", children: [_jsxs("div", { className: "bg-white border-b border-border flex-shrink-0", style: { paddingTop: `calc(env(safe-area-inset-top, 0px) + 12px)` }, children: [_jsxs("div", { className: "px-4 pb-2", children: [_jsx("h1", { className: "text-lg font-bold text-text", children: "Care Guide" }), _jsx("p", { className: "text-xs text-muted", children: "Feeding \u00B7 Medicine \u00B7 Bite first aid" })] }), _jsx("div", { className: "flex px-4 pb-0 gap-0", children: TABS.map(t => (_jsxs("button", { onClick: () => handleTab(t.id), className: "relative flex-1 flex flex-col items-center gap-1 py-2.5 outline-none", children: [_jsxs("span", { className: `text-sm font-semibold transition-colors duration-150 ${activeTab === t.id ? 'text-primary' : 'text-muted'}`, children: [t.emoji, " ", t.label] }), activeTab === t.id && (_jsx(motion.div, { layoutId: "care-tab-underline", className: "absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary", transition: { type: 'spring', stiffness: 500, damping: 42 } }))] }, t.id))) })] }), _jsx("div", { className: "flex-1 overflow-hidden relative", style: { marginBottom: 'calc(60px + env(safe-area-inset-bottom,0px))' }, children: _jsx(AnimatePresence, { mode: "popLayout", custom: direction, children: _jsxs(motion.div, { custom: direction, initial: { x: direction * 60, opacity: 0 }, animate: { x: 0, opacity: 1 }, exit: { x: direction * -60, opacity: 0 }, transition: { type: 'spring', stiffness: 400, damping: 40, mass: 0.8 }, className: "absolute inset-0 overflow-y-auto px-4 py-4", children: [activeTab === 'food' && _jsx(FoodTab, {}), activeTab === 'medicine' && _jsx(MedicineTab, {}), activeTab === 'bite' && _jsx(BiteTab, {}), _jsx("div", { className: "h-4" })] }, activeTab) }) })] }));
}
