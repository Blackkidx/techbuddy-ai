// mobile/src/contexts/TranslationContext.js
// ✅ Real-time i18n Context supporting React Native

import React, { createContext, useContext, useCallback } from 'react';
import { useSettings } from './SettingsContext';

import en from '../i18n/en.json';
import th from '../i18n/th.json';
import jp from '../i18n/jp.json';

const dictionaries = { en, th, jp };

const TranslationContext = createContext({
  t: (key, params) => key,
  language: 'en'
});

export const TranslationProvider = ({ children }) => {
  const { appLanguage } = useSettings();
  
  // Provide the translation function `t`
  const t = useCallback((key, params = {}) => {
    const lang = appLanguage || 'en';
    const dict = dictionaries[lang] || dictionaries['en'];
    
    // key can be "settings.title"
    const keys = key.split('.');
    let result = dict;
    
    for (const k of keys) {
      if (result[k] === undefined) {
        return key; // fallback to key path if missing
      }
      result = result[k];
    }

    if (typeof result !== 'string') return key;

    // Replace {{params}} if any
    let translated = result;
    for (const [pKey, pVal] of Object.entries(params)) {
      translated = translated.replace(new RegExp(`{{${pKey}}}`, 'g'), String(pVal));
    }

    return translated;
  }, [appLanguage]);

  return (
    <TranslationContext.Provider value={{ t, language: appLanguage || 'en' }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  return useContext(TranslationContext);
};

export default TranslationContext;
