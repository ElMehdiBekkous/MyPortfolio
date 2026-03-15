'use client';
import dynamic from 'next/dynamic';
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
