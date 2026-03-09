'use client';
import { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { localeList } from '@/i18n';

/* ── Animations ── */
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translate(-50%, -45%) scale(0.92); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
`;

const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-12px) rotate(3deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.1); }
`;

/* ── Overlay ── */
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100000;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(16px) saturate(180%);
  animation: ${fadeIn} 0.4s ease;
`;

/* ── Modal ── */
const Modal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 100001;
  width: 92%;
  max-width: 520px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 24px;
  padding: 0;
  animation: ${slideUp} 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow:
    0 25px 60px rgba(0, 0, 0, 0.35),
    0 0 0 1px ${({ theme }) => theme.colors.border},
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  overflow: hidden;

  @media (max-width: 480px) {
    width: 95%;
    border-radius: 20px;
  }
`;

/* ── Gradient Header ── */
const ModalHeader = styled.div`
  position: relative;
  padding: 2.5rem 2.5rem 2rem;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: ${({ theme }) => theme.colors.gradient};
    opacity: 0.08;
  }

  @media (max-width: 480px) {
    padding: 2rem 1.5rem 1.5rem;
  }
`;

const FloatingOrb = styled.div`
  position: absolute;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  filter: blur(${({ $blur }) => $blur || 40}px);
  top: ${({ $top }) => $top};
  left: ${({ $left }) => $left};
  right: ${({ $right }) => $right};
  animation: ${pulse} ${({ $speed }) => $speed || '4s'} ease-in-out infinite;
  pointer-events: none;
`;

const Emoji = styled.div`
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
  animation: ${float} 3s ease-in-out infinite;
`;

const Title = styled.h2`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 1.75rem;
  font-weight: 700;
  position: relative;
  background: ${({ theme }) => theme.colors.gradientText};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.25rem;
  letter-spacing: -0.5px;
`;

const Subtitle = styled.p`
  font-size: 0.95rem;
  color: ${({ theme }) => theme.colors.textMuted};
  position: relative;
`;

/* ── Body ── */
const ModalBody = styled.div`
  padding: 1.75rem 2.5rem 2.5rem;

  @media (max-width: 480px) {
    padding: 1.25rem 1.5rem 2rem;
  }
`;

const Section = styled.div`
  margin-bottom: 1.75rem;

  &:last-of-type {
    margin-bottom: 2rem;
  }
`;

const Label = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 1.5px;
`;

const LabelIcon = styled.span`
  font-size: 1rem;
`;

/* ── Language Options ── */
const LanguageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
`;

const LangOption = styled.button`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.1rem 0.5rem;
  border-radius: 16px;
  border: 2px solid transparent;
  background: ${({ theme }) => theme.colors.bgSecondary};
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;

  ${({ $active, theme }) =>
    $active &&
    css`
      border-color: ${theme.colors.accent};
      background: ${theme.colors.accentGlow};
      box-shadow: 0 4px 20px ${theme.colors.accentGlow}, 0 0 0 1px ${theme.colors.accent}33;
    `}

  &:not([disabled]):hover {
    border-color: ${({ theme }) => theme.colors.accent}88;
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(-1px);
  }
`;

const LangCheck = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.accent};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  color: #fff;
  opacity: ${({ $active }) => ($active ? 1 : 0)};
  transform: scale(${({ $active }) => ($active ? 1 : 0.5)});
  transition: all 0.2s ease;
`;

const LangFlag = styled.img`
  width: 32px;
  height: 24px;
  object-fit: cover;
  border-radius: 4px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
`;

const LangName = styled.span`
  font-size: 0.8rem;
  font-weight: 600;
  color: ${({ $active, theme }) =>
    $active ? theme.colors.accent : theme.colors.text};
  transition: color 0.2s ease;
`;

/* ── Theme Options ── */
const ThemeToggleRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
`;

const ThemeOption = styled.button`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 1.25rem;
  border-radius: 16px;
  border: 2px solid transparent;
  background: ${({ theme }) => theme.colors.bgSecondary};
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;

  ${({ $active, theme }) =>
    $active &&
    css`
      border-color: ${theme.colors.accent};
      background: ${theme.colors.accentGlow};
      box-shadow: 0 4px 20px ${theme.colors.accentGlow}, 0 0 0 1px ${theme.colors.accent}33;
    `}

  &:not([disabled]):hover {
    border-color: ${({ theme }) => theme.colors.accent}88;
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
`;

