import { createContext, useContext } from 'react';
export const AppContext = createContext({
    user: undefined,
    confirmation: null,
    coords: null,
    setUser: () => { },
    setConfirmation: () => { },
    setCoords: () => { },
});
export const useApp = () => useContext(AppContext);
