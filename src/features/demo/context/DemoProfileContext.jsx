import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  DEMO_PROFILES,
  DEFAULT_DEMO_PROFILE_ID,
  STORAGE_KEY_ACTIVE_PROFILE,
  getDemoProfileById,
} from '../data/demoProfiles';

const DemoProfileContext = createContext(null);

export function DemoProfileProvider({ children }) {
  const [activeProfileId, setActiveProfileIdState] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY_ACTIVE_PROFILE);
        if (stored && DEMO_PROFILES.some((p) => p.id === stored)) {
          return stored;
        }
      } catch {
        // Fallback to default
      }
    }
    return DEFAULT_DEMO_PROFILE_ID;
  });

  const setActiveProfileId = useCallback((newId) => {
    if (!newId || !DEMO_PROFILES.some((p) => p.id === newId)) return;
    setActiveProfileIdState(newId);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY_ACTIVE_PROFILE, newId);
      } catch {
        // Ignore storage errors
      }
    }
  }, []);

  const resetToDefaultProfile = useCallback(() => {
    setActiveProfileId(DEFAULT_DEMO_PROFILE_ID);
  }, [setActiveProfileId]);

  const activeProfile = getDemoProfileById(activeProfileId);

  const value = {
    activeProfile,
    activeProfileId,
    setActiveProfileId,
    switchProfile: setActiveProfileId,
    resetToDefaultProfile,
    demoProfiles: DEMO_PROFILES,
  };

  return (
    <DemoProfileContext.Provider value={value}>
      {children}
    </DemoProfileContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDemoProfile() {
  const context = useContext(DemoProfileContext);
  if (!context) {
    // Graceful fallback for components tested outside Provider
    return {
      activeProfile: DEMO_PROFILES[0],
      activeProfileId: DEFAULT_DEMO_PROFILE_ID,
      isDemoMode: false,
      setActiveProfileId: () => {},
      switchProfile: () => {},
      resetToDefaultProfile: () => {},
      demoProfiles: DEMO_PROFILES,
    };
  }
  return {
    ...context,
    isDemoMode: true,
  };
}

export default DemoProfileContext;
