import { createContext, useContext, useEffect, useState, useCallback, type PropsWithChildren } from "react";
import { colors, highContrastColors } from "./tokens";

export type PatientTextSize = "small" | "medium" | "large";
export type PatientContrast = "normal" | "high";
export type PatientLanguage = "en" | "ms";

export type PatientAccessibilityPreferences = {
  textSize: PatientTextSize;
  contrast: PatientContrast;
  alternativeInputOn: boolean;
};

export type PatientVoicePreferences = {
  preferredVoiceId: string | null;
  audioRate: number;
  audioVolume: number;
  voiceDisabled: boolean;
};

export type PatientPreferencesAccount = {
  preferredLanguage?: string | null;
  accessibilityPreferences?: Partial<PatientAccessibilityPreferences> | null;
  voicePreferences?: Partial<PatientVoicePreferences> | null;
} | null;

export type PatientPalette = { [Key in keyof typeof colors]: string };

export type PatientPreferences = {
  /** Original account locale, e.g. en-MY or ms-MY. */
  locale: string;
  /** Short content language used by the current training API. */
  language: PatientLanguage;
  accessibility: PatientAccessibilityPreferences;
  voice: PatientVoicePreferences;
  palette: PatientPalette;
  setLanguage: (language: PatientLanguage) => void;
};

export const DEFAULT_PATIENT_PREFERENCES: PatientPreferences = {
  locale: "en-MY",
  language: "en",
  accessibility: {
    textSize: "medium",
    contrast: "normal",
    alternativeInputOn: false,
  },
  voice: {
    preferredVoiceId: null,
    audioRate: 1,
    audioVolume: 1,
    voiceDisabled: false,
  },
  palette: colors,
  setLanguage: () => {},
};

const PatientPreferencesContext = createContext<PatientPreferences>(DEFAULT_PATIENT_PREFERENCES);

export function PatientPreferencesProvider({
  account,
  children,
}: PropsWithChildren<{ account: PatientPreferencesAccount }>) {
  const [overrideLanguage, setOverrideLanguage] = useState<PatientLanguage | null>(null);

  useEffect(() => {
    setOverrideLanguage(null);
  }, [account?.preferredLanguage]);

  const accountLocale = account?.preferredLanguage?.trim() || DEFAULT_PATIENT_PREFERENCES.locale;
  const accountLanguage: PatientLanguage = accountLocale.toLowerCase().startsWith("ms") ? "ms" : "en";
  const language = overrideLanguage ?? accountLanguage;
  const locale = overrideLanguage ? (overrideLanguage === "ms" ? "ms-MY" : "en-US") : accountLocale;

  const setLanguage = useCallback((lang: PatientLanguage) => {
    setOverrideLanguage(lang);
  }, []);

  const accessibility: PatientAccessibilityPreferences = {
    ...DEFAULT_PATIENT_PREFERENCES.accessibility,
    ...(account?.accessibilityPreferences ?? {}),
  };
  const value: PatientPreferences = {
    locale,
    language,
    accessibility,
    voice: {
      ...DEFAULT_PATIENT_PREFERENCES.voice,
      ...(account?.voicePreferences ?? {}),
    },
    palette: accessibility.contrast === "high"
      ? { ...colors, ...highContrastColors }
      : colors,
    setLanguage,
  };

  return (
    <PatientPreferencesContext.Provider value={value}>
      {children}
    </PatientPreferencesContext.Provider>
  );
}

/** Safe to call outside the provider; defaults are used until an account loads. */
export function usePatientPreferences(): PatientPreferences {
  return useContext(PatientPreferencesContext);
}
