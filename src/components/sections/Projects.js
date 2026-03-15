'use client';

import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useLanguage } from '@/context/LanguageContext';
import { projects } from '@/data/projects';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const ProjectsSection = styled.section`
  position: relative;
  background-color: ${({ theme }) => theme.colors.bg || '#050505'};
  color: ${({ theme }) => theme.colors.text || 'white'};
  z-index: 5;
  /* Crucial: override global section { overflow: hidden } to allow sticky! */
  overflow: visible !important;
  clip-path: inset(0); /* Hide horizontal scrolling elements safely */

  .font-anton {
    font-family: 'Anton', sans-serif;
  }
  .custom-projects-cursor {
    pointer-events: none;
    position: fixed;
    top: 0; left: 0;
    width: 16px; height: 16px;
    border-radius: 50%;
    background: #ffffff;
    mix-blend-mode: difference;
    z-index: 9999;
    opacity: 0;
    transition: width 0.3s ease, height 0.3s ease, opacity 0.3s ease;
    will-change: transform, width, height;
    @media (pointer: coarse) {
        display: none;
    }
  }
  .custom-projects-cursor.active {
    opacity: 1;
  }
  .custom-projects-cursor.hovered {
    width: 80px; height: 80px;
    background: rgba(255, 255, 255, 1);
  }
`;

const StickyContainer = styled.div`
  position: sticky;
  top: 0;
  height: 100vh;
  height: 100dvh; /* dvh ensures mobile Safari/Chrome UI bars don't hide the bottom of the container! */
  width: 100%;
  overflow: hidden;
  background-color: ${({ theme }) => theme.colors.bg || '#050505'};
`;

const Header = styled.header`
  position: absolute;
  top: 6rem; /* Pushed down from 2rem to ensure the fixed Navbar doesn't overlap the text */
  left: 2rem;
  z-index: 50;
  mix-blend-mode: difference;
  pointer-events: none;
  
  @media (min-width: 768px) {
    top: 7rem;
    left: 3rem;
  }
`;

const HeaderTitle = styled.h1`
  font-family: 'Anton', sans-serif;
  letter-spacing: 0.1em;
  font-size: 1.25rem;
  line-height: 1.2;
  text-transform: uppercase;
  color: white;
  
  @media (min-width: 768px) {
    font-size: 1.5rem;
  }
`;

const ScrollHintWrapper = styled.div`
  position: absolute;
  top: 6rem; /* Pushed down to match header */
  right: 2rem;
  z-index: 50;
  mix-blend-mode: difference;
  pointer-events: none;
  
  @media (min-width: 768px) {
    top: 7rem;
    right: 3rem;
  }
`;

const ScrollHintText = styled.p`
  color: white;
  font-size: 0.875rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-weight: 300;
`;

const ProgressBarWrapper = styled.div`
  position: absolute;
  bottom: 2rem;
  left: 2rem;
  right: 2rem;
  height: 2px;
  background-color: ${({ theme }) => theme.colors.border || 'rgba(255, 255, 255, 0.2)'};
  z-index: 50;
  pointer-events: none;
  
  @media (min-width: 768px) {
    bottom: 3rem;
    left: 3rem;
    right: 3rem;
  }
`;

const ProgressBar = styled.div`
  height: 100%;
  background-color: ${({ theme }) => theme.colors.text || 'white'};
  transform-origin: left;
  transform: scaleX(0);
  will-change: transform;
`;

const ScrollContainer = styled.div`
  display: flex;
  height: 100%;
  width: max-content;
  will-change: transform;
`;

const Slide = styled.section`
  width: 100vw;
  height: 100vh;
  height: 100dvh; /* prevents overlap issues on mobile browsers */
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
  overflow: hidden; /* Prevent huge text from bleeding into next slide */
  background-color: ${({ theme }) => theme.colors.bg || '#050505'};
`;

const TitleParallaxOutline = styled.h2`
  position: absolute;
  z-index: 0;
  font-size: 25vw;
  font-family: 'Anton', sans-serif;
  text-transform: uppercase;
  white-space: nowrap;
  pointer-events: none;
  user-select: none;
  color: transparent;
  -webkit-text-stroke: 1px ${({ theme }) => theme.name === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)'};
  
  @media (min-width: 768px) {
    font-size: 16vw;
  }
`;

const TitleParallaxSolid = styled.h2`
  position: absolute;
  z-index: 20;
  color: white;
  font-size: 25vw;
  font-family: 'Anton', sans-serif;
  text-transform: uppercase;
  white-space: nowrap;
  pointer-events: none;
  user-select: none;
  mix-blend-mode: difference;
  opacity: 0.9;
  
  @media (min-width: 768px) {
    font-size: 16vw;
  }
`;

