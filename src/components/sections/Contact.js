'use client';
import { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useLanguage } from '@/context/LanguageContext';
import { FaGithub, FaLinkedinIn, FaInstagram } from 'react-icons/fa';

// Background SVGs
const NoiseOverlay = styled.div`
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 0;
  opacity: 0.4;
`;

const GridBg = styled.div`
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(${({ theme }) => theme.colors.accent}08 1px, transparent 1px),
    linear-gradient(${({ $isRTL }) => ($isRTL ? '-90deg' : '90deg')}, ${({ theme }) => theme.colors.accent}08 1px, transparent 1px);
  background-size: 60px 60px;
  pointer-events: none;
  z-index: 0;
`;

const orbDrift = keyframes`
  from { transform: translate(0, 0); }
  to { transform: translate(30px, 20px); }
`;

const Orb = styled.div`
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  pointer-events: none;
  z-index: 0;
  animation: ${orbDrift} 12s ease-in-out infinite alternate;
`;

const Orb1 = styled(Orb)`
  width: 500px; height: 500px; background: rgba(124,58,237,0.12); top: -100px; right: -100px;
`;
const Orb2 = styled(Orb)`
  width: 400px; height: 400px; background: rgba(6,182,212,0.08); bottom: -80px; left: -80px; animation-delay: -6s;
`;
const Orb3 = styled(Orb)`
  width: 300px; height: 300px; background: rgba(244,114,182,0.06); top: 50%; left: 50%; transform: translate(-50%,-50%); animation-delay: -3s;
`;

const ContactSection = styled.section`
  position: relative;
  overflow-y: visible;
  overflow-x: clip;
  min-height: 100vh;
  display: flex;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.bg};
`;

const ContactContainer = styled.div`
  position: relative;
  z-index: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 100px 40px;
  @media (max-width: 768px) { padding: 60px 20px; }
`;

// animations
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Eyebrow
const SectionEyebrow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  opacity: 0;
  animation: ${fadeUp} 0.6s ease forwards;
`;
const EyebrowLine = styled.div`
  width: 32px; height: 1px;
  background: ${({ theme }) => theme.colors.accentLight || '#06b6d4'};
`;
const EyebrowText = styled.span`
  font-family: ${({ theme }) => theme.fonts?.mono || "'DM Mono', monospace"};
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.accentLight || '#06b6d4'};
`;

const SectionTitle = styled.h1`
  font-family: ${({ theme }) => theme.fonts?.primary || "'Syne', sans-serif"};
  font-size: clamp(52px, 8vw, 96px);
  font-weight: 800;
  line-height: 0.95;
  letter-spacing: -0.03em;
  margin-bottom: 16px;
  opacity: 0;
  animation: ${fadeUp} 0.6s ease 0.1s forwards;
`;
const TitleLine1 = styled.div`
  color: ${({ theme }) => theme.colors.text};
`;
const TitleLine2 = styled.div`
  -webkit-text-stroke: 1.5px ${({ theme }) => theme.colors.border};
  color: transparent;
  ${({ $accent, theme }) => $accent && `
    background: linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentLight || '#06b6d4'});
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    -webkit-text-stroke: 0;
  `}
`;

const SectionSub = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 60px;
  letter-spacing: 0.02em;
  opacity: 0;
  animation: ${fadeUp} 0.6s ease 0.2s forwards;
`;

const ContactLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 48px;
  align-items: start;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const LeftPanel = styled.div`
  opacity: 0;
  animation: ${fadeUp} 0.6s ease 0.3s forwards;
`;

const pulseGreen = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.6); }
  50% { box-shadow: 0 0 0 6px rgba(16,185,129,0); }
`;
const StatusBadge = styled.div`
  display: inline-flex; align-items: center; gap: 8px;
  background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2);
  border-radius: 999px; padding: 6px 14px; font-size: 11px;
  letter-spacing: 0.08em; color: #10b981; margin-bottom: 32px;
