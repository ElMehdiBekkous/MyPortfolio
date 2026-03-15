'use client';
import { useEffect, useRef } from 'react';
import styled from 'styled-components';

const ProgressContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  z-index: 9999;
  background: transparent;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: ${({ theme }) => theme.colors.gradient};
  width: 0%;
  border-radius: 0 2px 2px 0;
  box-shadow: 0 0 10px ${({ theme }) => theme.colors.accentGlow};
  will-change: width;
`;

export default function ScrollProgress() {
    const fillRef = useRef(null);

    useEffect(() => {
        let ticking = false;

        const handleScroll = () => {
            if (ticking) return;
            ticking = true;

            requestAnimationFrame(() => {
                if (fillRef.current) {
                    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
                    const scrolled = (window.scrollY / scrollHeight) * 100;
                    fillRef.current.style.width = `${scrolled}%`;
                }
                ticking = false;
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <ProgressContainer>
            <ProgressFill ref={fillRef} />
        </ProgressContainer>
    );
}
