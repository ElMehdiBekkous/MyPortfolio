import { FaReact, FaNodeJs, FaGitAlt, FaDocker, FaFigma, FaAws } from 'react-icons/fa';
import {
    SiNextdotjs, SiTypescript, SiJavascript, SiMongodb,
    SiFirebase, SiTailwindcss, SiStyledcomponents, SiPostgresql,
    SiGraphql, SiPrisma, SiVercel, SiStripe
} from 'react-icons/si';

export const skillCategories = [
    {
        title: 'Frontend',
        description: 'Building beautiful, responsive interfaces',
        icon: '🎨',
        skills: [
            { name: 'React.js', icon: FaReact, level: 95, color: '#61DAFB' },
            { name: 'Next.js', icon: SiNextdotjs, level: 95, color: '#FFFFFF' },
            { name: 'TypeScript', icon: SiTypescript, level: 85, color: '#3178C6' },
            { name: 'JavaScript', icon: SiJavascript, level: 95, color: '#F7DF1E' },
            { name: 'Tailwind CSS', icon: SiTailwindcss, level: 90, color: '#06B6D4' },
            { name: 'Styled Components', icon: SiStyledcomponents, level: 90, color: '#DB7093' },
        ],
    },
    {
        title: 'Backend',
        description: 'Scalable server-side solutions',
        icon: '⚙️',
        skills: [
            { name: 'Node.js', icon: FaNodeJs, level: 90, color: '#339933' },
            { name: 'GraphQL', icon: SiGraphql, level: 80, color: '#E10098' },
            { name: 'PostgreSQL', icon: SiPostgresql, level: 80, color: '#4169E1' },
            { name: 'MongoDB', icon: SiMongodb, level: 85, color: '#47A248' },
            { name: 'Prisma', icon: SiPrisma, level: 85, color: '#2D3748' },
            { name: 'Firebase', icon: SiFirebase, level: 90, color: '#FFCA28' },
        ],
    },
    {
        title: 'DevOps & Tools',
        description: 'Deployment & workflow optimization',
        icon: '🚀',
        skills: [
            { name: 'Git', icon: FaGitAlt, level: 90, color: '#F05032' },
            { name: 'Vercel', icon: SiVercel, level: 90, color: '#FFFFFF' },
            { name: 'Docker', icon: FaDocker, level: 70, color: '#2496ED' },
            { name: 'AWS', icon: FaAws, level: 65, color: '#FF9900' },
            { name: 'Figma', icon: FaFigma, level: 80, color: '#F24E1E' },
            { name: 'Stripe', icon: SiStripe, level: 80, color: '#635BFF' },
        ],
    },
];