`;
const StatusDot = styled.div`
  width: 6px; height: 6px; border-radius: 50%; background: #10b981;
  animation: ${pulseGreen} 2s ease-in-out infinite;
`;

const ContactInfoCards = styled.div`
  display: flex; flex-direction: column; gap: 12px; margin-bottom: 36px;
`;
const InfoCard = styled.div`
  background: ${({ theme }) => theme.colors.bgSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 16px; padding: 18px 20px; display: flex; align-items: center; gap: 16px;
  cursor: pointer; transition: all 0.25s ease; position: relative; overflow: hidden;
  &::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, transparent, ${({ theme }) => theme.colors.accent}15);
    opacity: 0; transition: opacity 0.25s;
  }
  &:hover {
    border-color: ${({ theme }) => theme.colors.border};
    transform: translateX(${({ $isRTL }) => ($isRTL ? '-4px' : '4px')});
    &::before { opacity: 1; }
  }
`;
const InfoCardIcon = styled.div`
  width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; font-size: 16px;
  background: ${({ $color }) => `${$color}25`};
  color: ${({ $color }) => $color};
`;
const InfoCardContent = styled.div`flex: 1;`;
const InfoCardLabel = styled.div`
  font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: ${({ theme }) => theme.colors.textMuted}; margin-bottom: 3px;
`;
const InfoCardValue = styled.div`
  font-size: 13px; color: ${({ theme }) => theme.colors.text}; font-weight: 400;
  display: flex; align-items: center; gap: 8px;
`;
const CopyHint = styled.span`
  font-size: 10px; color: ${({ theme }) => theme.colors.textMuted}; opacity: 0; transition: opacity 0.2s;
  ${InfoCard}:hover & { opacity: 1; }
`;

const SocialsLabel = styled.div`
  font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: ${({ theme }) => theme.colors.textMuted}; margin-bottom: 14px;
`;
const SocialsRow = styled.div`
  display: flex; gap: 10px; flex-wrap: wrap;
`;
const SocialBtn = styled.a`
  width: 44px; height: 44px; border-radius: 12px; background: ${({ theme }) => theme.colors.bgSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s ease; text-decoration: none; color: ${({ theme }) => theme.colors.textMuted};
  font-size: 18px; position: relative; overflow: hidden;
  &::after {
    content: ''; position: absolute; inset: 0; border-radius: 12px;
    background: linear-gradient(135deg, ${({ theme }) => theme.colors.accent}, ${({ theme }) => theme.colors.accentLight || '#06b6d4'});
    opacity: 0; transition: opacity 0.2s;
  }
  &:hover {
    color: white; border-color: transparent; transform: translateY(-3px);
    &::after { opacity: 1; }
  }
  svg { position: relative; z-index: 1; }
`;

const FormPanel = styled.div`
  background: ${({ theme }) => theme.colors.bgSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 24px; padding: 36px; position: relative; overflow: hidden;
  opacity: 0; animation: ${fadeUp} 0.6s ease 0.4s forwards;
  
  &::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, ${({ theme }) => theme.colors.accent}, ${({ theme }) => theme.colors.accentLight || '#06b6d4'}, transparent);
    opacity: 0.6;
  }
  @media (max-width: 480px) { padding: 24px; }
`;

const FormHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px;
`;
const FormTitle = styled.div`
  font-family: ${({ theme }) => theme.fonts?.primary || "'Syne', sans-serif"}; font-size: 18px; font-weight: 700; color: ${({ theme }) => theme.colors.text};
`;
const FormCounter = styled.div`
  font-size: 11px; color: ${({ theme }) => theme.colors.textMuted}; font-variant-numeric: tabular-nums;
`;

