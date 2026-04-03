// mobile/src/contexts/SettingsContext.js
// ✅ Global Settings Manager (AsyncStorage + React Context)

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsContext = createContext({});

const SETTINGS_KEY = '@TechBuddy_Settings';

export const SettingsProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    notificationsEnabled: true,
    darkModeEnabled: false,
    appLanguage: 'en',
    autoDownloadMedia: true,
  });

  // โหลดค่าเมื่อเปิดแอป
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        setSettings(prev => ({ ...prev, ...JSON.parse(stored) }));
      }
    } catch (e) {
      console.error('❌ Error loading settings:', e);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const updated = { ...settings, ...newSettings };
      setSettings(updated);
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('❌ Error saving settings:', e);
    }
  };

  const toggleNotifications = () => updateSettings({ notificationsEnabled: !settings.notificationsEnabled });
  const toggleDarkMode = () => updateSettings({ darkModeEnabled: !settings.darkModeEnabled });
  const setAppLanguage = (lang) => updateSettings({ appLanguage: lang });

  return (
    <SettingsContext.Provider
      value={{
        ...settings,
        loading,
        toggleNotifications,
        toggleDarkMode,
        setAppLanguage,
        updateSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export default SettingsContext;
