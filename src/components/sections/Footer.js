'use client';
import styled, { keyframes } from 'styled-components';
import { useLanguage } from '@/context/LanguageContext';
import { FaGithub, FaLinkedinIn, FaTwitter } from 'react-icons/fa';
import { FiArrowUp } from 'react-icons/fi';
import LogoIcon from '@/components/Logo';

const ticker = keyframes`
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
`;

const tickerRTL = keyframes`
  from { transform: translateX(0); }
  to { transform: translateX(50%); }
`;

const FooterSection = styled.footer`
  position: relative;
  padding: 0;
  overflow: hidden;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const TickerBar = styled.div`
  background: ${({ theme }) => theme.colors.gradient};
  padding: 1rem 0;
  overflow: hidden;
`;

const TickerTrack = styled.div`
  display: flex; gap: 3rem; width: max-content;
  animation: ${({ $isRTL }) => ($isRTL ? tickerRTL : ticker)} 20s linear infinite;
`;

const TickerText = styled.span`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: clamp(1rem, 2vw, 1.5rem);
  font-weight: 700; white-space: nowrap;
  color: rgba(255, 255, 255, 0.9);
`;

const FooterContent = styled.div`
  max-width: 1200px; margin: 0 auto; padding: 4rem 2rem 2rem;
`;

const FooterGrid = styled.div`
  display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 3rem;
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) { grid-template-columns: 1fr; gap: 2rem; }
`;

const BrandCol = styled.div``;

const BrandName = styled.h3`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 1.5rem; margin-bottom: 0.75rem;
  background: ${({ theme }) => theme.colors.gradientText};
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
`;

const BrandDesc = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.8; max-width: 320px; margin-bottom: 1.5rem;
`;

const FooterSocials = styled.div`display: flex; gap: 0.75rem;`;

const SocialIcon = styled.a`
  width: 38px; height: 38px; border-radius: ${({ theme }) => theme.radii.md};
  display: flex; align-items: center; justify-content: center;
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.95rem; transition: all 0.3s ease; cursor: pointer;
  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
    color: ${({ theme }) => theme.colors.accent};
    transform: translateY(-2px);
  }
`;

const ColTitle = styled.h4`
  font-size: 1rem; font-weight: 600; color: ${({ theme }) => theme.colors.text};
  margin-bottom: 1.25rem;
`;

const ColLink = styled.a`
  display: block; font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted}; margin-bottom: 0.75rem;
  transition: color 0.3s ease; cursor: pointer;
  &:hover { color: ${({ theme }) => theme.colors.accent}; }
`;

const BottomBar = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  padding: 1.5rem 2rem; max-width: 1200px; margin: 0 auto;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column; gap: 1rem; text-align: center;
  }
`;

const Copyright = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const BackToTop = styled.button`
  display: inline-flex; align-items: center; gap: 0.4rem;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.accent};
  cursor: pointer; transition: all 0.3s ease;
  &:hover { transform: translateY(-2px); }
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
      <TickerBar>
        <TickerTrack $isRTL={isRTL}>
          {Array.isArray(tickerItems) && [...tickerItems, ...tickerItems].map((text, i) => (
            <TickerText key={i}>{text}</TickerText>
          ))}
        </TickerTrack>
      </TickerBar>

      <FooterContent>
        <FooterGrid>
          <BrandCol>
            <BrandName>
              <LogoIcon width="40px" />
              {t('footer.brand')}
            </BrandName>
            <BrandDesc>{t('footer.brandDesc')}</BrandDesc>
            <FooterSocials>
              <SocialIcon href="https://github.com" target="_blank"><FaGithub /></SocialIcon>
              <SocialIcon href="https://linkedin.com" target="_blank"><FaLinkedinIn /></SocialIcon>
              <SocialIcon href="https://twitter.com" target="_blank"><FaTwitter /></SocialIcon>
            </FooterSocials>
          </BrandCol>

          <div>
            <ColTitle>{t('footer.quickLinks')}</ColTitle>
            {navLinks.map(id => (
              <ColLink key={id} onClick={() => handleClick(id)}>
                {navLabels[id]}
              </ColLink>
            ))}
          </div>

          <div>
            <ColTitle>{t('footer.services')}</ColTitle>
            <ColLink>{t('footer.webDev')}</ColLink>
            <ColLink>{t('footer.uiux')}</ColLink>
            <ColLink>{t('footer.apiDev')}</ColLink>
            <ColLink>{t('footer.consulting')}</ColLink>
          </div>
        </FooterGrid>
      </FooterContent>

      <BottomBar>
        <Copyright>
          {t('footer.copyright').replace('{year}', year)} ♡
        </Copyright>
        <BackToTop onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          {t('footer.backToTop')} <FiArrowUp />
        </BackToTop>
      </BottomBar>
    </FooterSection>
  );
}
