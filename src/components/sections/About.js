'use client';
import { useRef, useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import SectionWrapper from '@/components/SectionWrapper';
import { useLanguage } from '@/context/LanguageContext';

const float = keyframes`
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-15px) rotate(5deg); }
`;

const AboutGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr;
    gap: 2.5rem;
  }
`;

const ImageWrapper = styled.div`
  position: relative;
  perspective: 1000px;
`;

const TiltCard = styled.div`
  position: relative;
  border-radius: ${({ theme }) => theme.radii.xl};
  overflow: hidden;
  transition: transform 0.1s ease-out;
  transform-style: preserve-3d;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: ${({ theme }) => theme.colors.gradient};
    opacity: 0.1;
    z-index: 1;
  }
`;

const AvatarPlaceholder = styled.div`
  width: 100%;
  aspect-ratio: 4/5;
  background: ${({ theme }) => theme.colors.gradientSubtle};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8rem;
  border-radius: ${({ theme }) => theme.radii.xl};
  position: relative;
  overflow: hidden;
`;

const GlossOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, transparent 100%);
  z-index: 2;
  pointer-events: none;
  border-radius: ${({ theme }) => theme.radii.xl};
`;

const FloatingBadge = styled.div`
  position: absolute;
  bottom: -1rem;
  ${({ $isRTL }) => ($isRTL ? 'left: -1rem;' : 'right: -1rem;')}
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: ${({ theme }) => theme.colors.shadowLg};
  z-index: 10;
  animation: ${float} 4s ease-in-out infinite;
`;

const BadgeIcon = styled.span`font-size: 1.5rem;`;
const BadgeText = styled.div`
  font-size: 0.8rem;
  strong {
    display: block;
    font-size: 1.2rem;
    color: ${({ theme }) => theme.colors.accent};
  }
`;

const AboutContent = styled.div``;

const Bio = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.8;
  margin-bottom: ${({ theme }) => theme.spacing['2xl']};
`;

const Highlight = styled.span`
  color: ${({ theme }) => theme.colors.accent};
  font-weight: 600;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: ${({ theme }) => theme.spacing['2xl']};
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const StatItem = styled.div`
  text-align: center;
  padding: 1.25rem;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.bgSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  transition: all 0.3s ease;
  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
    transform: translateY(-4px);
    box-shadow: 0 8px 25px ${({ theme }) => theme.colors.accentGlow};
  }
`;

const StatNumber = styled.div`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 2rem;
  font-weight: 700;
  background: ${({ theme }) => theme.colors.gradientText};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: 0.25rem;
`;

const DownloadBtn = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem 2rem;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.gradient};
  color: #fff;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  cursor: pointer;
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 30px ${({ theme }) => theme.colors.accentGlow};
  }
`;

function AnimatedCounter({ end, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const duration = 2000;
          const step = (timestamp) => {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * end));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  return <StatNumber ref={ref}>{count}{suffix}</StatNumber>;
}

export default function About() {
  const { t, isRTL } = useLanguage();
  const tiltRef = useRef(null);

  useEffect(() => {
    const card = tiltRef.current;
    if (!card) return;
    const handleMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rotateX = (y - rect.height / 2) / 20;
      const rotateY = (rect.width / 2 - x) / 20;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    };
    const handleLeave = () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    };
    card.addEventListener('mousemove', handleMove);
    card.addEventListener('mouseleave', handleLeave);
    return () => {
      card.removeEventListener('mousemove', handleMove);
      card.removeEventListener('mouseleave', handleLeave);
    };
  }, []);

  const bio1 = t('about.bio1')
    .replace('{name}', 'El Mehdi Bekkous')
    .replace('{tech}', 'Next.js');

  return (
    <SectionWrapper id="about" label={t('about.label')} title={t('about.title')} description={t('about.description')}>
      <AboutGrid>
        <ImageWrapper>
          <TiltCard ref={tiltRef}>
            <AvatarPlaceholder>👨‍💻</AvatarPlaceholder>
            <GlossOverlay />
          </TiltCard>
          <FloatingBadge $isRTL={isRTL}>
            <BadgeIcon>🎯</BadgeIcon>
            <BadgeText>
              <strong>{t('about.badgeYears')}</strong>
              {t('about.badgeLabel')}
            </BadgeText>
          </FloatingBadge>
        </ImageWrapper>

        <AboutContent>
          <Bio>
            {bio1.split('El Mehdi Bekkous').map((part, i, arr) =>
              i < arr.length - 1 ? (
                <span key={i}>{part}<Highlight>El Mehdi Bekkous</Highlight></span>
              ) : (
                <span key={i}>{part}</span>
              )
            )}
          </Bio>
          <Bio>{t('about.bio2')}</Bio>

          <StatsGrid>
            <StatItem>
              <AnimatedCounter end={3} suffix="+" />
              <StatLabel>{t('about.yearsExp')}</StatLabel>
            </StatItem>
            <StatItem>
              <AnimatedCounter end={30} suffix="+" />
              <StatLabel>{t('about.projectsDone')}</StatLabel>
            </StatItem>
            <StatItem>
              <AnimatedCounter end={20} suffix="+" />
              <StatLabel>{t('about.happyClients')}</StatLabel>
            </StatItem>
          </StatsGrid>

          <DownloadBtn href="#" target="_blank" rel="noopener noreferrer">
            {t('about.downloadCv')}
          </DownloadBtn>
        </AboutContent>
      </AboutGrid>
    </SectionWrapper>
  );
}
