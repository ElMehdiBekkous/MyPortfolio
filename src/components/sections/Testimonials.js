'use client';
import { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import SectionWrapper from '@/components/SectionWrapper';
import { useLanguage } from '@/context/LanguageContext';
import { testimonials as testimonialData } from '@/data/testimonials';

const marquee = keyframes`
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
`;

const marqueeRTL = keyframes`
  from { transform: translateX(0); }
  to { transform: translateX(50%); }
`;

const Marquee = styled.div`
  overflow: hidden;
  margin-bottom: 3rem;
  padding: 1rem 0;
  mask-image: linear-gradient(90deg, transparent, black 20%, black 80%, transparent);
`;

const MarqueeTrack = styled.div`
  display: flex;
  gap: 2rem;
  width: max-content;
  animation: ${({ $isRTL }) => ($isRTL ? marqueeRTL : marquee)} 25s linear infinite;
`;

const MarqueeWord = styled.span`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: clamp(2rem, 5vw, 4rem);
  font-weight: 700;
  white-space: nowrap;
  color: ${({ $accent, theme }) => $accent ? theme.colors.accent : theme.colors.bgSecondary};
  -webkit-text-stroke: ${({ $accent, theme }) => $accent ? 'none' : `1px ${theme.colors.border}`};
  text-fill-color: ${({ $accent }) => $accent ? 'initial' : 'transparent'};
  -webkit-text-fill-color: ${({ $accent, theme }) => $accent ? theme.colors.accent : 'transparent'};
`;

const TestimonialCard = styled.div`
  max-width: 700px;
  margin: 0 auto;
  text-align: center;
  background: ${({ theme }) => theme.colors.glass};
  backdrop-filter: blur(20px);
  border: 1px solid ${({ theme }) => theme.colors.glassBorder};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: 3rem;
  position: relative;
  transition: all 0.4s ease;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 50px ${({ theme }) => theme.colors.accentGlow};
  }
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) { padding: 2rem; }
`;

const QuoteMark = styled.div`
  font-size: 4rem; line-height: 1;
  background: ${({ theme }) => theme.colors.gradientText};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1.5rem;
`;

const Quote = styled.p`
  font-size: clamp(1rem, 2vw, 1.2rem);
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.8; font-style: italic;
  margin-bottom: 2rem;
`;

const AuthorInfo = styled.div`display: flex; align-items: center; justify-content: center; gap: 1rem;`;

const AuthorAvatar = styled.div`
  width: 48px; height: 48px; border-radius: 50%;
  background: ${({ theme }) => theme.colors.gradientSubtle};
  display: flex; align-items: center; justify-content: center;
  font-size: 1.2rem; flex-shrink: 0;
`;

const AuthorText = styled.div`text-align: start;`;

const AuthorName = styled.div`font-weight: 600; color: ${({ theme }) => theme.colors.text}; font-size: 0.95rem;`;
const AuthorRole = styled.div`font-size: ${({ theme }) => theme.fontSizes.sm}; color: ${({ theme }) => theme.colors.textMuted};`;

const Dots = styled.div`display: flex; justify-content: center; gap: 0.5rem; margin-top: 2rem;`;

const Dot = styled.button`
  width: ${({ $active }) => ($active ? '24px' : '8px')}; height: 8px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ $active, theme }) => $active ? theme.colors.accent : theme.colors.border};
  transition: all 0.3s ease; cursor: pointer;
`;

const marqueeWords = ['Exceptional Work', '✦', 'Creative Solutions', '✦', 'Modern Design', '✦', 'Clean Code', '✦'];

export default function Testimonials() {
  const { t, isRTL } = useLanguage();
  const [active, setActive] = useState(0);
  const intervalRef = useRef(null);
  const translatedItems = t('testimonials.items');

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActive(prev => (prev + 1) % testimonialData.length);
    }, 5000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const goTo = (i) => {
    setActive(i);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActive(prev => (prev + 1) % testimonialData.length);
    }, 5000);
  };

  const current = testimonialData[active];
  const translated = Array.isArray(translatedItems) ? translatedItems[active] : null;

  return (
    <SectionWrapper id="testimonials" label={t('testimonials.label')} title={t('testimonials.title')} description={t('testimonials.description')}>
      <Marquee>
        <MarqueeTrack $isRTL={isRTL}>
          {[...marqueeWords, ...marqueeWords].map((word, i) => (
            <MarqueeWord key={i} $accent={word === '✦'}>{word}</MarqueeWord>
          ))}
        </MarqueeTrack>
      </Marquee>

      <TestimonialCard>
        <QuoteMark>&ldquo;</QuoteMark>
        <Quote>{translated?.content || current.content}</Quote>
        <AuthorInfo>
          <AuthorAvatar>{current.avatar}</AuthorAvatar>
          <AuthorText>
            <AuthorName>{current.name}</AuthorName>
            <AuthorRole>{current.role}</AuthorRole>
          </AuthorText>
        </AuthorInfo>
      </TestimonialCard>

      <Dots>
        {testimonialData.map((_, i) => (
          <Dot key={i} $active={i === active} onClick={() => goTo(i)} />
        ))}
      </Dots>
    </SectionWrapper>
  );
}
