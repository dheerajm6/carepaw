import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigationType } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import { AppContext } from './lib/store';
import { NavigationDirectionContext, TAB_PATHS } from './lib/navigation';
import Splash from './pages/Splash';
import Phone from './pages/Phone';
import OTP from './pages/OTP';
import Discover from './pages/Discover';
import Register from './pages/Register';
import Care from './pages/Care';
import Alerts from './pages/Alerts';
import DogProfile from './pages/DogProfile';
import TabBar from './components/TabBar';
function AppRoutes({ authed }) {
    const location = useLocation();
    const navType = useNavigationType(); // 'PUSH' | 'POP' | 'REPLACE' — built into React Router
    const isFirstRender = useRef(true);
    // Compute direction synchronously on every render so AnimatePresence
    // children always receive the correct initial/exit variants on the same render pass.
    let direction;
    if (isFirstRender.current) {
        direction = 'none';
    }
    else {
        const isTab = TAB_PATHS.includes(location.pathname);
        if (navType === 'POP') {
            direction = 'pop';
        }
        else if (isTab) {
            direction = 'tab';
        }
        else {
            direction = 'push';
        }
    }
    useEffect(() => {
        isFirstRender.current = false;
    }, []);
    return (_jsx(NavigationDirectionContext.Provider, { value: direction, children: _jsx(AnimatePresence, { mode: "popLayout", children: _jsxs(Routes, { location: location, children: [_jsx(Route, { path: "/phone", element: !authed ? _jsx(Phone, {}) : _jsx(Navigate, { to: "/discover", replace: true }) }), _jsx(Route, { path: "/otp", element: !authed ? _jsx(OTP, {}) : _jsx(Navigate, { to: "/discover", replace: true }) }), _jsx(Route, { path: "/discover", element: authed ? _jsxs(_Fragment, { children: [_jsx(Discover, {}), _jsx(TabBar, {})] }) : _jsx(Navigate, { to: "/phone", replace: true }) }), _jsx(Route, { path: "/register", element: authed ? _jsxs(_Fragment, { children: [_jsx(Register, {}), _jsx(TabBar, {})] }) : _jsx(Navigate, { to: "/phone", replace: true }) }), _jsx(Route, { path: "/care", element: authed ? _jsxs(_Fragment, { children: [_jsx(Care, {}), "    ", _jsx(TabBar, {})] }) : _jsx(Navigate, { to: "/phone", replace: true }) }), _jsx(Route, { path: "/alerts", element: authed ? _jsxs(_Fragment, { children: [_jsx(Alerts, {}), "  ", _jsx(TabBar, {})] }) : _jsx(Navigate, { to: "/phone", replace: true }) }), _jsx(Route, { path: "/dog/:id", element: authed ? _jsx(DogProfile, {}) : _jsx(Navigate, { to: "/phone", replace: true }) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: authed ? '/discover' : '/phone', replace: true }) })] }, location.pathname) }) }));
}
export default function App() {
    const [splashDone, setSplashDone] = useState(false);
    const [user, setUser] = useState(undefined);
    const [confirmation, setConfirmation] = useState(null);
    const [coords, setCoords] = useState(null);
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => setUser(u ?? null));
        return unsub;
    }, []);
    // Watch real GPS — high accuracy, live updates
    useEffect(() => {
        if (!navigator.geolocation)
            return;
        const id = navigator.geolocation.watchPosition((pos) => setCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
        }), () => { }, { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 });
        return () => navigator.geolocation.clearWatch(id);
    }, []);
    if (!splashDone)
        return _jsx(Splash, { onDone: () => setSplashDone(true) });
    const authed = !!user;
    return (_jsx(AppContext.Provider, { value: { user, setUser, confirmation, setConfirmation, coords, setCoords }, children: _jsx(BrowserRouter, { children: _jsx(AppRoutes, { authed: authed }) }) }));
}
