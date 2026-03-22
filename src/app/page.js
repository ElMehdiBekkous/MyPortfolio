'use client';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Preloader from '@/components/Preloader';
import ScrollProgress from '@/components/ScrollProgress';
import PreferencesPopup from '@/components/PreferencesPopup';

// Dynamically import heavy components so the Preloader can show instantly while they download in the background
const Navbar = dynamic(() => import('@/components/sections/Navbar'), { ssr: false });
const Hero = dynamic(() => import('@/components/sections/Hero'), { ssr: false });
const About = dynamic(() => import('@/components/sections/About'), { ssr: false });
const Skills = dynamic(() => import('@/components/sections/Skills'), { ssr: false });
const Projects = dynamic(() => import('@/components/sections/Projects'), { ssr: false });
const Testimonials = dynamic(() => import('@/components/sections/Testimonials'), { ssr: false });
const Contact = dynamic(() => import('@/components/sections/Contact'), { ssr: false });
const Footer = dynamic(() => import('@/components/sections/Footer'), { ssr: false });

export default function Home() {
    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger);
        ScrollTrigger.config({ ignoreMobileResize: true });
        
        // Normalize scroll behavior across devices (fixes mobile scroll thread jitters / detachments)
        ScrollTrigger.normalizeScroll(true);

        // Global Layout Observer: Wait for lazy-loaded components and heavy images 
        // to finish injecting into the DOM and expanding the total height.
        // Whenever the height changes, tell GSAP to recalculate pinned section coordinates 
        // (like Hero and Projects limits) so they don't trigger too early!
        let timeoutId;
        const observer = new ResizeObserver(() => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                ScrollTrigger.refresh();
            }, 300);
        });

        observer.observe(document.body);

        return () => {
            observer.disconnect();
            clearTimeout(timeoutId);
        };
    }, []);

    return (
        <>
            <Preloader />
            <PreferencesPopup />
            <ScrollProgress />
            <Navbar />
            <main>
                <Hero />
                <About />
                <Skills />
                <Projects />
                <Testimonials />
                <Contact />
            </main>
            <Footer />
        </>
    );
}
