import React, { useState, useEffect, useRef } from 'react';
import styled, { useTheme } from 'styled-components';
import { MdClose as X } from 'react-icons/md';
import { FaQuoteLeft as Quote } from 'react-icons/fa';
import { useLanguage } from '@/context/LanguageContext';
// import { motion, AnimatePresence } from 'framer-motion'; 
// NOTE: We avoid Framer Motion for the continuous physics loop to prevent excessive re-renders,
// utilizing pure refs for extreme performance.
import SectionWrapper from '@/components/SectionWrapper';
import { testimonials as testimonialsData } from '@/data/testimonials';

// --- DATA ---
const getInitials = (name) => {
  if (!name) return "";
  const parts = name.split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

// --- STYLES ---

const InteractiveArea = styled.div`
  position: relative;
  width: 100%;
  height: 600px;
  background-color: transparent; // using Canvas behind
  overflow: hidden;
  border-image: linear-gradient(to right, transparent, ${({ theme }) => theme.colors.text}10, transparent) 1;
  border-top: 1px solid;
  border-bottom: 1px solid;
  cursor: none; /* Hide default cursor everywhere inside */
  
  * { cursor: none !important; } /* Force hide cursor on children to use custom ring/dot */
`;

const CanvasWrapper = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
`;

// Fixed HTML Cursors matching user's Canvas cursor design
const CursorRing = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 140px; /* 70 * 2 = 140 base REPEL_RADIUS diameter */
  height: 140px;
  border: 1px solid #0EA5E9;
  border-radius: 50%;
  pointer-events: none;
  z-index: 9999;
  will-change: transform, opacity;
  opacity: 0;
`;

const CursorDot = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 10px;
  height: 10px;
  background-color: #0EA5E9;
  border-radius: 50%;
  pointer-events: none;
  z-index: 9999;
  will-change: transform, opacity;
  opacity: 0;
`;

const BlobsWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
`;

const BlobObj = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: auto;
  will-change: transform;
`;

const InactiveTitleWrap = styled.div`
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 10px;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
  white-space: nowrap;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.text};
  font-family: 'Space Grotesk', sans-serif;
  text-align: center;
  pointer-events: none;
`;

const BubbleContent = styled.div`
  position: relative;
  border-radius: ${({ $isActive }) => $isActive ? '16px' : '50%'};
  width: ${({ $isActive }) => $isActive ? '350px' : '80px'};
  height: ${({ $isActive }) => $isActive ? 'auto' : '80px'};
  min-height: ${({ $isActive }) => $isActive ? '250px' : '80px'};
  background: ${({ theme, $isActive }) => 
    $isActive ? `${theme.colors.background}cc` : `rgba(255,255,255,0.03)`};
  backdrop-filter: ${({ $isActive }) => $isActive ? 'blur(12px)' : 'blur(4px)'};
  border: 1px solid ${({ theme, $isActive, $color }) => 
    $isActive ? ($color || theme.colors.accentLight) : `${theme.colors.text}20`};
  box-shadow: ${({ theme, $isActive, $color }) => 
    $isActive ? `0 0 30px ${$color || theme.colors.accentLight}40` : `0 4px 15px rgba(0,0,0,0.1)`};
  display: flex;
  flex-direction: ${({ $isActive }) => $isActive ? 'column' : 'row'};
  align-items: center;
  justify-content: ${({ $isActive }) => $isActive ? 'flex-start' : 'center'};
  padding: ${({ $isActive }) => $isActive ? '30px' : '0'};
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  cursor: pointer;
  z-index: ${({ $isActive }) => ($isActive ? 100 : 1)};
  
  &:hover ${InactiveTitleWrap} {
    opacity: 1;
    visibility: visible;
  }
`;

const InitialsCircle = styled.div`
  width: ${({ $isActive }) => $isActive ? '60px' : '80px'};
  height: ${({ $isActive }) => $isActive ? '60px' : '80px'};
  border-radius: 50%;
  background: linear-gradient(135deg, ${({ $color, theme }) => $color || theme.colors.accent}, ${({ $color, theme }) => $color ? `${$color}80` : theme.colors.accentLight});
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: ${({ $isActive }) => $isActive ? '1.2rem' : '1.2rem'};
  font-family: 'Space Grotesk', sans-serif;
  flex-shrink: 0;
  transition: all 0.5s ease;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
  
  ${({ $isActive }) => $isActive && `
    margin-bottom: 20px;
  `}
