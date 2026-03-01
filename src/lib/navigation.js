import { createContext, useContext } from 'react';
export const NavigationDirectionContext = createContext('none');
export const useNavDirection = () => useContext(NavigationDirectionContext);
// Paths that live in the tab bar — switches between them should feel like tab taps, not push
export const TAB_PATHS = ['/discover', '/register', '/care', '/alerts'];
