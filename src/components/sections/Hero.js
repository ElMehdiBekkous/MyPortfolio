'use client';
import { useRef, useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import styled, { keyframes } from 'styled-components';
import { useLanguage } from '@/context/LanguageContext';
import { FiArrowDown, FiGithub, FiLinkedin, FiTwitter, FiDribbble } from 'react-icons/fi';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ══════════════════════════════════════════
   FRAME SEQUENCE CONFIG
   ══════════════════════════════════════════ */
const IDLE_FRAME_COUNT = 72;
const SCROLL_FRAME_COUNT = 96;
const ACTION_FRAME_COUNT = 72;
const IDLE_FPS = 10;
const ACTION_FPS = 10;
const LOOP_PAUSE_MS = 2000;

const buildFramePaths = (folder, count) =>
  Array.from({ length: count }, (_, i) => `/avatar/${folder}/frame_${String(i + 1).padStart(3, '0')}.webp`);


/* ══════════════════════════════════════════
   ANIMATIONS
   ══════════════════════════════════════════ */

const pulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.98); }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  33% { transform: translateY(-15px) rotate(2deg); }
  66% { transform: translateY(-8px) rotate(-1deg); }
`;



const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(108, 99, 255, 0.3), 0 0 60px rgba(108, 99, 255, 0.1); }
  50% { box-shadow: 0 0 30px rgba(108, 99, 255, 0.5), 0 0 80px rgba(108, 99, 255, 0.2); }
`;

const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% { transform: translateY(0) translateX(-50%); }
  40% { transform: translateY(-8px) translateX(-50%); }
  60% { transform: translateY(-4px) translateX(-50%); }
`;

const morphBlob = keyframes`
  0%, 100% { border-radius: 42% 58% 70% 30% / 45% 45% 55% 55%; transform: rotate(0deg) scale(1); }
  25% { border-radius: 58% 42% 30% 70% / 55% 30% 70% 45%; transform: rotate(90deg) scale(1.05); }
  50% { border-radius: 30% 70% 58% 42% / 70% 55% 45% 30%; transform: rotate(180deg) scale(0.95); }
  75% { border-radius: 70% 30% 42% 58% / 30% 70% 55% 45%; transform: rotate(270deg) scale(1.02); }
`;

const slideInLeft = keyframes`
  from { opacity: 0; transform: translateX(-60px); filter: blur(10px); }
  to { opacity: 1; transform: translateX(0); filter: blur(0); }
`;

const slideInRight = keyframes`
  from { opacity: 0; transform: translateX(60px); filter: blur(10px); }
  to { opacity: 1; transform: translateX(0); filter: blur(0); }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(40px); filter: blur(6px); }
  to { opacity: 1; transform: translateY(0); filter: blur(0); }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const typewriter = keyframes`
  from { width: 0; }
  to { width: 100%; }
`;

const blink = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
`;

/* ══════════════════════════════════════════
   STYLED COMPONENTS
   ══════════════════════════════════════════ */

const HeroSection = styled.section`
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  overflow: hidden;
  padding: 6rem 0 2rem;
`;

/* ── Background layers ── */
const BgLayer = styled.div`
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
`;

const GridPattern = styled.div`
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(${({ theme }) => theme.colors.border}44 1px, transparent 1px),
    linear-gradient(90deg, ${({ theme }) => theme.colors.border}44 1px, transparent 1px);
  background-size: 80px 80px;
  opacity: 0.25;
  mask-image: radial-gradient(ellipse 60% 60% at 50% 50%, black 20%, transparent 100%);
`;

const GradientMesh = styled.div`
  position: absolute;
  width: ${({ $size }) => $size || '500px'};
  height: ${({ $size }) => $size || '500px'};
  top: ${({ $top }) => $top};
  left: ${({ $left }) => $left};
  right: ${({ $right }) => $right};
  bottom: ${({ $bottom }) => $bottom};
  background: ${({ $color }) => $color};
  filter: blur(${({ $blur }) => $blur || '100px'});
  opacity: ${({ $opacity }) => $opacity || '0.25'};
  animation: ${morphBlob} ${({ $speed }) => $speed || '15s'} ease-in-out infinite;
