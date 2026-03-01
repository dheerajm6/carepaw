import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, MapPin } from 'lucide-react';
import { PHYSICAL_MARKERS, MARKER_GROUPS } from '../lib/markers';
import { StackPage } from '../components/PageTransition';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useApp } from '../lib/store';
import { uploadToCloudinary } from '../lib/cloudinary';
function Chip({ options, value, onChange, }) {
    return (_jsx("div", { className: "flex flex-wrap gap-2", children: options.map(o => (_jsxs("button", { onClick: () => onChange(o.v), className: `chip ${value === o.v ? 'chip-active' : ''}`, children: [_jsx("span", { children: o.emoji }), o.label] }, o.v))) }));
}
function Label({ text }) {
    return _jsx("p", { className: "text-xs font-semibold text-muted uppercase tracking-wider mb-2", children: text });
}
function MarkerPicker({ selected, onChange, }) {
    const toggle = (id) => onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
    return (_jsx("div", { className: "flex flex-col gap-3", children: MARKER_GROUPS.map(group => (_jsxs("div", { children: [_jsx("p", { className: "text-[10px] font-semibold text-muted uppercase tracking-wider mb-1.5", children: group }), _jsx("div", { className: "flex flex-wrap gap-2", children: PHYSICAL_MARKERS.filter(m => m.group === group).map(m => {
                        const active = selected.includes(m.id);
                        return (_jsxs("button", { type: "button", onClick: () => toggle(m.id), className: `flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${active
                                ? 'bg-primary/10 border-primary text-primary font-semibold'
                                : 'bg-white border-border text-muted'}`, children: [_jsx("span", { children: m.emoji }), m.label] }, m.id));
                    }) })] }, group))) }));
}
export default function Register() {
    const { user, coords } = useApp();
    const navigate = useNavigate();
    const fileRef = useRef(null);
    const [photo, setPhoto] = useState(null);
    const [preview, setPreview] = useState(null);
    const [name, setName] = useState('');
    const [markers, setMarkers] = useState([]);
    const [markerNotes, setMarkerNotes] = useState('');
    const [gender, setGender] = useState('unknown');
    const [size, setSize] = useState('medium');
    const [vaccinated, setVaccinated] = useState('unknown');
    const [sterilized, setSterilized] = useState('unknown');
    const [temperament, setTemperament] = useState('neutral');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const handlePhoto = (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        setPhoto(file);
        setPreview(URL.createObjectURL(file));
    };
    const handleSubmit = async () => {
        if (!photo) {
            setError('Photo is required.');
            return;
        }
        if (!coords) {
            setError('Location not available. Please enable GPS.');
            return;
        }
        if (!user)
            return;
        setLoading(true);
        setError('');
        try {
            const photoURL = await uploadToCloudinary(photo);
            await addDoc(collection(db, 'dogs'), {
                name: name.trim() || 'Unknown',
                ...(markers.length > 0 && { physicalMarkers: markers }),
                ...(markerNotes.trim() && { markerNotes: markerNotes.trim() }),
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
            });
            navigate('/discover');
        }
        catch (e) {
            setError(e?.message ?? 'Registration failed. Try again.');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs(StackPage, { className: "flex flex-col bg-bg", children: [_jsx("div", { className: "bg-white border-b border-border px-4 flex items-center", style: { paddingTop: `calc(env(safe-area-inset-top, 0px) + 12px)`, paddingBottom: 12 }, children: _jsxs("div", { children: [_jsx("h1", { className: "text-lg font-bold text-text", children: "Register a Dog" }), _jsx("p", { className: "text-xs text-muted", children: "Help the community keep track" })] }) }), _jsxs("div", { className: "flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5", style: { marginBottom: 'calc(60px + env(safe-area-inset-bottom,0px))' }, children: [_jsxs("div", { children: [_jsx(Label, { text: "Photo *" }), _jsx("input", { ref: fileRef, type: "file", accept: "image/*", capture: "environment", className: "hidden", onChange: handlePhoto }), _jsx("button", { onClick: () => fileRef.current?.click(), className: "w-full h-48 rounded-ios-xl border-2 border-dashed border-border bg-white flex flex-col items-center justify-center gap-2 active:bg-bg transition-colors relative overflow-hidden", children: preview ? (_jsxs(_Fragment, { children: [_jsx("img", { src: preview, className: "absolute inset-0 w-full h-full object-cover", alt: "preview" }), _jsxs("div", { className: "absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1", children: [_jsx(Camera, { size: 12 }), " Retake"] })] })) : (_jsxs(_Fragment, { children: [_jsx(Camera, { size: 36, className: "text-muted" }), _jsx("p", { className: "text-sm text-muted font-medium", children: "Tap to take photo" }), _jsx("p", { className: "text-xs text-muted/70", children: "Required" })] })) })] }), _jsxs("div", { children: [_jsx(Label, { text: "Location" }), _jsxs("div", { className: `flex items-center gap-3 p-3 rounded-ios-lg border ${coords ? 'border-border bg-white' : 'border-danger/30 bg-danger/5'}`, children: [_jsx(MapPin, { size: 20, className: coords ? 'text-success' : 'text-danger' }), _jsx("div", { className: "flex-1", children: coords ? (_jsxs(_Fragment, { children: [_jsx("p", { className: "text-sm font-semibold text-success", children: "GPS auto-tagged" }), _jsxs("p", { className: "text-xs text-muted font-mono", children: [coords.lat.toFixed(5), ", ", coords.lng.toFixed(5)] })] })) : (_jsx("p", { className: "text-sm font-semibold text-danger", children: "Location unavailable \u2014 enable GPS" })) })] })] }), _jsxs("div", { children: [_jsx(Label, { text: "Name / Nickname" }), _jsx("input", { className: "ios-input", placeholder: "e.g. Bruno, Tommy\u2026 (optional)", value: name, onChange: e => setName(e.target.value) })] }), _jsxs("div", { children: [_jsx(Label, { text: "Physical Identification" }), _jsx("p", { className: "text-xs text-muted mb-3 -mt-1", children: "Select visible traits to help others recognise this specific dog." }), _jsx(MarkerPicker, { selected: markers, onChange: setMarkers }), markers.length > 0 && (_jsxs("div", { className: "mt-3", children: [_jsx("p", { className: "text-xs text-muted mb-1.5", children: "Additional details (optional)" }), _jsx("input", { className: "ios-input", placeholder: "e.g. large scar on left shoulder, one blue eye\u2026", value: markerNotes, onChange: e => setMarkerNotes(e.target.value) })] }))] }), _jsxs("div", { children: [_jsx(Label, { text: "Gender (optional)" }), _jsx(Chip, { options: [{ v: 'male', label: 'Male', emoji: '♂️' }, { v: 'female', label: 'Female', emoji: '♀️' }, { v: 'unknown', label: 'Unknown', emoji: '❓' }], value: gender, onChange: setGender })] }), _jsxs("div", { children: [_jsx(Label, { text: "Sterilized" }), _jsx(Chip, { options: [{ v: 'yes', label: 'Yes', emoji: '✂️' }, { v: 'no', label: 'No', emoji: '❌' }, { v: 'unknown', label: 'Unknown', emoji: '❓' }], value: sterilized, onChange: setSterilized })] }), _jsxs("div", { children: [_jsx(Label, { text: "Vaccinated" }), _jsx(Chip, { options: [{ v: 'yes', label: 'Yes', emoji: '💉' }, { v: 'no', label: 'No', emoji: '❌' }, { v: 'unknown', label: 'Unknown', emoji: '❓' }], value: vaccinated, onChange: setVaccinated })] }), _jsxs("div", { children: [_jsx(Label, { text: "Approx Size" }), _jsx(Chip, { options: [{ v: 'small', label: 'Small', emoji: '🐩' }, { v: 'medium', label: 'Medium', emoji: '🐕' }, { v: 'large', label: 'Large', emoji: '🦮' }], value: size, onChange: setSize })] }), _jsxs("div", { children: [_jsx(Label, { text: "Temperament" }), _jsx(Chip, { options: [{ v: 'friendly', label: 'Friendly', emoji: '😊' }, { v: 'neutral', label: 'Neutral', emoji: '😐' }, { v: 'alert', label: 'Reactive', emoji: '⚠️' }], value: temperament, onChange: setTemperament })] }), _jsxs("div", { children: [_jsx(Label, { text: "Notes (optional)" }), _jsx("textarea", { className: "ios-input resize-none", rows: 3, placeholder: "Any other details\u2026", value: notes, onChange: e => setNotes(e.target.value) })] }), error && _jsx("p", { className: "text-danger text-sm", children: error }), _jsx("button", { className: "ios-btn-primary", onClick: handleSubmit, disabled: !photo || !coords || loading, children: loading ? 'Registering…' : 'Register Dog' }), _jsx("p", { className: "text-center text-xs text-muted pb-2", children: "By submitting, you confirm this is an accurate report." })] })] }));
}
