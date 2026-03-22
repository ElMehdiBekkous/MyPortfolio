'use client';
import { useRef, useEffect } from 'react';
import styled, { keyframes, useTheme } from 'styled-components';
import { useLanguage } from '@/context/LanguageContext';
import { FaGithub, FaLinkedinIn, FaInstagram } from 'react-icons/fa';
import { FiArrowUp, FiMail } from 'react-icons/fi';
import LogoIcon from '@/components/Logo';
import MagneticButton from '@/components/MagneticButton';

/* ── Animations ── */
const ticker = keyframes`from { transform: translateX(0); } to { transform: translateX(-50%); }`;
const tickerRTL = keyframes`from { transform: translateX(0); } to { transform: translateX(50%); }`;
const float = keyframes`0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}`;
const pulse = keyframes`0%,100%{transform:scale(1);opacity:1}50%{transform:scale(0.9);opacity:0.5}`;
const gradientShift = keyframes`
  0%,100%{background-position:0% 50%}
  50%{background-position:100% 50%}
`;

/* ── Outer wrapper ── */
const FooterSection = styled.footer`
  position: relative;
  overflow: hidden;
  background: transparent;
`;

/* ── Big CTA area on top ── */
const CtaArea = styled.div`
  position: relative;
  overflow: hidden;
  padding: 6rem 2rem 5rem;
  text-align: center;
  background: ${({ theme }) => `linear-gradient(180deg, transparent 0%, ${theme.colors.accent}08 60%, ${theme.colors.accent}12 100%)`};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const BigBlob = styled.div`
  position: absolute;
  width: 700px; height: 700px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.accent};
  filter: blur(160px);
  opacity: 0.06;
  top: 50%; left: 50%;
  transform: translate(-50%,-50%);
  pointer-events: none;
`;

const CtaEyebrow = styled.div`
  display: inline-flex; align-items: center; gap: 8px;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
  color: ${({ theme }) => theme.colors.accent};
  margin-bottom: 1.5rem;
  padding: 5px 14px;
  border-radius: 999px;
  border: 1px solid ${({ theme }) => theme.colors.accent}40;
  background: ${({ theme }) => theme.colors.accent}0D;
`;

const PulseDot = styled.span`
  width: 6px; height: 6px; border-radius: 50%;
  background: ${({ theme }) => theme.colors.accent};
  animation: ${pulse} 2s ease-in-out infinite;
`;

const CtaTitle = styled.h2`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: clamp(2.8rem, 7vw, 6rem);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.03em;
  margin-bottom: 1.25rem;
`;

const CtaLine1 = styled.div`
  color: ${({ theme }) => theme.colors.text};
`;
const CtaLine2 = styled.div`
  background: ${({ theme }) => theme.colors.gradient};
  background-size: 200% 200%;
  animation: ${gradientShift} 4s ease infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const CtaSub = styled.p`
  font-size: 1.05rem;
  color: ${({ theme }) => theme.colors.textMuted};
  max-width: 460px; margin: 0 auto 2.5rem;
  line-height: 1.75;
`;

const CtaButtons = styled.div`
  display: flex; align-items: center; justify-content: center; gap: 1rem; flex-wrap: wrap;
`;

const CtaBtn = styled.a`
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.85rem 2.2rem; border-radius: 999px;
  font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease;
  background: ${({ theme }) => theme.colors.gradient};
  background-size: 200% 200%; animation: ${gradientShift} 4s ease infinite;
  color: #fff;
  &:hover { transform: translateY(-3px); box-shadow: 0 14px 40px ${({ theme }) => theme.colors.accentGlow}; }
`;

const CtaBtnOutline = styled.a`
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.85rem 2.2rem; border-radius: 999px;
  font-size: 0.95rem; font-weight: 500; cursor: pointer; transition: all 0.3s ease;
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.glass}; backdrop-filter: blur(10px);
  color: ${({ theme }) => theme.colors.text};
  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
    color: ${({ theme }) => theme.colors.accent};
    transform: translateY(-3px);
    box-shadow: 0 8px 25px ${({ theme }) => theme.colors.accentGlow};
  }
`;

/* ── Ticker ── */
const TickerBar = styled.div`
  background: ${({ theme }) => theme.colors.gradient};
  background-size: 200% 200%;
  animation: ${gradientShift} 6s ease infinite;
  padding: 1rem 0; overflow: hidden;
`;

const TickerTrack = styled.div`
  display: flex; gap: 3rem; width: max-content;
  animation: ${({ $isRTL }) => ($isRTL ? tickerRTL : ticker)} 22s linear infinite;
`;

