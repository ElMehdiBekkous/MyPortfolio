'use client';
import { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import SectionWrapper from '@/components/SectionWrapper';
import { useLanguage } from '@/context/LanguageContext';
import { FiMail, FiMapPin, FiClock, FiSend, FiCopy, FiCheck } from 'react-icons/fi';
import { FaGithub, FaLinkedinIn, FaTwitter, FaDribbble } from 'react-icons/fa';

const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 currentColor; }
  50% { box-shadow: 0 0 0 8px transparent; }
`;

const ContactGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 3rem;
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) { grid-template-columns: 1fr; }
`;

const ContactInfo = styled.div``;

const InfoTitle = styled.h3`
  font-size: 1.5rem; margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.text};
`;

const InfoText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.8; margin-bottom: 2rem;
`;

const InfoCards = styled.div`display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem;`;

const InfoCard = styled.div`
  display: flex; align-items: center; gap: 1rem; padding: 1.25rem;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.bgSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  transition: all 0.3s ease; cursor: pointer;
  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
    transform: translateX(${({ $isRTL }) => ($isRTL ? '-8px' : '8px')});
  }
`;

const InfoIcon = styled.div`
  width: 44px; height: 44px; border-radius: ${({ theme }) => theme.radii.md};
  display: flex; align-items: center; justify-content: center;
  background: ${({ theme }) => theme.colors.gradientSubtle};
  color: ${({ theme }) => theme.colors.accent}; font-size: 1.1rem; flex-shrink: 0;
`;

const InfoLabel = styled.div`font-size: ${({ theme }) => theme.fontSizes.sm}; color: ${({ theme }) => theme.colors.textMuted}; margin-bottom: 0.1rem;`;
const InfoValue = styled.div`font-weight: 500; color: ${({ theme }) => theme.colors.text}; font-size: 0.95rem;`;

const Socials = styled.div`display: flex; gap: 0.75rem;`;

const SocialBtn = styled.a`
  width: 44px; height: 44px; border-radius: ${({ theme }) => theme.radii.md};
  display: flex; align-items: center; justify-content: center;
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 1.1rem; transition: all 0.3s ease; cursor: pointer;
  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
    color: ${({ theme }) => theme.colors.accent};
    transform: translateY(-3px);
    box-shadow: 0 8px 20px ${({ theme }) => theme.colors.accentGlow};
  }
`;

const Form = styled.form`
  background: ${({ theme }) => theme.colors.glass};
  backdrop-filter: blur(20px);
  border: 1px solid ${({ theme }) => theme.colors.glassBorder};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: 2.5rem;
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) { padding: 1.5rem; }
`;

const FormGrid = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) { grid-template-columns: 1fr; }
`;

const FloatLabel = styled.div`
  position: relative;
  ${({ $full }) => $full && 'grid-column: 1 / -1;'}
  margin-bottom: 0.25rem;
`;

const Input = styled.input`
  width: 100%; padding: 1rem 1rem 0.75rem;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bgSecondary};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.95rem;
  transition: border-color 0.3s ease;
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.accent};
    & + label { color: ${({ theme }) => theme.colors.accent}; transform: translateY(-1.6rem) scale(0.8); }
  }
  &:not(:placeholder-shown) + label { transform: translateY(-1.6rem) scale(0.8); }
`;

const Textarea = styled.textarea`
  width: 100%; padding: 1rem; min-height: 140px; resize: vertical;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bgSecondary};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.95rem; font-family: inherit;
  transition: border-color 0.3s ease;
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.accent};
    & + label { color: ${({ theme }) => theme.colors.accent}; transform: translateY(-1.6rem) scale(0.8); }
  }
  &:not(:placeholder-shown) + label { transform: translateY(-1.6rem) scale(0.8); }
`;

const FloatLabelText = styled.label`
  position: absolute;
  top: 1rem;
  ${({ $isRTL }) => ($isRTL ? 'right: 1rem;' : 'left: 1rem;')}
  font-size: 0.9rem; color: ${({ theme }) => theme.colors.textMuted};
  pointer-events: none; transition: all 0.2s ease;
  transform-origin: ${({ $isRTL }) => ($isRTL ? 'right' : 'left')};
`;

