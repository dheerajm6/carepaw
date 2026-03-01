import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { StackPage } from '../components/PageTransition';
import { ChevronLeft, Plus, Camera, Video, X, Clock, AlertTriangle, Sparkles, Loader2 } from 'lucide-react';
import { doc, getDoc, collection, addDoc, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { uploadToCloudinary } from '../lib/cloudinary';
import { useApp } from '../lib/store';
import { OBS_TYPES } from '../lib/constants';
import { PHYSICAL_MARKERS } from '../lib/markers';
import { analyzeMedia, extractVideoFrame, fileToBase64, AGGRESSION_BEHAVIOURS } from '../lib/ai';
function Chip({ options, value, onChange }) {
    return (_jsx("div", { className: "flex flex-wrap gap-2", children: options.map(o => (_jsxs("button", { onClick: () => onChange(o.v), className: `chip ${value === o.v ? 'chip-active' : ''}`, children: [o.emoji && _jsx("span", { children: o.emoji }), o.label] }, o.v))) }));
}
function timeAgo(ts) {
    const diff = Date.now() - new Date(ts).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1)
        return 'just now';
    if (h < 24)
        return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}
const STATUS_CONFIG = {
    safe: { bg: 'bg-success', label: 'Safe', icon: '🟢' },
    caution: { bg: 'bg-warning', label: 'Caution', icon: '🟡' },
    alert: { bg: 'bg-danger', label: 'Alert', icon: '🔴' },
};
const RISK_COLOR = (score) => score >= 60 ? 'text-danger' : score >= 30 ? 'text-warning' : 'text-success';
export default function DogProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useApp();
    // Dog + pre-selected log type passed via route state from the list tile
    const stateDog = location.state?.dog;
    const initType = location.state?.logType;
    const [dog, setDog] = useState(stateDog ?? null);
    const [observations, setObs] = useState([]);
    const [showModal, setShowModal] = useState(!!initType);
    const [loading, setLoading] = useState(!stateDog);
    // Observation form
    const [obsType, setObsType] = useState(initType ?? 'health');
    const [desc, setDesc] = useState('');
    const [mediaFile, setMediaFile] = useState(null);
    const [mediaPreview, setMediaPreview] = useState(null);
    const [isVideo, setIsVideo] = useState(false);
    const [aiInsight, setAiInsight] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [severity, setSeverity] = useState('scratch');
    const [ageGroup, setAgeGroup] = useState('unknown');
    const [antiRabies, setAntiRabies] = useState('unknown');
    const [aggrBehaviours, setAggrBehaviours] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [obsError, setObsError] = useState('');
    useEffect(() => {
        if (!id)
            return;
        // Always fetch observations fresh from Firestore
        const fetchObs = getDocs(query(collection(db, 'dogs', id, 'observations'), orderBy('timestamp', 'desc')))
            .then(snap => setObs(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        // Only fetch dog doc if not passed via route state
        if (stateDog) {
            fetchObs.finally(() => setLoading(false));
            return;
        }
        setLoading(true);
        Promise.all([
            getDoc(doc(db, 'dogs', id)),
            fetchObs,
        ]).then(([dogSnap]) => {
            if (dogSnap.exists())
                setDog({ id: dogSnap.id, ...dogSnap.data() });
        }).finally(() => setLoading(false));
    }, [id]);
    const handleMedia = async (e, video) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        setMediaFile(file);
        setIsVideo(video);
        setMediaPreview(URL.createObjectURL(file));
        setAiInsight(null);
        // Run AI analysis
        setAiLoading(true);
        try {
            const base64 = video ? await extractVideoFrame(file) : await fileToBase64(file);
            const insight = await analyzeMedia(base64, obsType, dog.name);
            setAiInsight(insight);
        }
        catch (err) {
            setAiInsight(`Could not analyze: ${err?.message ?? 'unknown error'}`);
        }
        finally {
            setAiLoading(false);
        }
    };
    const clearMedia = () => {
        setMediaFile(null);
        setMediaPreview(null);
        setIsVideo(false);
        setAiInsight(null);
        setAiLoading(false);
    };
    const toggleAggrBehaviour = (id) => {
        setAggrBehaviours(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };
    const closeModal = () => {
        setShowModal(false);
        setDesc('');
        clearMedia();
        setObsType('health');
        setObsError('');
        setAggrBehaviours([]);
    };
    const submitObservation = async () => {
        if (!desc.trim()) {
            setObsError('Description is required.');
            return;
        }
        if ((obsType === 'aggression' || obsType === 'bite') && !mediaFile) {
            setObsError(`Photo or video is required for ${obsType} reports.`);
            return;
        }
        if (!user || !id)
            return;
        setSubmitting(true);
        setObsError('');
        try {
            let photoURL;
            let videoURL;
            if (mediaFile) {
                const url = await uploadToCloudinary(mediaFile);
                if (isVideo)
                    videoURL = url;
                else
                    photoURL = url;
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
            });
            const snap = await getDocs(query(collection(db, 'dogs', id, 'observations'), orderBy('timestamp', 'desc')));
            setObs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            closeModal();
        }
        catch (e) {
            setObsError(e?.message ?? 'Failed to submit. Try again.');
        }
        finally {
            setSubmitting(false);
        }
    };
    if (loading)
        return (_jsx("div", { className: "fixed inset-0 flex items-center justify-center bg-bg", children: _jsxs("div", { className: "flex flex-col items-center gap-3", children: [_jsx("span", { className: "text-4xl animate-bounce", children: "\uD83D\uDC3E" }), _jsx("p", { className: "text-muted text-sm", children: "Loading profile\u2026" })] }) }));
    if (!dog)
        return (_jsx("div", { className: "fixed inset-0 flex items-center justify-center bg-bg", children: _jsx("p", { className: "text-muted", children: "Dog not found." }) }));
    const sc = STATUS_CONFIG[dog.status];
    const bites = observations.filter(o => o.type === 'bite');
    const byType = OBS_TYPES.map(t => ({
        ...t,
        count: observations.filter(o => o.type === t.v).length,
    }));
    return (_jsxs(_Fragment, { children: [_jsxs(StackPage, { className: "flex flex-col bg-bg overflow-y-auto", children: [_jsxs("div", { className: "relative h-72 bg-bg flex-shrink-0", children: [dog.photoURL
                                ? _jsx("img", { src: dog.photoURL, className: "w-full h-full object-cover", alt: dog.name })
                                : _jsx("div", { className: "w-full h-full flex items-center justify-center text-7xl bg-bg", children: "\uD83D\uDC36" }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" }), _jsx("button", { onClick: () => navigate(-1), className: "absolute left-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center", style: { top: `calc(env(safe-area-inset-top, 0px) + 12px)` }, children: _jsx(ChevronLeft, { size: 20, className: "text-white" }) }), _jsx("div", { className: "absolute bottom-0 left-0 right-0 px-4 pb-4", children: _jsxs("div", { className: "flex items-end justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-white drop-shadow", children: dog.name }), _jsxs("p", { className: "text-white/70 text-xs mt-0.5", children: [dog.size.charAt(0).toUpperCase() + dog.size.slice(1), " \u00B7 ", dog.temperament, dog.vaccinated === 'yes' ? ' · 💉' : ''] })] }), _jsxs("span", { className: `text-xs font-bold px-3 py-1.5 rounded-full text-white ${sc.bg}`, children: [sc.icon, " ", sc.label] })] }) })] }), _jsxs("div", { className: "px-4 py-4 flex flex-col gap-4 pb-32", children: [_jsxs("div", { className: "ios-card p-4 flex items-center gap-4", children: [_jsxs("div", { className: "text-center flex-shrink-0", children: [_jsx("p", { className: `text-4xl font-bold ${RISK_COLOR(dog.riskScore)}`, children: dog.riskScore }), _jsx("p", { className: "text-[9px] text-muted uppercase tracking-wider mt-0.5", children: "Risk Score" })] }), _jsx("div", { className: "w-px h-12 bg-border flex-shrink-0" }), _jsxs("div", { className: "flex gap-5 flex-1", children: [_jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-lg font-bold text-text", children: dog.observationCount }), _jsx("p", { className: "text-[10px] text-muted", children: "Sightings" })] }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: `text-lg font-bold ${dog.biteCount > 0 ? 'text-danger' : 'text-text'}`, children: dog.biteCount }), _jsx("p", { className: "text-[10px] text-muted", children: "Bites" })] }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: `text-lg font-bold ${dog.aggressionConfirmations > 0 ? 'text-warning' : 'text-text'}`, children: dog.aggressionConfirmations }), _jsx("p", { className: "text-[10px] text-muted", children: "Aggression" })] })] })] }), _jsxs("div", { className: "ios-card p-3", children: [_jsx("p", { className: "text-xs font-semibold text-muted uppercase tracking-wider mb-3 px-1", children: "Log an observation" }), _jsx("div", { className: "flex gap-2", children: OBS_TYPES.map(t => (_jsxs("button", { onClick: () => { setObsType(t.v); setShowModal(true); }, className: "flex-1 flex flex-col items-center gap-1.5 py-3 rounded-ios-lg border border-border bg-bg active:bg-border transition-colors", children: [_jsx("span", { className: "text-xl", children: t.emoji }), _jsx("span", { className: "text-[10px] text-muted font-medium leading-none text-center", children: t.label })] }, t.v))) })] }), _jsxs("div", { className: "ios-card p-4", children: [_jsx("p", { className: "font-bold text-text text-sm mb-3", children: "Profile" }), [
                                        ['Gender', dog.gender === 'unknown' ? '❓ Unknown' : dog.gender === 'male' ? '♂️ Male' : '♀️ Female'],
                                        ['Size', dog.size.charAt(0).toUpperCase() + dog.size.slice(1)],
                                        ['Temperament', dog.temperament.charAt(0).toUpperCase() + dog.temperament.slice(1)],
                                        ['Vaccinated', dog.vaccinated === 'yes' ? '✅ Yes' : dog.vaccinated === 'no' ? '❌ No' : '❓ Unknown'],
                                        ['Sterilized', dog.sterilized === 'yes' ? '✅ Yes' : dog.sterilized === 'no' ? '❌ No' : '❓ Unknown'],
                                    ].map(([l, v]) => (_jsxs("div", { className: "flex justify-between py-2 border-b border-border last:border-0", children: [_jsx("span", { className: "text-sm text-muted", children: l }), _jsx("span", { className: "text-sm font-semibold text-text", children: v })] }, l)))] }), (dog.physicalMarkers?.length || dog.markerNotes) && (_jsxs("div", { className: "ios-card p-4", children: [_jsx("p", { className: "font-bold text-text text-sm mb-3", children: "Physical Identification" }), dog.physicalMarkers && dog.physicalMarkers.length > 0 && (_jsx("div", { className: "flex flex-wrap gap-2 mb-3", children: dog.physicalMarkers.map(id => {
                                            const m = PHYSICAL_MARKERS.find(x => x.id === id);
                                            if (!m)
                                                return null;
                                            return (_jsxs("span", { className: "flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary", children: [_jsx("span", { children: m.emoji }), m.label] }, id));
                                        }) })), dog.markerNotes && (_jsx("p", { className: "text-xs text-muted leading-relaxed", children: dog.markerNotes }))] })), (bites.length > 0 || dog.aggressionConfirmations >= 2) && (_jsxs("div", { className: "ios-card p-4 border-danger/30 bg-danger/5", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(AlertTriangle, { size: 16, className: "text-danger" }), _jsx("p", { className: "font-bold text-danger text-sm", children: "Incident Summary" })] }), bites.length > 0 && (_jsxs("div", { className: "flex justify-between py-1.5 border-b border-danger/10", children: [_jsx("span", { className: "text-sm text-muted", children: "Confirmed bite reports" }), _jsx("span", { className: "text-sm font-bold text-danger", children: bites.length })] })), dog.aggressionConfirmations > 0 && (_jsxs("div", { className: "flex justify-between py-1.5", children: [_jsx("span", { className: "text-sm text-muted", children: "Aggression confirmations" }), _jsx("span", { className: "text-sm font-bold text-warning", children: dog.aggressionConfirmations })] }))] })), _jsxs("div", { className: "ios-card p-4", children: [_jsx("p", { className: "font-bold text-text text-sm mb-3", children: "Activity Summary" }), _jsx("div", { className: "flex gap-2", children: byType.map(t => (_jsxs("div", { className: "flex-1 flex flex-col items-center gap-1 py-2 rounded-ios bg-bg", children: [_jsx("span", { className: "text-lg", children: t.emoji }), _jsx("span", { className: "text-sm font-bold text-text", children: t.count }), _jsx("span", { className: "text-[9px] text-muted leading-none", children: t.label })] }, t.v))) })] }), _jsxs("div", { className: "ios-card p-4", children: [_jsxs("p", { className: "font-bold text-text text-sm mb-3", children: ["Observation Log (", observations.length, ")"] }), observations.length === 0 ? (_jsx("p", { className: "text-sm text-muted", children: "No observations logged yet. Be the first!" })) : (observations.map(o => {
                                        const t = OBS_TYPES.find(x => x.v === o.type);
                                        return (_jsxs("div", { className: "flex gap-3 py-3 border-b border-border last:border-0", children: [_jsx("div", { className: "w-9 h-9 rounded-ios flex items-center justify-center flex-shrink-0 text-base", style: { background: t?.color + '18' }, children: t?.emoji }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between gap-2 mb-0.5", children: [_jsx("span", { className: "text-sm font-semibold text-text", children: t?.label }), _jsxs("div", { className: "flex items-center gap-1 text-muted flex-shrink-0", children: [_jsx(Clock, { size: 10 }), _jsx("span", { className: "text-[10px]", children: o.timestamp ? timeAgo(o.timestamp) : 'just now' })] })] }), _jsx("p", { className: "text-xs text-muted line-clamp-2", children: o.description }), o.type === 'bite' && o.biteSeverity && (_jsxs("div", { className: "flex gap-2 mt-1", children: [_jsx("span", { className: "text-xs text-danger font-medium bg-danger/10 px-2 py-0.5 rounded-full", children: o.biteSeverity.replace('_', ' ') }), o.victimAgeGroup && o.victimAgeGroup !== 'unknown' && (_jsxs("span", { className: "text-xs text-muted bg-bg px-2 py-0.5 rounded-full border border-border", children: ["Victim: ", o.victimAgeGroup] })), o.antiRabiesTaken === 'yes' && (_jsx("span", { className: "text-xs text-success bg-success/10 px-2 py-0.5 rounded-full", children: "\uD83D\uDC89 Rabies shot" }))] })), o.photoURL && (_jsx("img", { src: o.photoURL, className: "mt-2 h-24 rounded-ios object-cover", alt: "" })), o.confirmations > 0 && (_jsxs("p", { className: "text-[10px] text-muted mt-1", children: ["\u2713 ", o.confirmations, " confirmation", o.confirmations > 1 ? 's' : ''] }))] })] }, o.id));
                                    }))] }), dog.notes && (_jsxs("div", { className: "ios-card p-4", children: [_jsx("p", { className: "font-bold text-text text-sm mb-1", children: "Notes" }), _jsx("p", { className: "text-sm text-muted", children: dog.notes })] })), _jsxs("p", { className: "text-center text-xs text-muted", children: ["Registered ", new Date(dog.registeredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })] })] }), _jsx("div", { className: "fixed right-4", style: { bottom: 'calc(60px + env(safe-area-inset-bottom,0px) + 12px)' }, children: _jsxs("button", { onClick: () => setShowModal(true), className: "flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-full shadow-lg font-semibold text-sm active:scale-95 transition-transform", children: [_jsx(Plus, { size: 18 }), " Log Observation"] }) })] }), _jsx(AnimatePresence, { children: showModal && (_jsx(motion.div, { className: "fixed inset-0 z-50 flex flex-col justify-end bg-black/50", initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, onClick: e => { if (e.target === e.currentTarget)
                        closeModal(); }, children: _jsxs(motion.div, { className: "bg-bg rounded-t-[24px] flex flex-col max-h-[92vh]", initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' }, transition: { type: 'spring', stiffness: 420, damping: 42, mass: 0.85 }, children: [_jsx("div", { className: "flex justify-center pt-3 pb-1", children: _jsx("div", { className: "w-10 h-1 rounded-full bg-border" }) }), _jsxs("div", { className: "flex items-center justify-between px-4 py-3 border-b border-border", children: [_jsxs("div", { children: [_jsx("h2", { className: "font-bold text-text", children: "Log Observation" }), _jsxs("p", { className: "text-xs text-primary font-medium mt-0.5", children: ["\uD83D\uDC3E ", dog.name] })] }), _jsx("button", { onClick: closeModal, className: "w-8 h-8 rounded-full bg-bg border border-border flex items-center justify-center", children: _jsx(X, { size: 16, className: "text-muted" }) })] }), _jsxs("div", { className: "overflow-y-auto px-4 py-4 flex flex-col gap-4", style: { paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + 16px)` }, children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold text-muted uppercase tracking-wider mb-2", children: "Type" }), _jsx("div", { className: "flex gap-2", children: OBS_TYPES.map(t => (_jsxs("button", { onClick: () => { setObsType(t.v); setAiInsight(null); }, className: "flex-1 flex flex-col items-center gap-1 py-3 rounded-ios-lg border-2 transition-all", style: {
                                                        borderColor: obsType === t.v ? t.color : '#E8E3DC',
                                                        background: obsType === t.v ? t.color + '18' : 'white',
                                                    }, children: [_jsx("span", { className: "text-xl", children: t.emoji }), _jsx("span", { className: "text-[10px] font-semibold leading-none", style: { color: obsType === t.v ? t.color : '#6B7280' }, children: t.label })] }, t.v))) })] }), obsType === 'aggression' && (_jsxs("div", { children: [_jsxs("p", { className: "text-xs font-semibold text-muted uppercase tracking-wider mb-2", children: ["What did the dog do? ", _jsx("span", { className: "normal-case font-normal", children: "(select all that apply)" })] }), _jsx("div", { className: "flex flex-wrap gap-2", children: AGGRESSION_BEHAVIOURS.map(b => {
                                                    const active = aggrBehaviours.includes(b.id);
                                                    return (_jsxs("button", { onClick: () => toggleAggrBehaviour(b.id), className: `flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${active
                                                            ? 'bg-danger/10 border-danger/40 text-danger'
                                                            : 'bg-white border-border text-muted'}`, children: [_jsx("span", { children: b.emoji }), b.label] }, b.id));
                                                }) })] })), _jsxs("div", { children: [_jsxs("p", { className: "text-xs font-semibold text-muted uppercase tracking-wider mb-2", children: ["Photo / Video", (obsType === 'aggression' || obsType === 'bite')
                                                        ? _jsx("span", { className: "text-danger", children: " (required)" })
                                                        : _jsx("span", { className: "font-normal text-muted", children: " \u2014 AI will analyse" })] }), mediaPreview ? (_jsxs("div", { className: "relative rounded-ios-lg overflow-hidden bg-black", children: [isVideo
                                                        ? _jsx("video", { src: mediaPreview, controls: true, className: "w-full max-h-52 object-contain" })
                                                        : _jsx("img", { src: mediaPreview, className: "w-full max-h-52 object-cover", alt: "" }), _jsx("button", { onClick: clearMedia, className: "absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center", children: _jsx(X, { size: 15, className: "text-white" }) })] })) : (_jsxs("div", { className: "flex gap-2", children: [_jsxs("label", { className: "flex-1", children: [_jsx("input", { type: "file", accept: "image/*", capture: "environment", className: "hidden", onChange: e => handleMedia(e, false) }), _jsxs("div", { className: "flex flex-col items-center gap-1.5 py-4 rounded-ios-lg border-2 border-dashed border-border bg-white cursor-pointer active:bg-bg transition-colors", children: [_jsx(Camera, { size: 24, className: "text-muted" }), _jsx("p", { className: "text-xs text-muted font-medium", children: "Photo" })] })] }), _jsxs("label", { className: "flex-1", children: [_jsx("input", { type: "file", accept: "video/*", capture: "environment", className: "hidden", onChange: e => handleMedia(e, true) }), _jsxs("div", { className: "flex flex-col items-center gap-1.5 py-4 rounded-ios-lg border-2 border-dashed border-border bg-white cursor-pointer active:bg-bg transition-colors", children: [_jsx(Video, { size: 24, className: "text-muted" }), _jsx("p", { className: "text-xs text-muted font-medium", children: "Video" })] })] })] })), (aiLoading || aiInsight) && (_jsxs("div", { className: "mt-2 rounded-ios-lg border border-primary/20 bg-primary/5 p-3", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1.5", children: [aiLoading
                                                                ? _jsx(Loader2, { size: 14, className: "text-primary animate-spin" })
                                                                : _jsx(Sparkles, { size: 14, className: "text-primary" }), _jsx("p", { className: "text-xs font-semibold text-primary", children: "AI Insight" })] }), aiLoading
                                                        ? _jsx("p", { className: "text-xs text-muted animate-pulse", children: "Analysing your upload\u2026" })
                                                        : _jsx("p", { className: "text-xs text-text leading-relaxed whitespace-pre-wrap", children: aiInsight })] }))] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold text-muted uppercase tracking-wider mb-2", children: "What did you observe? *" }), _jsx("textarea", { className: "ios-input resize-none", rows: 3, placeholder: obsType === 'health' ? "Describe the dog's health condition…" :
                                                    obsType === 'aggression' ? 'Describe what happened in your own words…' :
                                                        obsType === 'bite' ? 'Describe the bite incident…' :
                                                            obsType === 'injury' ? 'Describe the injury you saw…' :
                                                                'Describe the feeding pattern / what was fed…', value: desc, onChange: e => setDesc(e.target.value) })] }), obsType === 'bite' && (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold text-muted uppercase tracking-wider mb-2", children: "Bite Severity" }), _jsx(Chip, { options: [
                                                            { v: 'scratch', label: 'Minor scratch', emoji: '🟡' },
                                                            { v: 'skin_break', label: 'Skin break', emoji: '🟠' },
                                                            { v: 'severe', label: 'Severe wound', emoji: '🔴' },
                                                        ], value: severity, onChange: setSeverity })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold text-muted uppercase tracking-wider mb-2", children: "Victim Age Group" }), _jsx(Chip, { options: [
                                                            { v: 'child', label: 'Child' },
                                                            { v: 'adult', label: 'Adult' },
                                                            { v: 'elderly', label: 'Elderly' },
                                                            { v: 'unknown', label: 'Unknown' },
                                                        ], value: ageGroup, onChange: setAgeGroup })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold text-muted uppercase tracking-wider mb-2", children: "Anti-Rabies Taken?" }), _jsx(Chip, { options: [
                                                            { v: 'yes', label: 'Yes', emoji: '✅' },
                                                            { v: 'no', label: 'No', emoji: '❌' },
                                                            { v: 'unknown', label: 'Unknown', emoji: '❓' },
                                                        ], value: antiRabies, onChange: setAntiRabies })] })] })), obsError && (_jsxs("div", { className: "flex items-start gap-2 p-3 bg-danger/10 rounded-ios-lg border border-danger/20", children: [_jsx(AlertTriangle, { size: 14, className: "text-danger flex-shrink-0 mt-0.5" }), _jsx("p", { className: "text-danger text-sm", children: obsError })] })), _jsx("button", { className: "ios-btn-primary", onClick: submitObservation, disabled: submitting, children: submitting ? 'Submitting…' : 'Submit Observation' })] })] }) })) })] }));
}
