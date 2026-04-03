// mobile/src/contexts/ThemeContext.js
// ✅ Provides the live COLORS object based on User Settings

import React, { createContext, useContext, useEffect, useState } from 'react';
import { LIGHT_COLORS, DARK_COLORS } from '../theme/colors';
import { useSettings } from './SettingsContext';
import { useColorScheme } from 'nativewind';

const ThemeContext = createContext({ colors: LIGHT_COLORS, isDark: false });

export const ThemeProvider = ({ children }) => {
  const { darkModeEnabled } = useSettings();
  const [colors, setColors] = useState(LIGHT_COLORS);
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    setColors(darkModeEnabled ? DARK_COLORS : LIGHT_COLORS);
    setColorScheme(darkModeEnabled ? 'dark' : 'light');
  }, [darkModeEnabled]);

  return (
    <ThemeContext.Provider value={{ colors, isDark: darkModeEnabled }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeColors = () => {
    const context = useContext(ThemeContext);
    if (!context) return LIGHT_COLORS; // Fallback outside Tree
    return context.colors;
};

export default ThemeContext;