const TickerText = styled.span`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: clamp(0.9rem, 2vw, 1.4rem);
  font-weight: 700; white-space: nowrap;
  color: rgba(255,255,255,0.92);
`;

/* ── Main footer body ── */
const FooterBody = styled.div`
  background: ${({ theme }) => theme.colors.bg};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const FooterInner = styled.div`
  max-width: 1280px; margin: 0 auto; padding: 4rem 2rem 0;
  display: grid;
  grid-template-columns: 2.2fr 1fr 1fr 1.2fr;
  gap: 3rem;
  @media (max-width: 1024px) { grid-template-columns: 1fr 1fr; }
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;

/* Brand column */
const BrandCol = styled.div``;

const BrandRow = styled.div`
  display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;
`;

const BrandName = styled.span`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 1.25rem; font-weight: 700;
  background: ${({ theme }) => theme.colors.gradientText};
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
`;

const BrandDesc = styled.p`
  font-size: 0.88rem;
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.8; max-width: 300px; margin-bottom: 1.75rem;
`;

const FooterSocials = styled.div`display: flex; gap: 0.65rem; flex-wrap: wrap;`;

const SocialBtn = styled.a`
  width: 40px; height: 40px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textSecondary};
  transition: all 0.25s ease; cursor: pointer;
  background: ${({ theme }) => theme.colors.bgSecondary};
  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
    color: ${({ theme }) => theme.colors.accent};
    transform: translateY(-3px);
    box-shadow: 0 6px 20px ${({ theme }) => theme.colors.accentGlow};
  }
`;

/* Nav column */
const ColTitle = styled.h4`
  font-size: 0.8rem; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 1.25rem;
`;

const ColLink = styled.a`
  display: flex; align-items: center; gap: 0.4rem;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 0.7rem; cursor: pointer; transition: all 0.25s ease;
  &::before {
    content: ''; width: 0; height: 2px;
    background: ${({ theme }) => theme.colors.accent};
    transition: width 0.25s ease; border-radius: 2px;
  }
  &:hover {
    color: ${({ theme }) => theme.colors.accent};
    &::before { width: 10px; }
  }
`;

/* Status card */
const StatusCard = styled.div`
  background: ${({ theme }) => theme.colors.bgSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 16px; padding: 1.5rem;
  height: fit-content;
`;

const StatusTitle = styled.div`
  font-size: 0.8rem; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 1rem;
`;

const StatusBadge = styled.div`
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 0.8rem; color: #10b981;
  margin-bottom: 1rem;
`;

const GreenDot = styled.span`
  width: 7px; height: 7px; border-radius: 50%; background: #10b981;
  animation: ${pulse} 2s ease-in-out infinite;
`;

const EmailRow = styled.div`
  display: flex; align-items: center; gap: 0.4rem;
  font-size: 0.8rem; color: ${({ theme }) => theme.colors.textMuted};
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bg};
  margin-bottom: 1rem;
  word-break: break-all;
`;

const StatusBtn = styled.a`
  width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.4rem;
  padding: 0.65rem; border-radius: 10px; cursor: pointer; font-size: 0.82rem; font-weight: 600;
  background: ${({ theme }) => theme.colors.gradient};
  background-size: 200% 200%; animation: ${gradientShift} 5s ease infinite;
  color: #fff; transition: all 0.3s ease;
  &:hover { transform: translateY(-2px); box-shadow: 0 8px 24px ${({ theme }) => theme.colors.accentGlow}; }
`;

/* ── Bottom bar ── */
const BottomBar = styled.div`
  max-width: 1280px; margin: 0 auto;
  padding: 1.5rem 2rem;
  display: flex; justify-content: space-between; align-items: center;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  margin-top: 3rem;
  @media (max-width: 600px) { flex-direction: column; gap: 1rem; text-align: center; }
`;

const Copyright = styled.p`
  font-size: 0.82rem; color: ${({ theme }) => theme.colors.textMuted};
  display: flex; align-items: center; gap: 0.3rem;
  span { color: ${({ theme }) => theme.colors.accent}; }
`;

const BackToTop = styled.button`
  display: inline-flex; align-items: center; gap: 0.4rem;
  font-size: 0.82rem; color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer; transition: all 0.3s ease; padding: 0.45rem 1rem;
  border-radius: 999px; border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bgSecondary};
  &:hover {
    color: ${({ theme }) => theme.colors.accent};
    border-color: ${({ theme }) => theme.colors.accent};
    transform: translateY(-2px);
  }
`;

