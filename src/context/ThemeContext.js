'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { lightTheme, darkTheme } from '@/styles/theme';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [isDark, setIsDark] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem('portfolio-theme');
        if (stored) {
            setIsDark(stored === 'dark');
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setIsDark(prefersDark);
        }
    }, []);

    const toggleTheme = useCallback(() => {
        setIsDark(prev => {
            const newVal = !prev;
            localStorage.setItem('portfolio-theme', newVal ? 'dark' : 'light');
            return newVal;
        });
    }, []);

    const theme = isDark ? darkTheme : lightTheme;

    if (!mounted) {
        return (
            <StyledThemeProvider theme={darkTheme}>
                <div style={{ visibility: 'hidden' }}>{children}</div>
            </StyledThemeProvider>
        );
    }

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme }}>
            <StyledThemeProvider theme={theme}>
                {children}
            </StyledThemeProvider>
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        // Safe defaults for SSR prerender
        return { isDark: true, toggleTheme: () => { } };
    }
    return context;
}
