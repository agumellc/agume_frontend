'use client';

import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ConfigProvider, theme } from 'antd';
import { agumeTheme } from '@/lib/theme';
import mnMN from 'antd/locale/mn_MN';

const STORAGE_KEY = 'agume_theme';

type ThemeMode = 'light' | 'dark';

type ThemeContextValue = {
  mode: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (stored === 'dark' || stored === 'light') setMode(stored);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode, mounted]);

  const antdTheme = useMemo(() => {
    if (mode === 'dark') {
      return {
        ...agumeTheme,
        algorithm: theme.darkAlgorithm,
        token: {
          ...agumeTheme.token,
          colorBgContainer: '#1e293b',
          colorBgElevated: '#1e293b',
          colorBgLayout: '#0f172a',
          colorBorder: '#334155',
          colorBorderSecondary: '#475569',
          colorText: '#e2e8f0',
          colorTextSecondary: '#94a3b8',
          colorFillSecondary: 'rgba(255,255,255,0.06)',
          colorFillTertiary: 'rgba(255,255,255,0.04)',
        },
        components: {
          ...agumeTheme.components,
          Table: {
            headerBg: '#0f172a',
            headerColor: '#94a3b8',
            borderColor: '#334155',
            rowHoverBg: 'rgba(255,255,255,0.04)',
          },
          Card: {
            headerBg: 'transparent',
            headerColor: '#e2e8f0',
          },
          Input: {
            colorBgContainer: '#0f172a',
            activeBorderColor: '#25671E',
            hoverBorderColor: '#475569',
          },
          Select: {
            optionSelectedBg: 'rgba(37, 103, 30, 0.25)',
            colorBgElevated: '#1e293b',
          },
          DatePicker: {
            colorBgContainer: '#0f172a',
            colorBgElevated: '#1e293b',
          },
          Pagination: {
            colorBgContainer: 'transparent',
            colorText: '#94a3b8',
          },
          Descriptions: {
            colorText: '#e2e8f0',
            colorLabel: '#94a3b8',
          },
        },
      };
    }
    return agumeTheme;
  }, [mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      isDark: mode === 'dark',
      toggleTheme: () => setMode((m) => (m === 'dark' ? 'light' : 'dark')),
    }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider theme={antdTheme} locale={mnMN}>
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}