const ThemePreview = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  background: ${({ $dark }) =>
    $dark
      ? 'linear-gradient(135deg, #1a1a2e, #16213e)'
      : 'linear-gradient(135deg, #f8f9ff, #e8eaff)'};
  border: 1px solid ${({ $dark }) =>
    $dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'};
  box-shadow: ${({ $dark }) =>
    $dark
      ? 'inset 0 1px 0 rgba(255,255,255,0.05)'
      : 'inset 0 1px 0 rgba(255,255,255,0.8)'};
`;

const ThemeLabel = styled.span`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ $active, theme }) =>
    $active ? theme.colors.accent : theme.colors.text};
  transition: color 0.2s ease;
`;

/* ── CTA Button ── */
const ContinueBtn = styled.button`
  width: 100%;
  padding: 1rem;
  border-radius: 14px;
  position: relative;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.gradient};
  color: #fff;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.3px;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.15) 50%,
      transparent 100%
    );
    background-size: 200% 100%;
    animation: ${shimmer} 3s ease-in-out infinite;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow:
      0 12px 35px ${({ theme }) => theme.colors.accentGlow},
      0 4px 15px rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: translateY(-1px);
  }
`;

const BtnContent = styled.span`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const Arrow = styled.span`
  display: inline-block;
  transition: transform 0.3s ease;
  ${ContinueBtn}:hover & {
    transform: translateX(4px);
  }
`;

export default function PreferencesPopup() {
  const { isDark, toggleTheme } = useTheme();
  const { locale, setLocale, t } = useLanguage();
  const [show, setShow] = useState(false);
  const [selectedLang, setSelectedLang] = useState(locale);
  const [selectedDark, setSelectedDark] = useState(isDark);

  useEffect(() => {
    const visited = localStorage.getItem('portfolio-visited');
    if (!visited) {
      setShow(true);
    }
  }, []);

  useEffect(() => {
    setSelectedLang(locale);
    setSelectedDark(isDark);
  }, [locale, isDark]);

  const handleContinue = () => {
    setLocale(selectedLang);
    if (selectedDark !== isDark) {
      toggleTheme();
    }
    localStorage.setItem('portfolio-visited', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <>
      <Overlay />
      <Modal>
        <ModalHeader>
          <FloatingOrb $size={120} $color="#6C63FF55" $top="-30px" $right="-20px" $speed="5s" $blur={50} />
          <FloatingOrb $size={80} $color="#E040FB44" $top="20px" $left="-30px" $speed="7s" $blur={40} />
          <Emoji>✨</Emoji>
          <Title>{t('preferences.title')}</Title>
          <Subtitle>{t('preferences.subtitle')}</Subtitle>
        </ModalHeader>

        <ModalBody>
          <Section>
            <Label>
              <LabelIcon>🌐</LabelIcon>
              {t('preferences.language')}
            </Label>
            <LanguageGrid>
              {localeList.map((l) => (
                <LangOption
                  key={l.code}
                  $active={selectedLang === l.code}
                  onClick={() => setSelectedLang(l.code)}
                >
                  <LangCheck $active={selectedLang === l.code}>✓</LangCheck>
                  <LangFlag src={l.flag} alt={l.name} />
                  <LangName $active={selectedLang === l.code}>{l.name}</LangName>
                </LangOption>
              ))}
            </LanguageGrid>
          </Section>

          <Section>
            <Label>
              <LabelIcon>🎨</LabelIcon>
              {t('preferences.theme')}
            </Label>
            <ThemeToggleRow>
              <ThemeOption
                $active={selectedDark}
                onClick={() => setSelectedDark(true)}
              >
                <ThemePreview $dark>🌙</ThemePreview>
                <ThemeLabel $active={selectedDark}>{t('preferences.dark')}</ThemeLabel>
              </ThemeOption>
              <ThemeOption
                $active={!selectedDark}
                onClick={() => setSelectedDark(false)}
              >
                <ThemePreview>☀️</ThemePreview>
                <ThemeLabel $active={!selectedDark}>{t('preferences.light')}</ThemeLabel>
              </ThemeOption>
            </ThemeToggleRow>
          </Section>

          <ContinueBtn onClick={handleContinue}>
            <BtnContent>
              {t('preferences.continue')} <Arrow>→</Arrow>
            </BtnContent>
          </ContinueBtn>
        </ModalBody>
      </Modal>
    </>
  );
}