const SubmitBtn = styled.button`
  width: 100%; padding: 1rem; margin-top: 1rem;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.gradient};
  color: #fff; font-size: 1rem; font-weight: 600;
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  cursor: pointer; transition: all 0.3s ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px ${({ theme }) => theme.colors.accentGlow};
  }
  &:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
`;

const CopyBtn = styled.button`
  display: inline-flex; align-items: center; gap: 0.3rem;
  font-size: 0.75rem; color: ${({ theme }) => theme.colors.accent};
  cursor: pointer; padding: 0.2rem 0.5rem;
  border-radius: ${({ theme }) => theme.radii.sm};
  transition: all 0.2s ease;
  &:hover { background: ${({ theme }) => theme.colors.accentGlow}; }
`;

export default function Contact() {
  const { t, isRTL } = useLanguage();
  const [status, setStatus] = useState('idle');
  const [copied, setCopied] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('sending');
    setTimeout(() => {
      setStatus('sent');
      setTimeout(() => setStatus('idle'), 3000);
    }, 1500);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText('mehdi@example.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <SectionWrapper id="contact" label={t('contact.label')} title={t('contact.title')} description={t('contact.description')}>
      <ContactGrid>
        <ContactInfo>
          <InfoTitle>{t('contact.getInTouch')}</InfoTitle>
          <InfoText>{t('contact.intro')}</InfoText>

          <InfoCards>
            <InfoCard onClick={handleCopy} $isRTL={isRTL}>
              <InfoIcon><FiMail /></InfoIcon>
              <div>
                <InfoLabel>{t('contact.email')}</InfoLabel>
                <InfoValue>
                  mehdi@example.com
                  <CopyBtn>{copied ? <><FiCheck /> {t('contact.copied')}</> : <FiCopy />}</CopyBtn>
                </InfoValue>
              </div>
            </InfoCard>
            <InfoCard $isRTL={isRTL}>
              <InfoIcon><FiMapPin /></InfoIcon>
              <div><InfoLabel>{t('contact.location')}</InfoLabel><InfoValue>{t('contact.locationValue')}</InfoValue></div>
            </InfoCard>
            <InfoCard $isRTL={isRTL}>
              <InfoIcon><FiClock /></InfoIcon>
              <div><InfoLabel>{t('contact.availability')}</InfoLabel><InfoValue style={{ color: '#4CAF50' }}>{t('contact.availabilityValue')}</InfoValue></div>
            </InfoCard>
          </InfoCards>

          <Socials>
            <SocialBtn href="https://github.com" target="_blank"><FaGithub /></SocialBtn>
            <SocialBtn href="https://linkedin.com" target="_blank"><FaLinkedinIn /></SocialBtn>
            <SocialBtn href="https://twitter.com" target="_blank"><FaTwitter /></SocialBtn>
            <SocialBtn href="https://dribbble.com" target="_blank"><FaDribbble /></SocialBtn>
          </Socials>
        </ContactInfo>

        <Form onSubmit={handleSubmit}>
          <FormGrid>
            <FloatLabel><Input type="text" placeholder=" " required /><FloatLabelText $isRTL={isRTL}>{t('contact.formName')}</FloatLabelText></FloatLabel>
            <FloatLabel><Input type="email" placeholder=" " required /><FloatLabelText $isRTL={isRTL}>{t('contact.formEmail')}</FloatLabelText></FloatLabel>
            <FloatLabel $full><Input type="text" placeholder=" " /><FloatLabelText $isRTL={isRTL}>{t('contact.formSubject')}</FloatLabelText></FloatLabel>
            <FloatLabel $full><Textarea placeholder=" " required /><FloatLabelText $isRTL={isRTL}>{t('contact.formMessage')}</FloatLabelText></FloatLabel>
          </FormGrid>
          <SubmitBtn type="submit" disabled={status === 'sending'}>
            {status === 'sending' ? t('contact.sending') : status === 'sent' ? <><FiCheck /> {t('contact.sent')}</> : <><FiSend /> {t('contact.send')}</>}
          </SubmitBtn>
        </Form>
      </ContactGrid>
    </SectionWrapper>
  );
}
