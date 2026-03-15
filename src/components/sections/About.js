'use client';
import { useRef, useEffect, useState } from 'react';
import styled, { useTheme } from 'styled-components';
import * as THREE from 'three';
import { useLanguage } from '@/context/LanguageContext';
import useIsMobile from '@/lib/useIsMobile';

const AboutSection = styled.section`
  position: relative;
  width: 100vw;
  height: 100vh;
  min-height: 800px;
  background-color: transparent;
  overflow: visible;
  font-family: ${({ theme }) => theme.fonts?.sans || "'Inter', sans-serif"};

  @media (min-width: 769px) {
    touch-action: none;
  }
`;

const CanvasContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
`;

const UILayer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  pointer-events: none;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;

  @media (min-width: 768px) {
    padding: 2.5rem;
  }
`;

const HeaderBox = styled.header`
  max-width: 42rem;
  pointer-events: auto;
  animation: fadeIn 1s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const Badge = styled.div`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  margin-bottom: 1rem;
  border-radius: 9999px;
  background-color: ${({ theme }) => theme.name === 'dark' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)'};
  border: 1px solid ${({ theme }) => theme.name === 'dark' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.5)'};
  color: ${({ theme }) => theme.colors.accentDark || theme.colors.accent};
  font-size: 0.75rem;
  font-family: ${({ theme }) => theme.fonts?.mono || "'Fira Code', monospace"};
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

const InfoContent = styled.div`
  transition: opacity 0.3s ease-in-out, transform 0.3s ease-out;
  
  &.fade-out {
    opacity: 0;
    transform: translateY(10px);
  }
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
`;

const CardIcon = styled.span`
  font-size: 2.25rem;
  filter: drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06));

  @media (min-width: 768px) {
    font-size: 3rem;
  }
`;

const CardTitle = styled.h1`
  font-size: 2.25rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.text};
  letter-spacing: -0.025em;
  margin: 0;
  filter: drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06));

  @media (min-width: 768px) {
    font-size: 3rem;
  }
`;

const CardDesc = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.875rem;
  max-width: 28rem;
  line-height: 1.625;
  margin: 0;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

const contentData = {
  default: {
    title: "Centre de Commande",
    desc: "Survolez ou touchez les éléments de mon bureau pour explorer ma stack, mes projets et mon expérience. Bougez le curseur pour faire pivoter la caméra.",
    icon: "🚀"
  },
  laptop: {
    title: "Expertise Full-Stack",
    desc: "Création d'applications web robustes avec Next.js, React, Node.js et Firebase. Du backend jusqu'à l'interface utilisateur.",
    icon: "💻"
  },
  monitor: {
    title: "Focus Actuel",
    desc: "Exploration approfondie de l'IA, de Project IDX, et conception de solutions B2B intelligentes adaptées aux besoins réels.",
    icon: "🖥️"
  },
  coffee: {
    title: "Le Carburant",
    desc: "Transformation de la caféine en code propre et maintenable. Passionné par la résolution de problèmes et les rendus parfaits.",
    icon: "☕"
  },
  trophy: {
    title: "Expérience",
    desc: "Plus de 2 ans d'expérience professionnelle dans la réalisation d'applications de haute qualité, et le dépassement des attentes.",
    icon: "🏆"
  }
};

