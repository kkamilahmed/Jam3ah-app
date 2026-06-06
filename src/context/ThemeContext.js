import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@noor/theme';

export const dark = {
  bg: '#0D0D0D',
  surface: '#131313',
  surfaceLow: '#0D0D0D',
  surfaceMid: '#1a1a1a',
  surfaceHigh: '#222222',
  primary: '#38bdf8',
  primaryFill: '#0ea5e9',
  primaryBg: 'rgba(56,189,248,0.1)',
  accent: '#38bdf8',
  accentBg: 'transparent',
  accentBorder: '#38bdf8',
  onSurface: '#ffffff',
  onSurfaceDim: 'rgba(255,255,255,0.6)',
  onSurfaceFaint: 'rgba(255,255,255,0.2)',
  onSurfaceVariant: 'rgba(255,255,255,0.4)',
  border: '#2D2D2D',
  muted: 'rgba(255,255,255,0.4)',
  navBg: '#131313',
  navBorder: '#2D2D2D',
  error: '#ffb4ab',
  activeRowBg: 'rgba(56,189,248,0.05)',
  activeRowBorder: '#38bdf8',
  primaryGlow: 'rgba(56,189,248,0.1)',
  switchTrackOff: '#2D2D2D',
  switchTrackOn: 'rgba(56,189,248,0.3)',
  tabInactive: 'rgba(255,255,255,0.4)',
  overlay: 'rgba(0,0,0,0.88)',
};

export const light = {
  bg: '#f0f4f8',
  surface: '#ffffff',
  surfaceLow: '#e8edf2',
  surfaceMid: '#f5f8fb',
  surfaceHigh: '#ffffff',
  primary: '#0284c7',
  primaryFill: '#0369a1',
  primaryBg: 'rgba(2,132,199,0.08)',
  accent: '#0284c7',
  accentBg: 'transparent',
  accentBorder: '#0284c7',
  onSurface: '#0d1117',
  onSurfaceDim: 'rgba(13,17,23,0.72)',
  onSurfaceFaint: 'rgba(13,17,23,0.2)',
  onSurfaceVariant: 'rgba(13,17,23,0.5)',
  border: '#e2e8f0',
  muted: 'rgba(13,17,23,0.4)',
  navBg: '#ffffff',
  navBorder: '#e2e8f0',
  error: '#ba1a1a',
  activeRowBg: 'rgba(2,132,199,0.05)',
  activeRowBorder: '#0284c7',
  primaryGlow: 'rgba(2,132,199,0.08)',
  switchTrackOff: '#e2e8f0',
  switchTrackOn: 'rgba(2,132,199,0.25)',
  tabInactive: 'rgba(13,17,23,0.4)',
  overlay: 'rgba(0,0,0,0.5)',
};

const ThemeContext = createContext({ isDark: true, colors: dark, toggle: () => {} });

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((val) => {
      if (val !== null) setIsDark(val === 'dark');
    });
  }, []);

  function toggle() {
    setIsDark((prev) => {
      AsyncStorage.setItem(KEY, prev ? 'light' : 'dark');
      return !prev;
    });
  }

  return (
    <ThemeContext.Provider value={{ isDark, colors: isDark ? dark : light, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