const navLinks = ['about', 'skills', 'projects', 'testimonials', 'contact'];

export default function Footer() {
  const { t, isRTL } = useLanguage();
  const year = new Date().getFullYear();
  const tickerItems = t('footer.ticker');

  const handleClick = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const navLabels = {
    about: t('nav.about'),
    skills: t('nav.skills'),
    projects: t('nav.projects'),
    testimonials: t('nav.testimonials'),
    contact: t('nav.contact'),
  };

  return (
    <FooterSection>
      {/* ── Big CTA ── */}
      <CtaArea>
        <BigBlob />
        <CtaEyebrow><PulseDot /> {t('contact.availableStatus') || 'Available for freelance'}</CtaEyebrow>
        <CtaTitle>
          <CtaLine1>{t('footer.ctaLine1') || "Ready to build"}</CtaLine1>
          <CtaLine2>{t('footer.ctaLine2') || "something amazing?"}</CtaLine2>
        </CtaTitle>
        <CtaSub>{t('footer.ctaSub') || "Have a project concept or an idea you'd like to explore? Let's connect and turn your vision into reality."}</CtaSub>
        <CtaButtons>
          <MagneticButton>
            <CtaBtn href="#contact" onClick={e => { e.preventDefault(); handleClick('contact'); }}>
              <FiMail /> {t('nav.letsTalk')}
            </CtaBtn>
          </MagneticButton>
          <MagneticButton>
            <CtaBtnOutline href="https://github.com/ElMehdiBekkous" target="_blank">
              <FaGithub /> GitHub
            </CtaBtnOutline>
          </MagneticButton>
        </CtaButtons>
      </CtaArea>

      {/* ── Ticker ── */}
      <TickerBar>
        <TickerTrack $isRTL={isRTL}>
          {Array.isArray(tickerItems) && [...tickerItems, ...tickerItems].map((text, i) => (
            <TickerText key={i}>{text}</TickerText>
          ))}
        </TickerTrack>
      </TickerBar>

      {/* ── Footer grid ── */}
      <FooterBody>
        <FooterInner>
          {/* Brand */}
          <BrandCol>
            <BrandRow>
              <LogoIcon width="36px" />
              <BrandName>{t('footer.brand')}</BrandName>
            </BrandRow>
            <BrandDesc>{t('footer.brandDesc')}</BrandDesc>
            <FooterSocials>
              <SocialBtn href="https://github.com/ElMehdiBekkous" target="_blank" title="GitHub"><FaGithub /></SocialBtn>
              <SocialBtn href="https://www.linkedin.com/in/el-mehdi-bekkous/" target="_blank" title="LinkedIn"><FaLinkedinIn /></SocialBtn>
              <SocialBtn href="https://www.instagram.com/mehdibekkousse/" target="_blank" title="Instagram"><FaInstagram /></SocialBtn>
            </FooterSocials>
          </BrandCol>

          {/* Quick links */}
          <div>
            <ColTitle>{t('footer.quickLinks')}</ColTitle>
            {navLinks.map(id => (
              <ColLink key={id} onClick={() => handleClick(id)}>{navLabels[id]}</ColLink>
            ))}
          </div>

          {/* Services */}
          <div>
            <ColTitle>{t('footer.services')}</ColTitle>
            <ColLink>{t('footer.webDev')}</ColLink>
            <ColLink>{t('footer.uiux')}</ColLink>
            <ColLink>{t('footer.apiDev')}</ColLink>
            <ColLink>{t('footer.consulting')}</ColLink>
          </div>

          {/* Status card */}
          <StatusCard>
            <StatusTitle>{t('footer.statusTitle') || 'Current Status'}</StatusTitle>
            <StatusBadge><GreenDot /> {t('contact.availableStatus') || 'Available for freelance'}</StatusBadge>
            <EmailRow><FiMail size={12} /> mehdi@example.com</EmailRow>
            <StatusBtn href="#contact" onClick={e => { e.preventDefault(); handleClick('contact'); }}>
              {t('nav.letsTalk')} →
            </StatusBtn>
          </StatusCard>
        </FooterInner>

        {/* Bottom bar */}
        <BottomBar>
          <Copyright>
            {t('footer.copyright').replace('{year}', year)} <span>♡</span>
          </Copyright>
          <BackToTop onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            {t('footer.backToTop')} <FiArrowUp />
          </BackToTop>
        </BottomBar>
      </FooterBody>
    </FooterSection>
  );
}
