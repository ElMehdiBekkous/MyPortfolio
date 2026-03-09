'use client';
import { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { localeList } from '@/i18n';
import { FiSun, FiMoon, FiMenu, FiX, FiGlobe, FiChevronDown } from 'react-icons/fi';
import LogoIcon from '@/components/Logo';

const scrollDown = keyframes`
  0% { transform: translateY(-100%); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
`;

const Nav = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: ${({ $scrolled }) => ($scrolled ? '0.75rem 0' : '1.25rem 0')};
  background: ${({ $scrolled, theme }) =>
    $scrolled ? theme.colors.navBg : 'transparent'};
  backdrop-filter: ${({ $scrolled }) => ($scrolled ? 'blur(20px) saturate(180%)' : 'none')};
  border-bottom: ${({ $scrolled, theme }) =>
    $scrolled ? `1px solid ${theme.colors.border}` : 'none'};
  transition: all 0.3s ease;
  animation: ${scrollDown} 0.6s ease;
`;

const NavContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const LogoLink = styled.a`
  display: flex;
  align-items: center;
  cursor: pointer;
  
  svg {
    transition: transform 0.3s ease;
  }
  
  &:hover svg {
    transform: scale(1.05);
  }
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    position: fixed;
    top: 0;
    ${({ $isRTL }) => ($isRTL ? 'left: 0;' : 'right: 0;')}
    width: 300px;
    height: 100vh;
    flex-direction: column;
    justify-content: center;
    gap: 2rem;
    background: ${({ theme }) => theme.colors.surface};
    border-${({ $isRTL }) => ($isRTL ? 'right' : 'left')}: 1px solid ${({ theme }) => theme.colors.border};
    transform: translateX(${({ $open, $isRTL }) => {
    if (!$open) return $isRTL ? '-100%' : '100%';
    return '0';
  }});
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 1001;
  }
`;

const NavLink = styled.a`
  font-size: 0.9rem;
  font-weight: 500;
  color: ${({ theme, $active }) =>
    $active ? theme.colors.accent : theme.colors.textSecondary};
  transition: color 0.3s ease;
  position: relative;
  cursor: pointer;

  &::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: ${({ $active }) => ($active ? '100%' : '0')};
    height: 2px;
    background: ${({ theme }) => theme.colors.accent};
    transition: width 0.3s ease;
  }

  &:hover {
    color: ${({ theme }) => theme.colors.accent};
    &::after { width: 100%; }
  }
`;

const NavActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const IconBtn = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.bgSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.accent};
  font-size: 1.1rem;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
    transform: rotate(180deg);
    box-shadow: 0 0 20px ${({ theme }) => theme.colors.accentGlow};
  }
`;

const LangDropdown = styled.div`
  position: relative;
`;

const LangBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem 0.75rem;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.bgSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
  }

  svg {
    font-size: 0.75rem;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const LangMenu = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  ${({ $isRTL }) => ($isRTL ? 'left: 0;' : 'right: 0;')}
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 0.5rem;
  min-width: 150px;
  box-shadow: ${({ theme }) => theme.colors.shadowLg};
  display: ${({ $open }) => ($open ? 'block' : 'none')};
  z-index: 100;
`;

const LangMenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.6rem 0.75rem;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.accentGlow : 'transparent'};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.accent : theme.colors.text};
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: start;

  &:hover {
    background: ${({ theme }) => theme.colors.bgSecondary};
  }
`;

const MenuButton = styled.button`
  display: none;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  color: ${({ theme }) => theme.colors.text};
  z-index: 1002;
  cursor: pointer;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: flex;
  }
`;

const MobileOverlay = styled.div`
  display: none;
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: block;
    position: fixed;
    inset: 0;
    background: ${({ theme }) => theme.colors.overlay};
    opacity: ${({ $open }) => ($open ? 1 : 0)};
    pointer-events: ${({ $open }) => ($open ? 'all' : 'none')};
    transition: opacity 0.3s ease;
    z-index: 1000;
  }
`;

const ContactBtn = styled.a`
  padding: 0.6rem 1.5rem;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.gradient};
  color: #fff;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px ${({ theme }) => theme.colors.accentGlow};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }
`;

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme();
  const { locale, setLocale, t, isRTL } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [active, setActive] = useState('');
  const langRef = useRef(null);

  const links = [
    { label: t('nav.about'), href: '#about' },
    { label: t('nav.skills'), href: '#skills' },
    { label: t('nav.projects'), href: '#projects' },
    { label: t('nav.testimonials'), href: '#testimonials' },
    { label: t('nav.contact'), href: '#contact' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      const sections = ['about', 'skills', 'projects', 'testimonials', 'contact'];
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && window.scrollY >= el.offsetTop - 200) {
          setActive(sections[i]);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClick = (href) => {
    setMenuOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const currentLocale = localeList.find(l => l.code === locale);

  return (
    <>
      <Nav $scrolled={scrolled}>
        <NavContainer>
          <LogoLink href="#" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <LogoIcon width="64px" />
          </LogoLink>

          <NavLinks $open={menuOpen} $isRTL={isRTL}>
            {links.map(link => (
              <NavLink
                key={link.href}
                $active={active === link.href.slice(1)}
                onClick={() => handleClick(link.href)}
              >
                {link.label}
              </NavLink>
            ))}
          </NavLinks>

          <NavActions>
            <LangDropdown ref={langRef}>
              <LangBtn onClick={() => setLangOpen(!langOpen)}>
                <img src={currentLocale?.flag} alt={currentLocale?.name} style={{ width: '20px', height: '14px', borderRadius: '2px', objectFit: 'cover' }} /> <FiChevronDown />
              </LangBtn>
              <LangMenu $open={langOpen} $isRTL={isRTL}>
                {localeList.map(l => (
                  <LangMenuItem
                    key={l.code}
                    $active={locale === l.code}
                    onClick={() => { setLocale(l.code); setLangOpen(false); }}
                  >
                    <img src={l.flag} alt={l.name} style={{ width: '20px', height: '14px', borderRadius: '2px', objectFit: 'cover' }} /> {l.name}
                  </LangMenuItem>
                ))}
              </LangMenu>
            </LangDropdown>

            <IconBtn onClick={toggleTheme} aria-label="Toggle theme">
              {isDark ? <FiSun /> : <FiMoon />}
            </IconBtn>

            <ContactBtn href="#contact" onClick={(e) => { e.preventDefault(); handleClick('#contact'); }}>
              {t('nav.letsTalk')}
            </ContactBtn>

            <MenuButton onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
              {menuOpen ? <FiX /> : <FiMenu />}
            </MenuButton>
          </NavActions>
        </NavContainer>
      </Nav>
      <MobileOverlay $open={menuOpen} onClick={() => setMenuOpen(false)} />
    </>
  );
}
