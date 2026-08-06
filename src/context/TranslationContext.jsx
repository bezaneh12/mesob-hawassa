import React, { createContext, useContext, useState } from "react";
import { dictionary } from "../locales/dictionary";

export const TranslationContext = createContext();

export function TranslationProvider({ children }) {
  const [lang, setLang] = useState("en");

  const toggleLang = () => {
    setLang((prev) => (prev === "en" ? "am" : "en"));
  };

  const t = (key) => {
    return dictionary[lang][key] || dictionary["en"][key] || key;
  };

  return (
    <TranslationContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
}
