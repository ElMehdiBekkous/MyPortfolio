'use client';
import { useRef, useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import SectionWrapper from '@/components/SectionWrapper';
import { useLanguage } from '@/context/LanguageContext';
import { skillCategories } from '@/data/skills';

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const BentoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) { grid-template-columns: 1fr; }
`;

const CategoryCard = styled.div`
  background: ${({ theme }) => theme.colors.glass};
  backdrop-filter: blur(20px);
  border: 1px solid ${({ theme }) => theme.colors.glassBorder};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: 2rem;
  transition: all 0.4s ease;
  position: relative;
  overflow: hidden;
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: ${({ theme }) => theme.colors.gradient};
    opacity: 0;
    transition: opacity 0.4s ease;
  }
  &:hover {
    transform: translateY(-6px);
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: 0 20px 40px ${({ theme }) => theme.colors.accentGlow};
    &::before { opacity: 0.03; }
  }
`;

const CardContent = styled.div`position: relative; z-index: 1;`;

const CategoryHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const CategoryIcon = styled.span`
  font-size: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.gradientSubtle};
  border: 1px solid ${({ theme }) => theme.colors.border};
  flex-shrink: 0;
`;

const CategoryTitle = styled.h3`
  font-size: 1.3rem;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 0.25rem;
`;

const CategoryDesc = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const SkillsList = styled.div`display: flex; flex-direction: column; gap: 1rem;`;

const SkillItem = styled.div`display: flex; align-items: center; gap: 0.75rem;`;

const SkillIcon = styled.div`
  width: 36px; height: 36px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.bgSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  display: flex; align-items: center; justify-content: center;
  color: ${({ $color }) => $color || 'inherit'};
  font-size: 1rem; flex-shrink: 0;
  transition: all 0.3s ease;
  ${SkillItem}:hover & {
    border-color: ${({ $color }) => $color};
    box-shadow: 0 0 15px ${({ $color }) => $color}33;
  }
`;

const SkillInfo = styled.div`flex: 1;`;
const SkillName = styled.span`font-size: ${({ theme }) => theme.fontSizes.sm}; color: ${({ theme }) => theme.colors.text}; font-weight: 500;`;

const ProgressBar = styled.div`
  width: 100%; height: 4px;
  background: ${({ theme }) => theme.colors.bgSecondary};
  border-radius: 2px; margin-top: 0.35rem; overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%; border-radius: 2px;
  background: ${({ $color }) => $color || '#6C63FF'};
  width: ${({ $width }) => $width || 0}%;
  transition: width 1.5s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative; overflow: hidden;
  &::after {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    background-size: 200% 100%;
    animation: ${shimmer} 2s ease-in-out infinite;
  }
`;

const SkillLevel = styled.span`
  font-size: 0.75rem; font-weight: 600;
  color: ${({ $color }) => $color};
  min-width: 32px; text-align: end;
`;

function SkillCategory({ category, translatedTitle, translatedDesc }) {
  const [animated, setAnimated] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setAnimated(true); observer.disconnect(); }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <CategoryCard ref={ref}>
      <CardContent>
        <CategoryHeader>
          <CategoryIcon>{category.icon}</CategoryIcon>
          <div>
            <CategoryTitle>{translatedTitle}</CategoryTitle>
            <CategoryDesc>{translatedDesc}</CategoryDesc>
          </div>
        </CategoryHeader>
        <SkillsList>
          {category.skills.map((skill) => {
            const Icon = skill.icon;
            return (
              <SkillItem key={skill.name}>
                <SkillIcon $color={skill.color}><Icon /></SkillIcon>
                <SkillInfo>
                  <SkillName>{skill.name}</SkillName>
                  <ProgressBar>
                    <ProgressFill $width={animated ? skill.level : 0} $color={skill.color} />
                  </ProgressBar>
                </SkillInfo>
                <SkillLevel $color={skill.color}>{skill.level}%</SkillLevel>
              </SkillItem>
            );
          })}
        </SkillsList>
      </CardContent>
    </CategoryCard>
  );
}

export default function Skills() {
  const { t } = useLanguage();

  const categoryTranslations = [
    { title: t('skills.frontend'), desc: t('skills.frontendDesc') },
    { title: t('skills.backend'), desc: t('skills.backendDesc') },
    { title: t('skills.devops'), desc: t('skills.devopsDesc') },
  ];

  return (
    <SectionWrapper id="skills" label={t('skills.label')} title={t('skills.title')} description={t('skills.description')}>
      <BentoGrid>
        {skillCategories.map((cat, i) => (
          <SkillCategory
            key={cat.title}
            category={cat}
            translatedTitle={categoryTranslations[i]?.title || cat.title}
            translatedDesc={categoryTranslations[i]?.desc || cat.description}
          />
        ))}
      </BentoGrid>
    </SectionWrapper>
  );
}