const ImageWrapper = styled.a`
  width: 80vw;
  height: 60vh;
  background-color: #18181b;
  overflow: hidden;
  position: relative;
  z-index: 10;
  cursor: none;
  display: block;
  
  @media (min-width: 768px) {
    width: 45vw;
    height: 70vh;
  }
`;

const GradientOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: ${({ theme }) => theme.name === 'dark'
    ? 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.1))'
    : 'linear-gradient(to top, rgba(255,255,255,0.95), rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.1))'};
  z-index: 10;
  transition: opacity 0.7s, background 0.3s;
  opacity: 0.8;
  pointer-events: none;
  
  ${ImageWrapper}:hover & {
    opacity: 1;
  }
`;

const ProjectImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.3);
  will-change: transform;
  transition: transform 0.7s;
  
  ${ImageWrapper}:hover & {
    transform: scale(1.35);
  }
`;

const ProjectInfo = styled.div`
  position: absolute;
  bottom: 1.5rem;
  left: 1.5rem;
  right: 1.5rem;
  z-index: 20;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
  
  @media (min-width: 768px) {
    bottom: 2.5rem;
    left: 2.5rem;
    right: 2.5rem;
  }
`;

const ProjectRole = styled.p`
  color: ${({ theme }) => theme.colors.text || 'white'};
  font-size: 0.75rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  font-weight: 300;
  margin: 0;
  
  @media (min-width: 768px) {
    font-size: 0.875rem;
  }
`;

const RoleIndex = styled.span`
  font-weight: 700;
  margin-right: 0.5rem;
  color: ${({ theme }) => theme.name === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.5)'};
`;

const ProjectDescText = styled.p`
  color: ${({ theme }) => theme.name === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)'};
  font-size: 0.875rem;
  font-weight: 300;
  opacity: 0;
  transition: all 0.5s;
  transform: translateY(1rem);
  will-change: transform;
  max-width: 28rem;
  display: none;
  margin: 0;
  
  @media (min-width: 768px) {
    display: block;
    font-size: 1rem;
  }
  
  ${ImageWrapper}:hover & {
    opacity: 1;
    transform: translateY(0);
  }
`;

const ViewProjectBtn = styled.div`
  margin-top: 0.5rem;
  opacity: 0;
  transition: all 0.7s;
  transition-delay: 0.1s;
  transform: translateY(1rem);
  display: inline-flex;
  align-items: center;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text || 'white'};
  
  @media (min-width: 768px) {
    font-size: 0.875rem;
  }
  
  ${ImageWrapper}:hover & {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Arrow = styled.span`
  margin-left: 0.5rem;
  transition: transform 0.3s;
  
  ${ImageWrapper}:hover & {
    transform: translateX(0.5rem);
  }
