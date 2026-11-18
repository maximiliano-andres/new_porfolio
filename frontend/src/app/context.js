/* React contexts: reading profile (TI / RRHH), interface language (ES / EN) and system actions any window can trigger. */
import { createContext, useCallback, useContext } from "react";

export const AudienceContext = createContext({ audience: "ti", setAudience: () => {} });

export const useAudience = () => useContext(AudienceContext);

/* lang: "es" | "en". Every visible text has both versions; t(es, en) picks the one for the current language */
export const LangContext = createContext({ lang: "es", setLang: () => {} });

export const useLang = () => useContext(LangContext);

export function useT() {
  const { lang } = useContext(LangContext);
  return useCallback((es, en) => (lang === "en" && en !== undefined ? en : es), [lang]);
}

export const SystemContext = createContext({
  unlock: () => {}, openWindow: () => {}, openProject: () => {},
  startCoachTour: () => {}, startAutoTour: () => {}, openPalette: () => {},
  soundOn: false, setSoundOn: () => {}, closeWindow: () => {},
});

export const useSystem = () => useContext(SystemContext);
