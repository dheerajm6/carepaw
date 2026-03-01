import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigationType } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { onAuthStateChanged, User, ConfirmationResult } from 'firebase/auth'
import { auth } from './lib/firebase'
import { AppContext } from './lib/store'
import { NavigationDirectionContext, TAB_PATHS, NavDirection } from './lib/navigation'

import Splash     from './pages/Splash'
import Phone      from './pages/Phone'
import OTP        from './pages/OTP'
import Discover   from './pages/Discover'
import Register   from './pages/Register'
import Care       from './pages/Care'
import Alerts     from './pages/Alerts'
import DogProfile from './pages/DogProfile'
import TabBar     from './components/TabBar'

function AppRoutes({ authed }: { authed: boolean }) {
  const location     = useLocation()
  const navType      = useNavigationType()  // 'PUSH' | 'POP' | 'REPLACE' — built into React Router
  const isFirstRender = useRef(true)

  // Compute direction synchronously on every render so AnimatePresence
  // children always receive the correct initial/exit variants on the same render pass.
  let direction: NavDirection
  if (isFirstRender.current) {
    direction = 'none'
  } else {
    const isTab = TAB_PATHS.includes(location.pathname)
    if (navType === 'POP') {
      direction = 'pop'
    } else if (isTab) {
      direction = 'tab'
    } else {
      direction = 'push'
    }
  }

  useEffect(() => {
    isFirstRender.current = false
  }, [])

  return (
    <NavigationDirectionContext.Provider value={direction}>
      {/* popLayout: exiting screen is lifted out of layout flow so both screens
          animate simultaneously — exactly how iOS UINavigationController works */}
      <AnimatePresence mode="popLayout">
        <Routes location={location} key={location.pathname}>
          {/* Auth */}
          <Route path="/phone" element={!authed ? <Phone /> : <Navigate to="/discover" replace />} />
          <Route path="/otp"   element={!authed ? <OTP />   : <Navigate to="/discover" replace />} />

          {/* App */}
          <Route path="/discover" element={authed ? <><Discover /><TabBar /></> : <Navigate to="/phone" replace />} />
          <Route path="/register" element={authed ? <><Register /><TabBar /></> : <Navigate to="/phone" replace />} />
          <Route path="/care"     element={authed ? <><Care />    <TabBar /></> : <Navigate to="/phone" replace />} />
          <Route path="/alerts"   element={authed ? <><Alerts />  <TabBar /></> : <Navigate to="/phone" replace />} />
          <Route path="/dog/:id"  element={authed ? <DogProfile /> : <Navigate to="/phone" replace />} />

          {/* Default */}
          <Route path="*" element={<Navigate to={authed ? '/discover' : '/phone'} replace />} />
        </Routes>
      </AnimatePresence>
    </NavigationDirectionContext.Provider>
  )
}

export default function App() {
  const [splashDone, setSplashDone]     = useState(false)
  const [user, setUser]                 = useState<User | null | undefined>(undefined)
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null)
  const [coords, setCoords]             = useState<{ lat: number; lng: number; accuracy: number } | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u ?? null))
    return unsub
  }, [])

  // Watch real GPS — high accuracy, live updates
  useEffect(() => {
    if (!navigator.geolocation) return
    const id = navigator.geolocation.watchPosition(
      (pos) => setCoords({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [])

  if (!splashDone) return <Splash onDone={() => setSplashDone(true)} />

  const authed = !!user

  return (
    <AppContext.Provider value={{ user, setUser, confirmation, setConfirmation, coords, setCoords }}>
      <BrowserRouter>
        <AppRoutes authed={authed} />
      </BrowserRouter>
    </AppContext.Provider>
  )
}