`;

export default function Projects() {
  const { t, language = 'fr', isRtl = false } = useLanguage();
  const translatedItems = t('projects.items') || [];

  const sectionRef = useRef(null);
  const containerRef = useRef(null);
  const progressBarRef = useRef(null);
  const cursorRef = useRef(null);
  const [sectionHeight, setSectionHeight] = useState('400vh');

  // Calculate required height based on number of projects
  useEffect(() => {
    let refreshTimeout;
    const updateHeight = () => {
      // 100vh for each project to ensure enough scroll duration
      const totalHeight = (projects.length * window.innerWidth) + window.innerHeight;
      setSectionHeight(`${totalHeight}px`);

      // Give the DOM a tiny moment to apply the new height before recalculating triggers
      clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(() => ScrollTrigger.refresh(), 50);
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => {
      clearTimeout(refreshTimeout);
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  // GSAP ScrollTrigger Logic (No pinning, just scroll tracking)
  useEffect(() => {
    if (!sectionRef.current || !containerRef.current) return;

    let ctx;
    const timer = setTimeout(() => {
      ctx = gsap.context(() => {
        // Calculate total horizontal width needed to show all slides.
        const getScrollAmount = () => (projects.length - 1) * window.innerWidth;

        gsap.to(containerRef.current, {
          x: () => isRtl ? getScrollAmount() : -getScrollAmount(),
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (progressBarRef.current) {
                // Invert progress bar tracking origin visually in RTL
                progressBarRef.current.style.transformOrigin = isRtl ? 'right' : 'left';
                progressBarRef.current.style.transform = `scaleX(${self.progress})`;
              }

              const winWidth = window.innerWidth;
              const currentScroll = self.progress * getScrollAmount();

              const slides = containerRef.current.querySelectorAll('.slide');
              slides.forEach((slide) => {
                const index = parseInt(slide.dataset.index || 0);

                // For RTL, visually invert the indexing so distance offsets calculate from right to left
                const slideLeft = isRtl
                  ? ((projects.length - 1 - index) * winWidth) - currentScroll
                  : (index * winWidth) - currentScroll;

                const progressRatio = slideLeft / winWidth;

                const img = slide.querySelector('.parallax-bg');
                if (img) {
                  img.style.transform = `translate3d(${progressRatio * -25}%, 0, 0) scale(1.3)`;
                }

                const titles = slide.querySelectorAll('.title-parallax');
                titles.forEach((title) => {
                  title.style.transform = `translate3d(${progressRatio * 5}%, 0, 0)`;
                });
              });
            }
          }
        });
      }, sectionRef);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (ctx) ctx.revert();
    };
  }, [isRtl]);

  // Custom Cursor Logic (desktop only — cursor is hidden on touch devices)
  useEffect(() => {
    // Skip on touch devices — the cursor is invisible via CSS `pointer: coarse` anyway
    if (window.matchMedia('(pointer: coarse)').matches) return;

    let cursorX = window.innerWidth / 2;
    let cursorY = window.innerHeight / 2;
    let targetCursorX = cursorX;
    let targetCursorY = cursorY;
    let animationFrameId;

    const handleMouseMove = (e) => {
      targetCursorX = e.clientX;
      targetCursorY = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const animateCursor = () => {
      if (!sectionRef.current) {
        animationFrameId = requestAnimationFrame(animateCursor);
        return;
      }

      const sectionRect = sectionRef.current.getBoundingClientRect();

      // Basic visibility check
      if (sectionRect.top <= window.innerHeight && sectionRect.bottom >= 0) {
        if (cursorRef.current && !cursorRef.current.classList.contains('active')) {
          cursorRef.current.classList.add('active');
        }
      } else {
        if (cursorRef.current && cursorRef.current.classList.contains('active')) {
          cursorRef.current.classList.remove('active');
        }
      }

      cursorX += (targetCursorX - cursorX) * 0.15;
      cursorY += (targetCursorY - cursorY) * 0.15;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(calc(${cursorX}px - 50%), calc(${cursorY}px - 50%), 0)`;
      }

      animationFrameId = requestAnimationFrame(animateCursor);
    };

    animateCursor();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleMouseEnterImage = () => cursorRef.current?.classList.add('hovered');
  const handleMouseLeaveImage = () => cursorRef.current?.classList.remove('hovered');

  return (
    <ProjectsSection id="projects" ref={sectionRef} style={{ height: sectionHeight }}>
      <div ref={cursorRef} className="custom-projects-cursor" />

      <StickyContainer>
        <Header>
          <HeaderTitle>
            {t('projects.label') || 'Studio'}<br />{t('projects.title') || 'Cinématique'}
          </HeaderTitle>
        </Header>

        <ScrollHintWrapper>
          <ScrollHintText>
            {language === 'fr' ? 'Faites défiler ↓' : 'Scroll Down ↓'}
          </ScrollHintText>
        </ScrollHintWrapper>

        <ProgressBarWrapper>
          <ProgressBar ref={progressBarRef} />
        </ProgressBarWrapper>

        <ScrollContainer ref={containerRef}>
          {projects.map((projet, index) => {
            const translated = Array.isArray(translatedItems) ? translatedItems[index] : null;
            const title = translated?.title || projet.title;
            const description = translated?.description || projet.description;
            const role = projet.category || projet.subtitle;

            return (
              <Slide key={projet.id} className="slide" data-index={index}>
                <TitleParallaxOutline className="title-parallax">
                  {title}
                </TitleParallaxOutline>

                <ImageWrapper
                  href={projet.link}
                  target="_blank"
                  rel="noreferrer"
                  onMouseEnter={handleMouseEnterImage}
                  onMouseLeave={handleMouseLeaveImage}
                >
                  <GradientOverlay />
                  <ProjectImage
                    src={projet.image}
                    className="parallax-bg"
                    alt={`Image du projet ${title}`}
                  />
                  <ProjectInfo>
                    <ProjectRole>
                      <RoleIndex>0{index + 1}</RoleIndex> {role}
                    </ProjectRole>
                    <ProjectDescText>
                      {description}
                    </ProjectDescText>
                    <ViewProjectBtn>
                      {t('projects.viewProject') || 'Voir le projet'} <Arrow>→</Arrow>
                    </ViewProjectBtn>
                  </ProjectInfo>
                </ImageWrapper>

                <TitleParallaxSolid className="title-parallax">
                  {title}
                </TitleParallaxSolid>
              </Slide>
            );
          })}
        </ScrollContainer>
      </StickyContainer>
    </ProjectsSection>
  );
}
