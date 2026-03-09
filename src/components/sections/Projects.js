'use client';
import { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import SectionWrapper from '@/components/SectionWrapper';
import { useLanguage } from '@/context/LanguageContext';
import { projects } from '@/data/projects';
import { FiArrowRight } from 'react-icons/fi';

const gradientMove = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const FilterBar = styled.div`
  display: flex; align-items: center; gap: 0.75rem; margin-bottom: 2.5rem; flex-wrap: wrap;
`;

const FilterBtn = styled.button`
  padding: 0.5rem 1.25rem;
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid ${({ theme, $active }) => $active ? theme.colors.accent : theme.colors.border};
  background: ${({ theme, $active }) => $active ? theme.colors.accent : theme.colors.glass};
  color: ${({ theme, $active }) => $active ? '#fff' : theme.colors.textSecondary};
  backdrop-filter: blur(10px);
  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
    color: ${({ theme, $active }) => $active ? '#fff' : theme.colors.accent};
    transform: translateY(-2px);
  }
`;

const ProjectsGrid = styled.div`
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 2rem;
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) { grid-template-columns: 1fr; }
`;

const ProjectCard = styled.div`
  position: relative; border-radius: ${({ theme }) => theme.radii.xl}; overflow: hidden;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  transition: all 0.4s ease; cursor: pointer;
  &:hover {
    transform: translateY(-8px);
    border-color: ${({ $color }) => $color}66;
    box-shadow: 0 20px 60px ${({ $color }) => $color}22;
  }
`;

const CardImageArea = styled.div`
  height: 200px;
  background: ${({ $color }) => `linear-gradient(135deg, ${$color}22 0%, ${$color}44 100%)`};
  display: flex; align-items: center; justify-content: center;
  position: relative; overflow: hidden;
  &::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, ${({ $color }) => $color}33, transparent);
    background-size: 200% 200%;
    animation: ${gradientMove} 6s ease infinite;
  }
`;

const ProjectNumber = styled.span`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 5rem; font-weight: 700;
  color: ${({ $color }) => $color}33;
  position: absolute; right: 1.5rem; bottom: -0.5rem;
`;

const ProjectEmoji = styled.span`
  font-size: 4rem; z-index: 1;
  filter: drop-shadow(0 4px 12px rgba(0,0,0,0.2));
  transition: transform 0.4s ease;
  ${ProjectCard}:hover & { transform: scale(1.15) rotate(5deg); }
`;

const CardBody = styled.div`padding: 1.75rem;`;

const ProjectCategory = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.75rem; color: ${({ $color }) => $color};
  text-transform: uppercase; letter-spacing: 1.5px;
`;

const ProjectTitle = styled.h3`font-size: 1.4rem; color: ${({ theme }) => theme.colors.text}; margin: 0.5rem 0;`;

const ProjectDesc = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.7; margin-bottom: 1.25rem;
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
`;

const TechTags = styled.div`display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.25rem;`;

const TechTag = styled.span`
  font-size: 0.7rem; padding: 0.3rem 0.75rem;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.bgSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textSecondary}; font-weight: 500;
`;

const CardActions = styled.div`display: flex; align-items: center; justify-content: space-between;`;

const ActionLink = styled.a`
  display: inline-flex; align-items: center; gap: 0.4rem;
  font-size: ${({ theme }) => theme.fontSizes.sm}; font-weight: 500;
  color: ${({ $color }) => $color || 'inherit'};
  transition: all 0.3s ease;
  &:hover { gap: 0.7rem; }
  svg { font-size: 1rem; }
`;

const Year = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const emojis = ['🛒', '📊', '💬', '🤖', '🏠', '📈'];

export default function Projects() {
  const { t } = useLanguage();
  const [filter, setFilter] = useState('all');

  const translatedItems = t('projects.items');
  const categoryKeys = ['all', ...new Set(projects.map(p => p.category))];
  const categoryLabels = { all: t('projects.all') };
  const filtered = filter === 'all' ? projects : projects.filter(p => p.category === filter);

  return (
    <SectionWrapper id="projects" label={t('projects.label')} title={t('projects.title')} description={t('projects.description')}>
      <FilterBar>
        {categoryKeys.map(cat => (
          <FilterBtn key={cat} $active={filter === cat} onClick={() => setFilter(cat)}>
            {categoryLabels[cat] || cat}
          </FilterBtn>
        ))}
      </FilterBar>

      <ProjectsGrid>
        {filtered.map((project) => {
          const idx = project.id - 1;
          const translated = Array.isArray(translatedItems) ? translatedItems[idx] : null;
          return (
            <ProjectCard key={project.id} $color={project.color}>
              <CardImageArea $color={project.color}>
                <ProjectEmoji>{emojis[idx] || '🚀'}</ProjectEmoji>
                <ProjectNumber $color={project.color}>0{project.id}</ProjectNumber>
              </CardImageArea>
              <CardBody>
                <ProjectCategory $color={project.color}>{project.category}</ProjectCategory>
                <ProjectTitle>{translated?.title || project.title}</ProjectTitle>
                <ProjectDesc>{translated?.description || project.description}</ProjectDesc>
                <TechTags>
                  {project.tech.map(tech => <TechTag key={tech}>{tech}</TechTag>)}
                </TechTags>
                <CardActions>
                  <ActionLink href={project.link} $color={project.color} target="_blank">
                    {t('projects.viewProject')} <FiArrowRight />
                  </ActionLink>
                  <Year>{project.year}</Year>
                </CardActions>
              </CardBody>
            </ProjectCard>
          );
        })}
      </ProjectsGrid>
    </SectionWrapper>
  );
}
