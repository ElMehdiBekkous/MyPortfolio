'use client';
import Preloader from '@/components/Preloader';
import ScrollProgress from '@/components/ScrollProgress';
import PreferencesPopup from '@/components/PreferencesPopup';
import Navbar from '@/components/sections/Navbar';
import Hero from '@/components/sections/Hero';
import About from '@/components/sections/About';
import Skills from '@/components/sections/Skills';
import Projects from '@/components/sections/Projects';
import Testimonials from '@/components/sections/Testimonials';
import Contact from '@/components/sections/Contact';
import Footer from '@/components/sections/Footer';

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