const ChipsRow = styled.div`
  display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px;
`;
const Chip = styled.button`
  padding: 6px 14px; border-radius: 999px; border: 1px solid ${({ theme, $active }) => $active ? theme.colors.accent : theme.colors.border};
  font-size: 11px; font-family: ${({ theme }) => theme.fonts?.mono || "monospace"};
  color: ${({ theme, $active }) => $active ? theme.colors.text : theme.colors.textMuted};
  background: ${({ theme, $active }) => $active ? `${theme.colors.accent}20` : 'transparent'};
  cursor: pointer; transition: all 0.2s ease; letter-spacing: 0.02em;
  &:hover {
    border-color: ${({ theme }) => theme.colors.accent}; color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.accent}15;
  }
`;

const FormGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;
  @media (max-width: 640px) { grid-template-columns: 1fr; }
`;
const FieldGroup = styled.div`
  display: flex; flex-direction: column; gap: 6px;
  ${({ $full }) => $full && 'grid-column: 1 / -1;'}
`;
const FieldLabel = styled.label`
  font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: ${({ theme }) => theme.colors.textMuted};
  padding: 0 2px;
`;
const FieldInput = styled.input`
  background: ${({ theme }) => theme.colors.inputBg || theme.colors.bg}; border: 1px solid ${({ $error, theme }) => $error ? '#ef4444' : theme.colors.border};
  border-radius: 12px; padding: 14px 16px; font-family: inherit; font-size: 13px; color: ${({ theme }) => theme.colors.text};
  outline: none; transition: all 0.2s ease; width: 100%;
  &::placeholder { color: ${({ theme }) => theme.colors.textMuted}; opacity: 0.5; }
  &:focus {
    border-color: ${({ theme }) => theme.colors.accent}; background: ${({ theme }) => theme.colors.accent}0A;
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.accent}15;
  }
`;
const FieldTextarea = styled.textarea`
  background: ${({ theme }) => theme.colors.inputBg || theme.colors.bg}; border: 1px solid ${({ $error, theme }) => $error ? '#ef4444' : theme.colors.border};
  border-radius: 12px; padding: 14px 16px; font-family: inherit; font-size: 13px; color: ${({ theme }) => theme.colors.text};
  outline: none; transition: all 0.2s ease; width: 100%; resize: vertical; min-height: 130px;
  &::placeholder { color: ${({ theme }) => theme.colors.textMuted}; opacity: 0.5; }
  &:focus {
    border-color: ${({ theme }) => theme.colors.accent}; background: ${({ theme }) => theme.colors.accent}0A;
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.accent}15;
  }
`;

const CharCount = styled.div`
  font-size: 10px; color: ${({ $count, theme }) => $count > 480 ? '#ef4444' : $count > 400 ? '#f59e0b' : theme.colors.textMuted};
  text-align: ${({ $isRTL }) => ($isRTL ? 'left' : 'right')}; margin-top: 4px; transition: color 0.2s;
`;

const gradientShift = keyframes`
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
`;
const SubmitBtn = styled.button`
  width: 100%; padding: 16px; border-radius: 14px; border: none; cursor: pointer;
  font-family: ${({ theme }) => theme.fonts?.primary || "'Syne', sans-serif"}; font-size: 15px; font-weight: 700;
  letter-spacing: 0.04em; color: white; position: relative; overflow: hidden; transition: transform 0.2s ease;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.accent} 0%, #9333ea 40%, ${({ theme }) => theme.colors.accentLight || '#06b6d4'} 100%);
  background-size: 200% 200%; animation: ${gradientShift} 4s ease infinite;
  &::before {
    content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
  }
  &:hover { transform: translateY(-2px); }
  &:active { transform: translateY(0); }
  &:disabled { opacity: 0.7; cursor: not-allowed; transform: none; animation: none; }
`;
const SubmitBtnInner = styled.div`
  position: relative; z-index: 1; display: flex; align-items: center; justify-content: center; gap: 10px;
  svg { width: 18px; height: 18px; transition: transform 0.3s ease; }
  ${SubmitBtn}:hover & svg { transform: translate(${({ $isRTL }) => ($isRTL ? '-3px' : '3px')}, -3px); }
`;

const FormFooter = styled.div`
  display: flex; align-items: center; justify-content: space-between; margin-top: 16px;