`;

const ParticleCanvas = styled.canvas`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
`;

const ColorOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
  background-color: transparent;
  pointer-events: none;
`;

/* ── Layout ── */
const HeroContainer = styled.div`
  position: relative;
  z-index: 10;
  max-width: 1300px;
  margin: 0 auto;
  padding: 0 2rem;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 4rem;
  align-items: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 3rem;
  }
`;

/* ── Left: Text Content ── */
const TextColumn = styled.div`
  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    order: 2;
  }
`;

const Greeting = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.95rem;
  color: ${({ theme }) => theme.colors.accent};
  margin-bottom: 1.25rem;
  padding: 0.4rem 1rem;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.accentGlow};
  border: 1px solid ${({ theme }) => theme.colors.accent}33;
  opacity: 0;
  animation: ${slideUp} 0.8s ease forwards;
  animation-delay: 0.3s;
`;

const StatusDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4CAF50;
  animation: ${pulse} 2s ease-in-out infinite;
`;

/* ── Split-text name ── */
const NameWrapper = styled.h1`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: clamp(3rem, 6vw, 5rem);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -2px;
  margin-bottom: 1.5rem;
`;

const NameLine = styled.div`
  overflow: hidden;
  display: block;
`;

const NameText = styled.span`
  display: inline-block;
  opacity: 0;
  animation: ${slideInLeft} 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  animation-delay: ${({ $delay }) => $delay || '0.5s'};
  color: ${({ theme }) => theme.colors.text};
`;

const GradientName = styled.span`
  display: inline-block;
  opacity: 0;
  animation: ${slideInRight} 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  animation-delay: ${({ $delay }) => $delay || '0.7s'};
  background: ${({ theme }) => theme.colors.gradient};
  background-size: 200% 200%;
  animation-name: ${slideInRight}, ${gradientShift};
  animation-duration: 0.9s, 4s;
  animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94), ease;
  animation-fill-mode: forwards, none;
  animation-delay: ${({ $delay }) => $delay || '0.7s'}, 0s;
  animation-iteration-count: 1, infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

/* ── Role typewriter ── */
const RoleWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  opacity: 0;
  animation: ${fadeIn} 0.5s ease forwards;
  animation-delay: 1s;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    justify-content: center;
  }
`;

const RoleLine = styled.div`
  width: 40px;
  height: 2px;
  background: ${({ theme }) => theme.colors.accent};
`;

const RoleText = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.accent};
  letter-spacing: 2px;
  text-transform: uppercase;
  font-weight: 500;
`;

/* ── Subtitle ── */
const Subtitle = styled.p`
  font-size: clamp(1rem, 1.5vw, 1.2rem);
  color: ${({ theme }) => theme.colors.textSecondary};
  max-width: 520px;
  line-height: 1.8;
  margin-bottom: 2rem;
  opacity: 0;
  animation: ${slideUp} 0.8s ease forwards;
  animation-delay: 1.1s;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    margin-left: auto;
    margin-right: auto;
  }

  strong {
    color: ${({ theme }) => theme.colors.accent};
    font-weight: 600;
  }
`;

/* ── CTAs ── */
const HeroActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  opacity: 0;
  animation: ${slideUp} 0.8s ease forwards;
  animation-delay: 1.3s;
  flex-wrap: wrap;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    justify-content: center;
  }
`;

const PrimaryBtn = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.9rem 2.25rem;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.gradient};
  color: #fff;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.4s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
    transform: translateX(-100%);
    transition: transform 0.6s ease;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 35px ${({ theme }) => theme.colors.accentGlow};
    &::before { transform: translateX(100%); }
  }
