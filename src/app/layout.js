import StyledComponentsRegistry from '@/lib/registry';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import GlobalStyles from '@/styles/GlobalStyles';

export const metadata = {
    title: 'El Mehdi Bekkous — Full-Stack Web Developer',
    description: 'Portfolio of El Mehdi Bekkous, a Full-Stack Web Developer specializing in Next.js, React, and modern web technologies. Building exceptional digital experiences.',
    keywords: ['web developer', 'full-stack', 'next.js', 'react', 'portfolio', 'El Mehdi Bekkous'],
    authors: [{ name: 'El Mehdi Bekkous' }],
    openGraph: {
        title: 'El Mehdi Bekkous — Full-Stack Web Developer',
        description: 'Full-Stack Web Developer specializing in Next.js & modern technologies.',
        type: 'website',
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" dir="ltr">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body>
                <StyledComponentsRegistry>
                    <ThemeProvider>
                        <LanguageProvider>
                            <GlobalStyles />
                            {children}
                        </LanguageProvider>
                    </ThemeProvider>
                </StyledComponentsRegistry>
            </body>
        </html>
    );
}
