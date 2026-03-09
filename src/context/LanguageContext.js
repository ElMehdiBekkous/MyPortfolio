'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { locales, detectLocale, getTranslation } from '@/i18n';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [locale, setLocaleState] = useState('en');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem('portfolio-locale');
        if (stored && locales[stored]) {
            setLocaleState(stored);
        } else {
            setLocaleState(detectLocale());
        }
    }, []);

    const setLocale = useCallback((code) => {
        if (locales[code]) {
            setLocaleState(code);
            localStorage.setItem('portfolio-locale', code);
        }
    }, []);

    const t = useCallback((key) => {
        return getTranslation(locale, key);
    }, [locale]);

    const dir = locales[locale]?.dir || 'ltr';
    const isRTL = dir === 'rtl';

    useEffect(() => {
        if (mounted) {
            document.documentElement.setAttribute('lang', locale);
            document.documentElement.setAttribute('dir', dir);
        }
    }, [locale, dir, mounted]);

    return (
        <LanguageContext.Provider value={{ locale, setLocale, t, dir, isRTL }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        return {
            locale: 'en',
            setLocale: () => { },
            t: (key) => key,
            dir: 'ltr',
            isRTL: false,
        };
    }
    return context;
}
