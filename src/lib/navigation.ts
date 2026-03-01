import { createContext, useContext } from 'react'

export type NavDirection = 'push' | 'pop' | 'tab' | 'none'

export const NavigationDirectionContext = createContext<NavDirection>('none')
export const useNavDirection = () => useContext(NavigationDirectionContext)

// Paths that live in the tab bar — switches between them should feel like tab taps, not push
export const TAB_PATHS = ['/discover', '/register', '/care', '/alerts']