`;

const QuoteIcon = styled(Quote)`
  color: ${({ $color, theme }) => $color || theme.colors.accentLight};
  opacity: 0.3;
  margin-bottom: 10px;
  width: 24px;
  height: 24px;
`;

const TextContent = styled.div`
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.95rem;
  line-height: 1.6;
  text-align: center;
  margin-bottom: 20px;
`;

const AuthorInfo = styled.div`
  text-align: center;
  margin-top: auto;
`;

const AuthorName = styled.h4`
  margin: 0 0 5px 0;
  color: ${({ $color, theme }) => $color || theme.colors.accentLight};
  font-size: 1.1rem;
`;

const AuthorRole = styled.div`
  color: ${({ theme }) => theme.colors.text}a0;
  font-size: 0.85rem;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: ${({ theme }) => theme.colors.text};
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.3s ease;
  z-index: 10;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const BLOB_COLORS = [
  '#0ea5e9', // sky blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#14b8a6', // teal
  '#3b82f6', // blue
];

// Default physics constants
const BASE_SPEED_LIMIT = 2;

const Testimonials = () => {
  const { t, language } = useLanguage();
  const theme = useTheme();
  const [activeId, setActiveId] = useState(null);
  
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const cursorRingRef = useRef(null);
  const cursorDotRef = useRef(null);
  
  const bubbleRefs = useRef([]);
  const requestRef = useRef();

  // Mouse tracking logic via pure Refs to avoid React renders
  const mouseRef = useRef({ x: -1000, y: -1000 }); // global client coords for HTML cursors
  const canvasMouseRef = useRef({ x: -1000, y: -1000 }); // local coords for canvas drawing
  const isHovering = useRef(false);

  // Load correct translations
  const localizedData = testimonialsData.map((item, index) => {
    const locArr = t('testimonials.items') || [];
    const translation = locArr[index] || {};
    return { ...item, ...translation };
  });

  // State to hold dimensions/physics per item
  const physicsData = useRef(localizedData.map(() => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * 600,
    vx: (Math.random() - 0.5) * BASE_SPEED_LIMIT,
    vy: (Math.random() - 0.5) * BASE_SPEED_LIMIT,
  })));

  // === CANVAS PARTICLES BACKGROUND ===
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Set dynamic dimensions matching container
    const resizeCanvas = () => {
      canvas.width = containerRef.current?.clientWidth || window.innerWidth;
      canvas.height = 600;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initial particle configuration
    const svgW = 1536, svgH = 1024;
    const logoSize = Math.min(window.innerWidth * 0.9, 1000); // Giant responsive logo background
    const scale = logoSize / Math.max(svgW, svgH);
    
    // Dynamically size offscreen canvas so the scaled logo isn't clipped out of bounds
    const offW = Math.ceil(svgW * scale) + 100;
    const offH = Math.ceil(svgH * scale) + 100;

    const off = document.createElement('canvas');
    off.width = offW; 
    off.height = offH;
    const octx = off.getContext('2d');

    const offX = 50; // padding offset
    const offY = 50;

    const logoPath = new Path2D(`M1405.485,416.49 C1424.763,372.019 1425.935,326.734 1406.374,282.707 C1373.711,209.191 1314.024,173.849 1235.299,169.328 C1206.573,167.678 1177.674,169.043 1148.854,169.053 C1147.424,169.053 1145.994,169.25 1144.423,169.366 C1144.423,195.321 1144.423,220.9 1144.423,246.969 C1146.262,246.969 1147.888,246.969 1149.514,246.969 C1175.669,246.985 1201.824,247.056 1227.979,246.997 C1247.004,246.953 1264.758,251.427 1281.482,260.63 C1326.894,285.62 1345.323,345.771 1320.656,391.319 C1301.883,425.982 1271.752,443.03 1232.692,443.918 C1205.052,444.545 1177.387,444.104 1149.733,444.14 C1147.992,444.142 1146.25,444.14 1144.537,444.14 C1144.537,471.079 1144.537,497.209 1145.166,523.982 C1165.111,523.976 1185.057,523.971 1205.925,524.143 C1214.088,524.147 1222.251,524.175 1230.414,524.152 C1249.151,524.099 1267.153,527.565 1284.084,535.729 C1328.795,557.287 1353.12,609.134 1342.485,659.967 C1331.483,712.56 1286.818,749.082 1232.891,749.205 C1171.251,749.346 1109.609,749.183 1047.969,749.208 C1025.321,749.217 1002.674,749.386 979.111,749.253 C970.106,749.091 961.101,748.928 952.228,747.866 C952.265,643.863 952.303,539.861 952.332,435.858 C952.332,435.284 952.206,434.709 952.139,434.135 C951.719,433.874 951.299,433.614 950.879,433.354 C894.495,490.657 838.111,547.96 781.509,605.486 C721.678,546.737 663.306,489.419 604.934,432.102 C604.54,432.335 604.146,432.568 603.752,432.801 C603.752,538.205 603.752,643.608 603.752,748.995 C602.761,749.1 602.267,749.198 601.773,749.198 C497.774,749.207 393.773,748.886 289.777,749.456 C265.972,749.586 246.595,730.783 247.474,706.631 C248.529,677.67 247.882,648.639 247.649,619.642 C247.555,608.006 247.449,596.262 245.875,584.769 C242.04,556.763 230.778,532.117 210.002,512.394 C198.061,501.059 184.149,492.751 169.329,486.839 C178.308,481.759 187.944,477.398 196.369,471.351 C230.509,446.849 246.326,412.412 247.608,371.202 C248.488,342.896 247.807,314.541 247.809,286.208 C247.81,261.944 263.842,245.855 288.204,245.83 C326.203,245.791 364.202,245.826 402.201,245.83 C403.994,245.83 405.786,245.83 407.801,245.83 C407.801,218.991 407.801,192.611 407.801,165.825 C403.378,165.825 399.241,165.825 395.104,165.825 C352.105,165.824 309.105,165.716 266.106,165.92 C258.327,165.958 250.444,166.685 242.797,168.104 C195.248,176.933 159.285,217.152 156.02,265.441 C155.123,278.716 155.725,292.092 155.627,305.421 C155.444,330.082 156.557,354.84 154.741,379.381 C152.346,411.747 133.751,433.419 103.804,444.705 C93.574,448.56 82.235,449.474 70.998,451.816 C70.998,474.754 70.998,498.786 70.998,522.519 C78.047,523.195 84.763,523.266 91.237,524.554 C129.871,532.238 155.329,563.518 155.527,603.659 C155.726,644.158 155.584,684.659 155.589,725.159 C155.591,742.452 159.224,759.044 167.508,774.135 C189.774,814.695 225.023,835.306 270.678,835.522 C406.506,836.167 542.339,835.742 678.17,835.72 C680.427,835.72 682.685,835.531 685.293,835.415 C685.293,761.764 685.293,688.704 685.293,614.895 C717.053,646.136 748.243,676.816 779.653,707.712 C810.328,677.309 840.846,647.06 871.614,616.564 C871.614,689.577 871.614,762.476 871.614,835.628 C895.315,835.628 918.63,835.62 941.944,835.629 C1041.609,835.669 1141.273,835.86 1240.936,835.587 C1254.51,835.55 1268.343,834.473 1281.603,831.706 C1350.279,817.375 1399.093,778.137 1423.973,712.183 C1444.595,657.514 1439.208,603.876 1410.667,552.886 C1401.031,535.67 1389.097,520.067 1372.937,507.281 C1363.358,500.058 1353.778,492.835 1344.513,485.85 C1351.68,480.439 1359.649,474.99 1366.972,468.78 C1383.72,454.577 1396.408,437.261 1405.485,416.49 M1089.066,583.072 C1089.132,446.079 1089.199,309.085 1089.249,172.091 C1089.249,170.989 1089.007,169.887 1088.871,168.718 C1069.585,168.718 1050.594,168.897 1031.61,168.598 C1026.552,168.518 1023.018,169.924 1019.436,173.536 C992.798,200.394 965.922,227.015 939.158,253.748 C892.471,300.383 845.821,347.056 799.127,393.683 C792.591,400.209 785.887,406.567 778.435,413.805 C768.342,403.346 758.476,392.715 748.176,382.522 C711.107,345.835 673.887,309.3 636.732,272.699 C602.186,238.669 567.665,204.612 533.046,170.656 C531.814,169.448 529.652,168.592 527.919,168.584 C508.921,168.496 489.922,168.609 470.923,168.667 C469.162,168.672 467.4,168.668 465.456,168.668 C465.456,341.768 465.456,514.172 465.456,686.776 C492.372,686.776 518.955,686.776 546.173,686.776 C546.173,556.053 546.173,425.559 546.173,293.659 C624.722,371.047 702.246,447.425 780.941,524.957 C857.144,448.393 932.827,372.351 1009.156,295.661 C1009.156,426.611 1009.156,556.672 1009.156,686.688 C1015.036,686.688 1020.506,686.688 1026.893,686.916 C1047.606,686.916 1068.318,686.916 1089.146,686.916 C1089.146,668.501 1089.182,650.696 1089.135,632.892 C1089.093,616.591 1088.963,600.291 1089.066,583.072 M287.756,446.153 C283.709,445.419 281.743,447.157 280.144,451.006 C275.763,461.557 269.197,470.729 260.957,478.704 C258.499,481.083 256.384,483.817 253.803,486.738 C268.013,496.483 275.626,511.382 281.932,526.645 C324.182,526.645 365.914,526.645 407.772,526.645 C407.772,499.763 407.772,473.21 407.772,446.153 C367.881,446.153 328.288,446.153 287.756,446.153 z`);

    octx.save();
    octx.translate(offX, offY);
    octx.scale(scale, scale);
    octx.fillStyle = '#ffffff';
    octx.fill(logoPath);
    octx.restore();

    const imgData = octx.getImageData(0, 0, offW, offH);
    const particles = [];
    const STEP = 5; // Tighter steps for better fidelity on large logo

    for (let y = 0; y < offH; y += STEP) {
      for (let x = 0; x < offW; x += STEP) {
        const idx = (y * offW + x) * 4;
        if (imgData.data[idx + 3] > 128) {
          const isAccent = Math.random() > 0.5;
          particles.push({
            x, y,
            homeX: x, homeY: y,
            vx: 0, vy: 0,
            r: 2.2 + Math.random() * 1.2,
            color: isAccent ? '#0EA5E9' : '#3B82F6', // Blue theme override
          });
        }
      }
    }

    const REPEL_RADIUS = 70;
    const REPEL_FORCE = 6;
    const SPRING = 0.1;
    const DAMPING = 0.75;
    let animId;

    const draw = () => {
      // Directly clear the canvas recursively to respect application's natural theme background
      ctx.clearRect(0, 0, canvas.width, canvas.height); 

      // the canvas physics uses centralized coordinates to map offW x offH onto full screen
      const centerOffsetX = (canvas.width - offW) / 2;
      const centerOffsetY = (canvas.height - offH) / 2;
      const isMobile = window.innerWidth <= 768;

      for (const p of particles) {
        const globalHomeX = p.homeX + centerOffsetX;
        const globalHomeY = p.homeY + centerOffsetY;
        
        // Use coordinates relative to the canvas itself mapped via handleMouseMove
        const mouseCanvasX = canvasMouseRef.current.x;
        const mouseCanvasY = canvasMouseRef.current.y;
        
        const dx = p.x + centerOffsetX - mouseCanvasX;
        const dy = p.y + centerOffsetY - mouseCanvasY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (!isMobile && dist < REPEL_RADIUS && mouseCanvasX > 0) {
          const force = (REPEL_RADIUS - dist) / REPEL_RADIUS;
          p.vx += (dx / dist) * force * REPEL_FORCE;
          p.vy += (dy / dist) * force * REPEL_FORCE;
        } else if (isMobile) {
          // Gentle vibration that returns to home
          p.vx += (Math.random() - 0.5) * 0.4;
          p.vy += (Math.random() - 0.5) * 0.4;
        }

        // spring back home
        p.vx += (p.homeX - p.x) * SPRING;
        p.vy += (p.homeY - p.y) * SPRING;
        p.vx *= DAMPING;
        p.vy *= DAMPING;
        p.x += p.vx;
        p.y += p.vy;

        ctx.beginPath();
        ctx.arc(p.x + centerOffsetX, p.y + centerOffsetY, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;

        if (!isMobile && dist < REPEL_RADIUS && mouseCanvasX > 0) {
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8 * ((REPEL_RADIUS - dist) / REPEL_RADIUS);
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      animId = requestAnimationFrame(draw);
    };
    
    draw();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animId);
    };
  }, [theme]);


  // === HTML PHYSICS: Floating Testimonials Bubbles ===
  // Entirely powered by direct refs to prevent DOM re-renders causing FPS drops
  
  const tickPhysics = () => {
    const container = containerRef.current;
    if (!container) {
      requestRef.current = requestAnimationFrame(tickPhysics);
      return;
    }
    
    const width = container.clientWidth;
    const height = 600;

    const mouseCanvasX = canvasMouseRef.current.x;
    const mouseCanvasY = canvasMouseRef.current.y;

    // 1. Find the SINGLE closest blob to apply magnetic effect
    let closestBlobIndex = -1;
    let minMouseDist = Infinity;

    if (mouseCanvasX > 0 && !activeId) {
      physicsData.current.forEach((obj, idx) => {
          if (activeId === localizedData[idx].id) return;
          const dist = Math.hypot(mouseCanvasX - (obj.x + 40), mouseCanvasY - (obj.y + 40));
          if (dist < 200 && dist < minMouseDist) {
              minMouseDist = dist;
              closestBlobIndex = idx;
          }
      });
    }

    // 2. Resolve collisions and update positions
    bubbleRefs.current.forEach((blob, index) => {
      if (!blob) return;

      const obj = physicsData.current[index];
      const isCurrentlyActive = activeId === localizedData[index].id;
      
      blob.style.zIndex = isCurrentlyActive ? '1000' : '10';

      if (isCurrentlyActive) {
        obj.x += (width / 2 - 175 - obj.x) * 0.1;
        obj.y += (height / 2 - 125 - obj.y) * 0.1;
      } else {
        // Basic bounce boundaries
        if (obj.x <= 0 || obj.x >= width - 80) obj.vx *= -1;
        if (obj.y <= 0 || obj.y >= height - 80) obj.vy *= -1;

        // Force bounds
        obj.x = Math.max(0, Math.min(obj.x, width - 80));
        obj.y = Math.max(0, Math.min(obj.y, height - 80));

        // Magnetic attraction to mouse (only if it's the closest one)
        if (index === closestBlobIndex) {
            const targetX = obj.x + 40;
            const targetY = obj.y + 40;
            const dx = mouseCanvasX - targetX;
            const dy = mouseCanvasY - targetY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            const force = (200 - dist) / 200;
            obj.vx += dx * force * 0.03; // Attract towards mouse gracefully
            obj.vy += dy * force * 0.03;
        }

        // Apply velocities
        obj.x += obj.vx;
        obj.y += obj.vy;

        // Friction to cap speed
        const speed = Math.sqrt(obj.vx * obj.vx + obj.vy * obj.vy);
        if (speed > BASE_SPEED_LIMIT) {
          obj.vx = (obj.vx / speed) * BASE_SPEED_LIMIT;
          obj.vy = (obj.vy / speed) * BASE_SPEED_LIMIT;
        }
      }
    });

    // 3. Simple Iterative Collision Resolution among all non-active blobs
    for (let i = 0; i < physicsData.current.length; i++) {
        if (activeId === localizedData[i].id) continue;
        const obj1 = physicsData.current[i];
        
        for (let j = i + 1; j < physicsData.current.length; j++) {
            if (activeId === localizedData[j].id) continue;
            const obj2 = physicsData.current[j];
            
            const dx = obj2.x - obj1.x;
            const dy = obj2.y - obj1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxDist = 80; // Bubble diameter is 80px
            
            if (dist > 0 && dist < maxDist) {
                const overlap = (maxDist - dist) / 2;
                const pushForce = overlap * 0.1; // Smooth repulsion force
                const forceX = (dx / dist) * pushForce;
                const forceY = (dy / dist) * pushForce;
                
                // Nudge position directly and adjust velocity slightly
                obj1.x -= forceX;
                obj1.y -= forceY;
                obj2.x += forceX;
                obj2.y += forceY;
                
                obj1.vx -= forceX * 0.5;
                obj1.vy -= forceY * 0.5;
                obj2.vx += forceX * 0.5;
                obj2.vy += forceY * 0.5;
            }
        }
    }

    // 4. Update styling (EX: transform)
    bubbleRefs.current.forEach((blob, index) => {
        if (!blob) return;
        const obj = physicsData.current[index];
        blob.style.transform = `translate(${obj.x}px, ${obj.y}px)`;
    });

    // Update absolute HTML custom cursors tracking the canvas coordinates directly
    if (cursorRingRef.current && cursorDotRef.current) {
      const localX = mouseCanvasX;
      const localY = mouseCanvasY;
      
      if (localX > 0 && localY > 0) {
        cursorRingRef.current.style.opacity = '0.3';
        cursorDotRef.current.style.opacity = '0.6';

        // Offset positions by half their absolute dimensions (140px -> -70px, 10px -> -5px)
        cursorRingRef.current.style.transform = `translate3d(${localX - 70}px, ${localY - 70}px, 0)`;
        cursorDotRef.current.style.transform = `translate3d(${localX - 5}px, ${localY - 5}px, 0)`;
        
        // When active dialog is open, we can expand ring
        if (activeId || isHovering.current) {
             cursorRingRef.current.style.transform = `translate3d(${localX - 70}px, ${localY - 70}px, 0) scale(1.5)`;
        } 
      } else {
        cursorRingRef.current.style.opacity = '0';
        cursorDotRef.current.style.opacity = '0';
      }
    }

    requestRef.current = requestAnimationFrame(tickPhysics);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(tickPhysics);
    return () => cancelAnimationFrame(requestRef.current);
  });

  // Track global mouse
  const handleMouseMove = (e) => {
    // 1. Used for fixed HTML Cursors
    mouseRef.current.x = e.clientX;
    mouseRef.current.y = e.clientY;

    // 2. Used for Container relative bounds (Physics & Canvas)
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (containerRef.current.clientWidth / rect.width);
      const y = (e.clientY - rect.top) * (600 / rect.height);
      
      // We only care about mouse inside the container for the physics interactions
      if (e.clientY >= rect.top && e.clientY <= rect.bottom && e.clientX >= rect.left && e.clientX <= rect.right) {
          canvasMouseRef.current.x = x;
          canvasMouseRef.current.y = y;
      } else {
          canvasMouseRef.current.x = -1000;
          canvasMouseRef.current.y = -1000;
      }
    }
  };

  const handleMouseLeave = () => {
    mouseRef.current = { x: -1000, y: -1000 };
    canvasMouseRef.current = { x: -1000, y: -1000 };
  };

  useEffect(() => {
    // Track global mouse exclusively for the cursor fixed layer
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <SectionWrapper 
      id="testimonials" 
      fullWidth={true}
      title={t('testimonials.title')}
      description={t('testimonials.description')}
    >
      <InteractiveArea 
        ref={containerRef} 
        onMouseLeave={handleMouseLeave}
        onClick={() => { if (activeId) setActiveId(null); }}
      >
        <CanvasWrapper ref={canvasRef} />

        <CursorRing ref={cursorRingRef} />
        <CursorDot ref={cursorDotRef} />

        <BlobsWrapper>
          {localizedData.map((item, index) => {
            const isActive = activeId === item.id;
            const blobColor = BLOB_COLORS[index % BLOB_COLORS.length];
            // The styled component relies on isActive. When clicked, activeId changes => forces ONE re-render
            // which safely triggers the massive CSS transition safely. 
            // All other positioning uses pure `ref` transformations every frame! (60fps guaranteed)

            return (
              <BlobObj 
                key={item.id} 
                ref={el => bubbleRefs.current[index] = el}
                onMouseEnter={() => { isHovering.current = true; }}
                onMouseLeave={() => { isHovering.current = false; }}
              >
                <BubbleContent 
                  $isActive={isActive} 
                  $color={blobColor}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isActive) setActiveId(item.id);
                  }}
                >
                  {isActive && (
                    <CloseButton onClick={(e) => { e.stopPropagation(); setActiveId(null); }}>
                      <X size={18} />
                    </CloseButton>
                  )}
                  
                  <InitialsCircle $isActive={isActive} $color={blobColor}>
                    {getInitials(item.name)}
                  </InitialsCircle>

                  {isActive ? (
                    <div style={{ marginLeft: language === 'ar' ? '0' : '20px', marginRight: language === 'ar' ? '20px' : '0', display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <QuoteIcon $color={blobColor} />
                      <TextContent>"{item.content}"</TextContent>
                      <AuthorInfo>
                        <AuthorName $color={blobColor}>{item.name}</AuthorName>
                        <AuthorRole>{item.role}</AuthorRole>
                      </AuthorInfo>
                    </div>
                  ) : (
                    <InactiveTitleWrap>
                      {item.role}
                    </InactiveTitleWrap>
                  )}
                </BubbleContent>
              </BlobObj>
            );
          })}
        </BlobsWrapper>

      </InteractiveArea>
    </SectionWrapper>
  );
};

export default Testimonials;