export default function About() {
  const { t, isRTL } = useLanguage();
  const themeContext = useTheme();
  const isMobile = useIsMobile();
  const mountRef = useRef(null);
  const [hoveredData, setHoveredData] = useState(contentData.default);
  const [isFading, setIsFading] = useState(false);
  const sceneElementsRef = useRef({});

  // Provide a state-based update UI instead of DOM manipulation
  const handleUpdateUI = (dataKey) => {
    const data = contentData[dataKey] || contentData.default;

    // Use a functional update to avoid stale closures inside three.js animations
    setHoveredData(prev => {
      if (prev.title === data.title) return prev;
      setIsFading(true);
      setTimeout(() => {
        setHoveredData(data);
        setIsFading(false);
      }, 150);
      return prev;
    });
  };

  useEffect(() => {
    if (!mountRef.current || isMobile === undefined) return;

    const initialThemeName = themeContext?.name || 'dark';
    const initialBgColor = themeContext?.colors?.bg || '#0f172a';

    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    const initialDensity = initialThemeName === 'dark' ? 0.025 : 0.012;

    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(initialBgColor, initialDensity);

    const baseRadius = Math.sqrt(12 * 12 + 15 * 15); // ~19.2
    const baseAngle = Math.atan2(12, 15);
    const baseHeight = 10;

    camera.position.set(12, 10, 15);
    camera.lookAt(0, 1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isMobile ? 1.0 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isMobile; // Disable shadow maps on mobile
    if (!isMobile) {
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff0dd, 1.2);
    dirLight.position.set(5, 12, 8);
    if (!isMobile) {
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      dirLight.shadow.camera.near = 0.5;
      dirLight.shadow.camera.far = 25;
      dirLight.shadow.camera.left = -10;
      dirLight.shadow.camera.right = 10;
      dirLight.shadow.camera.top = 10;
      dirLight.shadow.camera.bottom = -10;
      dirLight.shadow.bias = -0.001;
    }
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xcceeff, 0.4);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);

    const monitorLight = new THREE.PointLight(0x00f3ff, 1.5, 8);
    monitorLight.position.set(0, 3, 1);
    scene.add(monitorLight);

    const interactables = [];

    // LOAD EXPERT PHOTO AS PNG
    const textureLoader = new THREE.TextureLoader();
    const photoTexture = textureLoader.load('/mehdi photo professionel.png');

    const mats = {
      wood: new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.8, name: "wood" }),
      woodEdge: new THREE.MeshStandardMaterial({ color: 0x4a332a, roughness: 0.9 }),
      silver: new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.5, roughness: 0.4 }),
      darkSilver: new THREE.MeshStandardMaterial({ color: 0x808080, metalness: 0.6, roughness: 0.5 }),
      dark: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7 }),
      screen: new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.2 }),
      screenGlow: new THREE.MeshStandardMaterial({ color: 0x00f3ff, emissive: 0x004488, emissiveIntensity: 0.8 }),
      photoScreen: new THREE.MeshStandardMaterial({ map: photoTexture, roughness: 0.2, emissive: 0x111111 }),
      white: new THREE.MeshStandardMaterial({ color: 0xf3f4f6, roughness: 0.2 }),
      coffee: new THREE.MeshStandardMaterial({ color: 0x3b2818, roughness: 0.1 }),
      gold: new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 }),
      leaf: new THREE.MeshStandardMaterial({ color: 0x2e8b57, roughness: 0.7 }),
      pot: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 })
    };

    function createMesh(geometry, material, castShadow = true) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = castShadow;
      mesh.receiveShadow = true;
      return mesh;
    }

    const floor = createMesh(new THREE.PlaneGeometry(50, 50), new THREE.MeshStandardMaterial({ color: initialBgColor, roughness: 1 }), false);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -3;
    scene.add(floor);

    const gridColor = initialThemeName === 'dark' ? 0x1e293b : 0xe2e8f0; // Adjust grid color based on theme
    const grid = new THREE.GridHelper(50, 50, gridColor, gridColor);
    grid.material.vertexColors = false;
    grid.material.color.setHex(gridColor);
    grid.position.y = -2.99;
    scene.add(grid);

    sceneElementsRef.current = {
      scene,
      floorMaterial: floor.material,
      gridMaterial: grid.material,
      ambientLight,
      dirLight
    };

    const deskGroup = new THREE.Group();
    const top = createMesh(new THREE.BoxGeometry(14, 0.4, 7), mats.wood);
    top.position.y = -0.2;

    const legGeo = new THREE.CylinderGeometry(0.15, 0.1, 2.8);
    const positions = [
      [-6.5, -1.6, -3], [6.5, -1.6, -3],
      [-6.5, -1.6, 3], [6.5, -1.6, 3]
    ];
    positions.forEach(pos => {
      const leg = createMesh(legGeo, mats.dark);
      leg.position.set(...pos);
      deskGroup.add(leg);
    });

    deskGroup.add(top);
    scene.add(deskGroup);

    const laptop = new THREE.Group();
    const lBase = createMesh(new THREE.BoxGeometry(2.6, 0.1, 1.8), mats.silver);
    lBase.position.y = 0.05;
    const lKeyboard = createMesh(new THREE.BoxGeometry(2.2, 0.11, 1.0), mats.dark);
    lKeyboard.position.set(0, 0.05, -0.1);
    const lScreen = createMesh(new THREE.BoxGeometry(2.6, 1.7, 0.1), mats.silver);
    lScreen.position.set(0, 0.9, -0.85);
    lScreen.rotation.x = -Math.PI / 15;
    const lDisplay = createMesh(new THREE.BoxGeometry(2.4, 1.5, 0.11), mats.screen);
    lDisplay.position.set(0, 0.9, -0.85);
    lDisplay.rotation.x = -Math.PI / 15;

    laptop.add(lBase, lKeyboard, lScreen, lDisplay);
    laptop.position.set(-3.5, 0, 1.5);
    laptop.rotation.y = Math.PI / 6;

    laptop.userData = { id: 'laptop', originalY: 0, hoverScale: 1.05 };
    scene.add(laptop);
    interactables.push(laptop);

    const monitor = new THREE.Group();
    const mBase = createMesh(new THREE.BoxGeometry(1.5, 0.1, 1.2), mats.darkSilver);
    mBase.position.y = 0.05;
    const mNeck = createMesh(new THREE.CylinderGeometry(0.1, 0.15, 1.5), mats.darkSilver);
    mNeck.position.set(0, 0.8, -0.2);
    mNeck.rotation.x = Math.PI / 16;
    const mBody = createMesh(new THREE.BoxGeometry(5.0, 3.0, 0.2), mats.dark);
    mBody.position.set(0, 2.0, 0);

    const mDisplayMats = [
      mats.dark, mats.dark, mats.dark, mats.dark, mats.photoScreen, mats.dark
    ];
    const mDisplay = createMesh(new THREE.BoxGeometry(4.8, 2.8, 0.22), mDisplayMats);
    mDisplay.position.set(0, 2.0, 0);
    mDisplay.userData.isGlow = true; // Use emissive smartly

    monitor.add(mBase, mNeck, mBody, mDisplay);
    monitor.position.set(0, 0, -1.5);

    monitor.userData = { id: 'monitor', originalY: 0, hoverScale: 1.02 };
    scene.add(monitor);
    interactables.push(monitor);

    const coffee = new THREE.Group();
    const cCup = createMesh(new THREE.CylinderGeometry(0.35, 0.28, 0.7, 16), mats.white);
    cCup.position.y = 0.35;
    const cHandle = createMesh(new THREE.TorusGeometry(0.18, 0.06, 8, 16), mats.white);
    cHandle.position.set(0.35, 0.35, 0);
    cHandle.rotation.y = Math.PI / 2;
    const cLiquid = createMesh(new THREE.CylinderGeometry(0.32, 0.32, 0.65, 16), mats.coffee);
    cLiquid.position.y = 0.36;

    coffee.add(cCup, cHandle, cLiquid);
    coffee.position.set(3.5, 0, 1.5);
    coffee.rotation.y = -Math.PI / 4;

    coffee.userData = { id: 'coffee', originalY: 0, hoverScale: 1.1 };
    scene.add(coffee);
    interactables.push(coffee);

    const trophy = new THREE.Group();
    const tBase = createMesh(new THREE.BoxGeometry(0.8, 0.4, 0.8), mats.dark);
    tBase.position.y = 0.2;
    const tStem = createMesh(new THREE.CylinderGeometry(0.05, 0.15, 0.7), mats.gold);
    tStem.position.y = 0.75;
    const tCup = createMesh(new THREE.CylinderGeometry(0.4, 0.05, 0.6), mats.gold);
    tCup.position.y = 1.4;
    const tHandleL = createMesh(new THREE.TorusGeometry(0.2, 0.04, 8, 16), mats.gold);
    tHandleL.position.set(-0.4, 1.4, 0);
    const tHandleR = createMesh(new THREE.TorusGeometry(0.2, 0.04, 8, 16), mats.gold);
    tHandleR.position.set(0.4, 1.4, 0);

    trophy.add(tBase, tStem, tCup, tHandleL, tHandleR);
    trophy.position.set(4.5, 0, -1.0);

    trophy.userData = { id: 'trophy', originalY: 0, hoverScale: 1.1 };
    scene.add(trophy);
    interactables.push(trophy);

    const plant = new THREE.Group();
    const pPot = createMesh(new THREE.CylinderGeometry(0.5, 0.35, 0.8, 12), mats.pot);
    pPot.position.y = 0.4;

    const leafGeo = new THREE.DodecahedronGeometry(0.3, 0);
    for (let i = 0; i < 5; i++) {
      const leaf = createMesh(leafGeo, mats.leaf);
      const angle = (i / 5) * Math.PI * 2;
      leaf.position.set(Math.cos(angle) * 0.2, 0.8 + Math.random() * 0.3, Math.sin(angle) * 0.2);
      leaf.rotation.set(Math.random(), Math.random(), Math.random());
      leaf.scale.set(1, 1.5, 1);
      plant.add(leaf);
    }
    plant.add(pPot);
    plant.position.set(-5, 0, -1.5);
    scene.add(plant);


    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let hoveredGroup = null;

    function onPointerMove(event) {
      // Get bounding rect logic exactly
      const rect = renderer.domElement.getBoundingClientRect();
      let clientX = event.clientX;
      let clientY = event.clientY;

      if (event.touches && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      }

      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = - ((clientY - rect.top) / rect.height) * 2 + 1;

      checkIntersections();
    }

    function checkIntersections() {
      raycaster.setFromCamera(pointer, camera);

      const intersects = raycaster.intersectObjects(interactables, true);

      if (intersects.length > 0) {
        let object = intersects[0].object;
        while (object && !object.userData.id) {
          object = object.parent;
        }

        if (object && hoveredGroup !== object) {
          hoveredGroup = object;
          document.body.style.cursor = 'pointer';
          handleUpdateUI(hoveredGroup.userData.id);
        }
      } else {
        if (hoveredGroup) {
          hoveredGroup = null;
          document.body.style.cursor = 'default';
          handleUpdateUI('default');
        }
      }
    }

    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('touchstart', onPointerMove, { passive: true });

    const clock = new THREE.Clock();
    let animationFrameId;
    let isVisible = false; // Start false to prevent blocking shaders compilation on load

    function animate() {
      animationFrameId = requestAnimationFrame(animate);

      // Skip rendering when section is out of viewport
      if (!isVisible) return;

      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      interactables.forEach(group => {
        const isHovered = (group === hoveredGroup);

        const targetScale = isHovered ? group.userData.hoverScale : 1.0;
        const targetY = group.userData.originalY + (isHovered ? 0.3 : 0) + Math.sin(time * 2 + group.position.x) * 0.05;

        group.position.y += (targetY - group.position.y) * 10 * delta;
        group.scale.x += (targetScale - group.scale.x) * 10 * delta;
        group.scale.y += (targetScale - group.scale.y) * 10 * delta;
        group.scale.z += (targetScale - group.scale.z) * 10 * delta;

        group.traverse(child => {
          if (child.isMesh && child.material.emissive) {
            if (child.material.userData && child.material.userData.isGlow) return;

            const currentEmissive = child.material.emissive.getHex();
            const targetEmissive = isHovered ? 0x222222 : 0x000000;

            if (currentEmissive !== targetEmissive) {
              child.material.emissive.setHex(targetEmissive);
            }
          }
        });
      });

      plant.children.forEach((child, i) => {
        if (child.geometry.type === 'DodecahedronGeometry') {
          child.rotation.y += Math.sin(time * 0.5 + i) * 0.005;
        }
      });

      const targetAngle = baseAngle + (pointer.x * 0.5);
      const targetHeight = baseHeight - (pointer.y * 3);

      const targetX = Math.sin(targetAngle) * baseRadius;
      const targetZ = Math.cos(targetAngle) * baseRadius;

      camera.position.x += (targetX - camera.position.x) * 3 * delta;
      camera.position.y += (targetHeight - camera.position.y) * 3 * delta;
      camera.position.z += (targetZ - camera.position.z) * 3 * delta;

      camera.lookAt(0, 1, 0);

      renderer.render(scene, camera);
    }

    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(isMobile ? 1.0 : Math.min(window.devicePixelRatio, 2));
      checkIntersections();
    };

    window.addEventListener('resize', handleResize);

    // Pause rendering when out of view for GPU savings
    const visibilityObserver = new IntersectionObserver((entries) => {
      isVisible = entries[0].isIntersecting;
    }, { threshold: 0.05 });
    visibilityObserver.observe(container);

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      visibilityObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('touchstart', onPointerMove);

      scene.traverse(object => {
        if (object.isMesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach(m => m.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      document.body.style.cursor = 'default';
      sceneElementsRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]); // Re-create scene if mobile state changes

  useEffect(() => {
    if (!sceneElementsRef.current.scene || !themeContext) return;

    const { scene, floorMaterial, gridMaterial, ambientLight, dirLight } = sceneElementsRef.current;

    // We adjust fog density: lower for light mode so we don't wash out colors in white fog
    const targetDensity = themeContext.name === 'dark' ? 0.025 : 0.012;
    const bgColor = new THREE.Color(themeContext.colors.bg);

    if (scene.fog) {
      scene.fog.color.copy(bgColor);
      scene.fog.density = targetDensity;
    }

    // In light mode we slightly adjust the ambient and directional lights for better contrast
    if (ambientLight) {
      ambientLight.intensity = themeContext.name === 'dark' ? 0.6 : 0.8;
    }
    if (dirLight) {
      dirLight.intensity = themeContext.name === 'dark' ? 1.2 : 0.9;
    }

    if (floorMaterial) {
      floorMaterial.color.copy(bgColor);
    }
    if (gridMaterial) {
      gridMaterial.color.setHex(themeContext.name === 'dark' ? 0x1e293b : 0xcbd5e1);
    }
  }, [themeContext]);

  return (
    <AboutSection id="about" $isRTL={isRTL}>
      <CanvasContainer ref={mountRef}></CanvasContainer>
      <UILayer>
        <HeaderBox>
          <Badge>CV Interactif</Badge>

          <InfoContent className={isFading ? 'fade-out' : ''}>
            <TitleRow>
              <CardIcon>{hoveredData.icon}</CardIcon>
              <CardTitle>{hoveredData.title}</CardTitle>
            </TitleRow>
            <CardDesc>
              {hoveredData.desc}
            </CardDesc>
          </InfoContent>
        </HeaderBox>
      </UILayer>
    </AboutSection>
  );
}