`;
const FormFootnote = styled.div`
  font-size: 10px; color: ${({ theme }) => theme.colors.textMuted}; display: flex; align-items: center; gap: 6px;
  svg { width: 10px; opacity: 0.5; }
`;

const scaleIn = keyframes`
  from { transform: scale(0); }
  to { transform: scale(1); }
`;
const SuccessOverlay = styled.div`
  position: absolute; inset: 0; background: ${({ theme }) => theme.colors.bgSecondary};
  border-radius: 24px; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 16px; opacity: ${({ $show }) => $show ? 1 : 0}; pointer-events: ${({ $show }) => $show ? 'all' : 'none'};
  transition: opacity 0.4s ease; z-index: 10;
`;
const SuccessIcon = styled.div`
  width: 64px; height: 64px; border-radius: 50%; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3);
  display: flex; align-items: center; justify-content: center; font-size: 28px; color: #10b981;
  animation: ${({ $show }) => $show ? scaleIn : 'none'} 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards;
`;
const SuccessTitle = styled.div`
  font-family: ${({ theme }) => theme.fonts?.primary || "'Syne', sans-serif"}; font-size: 22px; font-weight: 800; color: ${({ theme }) => theme.colors.text};
`;
const SuccessSub = styled.div`
  font-size: 12px; color: ${({ theme }) => theme.colors.textMuted}; text-align: center; max-width: 240px; line-height: 1.7;
