/* React contexts: reading profile (TI / RRHH) and system actions any window can trigger. */
import { createContext, useContext } from "react";

export const AudienceContext = createContext({ audience: "ti", setAudience: () => {} });

export const useAudience = () => useContext(AudienceContext);

export const SystemContext = createContext({
  unlock: () => {}, openWindow: () => {}, openProject: () => {},
  startCoachTour: () => {}, startAutoTour: () => {}, openPalette: () => {},
  soundOn: false, setSoundOn: () => {}, closeWindow: () => {},
});

export const useSystem = () => useContext(SystemContext);