`;

const SecondaryBtn = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.9rem 2.25rem;
  border-radius: ${({ theme }) => theme.radii.full};
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};
  font-weight: 500;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.4s ease;
  background: ${({ theme }) => theme.colors.glass};
  backdrop-filter: blur(10px);

  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
    transform: translateY(-3px);
    color: ${({ theme }) => theme.colors.accent};
    box-shadow: 0 8px 25px ${({ theme }) => theme.colors.accentGlow};
  }
`;

/* ── Socials ── */
const SocialLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 2rem;
  opacity: 0;
  animation: ${slideUp} 0.8s ease forwards;
  animation-delay: 1.5s;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    justify-content: center;
  }
`;

const SocialIcon = styled.a`
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 1.05rem;
  transition: all 0.3s ease;
  background: ${({ theme }) => theme.colors.glass};
  backdrop-filter: blur(10px);
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
    color: ${({ theme }) => theme.colors.accent};
    transform: translateY(-4px) rotate(-3deg);
    box-shadow: 0 8px 25px ${({ theme }) => theme.colors.accentGlow};
  }
`;

/* ── Right: 3D Avatar Column ── */
const AvatarColumn = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    order: 1;
  }
`;

const AvatarWrapper = styled.div`
  position: relative;
  width: 420px;
  height: 520px;
  animation: ${float} 6s ease-in-out infinite;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    width: 300px;
    height: 370px;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    width: 250px;
    height: 310px;
  }
`;

const AvatarGlow = styled.div`
  position: absolute;
  inset: -20px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.gradient};
  opacity: 0.15;
  filter: blur(40px);
  animation: ${glow} 3s ease-in-out infinite;
`;

const AvatarFrame = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  z-index: 2;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
`;

/* ── Tech badges (orbiting & skill bars) ── */
const OrbitalBadgeWrapper = styled.div`
  position: absolute;
  z-index: 5;
  top: ${({ $top }) => $top || 'auto'};
  bottom: ${({ $bottom }) => $bottom || 'auto'};
  left: ${({ $left }) => $left || 'auto'};
  right: ${({ $right }) => $right || 'auto'};
`;

const OrbitalBadgeInner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.colors.shadowLg};
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.text};
  animation: ${float} ${({ $speed }) => $speed || '4s'} ease-in-out infinite;
  animation-delay: ${({ $delay }) => $delay || '0s'};
`;

const SkillBarWrapper = styled.div`
  position: absolute;
  z-index: 5;
  display: flex;
  align-items: center;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 0.8rem;
  font-weight: 600;
  box-shadow: ${({ theme }) => theme.colors.shadowLg};
  overflow: hidden;
  white-space: nowrap;
  color: ${({ theme }) => theme.colors.text};
  opacity: 0; /* Hidden initially */
  width: 50px; /* Starts small */
  right: 8%; /* Fixed right position */
`;

const SkillFill = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 0%;
  background: ${({ $color }) => $color};
  opacity: 0.15;
  z-index: 0;
`;

const BadgeContent = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  gap: 0.4rem;
  width: 100%;
`;

const SkillPercent = styled.span`
  margin-left: auto;
  opacity: 0;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.75rem;
  color: ${({ $color }) => $color};
`;

const BadgeEmoji = styled.span`font-size: 1.1rem;`;

/* ── Orbit ring ── */
const OrbitRing = styled.div`
  position: absolute;
  inset: -30px;
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: 50%;
  animation: spin 20s linear infinite;
  z-index: 1;
  opacity: 0.5;

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const OrbitDot = styled.div`
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  top: ${({ $top }) => $top};
  left: ${({ $left }) => $left};
  right: ${({ $right }) => $right};
  bottom: ${({ $bottom }) => $bottom};
  box-shadow: 0 0 15px ${({ $color }) => $color}88;
`;

/* ── Orbit ring ── */
const ScrollIndicator = styled.div`
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  animation: ${bounce} 2.5s ease infinite;
  cursor: pointer;
  z-index: 10;
