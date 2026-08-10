import { useState } from "react";
import { dictionary } from "../locales/dictionary";
import { TranslationContext } from "./translation-context";

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
