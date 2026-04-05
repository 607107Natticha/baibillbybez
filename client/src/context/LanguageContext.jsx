import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext({ language: 'th', setLanguage: () => {} });

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(localStorage.getItem('language') || 'th');

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  useEffect(() => {
    const stored = localStorage.getItem('language') || 'th';
    if (stored !== language) setLanguageState(stored);
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  return (ctx.language ?? localStorage.getItem('language')) || 'th';
}

export function useSetLanguage() {
  const ctx = useContext(LanguageContext);
  return ctx.setLanguage ?? (() => {});
}

export default LanguageContext;
