import { createContext, useContext } from 'react'
import { User, ConfirmationResult } from 'firebase/auth'

export interface AppState {
  user: User | null | undefined        // undefined = loading
  confirmation: ConfirmationResult | null
  coords: { lat: number; lng: number; accuracy: number } | null
}

export interface AppActions {
  setUser: (u: User | null) => void
  setConfirmation: (c: ConfirmationResult | null) => void
  setCoords: (c: { lat: number; lng: number; accuracy: number }) => void
}

export const AppContext = createContext<AppState & AppActions>({
  user: undefined,
  confirmation: null,
  coords: null,
  setUser: () => {},
  setConfirmation: () => {},
  setCoords: () => {},
})

export const useApp = () => useContext(AppContext)