`;

const ScrollMouse = styled.div`
  width: 26px;
  height: 42px;
  border-radius: 13px;
  border: 2px solid ${({ theme }) => theme.colors.accent};
  position: relative;
  animation: ${glow} 3s ease-in-out infinite;

  &::before {
    content: '';
    position: absolute;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    width: 3px;
    height: 8px;
    border-radius: 2px;
    background: ${({ theme }) => theme.colors.accent};
    animation: ${keyframes`
      0%, 100% { opacity: 1; transform: translateX(-50%) translateY(0); }
      50% { opacity: 0.3; transform: translateX(-50%) translateY(8px); }
    `} 1.5s ease-in-out infinite;
  }
`;

const ScrollText = styled.span`
  font-size: 0.65rem;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: 500;
`;

/* ══════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════ */

export default function Hero() {
  const { t } = useLanguage();
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const avatarRef = useRef(null);
  const heroRef = useRef(null);
  const textColumnRef = useRef(null);
  const avatarColumnRef = useRef(null);

  /* ── Frame sequences ── */
  const idleFrames = useRef(buildFramePaths('idle', IDLE_FRAME_COUNT));
  const scrollFrames = useRef(buildFramePaths('scroll', SCROLL_FRAME_COUNT));
  const actionFrames = useRef(buildFramePaths('action', ACTION_FRAME_COUNT));

  const [currentFrame, setCurrentFrame] = useState('/avatar/idle/frame_001.webp');
  const [framesLoaded, setFramesLoaded] = useState(false);
  const animState = useRef('idle'); // 'idle' | 'scroll' | 'action'
  const loopTimerRef = useRef(null);
  const loopIndexRef = useRef(0);

  /* ── Preload all frames ── */
  useEffect(() => {
    const allFrames = [
      ...idleFrames.current,
      ...scrollFrames.current,
      ...actionFrames.current,
    ];
    let loaded = 0;
    allFrames.forEach((src) => {
      const img = new Image();
      img.onload = img.onerror = () => {
        loaded++;
        if (loaded >= allFrames.length) setFramesLoaded(true);
      };
      img.src = src;
    });
  }, []);

  /* ── Loop animation helper ── */
  const startLoop = useCallback((frames, fps) => {
    stopLoop();
    loopIndexRef.current = 0;
    const frameDelay = 1000 / fps;

    const tick = () => {
      loopIndexRef.current = (loopIndexRef.current + 1) % frames.length;
      setCurrentFrame(frames[loopIndexRef.current]);

      // If we just wrapped to frame 0, pause before replaying
      const delay = loopIndexRef.current === 0 ? LOOP_PAUSE_MS : frameDelay;
      loopTimerRef.current = setTimeout(tick, delay);
    };

    loopTimerRef.current = setTimeout(tick, frameDelay);
  }, []);

  const stopLoop = useCallback(() => {
    if (loopTimerRef.current) {
      clearTimeout(loopTimerRef.current);
      loopTimerRef.current = null;
    }
  }, []);

  /* ── Start idle loop once frames are loaded ── */
  useEffect(() => {
    if (framesLoaded) {
      animState.current = 'idle';
      startLoop(idleFrames.current, IDLE_FPS);
    }
    return () => stopLoop();
  }, [framesLoaded, startLoop, stopLoop]);

  /* ── GSAP ScrollTrigger — pin hero & scrub avatar frames ── */
  useEffect(() => {
    if (!framesLoaded || !heroRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: '+=400%',       // extended for sequential animations
          pin: true,            // pin the hero section
          pinSpacing: true,     // push subsequent content down
          scrub: 0.5,
          onUpdate: (self) => {
            const progress = self.progress; // 0 → 1

            if (progress <= 0.02) {
              // At the very top — idle loop
              if (animState.current !== 'idle') {
                animState.current = 'idle';
                startLoop(idleFrames.current, IDLE_FPS);
              }
            } else if (progress >= 0.98) {
              // Reached the end — action loop
              if (animState.current !== 'action') {
                animState.current = 'action';
                startLoop(actionFrames.current, ACTION_FPS);
              }
            } else {
              // In the middle — scroll-driven frames
              if (animState.current !== 'scroll') {
                animState.current = 'scroll';
                stopLoop();
              }
              const frameIndex = Math.min(
                SCROLL_FRAME_COUNT - 1,
                Math.floor(progress * SCROLL_FRAME_COUNT)
              );
              setCurrentFrame(scrollFrames.current[frameIndex]);
            }
          },
        }
      });

      // Animate text column to disappear
      tl.to(textColumnRef.current, {
        opacity: 0,
        x: -50,
        duration: 1,
        ease: 'power1.inOut'
      }, 0);

      // Animate avatar to move from right to left
      tl.to(avatarColumnRef.current, {
        x: () => {
          // calculate movement to approx center or left side
          const isMobile = window.innerWidth <= 1024;
          return isMobile ? 0 : -window.innerWidth * 0.35;
        },
        duration: 1,
        ease: 'power1.inOut'
      }, 0);

      // Animate scroll indicator to fade out
      tl.to('.scroll-indicator-hero', {
        opacity: 0,
        duration: 0.3
      }, 0);

      // Arrays for new separate elements
      const orbitalBadges = gsap.utils.toArray('.orbital-badge');
      const skillBars = gsap.utils.toArray('.skill-bar-wrapper');

      // Phase 1: Orbit badges already move left because they are children of AvatarColumn!
      // We don't need to animate them in Phase 1 manually anymore.

      const badgeColors = [
        'rgba(97, 218, 251, 0.4)', // React cyan
        'rgba(160, 160, 160, 0.4)', // Next.js gray
        'rgba(104, 160, 99, 0.4)'  // Node.js green
      ];

      // Reset color overlay initially
      tl.set('.hero-color-overlay', { backgroundColor: 'transparent' }, 0);
      tl.set(skillBars, { opacity: 0, width: 50 }, 0); // Hide skill bars initially

      orbitalBadges.forEach((badge, index) => {
        const startTime = 1 + index * 1.5;

        // Phase 2: Shoot to the right side
        // Since the badge is inside the avatar (which moved left), we translate it far right
        const targetX = () => window.innerWidth <= 1024 ? 200 : window.innerWidth * 0.6;
        const targetY = (index - 1) * 80; // Spread them vertically based on index

        tl.to(badge, {
          x: targetX, // Shoot out of orbit
          y: targetY,
          duration: 0.5,
          ease: 'power3.in'
        }, startTime);

        const impactTime = startTime + 0.5;

        // Phase 3: The exact moment of impact it explodes
        tl.to(badge, {
          scale: 4, // Explosion scale
          opacity: 0,
          duration: 0.2,
          ease: 'power1.out'
        }, impactTime);

        // Wash background color exactly ON impact
        tl.to('.hero-color-overlay', {
          backgroundColor: badgeColors[index],
          duration: 0.6,
          ease: 'power2.out'
        }, impactTime);

        // Reveal Skill Bar popping out of explosion
        const skillBar = skillBars[index];
        const targetWidth = () => window.innerWidth <= 1024 ? 180 : 250;

        tl.fromTo(skillBar,
          {
            top: () => `${35 + index * 15}%`,
            scale: 0.2, // Pop from inside explosion
            opacity: 0,
            width: 50
          },
          {
            opacity: 1,
            scale: 1,
            width: targetWidth,
            duration: 0.4,
            ease: 'back.out(2)' // strong pop
          }, impactTime);

        // Fill skill bar immediately after pop
        tl.to(skillBar.querySelector('.skill-fill'), {
          width: (i, el) => el.getAttribute('data-percent'),
          duration: 0.6,
          ease: 'power2.out'
        }, impactTime + 0.2);

        // Show percent text
        tl.to(skillBar.querySelector('.skill-percent'), {
          opacity: 1,
          duration: 0.4
        }, impactTime + 0.4);
      });

    }, heroRef);

    return () => ctx.revert();
  }, [framesLoaded, startLoop, stopLoop]);

  /* ── Particle field ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const createParticles = () => {
      particles = [];
      const count = Math.min(100, Math.floor(window.innerWidth / 12));
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          size: Math.random() * 2.5 + 0.5,
          opacity: Math.random() * 0.4 + 0.1,
          hue: Math.random() > 0.5 ? 245 : 280,
        });
      }
    };
    createParticles();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { x: mx, y: my } = mouseRef.current;

      particles.forEach((p, i) => {
        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180) {
          const force = (180 - dist) / 180;
          p.x -= dx * force * 0.015;
          p.y -= dy * force * 0.015;
        }

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 70%, 65%, ${p.opacity})`;
        ctx.shadowBlur = 15;
        ctx.shadowColor = `hsla(${p.hue}, 70%, 65%, 0.3)`;
        ctx.fill();
        ctx.shadowBlur = 0;

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const d = Math.sqrt(Math.pow(p.x - p2.x, 2) + Math.pow(p.y - p2.y, 2));
          if (d < 130) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `hsla(${p.hue}, 60%, 60%, ${0.12 * (1 - d / 130)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      });
      animId = requestAnimationFrame(animate);
    };
    animate();

    const handleMouseMove = (e) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  /* ── Interactive floating for avatar ── */
  useEffect(() => {
    const handleMove = (e) => {
      if (!avatarRef.current) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      avatarRef.current.style.transform = `translate(${x}px, ${y}px)`;
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <HeroSection id="hero" ref={heroRef}>
      {/* ── Background ── */}
      <BgLayer>
        <GridPattern />
        <ColorOverlay className="hero-color-overlay" />
        <GradientMesh $color="radial-gradient(circle, #6C63FF, #4834d4)" $size="600px" $top="-15%" $left="5%" $speed="18s" $blur="120px" $opacity="0.2" />
        <GradientMesh $color="radial-gradient(circle, #E040FB, #9b59b6)" $size="450px" $top="60%" $right="0%" $speed="22s" $blur="100px" $opacity="0.15" />
        <GradientMesh $color="radial-gradient(circle, #00BCD4, #0097A7)" $size="350px" $bottom="-10%" $left="30%" $speed="25s" $blur="90px" $opacity="0.12" />
        <ParticleCanvas ref={canvasRef} />
      </BgLayer>

      {/* ── Content: Split Layout ── */}
      <HeroContainer>
        <TextColumn ref={textColumnRef}>
          <Greeting>
            <StatusDot />
            {t('hero.greeting')}
          </Greeting>

          <NameWrapper>
            <NameLine>
              <NameText $delay="0.5s">{t('hero.name')} </NameText>
            </NameLine>
            <NameLine>
              <GradientName $delay="0.7s">{t('hero.lastName')}</GradientName>
            </NameLine>
          </NameWrapper>

          <RoleWrapper>
            <RoleLine />
            <RoleText>Full-Stack Developer</RoleText>
          </RoleWrapper>

          <Subtitle>
            {t('hero.subtitle')}{' '}
            <strong>{t('hero.subtitleHighlight')}</strong>{' '}
            {t('hero.subtitleEnd')}
          </Subtitle>

          <HeroActions>
            <PrimaryBtn href="#projects" onClick={(e) => { e.preventDefault(); scrollTo('projects'); }}>
              {t('hero.viewWork')} →
            </PrimaryBtn>
            <SecondaryBtn href="#contact" onClick={(e) => { e.preventDefault(); scrollTo('contact'); }}>
              {t('hero.getInTouch')}
            </SecondaryBtn>
          </HeroActions>

          <SocialLinks>
            <SocialIcon href="https://github.com" target="_blank" rel="noopener noreferrer"><FiGithub /></SocialIcon>
            <SocialIcon href="https://linkedin.com" target="_blank" rel="noopener noreferrer"><FiLinkedin /></SocialIcon>
            <SocialIcon href="https://twitter.com" target="_blank" rel="noopener noreferrer"><FiTwitter /></SocialIcon>
            <SocialIcon href="https://dribbble.com" target="_blank" rel="noopener noreferrer"><FiDribbble /></SocialIcon>
          </SocialLinks>
        </TextColumn>

        {/* ── Right: 3D Avatar with Parallax ── */}
        <AvatarColumn ref={avatarColumnRef}>
          <AvatarWrapper ref={avatarRef}>
            <AvatarGlow />
            <OrbitRing>
              <OrbitDot $color="#6C63FF" $top="0" $left="50%" />
              <OrbitDot $color="#E040FB" $bottom="10%" $right="0" />
              <OrbitDot $color="#00BCD4" $bottom="10%" $left="0" />
            </OrbitRing>

            {/* Orbital Badges (Inside AvatarWrapper to tightly anchor to the Avatar) */}
            <OrbitalBadgeWrapper className="orbital-badge" $top="15%" $right="5%">
              <OrbitalBadgeInner $speed="4s" $delay="0s">
                <BadgeEmoji>⚛️</BadgeEmoji>
              </OrbitalBadgeInner>
            </OrbitalBadgeWrapper>

            <OrbitalBadgeWrapper className="orbital-badge" $bottom="25%" $left="10%">
              <OrbitalBadgeInner $speed="5s" $delay="0.5s">
                <BadgeEmoji>▲</BadgeEmoji>
              </OrbitalBadgeInner>
            </OrbitalBadgeWrapper>

            <OrbitalBadgeWrapper className="orbital-badge" $top="50%" $left="-5%">
              <OrbitalBadgeInner $speed="6s" $delay="1s">
                <BadgeEmoji>🟢</BadgeEmoji>
              </OrbitalBadgeInner>
            </OrbitalBadgeWrapper>

            <AvatarFrame
              src={currentFrame}
              alt="El Mehdi Bekkous 3D Avatar"
              draggable={false}
            />
          </AvatarWrapper>
        </AvatarColumn>

        {/* Right side Skill Bars (appear after explosion impact) */}
        <SkillBarWrapper className="skill-bar-wrapper">
          <SkillFill className="skill-fill" $color="#61DAFB" data-percent="90%" />
          <BadgeContent>
            <BadgeEmoji>⚛️</BadgeEmoji> React
            <SkillPercent className="skill-percent" $color="#61DAFB">90%</SkillPercent>
          </BadgeContent>
        </SkillBarWrapper>

        <SkillBarWrapper className="skill-bar-wrapper">
          <SkillFill className="skill-fill" $color="#a0a0a0" data-percent="85%" />
          <BadgeContent>
            <BadgeEmoji>▲</BadgeEmoji> Next.js
            <SkillPercent className="skill-percent" $color="#a0a0a0">85%</SkillPercent>
          </BadgeContent>
        </SkillBarWrapper>

        <SkillBarWrapper className="skill-bar-wrapper">
          <SkillFill className="skill-fill" $color="#68A063" data-percent="80%" />
          <BadgeContent>
            <BadgeEmoji>🟢</BadgeEmoji> Node.js
            <SkillPercent className="skill-percent" $color="#68A063">80%</SkillPercent>
          </BadgeContent>
        </SkillBarWrapper>

      </HeroContainer>

      {/* ── Glowing scroll indicator ── */}
      <ScrollIndicator className="scroll-indicator-hero" onClick={() => scrollTo('about')}>
        <ScrollMouse />
        <ScrollText>{t('hero.scroll')}</ScrollText>
      </ScrollIndicator>
    </HeroSection >
  );
}
