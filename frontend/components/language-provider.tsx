"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

type Language = "uz";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  getTitle: (anime: {
    title?: string;
    title_english?: string;
    title_japanese?: string;
  }) => string;
  getEpisodeTitle: (
    episode: {
      title?: string;
      title_romanji?: string;
      title_japanese?: string;
    },
    epNum: number,
  ) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("uz");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    localStorage.removeItem("language");
    setLanguage("uz");
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
  };

  const getTitle = useCallback(
    (anime: {
      title?: string;
      title_english?: string;
      title_japanese?: string;
    }) => {
      return anime.title_english || anime.title || "Nomaʼlum";
    },
    [language],
  );

  const getEpisodeTitle = useCallback(
    (
      episode: {
        title?: string;
        title_romanji?: string;
        title_japanese?: string;
      },
      epNum: number,
    ) => {
      return episode.title || episode.title_romanji || `Qism ${epNum}`;
    },
    [language],
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: handleSetLanguage,
        getTitle,
        getEpisodeTitle,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
