import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TabPage } from '../components/PageTransition';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { List, Map as MapIcon, LocateFixed, Plus } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useApp } from '../lib/store';
import { OBS_TYPES } from '../lib/constants';
// ─── Helpers ─────────────────────────────────────────────────────────────────
function haversine(a, b) {
    const R = 6371000, toR = (d) => d * Math.PI / 180;
    const dLat = toR(b.lat - a.lat), dLng = toR(b.lng - a.lng);
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
function distLabel(m) {
    return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}
// ─── Map: dog marker ──────────────────────────────────────────────────────────
const STATUS_HEX = {
    safe: '#10B981',
    caution: '#F59E0B',
    alert: '#DC2626',
};
const STATUS_BG = {
    safe: 'bg-success',
    caution: 'bg-warning',
    alert: 'bg-danger',
};
const STATUS_LABEL = {
    safe: 'Safe', caution: 'Caution', alert: 'Alert',
};
function dogIcon(dog) {
    const color = STATUS_HEX[dog.status];
    const label = dog.name.length > 10 ? dog.name.slice(0, 10) + '…' : dog.name;
    return L.divIcon({
        className: '',
        html: `
      <div style="
        background:white;border:2.5px solid ${color};border-radius:20px;
        padding:4px 8px 4px 5px;display:flex;align-items:center;gap:5px;
        box-shadow:0 2px 10px rgba(0,0,0,0.2);white-space:nowrap;
        font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif;
        font-size:12px;font-weight:600;color:#1A1A1A;
      ">
        <span style="font-size:14px">🐾</span>
        <span style="width:7px;height:7px;border-radius:50%;background:${color};flex-shrink:0"></span>
        <span>${label}</span>
      </div>`,
        iconAnchor: [0, 14],
    });
}
// ─── Map: "you are here" marker ───────────────────────────────────────────────
const youAreHereIcon = L.divIcon({
    className: '',
    html: `
    <div style="position:relative;width:20px;height:20px;display:flex;align-items:center;justify-content:center">
      <div class="gps-ring"></div>
      <div style="
        width:14px;height:14px;border-radius:50%;
        background:#3B82F6;border:2.5px solid white;
        box-shadow:0 2px 6px rgba(59,130,246,0.5);
        position:relative;z-index:1;
      "></div>
    </div>`,
    iconAnchor: [10, 10],
});
// ─── Map: fit + locate helpers ────────────────────────────────────────────────
function fitTo500m(map, lat, lng) {
    const latD = 500 / 111000;
    const lngD = 500 / (111000 * Math.cos(lat * Math.PI / 180));
    map.fitBounds(L.latLngBounds([lat - latD, lng - lngD], [lat + latD, lng + lngD]), { padding: [32, 32], animate: true });
}
function MapFitRadius({ lat, lng }) {
    const map = useMap();
    useEffect(() => { fitTo500m(map, lat, lng); }, [lat, lng]);
    return null;
}
function LocateButton({ lat, lng }) {
    const map = useMap();
    return (_jsx("div", { className: "leaflet-bottom leaflet-right", style: { marginBottom: 12, marginRight: 12 }, children: _jsx("div", { className: "leaflet-control", children: _jsx("button", { onClick: () => fitTo500m(map, lat, lng), style: {
                    width: 40, height: 40, borderRadius: 10,
                    background: 'white', border: '1.5px solid #E8E3DC',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', fontSize: 18,
                }, title: "Back to my location", children: "\uD83D\uDCCD" }) }) }));
}
// ─── Component ────────────────────────────────────────────────────────────────
export default function Discover() {
    const { coords } = useApp();
    const [dogs, setDogs] = useState([]);
    const [view, setView] = useState('map');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const center = coords ?? { lat: 12.9716, lng: 77.5946 };
    useEffect(() => {
        if (!coords)
            return;
        setLoading(true);
        const latD = 500 / 111000;
        const q = query(collection(db, 'dogs'), where('latitude', '>=', coords.lat - latD), where('latitude', '<=', coords.lat + latD));
        getDocs(q)
            .then(snap => {
            const list = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(dog => haversine(coords, { lat: dog.latitude, lng: dog.longitude }) <= 500);
            setDogs(list);
        })
            .finally(() => setLoading(false));
    }, [coords]);
    const sorted = [...dogs].sort((a, b) => haversine(center, { lat: a.latitude, lng: a.longitude }) -
        haversine(center, { lat: b.latitude, lng: b.longitude }));
    return (_jsxs(TabPage, { className: "flex flex-col", children: [_jsxs("div", { className: "bg-white border-b border-border px-4 flex items-center justify-between z-10 flex-shrink-0", style: { paddingTop: `calc(env(safe-area-inset-top, 0px) + 12px)`, paddingBottom: 12 }, children: [_jsxs("div", { children: [_jsx("h1", { className: "text-lg font-bold text-text", children: "\uD83D\uDC3E Discover" }), _jsx("p", { className: "text-xs text-muted flex items-center gap-1", children: coords
                                    ? _jsxs(_Fragment, { children: [_jsx(LocateFixed, { size: 10, className: coords.accuracy < 50 ? 'text-success' :
                                                    coords.accuracy < 200 ? 'text-warning' : 'text-danger' }), loading ? 'Loading…' : `${dogs.length} dog${dogs.length !== 1 ? 's' : ''} within 500 m`, _jsxs("span", { className: "text-muted/60", children: ["\u00B7 \u00B1", Math.round(coords.accuracy), " m"] })] })
                                    : 'Getting your location…' })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "flex bg-bg rounded-full p-1 gap-0.5 border border-border", children: ['map', 'list'].map(v => (_jsx("button", { onClick: () => setView(v), className: `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${view === v ? 'bg-primary text-white shadow-sm' : 'text-muted'}`, children: v === 'map' ? _jsxs(_Fragment, { children: [_jsx(MapIcon, { size: 13 }), " Map"] }) : _jsxs(_Fragment, { children: [_jsx(List, { size: 13 }), " List"] }) }, v))) }), _jsxs("button", { onClick: () => navigate('/register'), className: "flex items-center gap-1.5 px-3 py-2 rounded-full bg-accent text-white text-sm font-semibold active:opacity-80 transition-opacity shadow-sm", children: [_jsx(Plus, { size: 14 }), " Register"] })] })] }), view === 'map' && (_jsxs("div", { className: "flex-1 relative", style: { marginBottom: 'calc(60px + env(safe-area-inset-bottom,0px))' }, children: [!coords && (_jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center z-20 bg-bg/90 gap-3 px-8 text-center", children: [_jsx("span", { className: "text-5xl animate-pulse", children: "\uD83D\uDCCD" }), _jsx("p", { className: "font-bold text-text", children: "Waiting for GPS\u2026" }), _jsx("p", { className: "text-sm text-muted", children: "Allow location access when your browser asks, or check your device GPS settings." })] })), _jsxs(MapContainer, { center: [center.lat, center.lng], zoom: 15, style: { width: '100%', height: '100%' }, zoomControl: false, attributionControl: false, children: [_jsx(TileLayer, { url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", maxZoom: 19 }), coords && _jsx(MapFitRadius, { lat: coords.lat, lng: coords.lng }), coords && _jsx(LocateButton, { lat: coords.lat, lng: coords.lng }), coords && (_jsxs(_Fragment, { children: [_jsx(Circle, { center: [coords.lat, coords.lng], radius: 500, pathOptions: { color: '#1E3A2F', fillColor: '#1E3A2F', fillOpacity: 0.07, weight: 2, dashArray: '6 4' } }), _jsx(Circle, { center: [coords.lat, coords.lng], radius: 502, pathOptions: { color: '#1E3A2F', fillOpacity: 0, weight: 0.5, opacity: 0.2 } })] })), coords && coords.accuracy < 500 && (_jsx(Circle, { center: [coords.lat, coords.lng], radius: coords.accuracy, pathOptions: { color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.08, weight: 1, dashArray: '4 3' } })), coords && (_jsx(Marker, { position: [coords.lat, coords.lng], icon: youAreHereIcon, zIndexOffset: 1000 })), dogs.map(dog => (_jsx(Marker, { position: [dog.latitude, dog.longitude], icon: dogIcon(dog), children: _jsx(Popup, { closeButton: false, offset: [60, 0], children: _jsxs("div", { style: { minWidth: 180, padding: '12px 14px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }, children: [dog.photoURL
                                                        ? _jsx("img", { src: dog.photoURL, style: { width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }, alt: "" })
                                                        : _jsx("div", { style: { width: 40, height: 40, borderRadius: 8, background: '#F9F6F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }, children: "\uD83D\uDC36" }), _jsxs("div", { children: [_jsx("p", { style: { fontWeight: 700, fontSize: 13, color: '#1A1A1A', margin: 0 }, children: dog.name }), _jsxs("p", { style: { fontSize: 11, color: '#6B7280', margin: 0 }, children: [dog.size, " \u00B7 ", dog.temperament] })] })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }, children: [_jsx("span", { style: {
                                                            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
                                                            background: dog.status === 'safe' ? '#D1FAE5' : dog.status === 'caution' ? '#FEF3C7' : '#FEE2E2',
                                                            color: STATUS_HEX[dog.status],
                                                        }, children: STATUS_LABEL[dog.status].toUpperCase() }), _jsxs("span", { style: { fontSize: 11, color: '#6B7280' }, children: ["\uD83D\uDCCD ", coords ? distLabel(haversine(coords, { lat: dog.latitude, lng: dog.longitude })) : ''] })] }), _jsx("button", { onClick: () => navigate(`/dog/${dog.id}`, { state: { dog } }), style: {
                                                    width: '100%', background: '#1E3A2F', color: 'white',
                                                    border: 'none', borderRadius: 8, padding: '7px 0',
                                                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                                }, children: "View Profile \u2192" })] }) }) }, dog.id)))] }), _jsx("div", { className: "absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm border border-border rounded-ios px-3 py-2 flex gap-3 z-[400] shadow-sm", children: [['#10B981', 'Safe'], ['#F59E0B', 'Caution'], ['#DC2626', 'Alert']].map(([c, l]) => (_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "w-2.5 h-2.5 rounded-full flex-shrink-0", style: { background: c } }), _jsx("span", { className: "text-xs text-muted font-medium", children: l })] }, l))) })] })), view === 'list' && (_jsx("div", { className: "flex-1 overflow-y-auto px-4 pt-3 pb-4", style: { marginBottom: 'calc(60px + env(safe-area-inset-bottom,0px))' }, children: loading ? (_jsxs("div", { className: "flex flex-col items-center justify-center pt-24 gap-3", children: [_jsx("span", { className: "text-4xl animate-pulse", children: "\uD83D\uDC3E" }), _jsx("p", { className: "text-muted text-sm", children: "Looking for dogs nearby\u2026" })] })) : !coords ? (_jsxs("div", { className: "flex flex-col items-center justify-center pt-24 gap-3 text-center px-6", children: [_jsx("span", { className: "text-5xl", children: "\uD83D\uDCCD" }), _jsx("p", { className: "font-bold text-text", children: "Location required" }), _jsx("p", { className: "text-muted text-sm", children: "Allow GPS access to discover dogs near you." })] })) : sorted.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center pt-24 gap-3 text-center px-6", children: [_jsx("span", { className: "text-5xl", children: "\uD83D\uDC3E" }), _jsx("p", { className: "font-bold text-text", children: "No dogs registered nearby" }), _jsx("p", { className: "text-muted text-sm", children: "Be the first to register a dog in your area." }), _jsxs("button", { onClick: () => navigate('/register'), className: "mt-2 flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-full text-sm font-semibold", children: [_jsx(Plus, { size: 15 }), " Register a dog"] })] })) : (_jsxs(_Fragment, { children: [_jsxs("p", { className: "text-xs text-muted px-1 mb-3", children: [sorted.length, " dog", sorted.length !== 1 ? 's' : '', " within ", _jsx("span", { className: "font-semibold text-primary", children: "500 m" })] }), sorted.map(dog => {
                            const dist = haversine(center, { lat: dog.latitude, lng: dog.longitude });
                            return (_jsxs("div", { className: "ios-card mb-2.5 overflow-hidden", children: [_jsxs("button", { onClick: () => navigate(`/dog/${dog.id}`, { state: { dog } }), className: "w-full p-3 flex items-center gap-3 text-left active:bg-bg transition-colors", children: [_jsx("div", { className: "w-14 h-14 rounded-ios bg-bg flex-shrink-0 overflow-hidden", children: dog.photoURL
                                                    ? _jsx("img", { src: dog.photoURL, className: "w-full h-full object-cover", alt: dog.name })
                                                    : _jsx("div", { className: "w-full h-full flex items-center justify-center text-2xl", children: "\uD83D\uDC36" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 mb-0.5", children: [_jsx("span", { className: "font-bold text-text truncate", children: dog.name }), _jsx("span", { className: `text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white flex-shrink-0 ${STATUS_BG[dog.status]}`, children: STATUS_LABEL[dog.status] })] }), _jsxs("p", { className: "text-xs text-muted", children: [dog.size.charAt(0).toUpperCase() + dog.size.slice(1), " \u00B7 ", dog.temperament, dog.vaccinated === 'yes' ? ' · 💉' : '', dog.sterilized === 'yes' ? ' · ✂️' : ''] }), _jsxs("div", { className: "flex items-center gap-3 mt-0.5", children: [_jsxs("p", { className: "text-xs text-muted font-medium", children: ["\uD83D\uDCCD ", distLabel(dist)] }), dog.biteCount > 0 && (_jsxs("p", { className: "text-xs text-danger font-semibold", children: ["\u26A0\uFE0F ", dog.biteCount, " bite", dog.biteCount > 1 ? 's' : ''] })), dog.observationCount > 0 && (_jsxs("p", { className: "text-xs text-muted", children: [dog.observationCount, " sightings"] }))] })] }), _jsx("span", { className: "text-muted text-lg flex-shrink-0", children: "\u203A" })] }), _jsx("div", { className: "flex border-t border-border", children: OBS_TYPES.map((t, i) => (_jsxs("button", { onClick: () => navigate(`/dog/${dog.id}`, { state: { dog, logType: t.v } }), className: `flex-1 flex flex-col items-center gap-0.5 py-2.5 active:bg-bg transition-colors
                            ${i < OBS_TYPES.length - 1 ? 'border-r border-border' : ''}`, children: [_jsx("span", { className: "text-base", children: t.emoji }), _jsx("span", { className: "text-[9px] text-muted leading-none", children: t.label })] }, t.v))) })] }, dog.id));
                        })] })) }))] }));
}