`;

export default function Contact() {
  const { t, isRTL } = useLanguage();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [selectedChip, setSelectedChip] = useState(null);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle, sending, success
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Compute step
  let step = 1;
  if (selectedChip) step = 2;
  if (name && email) step = 3;

  const topics = t('contact.topics', { returnObjects: true }) || ['Freelance project', 'Collaboration', 'Job opportunity', 'Just saying hi 👋'];

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!name.trim()) newErrors.name = true;
    if (!email.trim()) newErrors.email = true;
    if (!message.trim()) newErrors.message = true;
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTimeout(() => setErrors({}), 1500);
      return;
    }
    
    setStatus('sending');
    setTimeout(() => {
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        setName('');
        setEmail('');
        setMessage('');
        setSelectedChip(null);
      }, 4000);
    }, 1500);
  };

  const copyEmail = () => {
    navigator.clipboard.writeText('mehdi@example.com').catch(() => {});
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <ContactSection id="contact">
      <NoiseOverlay />
      <GridBg $isRTL={isRTL} />
      <Orb1 />
      <Orb2 />
      <Orb3 />

      <ContactContainer>
        <SectionEyebrow>
          <EyebrowLine />
          <EyebrowText>{t('contact.eyebrow') || 'Contact'}</EyebrowText>
        </SectionEyebrow>

        <SectionTitle>
          <TitleLine1>{t('contact.title1') || "Let's build"}</TitleLine1>
          <TitleLine2 $accent>{t('contact.titleAccent') || "something"}</TitleLine2>
          <TitleLine2>{t('contact.title2') || "great."}</TitleLine2>
        </SectionTitle>

        <SectionSub>{t('contact.subtitle') || "Have a project in mind? I'd love to hear about it."}</SectionSub>

        <ContactLayout>
          
          <LeftPanel>
            <StatusBadge>
              <StatusDot />
              {t('contact.availableStatus') || "Available for freelance"}
            </StatusBadge>

            <ContactInfoCards>
              <InfoCard onClick={copyEmail} $isRTL={isRTL}>
                <InfoCardIcon $color="#a78bfa">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </InfoCardIcon>
                <InfoCardContent>
                  <InfoCardLabel>{t('contact.email')}</InfoCardLabel>
                  <InfoCardValue>
                    {copiedEmail ? <span style={{ color: '#10b981' }}>{t('contact.copiedSucc') || 'Copied ✓'}</span> : 'mehdi@example.com'} 
                    {!copiedEmail && <CopyHint>{t('contact.copyHint') || 'click to copy'}</CopyHint>}
                  </InfoCardValue>
                </InfoCardContent>
              </InfoCard>

              <InfoCard $isRTL={isRTL}>
                <InfoCardIcon $color="#06b6d4">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </InfoCardIcon>
                <InfoCardContent>
                  <InfoCardLabel>{t('contact.location')}</InfoCardLabel>
                  <InfoCardValue>{t('contact.locationValue') || 'Morocco, MA'}</InfoCardValue>
                </InfoCardContent>
              </InfoCard>
            </ContactInfoCards>

            <SocialsLabel>{t('contact.findMeOn') || 'Find me on'}</SocialsLabel>
            <SocialsRow>
              <SocialBtn href="https://github.com/ElMehdiBekkous" target="_blank" title="GitHub">
                <FaGithub />
              </SocialBtn>
              <SocialBtn href="https://www.linkedin.com/in/el-mehdi-bekkous/" target="_blank" title="LinkedIn">
                <FaLinkedinIn />
              </SocialBtn>
              <SocialBtn href="https://www.instagram.com/mehdibekkousse/" target="_blank" title="Instagram">
                <FaInstagram />
              </SocialBtn>
            </SocialsRow>
          </LeftPanel>

          <FormPanel>
            <SuccessOverlay $show={status === 'success'}>
              <SuccessIcon $show={status === 'success'}>✓</SuccessIcon>
              <SuccessTitle>{t('contact.successTitle') || 'Message sent!'}</SuccessTitle>
              <SuccessSub>{t('contact.successSub') || "Thanks for reaching out. I'll get back to you within 24 hours."}</SuccessSub>
            </SuccessOverlay>

            <FormHeader>
              <FormTitle>{t('contact.formTitle') || 'Send a message'}</FormTitle>
              <FormCounter>
                {t('contact.step') || 'Step'} {step} {t('contact.of') || 'of'} 3
              </FormCounter>
            </FormHeader>

            <ChipsRow>
              {Array.isArray(topics) && topics.map((topic, i) => (
                <Chip key={i} $active={selectedChip === topic} onClick={() => setSelectedChip(topic)} type="button">
                  {topic}
                </Chip>
              ))}
            </ChipsRow>

            <FormGrid>
              <FieldGroup>
                <FieldLabel>{t('contact.formName') || 'Name'}</FieldLabel>
                <FieldInput 
                  type="text" 
                  placeholder={t('contact.namePlaceholder') || "Your name"}
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  $error={errors.name}
                />
              </FieldGroup>
              <FieldGroup>
                <FieldLabel>{t('contact.formEmail') || 'Email'}</FieldLabel>
                <FieldInput 
                  type="email" 
                  placeholder={t('contact.emailPlaceholder') || "your@email.com"}
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  $error={errors.email}
                />
              </FieldGroup>
              <FieldGroup $full>
                <FieldLabel>{t('contact.formMessage') || 'Message'}</FieldLabel>
                <FieldTextarea 
                  placeholder={t('contact.msgPlaceholder') || "Tell me about your project..."}
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)} 
                  maxLength={500}
                  $error={errors.message}
                />
                <CharCount $count={message.length} $isRTL={isRTL}>
                  {message.length} / 500
                </CharCount>
              </FieldGroup>
            </FormGrid>

            <SubmitBtn onClick={handleSubmit} disabled={status === 'sending'}>
              <SubmitBtnInner $isRTL={isRTL}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
                {status === 'sending' ? t('contact.sending') : t('contact.send') || 'Send Message'}
              </SubmitBtnInner>
            </SubmitBtn>

            <FormFooter>
              <FormFootnote>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0110 0v4"></path>
                </svg>
                {t('contact.footnote') || 'Your info is safe with me. No spam, ever.'}
              </FormFootnote>
            </FormFooter>
          </FormPanel>

        </ContactLayout>
      </ContactContainer>
    </ContactSection>
  );
}
