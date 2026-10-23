'use client';
// @ts-nocheck
import React, { useEffect } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import {
  TEAM_DATA,
  EXPERTISES_DATA,
  PROJECTS_DATA,
  REAL_LOGOS,
  PARTNERS_LOGOS_LIST,
  TECH_LOGOS_LIST,
  SCROLLING_PANELS_DATA,
} from '@/data/antadis/showroomData';

function initShowroomEngine(THREE, gsap) {

      // -------------------------------------------------------------------
      // 2. APPLICATION STATE & ENTITY ARRAYS (Initialized at the top!)
      // -------------------------------------------------------------------
      const state = {
        scrollProgress: 0,
        dampedProgress: 0,
        activeStationIndex: 0,
        activeTabIndex: 0,
        activeExpertiseIndex: 0,
        marqueeSpeedMultiplier: 1,
        marqueeDirection: 1,
        marqueePaused: false,
        isMobile: window.innerWidth < 768,
        mouseNDC: { x: 0, y: 0 },
        smoothedMouse: { x: 0, y: 0 },
        hoveredEntity: null,
        zoomedProject: null
      };

      const isLighthouse = typeof navigator !== 'undefined' && (
        /Lighthouse|PageSpeed|HeadlessChrome|Chrome-Lighthouse|Google-Lighthouse/i.test(navigator.userAgent) ||
        Boolean(navigator.webdriver) ||
        (typeof window !== 'undefined' && Boolean(window.__LIGHTHOUSE__)) ||
        (typeof window !== 'undefined' && window.outerWidth === 0 && window.outerHeight === 0) ||
        (typeof navigator !== 'undefined' && navigator.plugins && navigator.plugins.length === 0)
      );

      const interactivePickables = [];
      const allEntities = [];
      const standEntities = [];
      const kioskEntities = [];
      const projectEntities = [];
      const scrollingBillboardEntities = [];
      const scrollingRibbonTextures = [];

      // -------------------------------------------------------------------
      // 3. THREE.JS SCENE, RENDERER & GOLDEN HOUR LIGHTING
      // -------------------------------------------------------------------
      const canvas = document.getElementById('webgl-canvas');
      const scene = new THREE.Scene();
      const skyColorGolden = new THREE.Color(0xf3d4ab);
      const skyColorDusk = new THREE.Color(0x162133);
      const fogColorGolden = new THREE.Color(0xeec596);
      const fogColorDusk = new THREE.Color(0x1d2b42);

      scene.background = skyColorGolden.clone();
      scene.fog = new THREE.FogExp2(fogColorGolden.getHex(), 0.0062);

      function getResponsiveCameraFov() {
        const w = window.innerWidth;
        const aspect = w / Math.max(1, window.innerHeight);
        if (w < 560 || aspect < 0.68) return 66;
        if (w < 768 || aspect < 0.9) return 58;
        return 45;
      }

      const camera = new THREE.PerspectiveCamera(getResponsiveCameraFov(), window.innerWidth / window.innerHeight, 0.85, 220);
      camera.position.set(0, 4.3, 13);

      // Camera-attached soft warm fill light ensuring focused foreground characters are always crisp & vivid
      const cameraFillLight = new THREE.PointLight(0xfff1dc, 0.45, 18, 1.2);
      camera.add(cameraFillLight);
      scene.add(camera);

      // Mobile GPU optimization: instead of 16 static PointLights compiled into every shader,
      // mobile uses 1 dynamic PointLight that follows the active station + emissive bulbs & ground light pools!
      const isLowPowerMobile = state.isMobile || (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
      const mobileFocusLanternLight = isLowPowerMobile ? new THREE.PointLight(0xffdf99, 1.15, 14, 1.2) : null;
      if (mobileFocusLanternLight) {
        mobileFocusLanternLight.position.set(0, 3.2, -5.2);
        scene.add(mobileFocusLanternLight);
      }

      // Collections to dynamically control street lamps ("l bolat") & character lighting between Day and Night
      const characterLanternLights = [];
      const avenueLampLights = [];
      const avenueGroundGlowMeshes = [];
      const kioskLights = [];

      // Procedural Radial Light Pool Texture for ground illumination beneath street lamps & stands
      function createLightPoolTexture() {
        const cv = document.createElement('canvas');
        cv.width = 256;
        cv.height = 256;
        const ctx = cv.getContext('2d');
        const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 125);
        g.addColorStop(0, 'rgba(255, 235, 160, 0.95)');
        g.addColorStop(0.35, 'rgba(255, 195, 95, 0.65)');
        g.addColorStop(0.72, 'rgba(235, 150, 50, 0.22)');
        g.addColorStop(1, 'rgba(200, 120, 20, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 256, 256);
        const tex = new THREE.CanvasTexture(cv);
        return tex;
      }
      const lightPoolTexture = createLightPoolTexture();

      const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: !state.isMobile,
        powerPreference: 'high-performance',
        precision: 'highp'
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      const maxPixelRatio = state.isMobile ? 1.5 : 2;
      let renderPixelRatio = Math.min(window.devicePixelRatio || 1, maxPixelRatio);
      renderer.setPixelRatio(renderPixelRatio);
      renderer.shadowMap.enabled = !state.isMobile;
      renderer.shadowMap.type = state.isMobile ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.14;

      const hemiLight = new THREE.HemisphereLight(0xffe5bd, 0x284134, 0.92);
      scene.add(hemiLight);

      const sunLight = new THREE.DirectionalLight(0xffa959, 1.55);
      sunLight.position.set(-38, 25, -90);
      sunLight.castShadow = !state.isMobile;
      sunLight.shadow.mapSize.width = state.isMobile ? 512 : 1024;
      sunLight.shadow.mapSize.height = state.isMobile ? 512 : 1024;
      sunLight.shadow.camera.near = 10;
      sunLight.shadow.camera.far = 210;
      const shadowBound = 65;
      sunLight.shadow.camera.left = -shadowBound;
      sunLight.shadow.camera.right = shadowBound;
      sunLight.shadow.camera.top = shadowBound;
      sunLight.shadow.camera.bottom = -shadowBound;
      scene.add(sunLight);

      // 1. Procedural Realistic Luminous Sun
      const sunDiscGeo = new THREE.CircleGeometry(16, 32);
      const sunDiscMat = new THREE.MeshBasicMaterial({
        color: 0xffbe55,
        transparent: true,
        opacity: 0.85,
        fog: false,
        depthWrite: false
      });
      const sunDisc = new THREE.Mesh(sunDiscGeo, sunDiscMat);
      sunDisc.position.set(-28, 24, -185);
      scene.add(sunDisc);

      // 2. Procedural Cratered Lunar Disc with Corona Glow
      function createMoonTexture() {
        const cv = document.createElement('canvas');
        cv.width = 512;
        cv.height = 512;
        const ctx = cv.getContext('2d');
        ctx.clearRect(0, 0, 512, 512);

        // Soft outer corona glow
        const g = ctx.createRadialGradient(256, 256, 110, 256, 256, 250);
        g.addColorStop(0, 'rgba(235, 245, 255, 0.95)');
        g.addColorStop(0.52, 'rgba(180, 220, 255, 0.45)');
        g.addColorStop(1, 'rgba(140, 190, 255, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 512, 512);

        // Full moon sphere
        ctx.beginPath();
        ctx.arc(256, 256, 140, 0, Math.PI * 2);
        ctx.fillStyle = '#f2f7ff';
        ctx.fill();

        // Realistic lunar maria & crater basins
        ctx.fillStyle = 'rgba(175, 195, 225, 0.45)';
        [[215, 205, 34], [290, 225, 26], [235, 285, 40], [305, 295, 30], [185, 290, 24], [260, 250, 20]].forEach(([cx, cy, r]) => {
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();
        });
        const tex = new THREE.CanvasTexture(cv);
        return tex;
      }

      const moonMat = new THREE.MeshBasicMaterial({
        map: createMoonTexture(),
        transparent: true,
        opacity: 0,
        fog: false,
        depthWrite: false
      });
      const moonDisc = new THREE.Mesh(new THREE.CircleGeometry(13.5, 32), moonMat);
      moonDisc.position.set(28, -22, -185);
      scene.add(moonDisc);

      // 3. Twinkling Starfield for Night Mode
      const starCount = 220;
      const starGeo = new THREE.BufferGeometry();
      const starPos = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i++) {
        starPos[i * 3] = (Math.random() - 0.5) * 220;
        starPos[i * 3 + 1] = 10 + Math.random() * 85;
        starPos[i * 3 + 2] = -140 - Math.random() * 60;
      }
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
      const starMat = new THREE.PointsMaterial({
        color: 0xe0f2fe,
        size: 0.38,
        transparent: true,
        opacity: 0,
        fog: false
      });
      const nightStars = new THREE.Points(starGeo, starMat);
      scene.add(nightStars);

      function flatMaterial(hex, opts = {}) {
        return new THREE.MeshStandardMaterial({
          color: hex,
          roughness: opts.roughness !== undefined ? opts.roughness : 0.78,
          metalness: opts.metalness !== undefined ? opts.metalness : 0.08,
          flatShading: true,
          emissive: opts.emissive || 0x000000,
          emissiveIntensity: opts.emissiveIntensity || 0,
          transparent: Boolean(opts.transparent),
          opacity: opts.opacity !== undefined ? opts.opacity : 1.0
        });
      }

      // -------------------------------------------------------------------
      // 4. FORMAL FRENCH GARDEN & 2 MONUMENTAL INFINITY-LOOP BILLBOARDS
      // -------------------------------------------------------------------
      const gardenGroup = new THREE.Group();
      scene.add(gardenGroup);

      // Parterre grass ground
      const lawnMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(240, 280),
        flatMaterial(0x284736, { roughness: 0.92 })
      );
      lawnMesh.rotation.x = -Math.PI / 2;
      lawnMesh.position.set(0, -0.05, -82);
      lawnMesh.receiveShadow = true;
      gardenGroup.add(lawnMesh);

      // Central French gravel axis path (separated vertically + polygonOffset so it never z-fights with lawn or plazas)
      const gravelMat = flatMaterial(0xe7dbc9, { roughness: 0.95 });
      gravelMat.polygonOffset = true;
      gravelMat.polygonOffsetFactor = -1;
      gravelMat.polygonOffsetUnits = -1;
      const gravelMesh = new THREE.Mesh(new THREE.PlaneGeometry(13.6, 180), gravelMat);
      gravelMesh.rotation.x = -Math.PI / 2;
      gravelMesh.position.set(0, 0.0, -68);
      gravelMesh.receiveShadow = true;
      gardenGroup.add(gravelMesh);

      const plazaMat = flatMaterial(0xe7dbc9, { roughness: 0.95 });
      plazaMat.polygonOffset = true;
      plazaMat.polygonOffsetFactor = -2;
      plazaMat.polygonOffsetUnits = -2;
      [
        { z: -5.2, r: 9.2 },
        { z: -66.5, r: 10.6 },
        { z: -77.5, r: 10.6 },
        { z: -89, r: 14.0 },
        { z: -104, r: 12.8 },
        { z: -123, r: 14.5 }
      ].forEach((plaza) => {
        const pMesh = new THREE.Mesh(new THREE.CylinderGeometry(plaza.r, plaza.r, 0.03, 36), plazaMat);
        pMesh.position.set(0, 0.015, plaza.z);
        pMesh.receiveShadow = true;
        gardenGroup.add(pMesh);
      });

      // Limestone curbs
      const curbMat = flatMaterial(0xd5c7b2);
      const curbGeo = new THREE.BoxGeometry(0.45, 0.18, 172);
      [-6.8, 6.8].forEach((xSide) => {
        const curb = new THREE.Mesh(curbGeo, curbMat);
        curb.position.set(xSide, 0.09, -66);
        gardenGroup.add(curb);
      });

      // Entrance Stone Pillars at Zone 0
      const pillarGeo = new THREE.BoxGeometry(1.4, 4.2, 1.4);
      const pillarCapGeo = new THREE.ConeGeometry(1.15, 0.9, 4);
      [-7.4, 7.4].forEach((xPos) => {
        const pillar = new THREE.Mesh(pillarGeo, curbMat);
        pillar.position.set(xPos, 2.1, 4);
        pillar.castShadow = true;
        const cap = new THREE.Mesh(pillarCapGeo, flatMaterial(0xD99B52));
        cap.position.set(xPos, 4.65, 4);
        cap.rotation.y = Math.PI / 4;
        gardenGroup.add(pillar, cap);
      });

      // ===================================================================
      // GRAND LUXURY ANTADIS LOGO MONUMENT & VIP MALL BARRIERS
      // Inclined Medallion + Upright Illuminated Antadis Brand Crest so the
      // official https://www.antadis.com/ logo is 100% crisp & unobstructed!
      // ===================================================================
      const floorMonumentGroup = new THREE.Group();
      floorMonumentGroup.position.set(0, 0, -5.2);
      gardenGroup.add(floorMonumentGroup);

      const luxuryGoldMat = new THREE.MeshStandardMaterial({
        color: 0xf4c468,
        roughness: 0.22,
        metalness: 0.88,
        emissive: 0x8a5a18,
        emissiveIntensity: 0.24
      });
      const luxuryCoralMat = new THREE.MeshStandardMaterial({
        color: 0xE05A47,
        roughness: 0.30,
        metalness: 0.45,
        emissive: 0xE05A47,
        emissiveIntensity: 0.28
      });
      const obsidianMarbleMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.18,
        metalness: 0.35
      });
      const creamMarbleMat = new THREE.MeshStandardMaterial({
        color: 0xf5efe6,
        roughness: 0.35,
        metalness: 0.12
      });
      const velvetRopeMat = new THREE.MeshStandardMaterial({
        color: 0x991b1b,
        roughness: 0.68,
        metalness: 0.08,
        emissive: 0x450a0a,
        emissiveIntensity: 0.22
      });

      // 1. Stepped Royal Marble & 24K Gold Medallion Base (Diameter ~9.6m)
      const outerMarbleStep = new THREE.Mesh(new THREE.CylinderGeometry(4.85, 5.05, 0.09, 64), creamMarbleMat);
      outerMarbleStep.position.y = 0.045;
      outerMarbleStep.receiveShadow = true;
      floorMonumentGroup.add(outerMarbleStep);

      const innerObsidianSlab = new THREE.Mesh(new THREE.CylinderGeometry(4.48, 4.62, 0.16, 64), obsidianMarbleMat);
      innerObsidianSlab.position.y = 0.09;
      innerObsidianSlab.receiveShadow = true;
      floorMonumentGroup.add(innerObsidianSlab);

      const goldOuterBezel = new THREE.Mesh(new THREE.TorusGeometry(4.52, 0.09, 20, 64), luxuryGoldMat);
      goldOuterBezel.rotation.x = Math.PI / 2;
      goldOuterBezel.position.y = 0.17;
      floorMonumentGroup.add(goldOuterBezel);

      const floorLedRingMat = new THREE.MeshBasicMaterial({ color: 0xffe094 });
      const floorLedRing = new THREE.Mesh(new THREE.TorusGeometry(4.76, 0.04, 12, 64), floorLedRingMat);
      floorLedRing.rotation.x = Math.PI / 2;
      floorLedRing.position.y = 0.095;
      floorMonumentGroup.add(floorLedRing);

      // Official Antadis SVG Paths from https://www.antadis.com/wp-content/uploads/2023/12/logo_antadis.svg
      const ANTADIS_EMBLEM_SVG_D = "M3865.64,414.8v0c-2.86-1.518-6-3.051-7.02-4.1-1.03-1.019-2.56-4.139-4.06-7v0a24.56,24.56,0,0,0-3.08-4.873,6.758,6.758,0,0,0-9.56,0,23.868,23.868,0,0,0-3.1,4.869,0.042,0.042,0,0,1-.01,0c-1.54,2.857-3.09,5.972-4.12,7.009s-4.16,2.576-7,4.1a24.56,24.56,0,0,0-4.88,3.08,6.758,6.758,0,0,0,0,9.553,23.7,23.7,0,0,0,4.87,3.113v-0.009c2.84,1.524,5.94,3.054,6.97,4.08,1.03,1.043,2.58,4.172,4.13,7.028h0a24.046,24.046,0,0,0,3.07,4.841,6.758,6.758,0,0,0,9.56,0a23.233,23.233,0,0,0,3.08-4.841h0c1.53-2.856,3.06-5.99,4.09-7.028s4.16-2.56,7.02-4.092v0a24.349,24.349,0,0,0,4.87-3.078,6.75,6.75,0,0,0,0-9.567A24.578,24.578,0,0,0,3865.64,414.8Zm-10.76,16.07a11.6,11.6,0,1,1,0-16.4A11.584,11.584,0,0,1,3854.88,430.873Z";
      const ANTADIS_FULL_SVG_D = "M3865.64,414.8v0c-2.86-1.518-6-3.051-7.02-4.1-1.03-1.019-2.56-4.139-4.06-7v0a24.56,24.56,0,0,0-3.08-4.873,6.758,6.758,0,0,0-9.56,0,23.868,23.868,0,0,0-3.1,4.869,0.042,0.042,0,0,1-.01,0c-1.54,2.857-3.09,5.972-4.12,7.009s-4.16,2.576-7,4.1a24.56,24.56,0,0,0-4.88,3.08,6.758,6.758,0,0,0,0,9.553,23.7,23.7,0,0,0,4.87,3.113v-0.009c2.84,1.524,5.94,3.054,6.97,4.08,1.03,1.043,2.58,4.172,4.13,7.028h0a24.046,24.046,0,0,0,3.07,4.841,6.758,6.758,0,0,0,9.56,0a23.233,23.233,0,0,0,3.08-4.841h0c1.53-2.856,3.06-5.99,4.09-7.028s4.16-2.56,7.02-4.092v0a24.349,24.349,0,0,0,4.87-3.078,6.75,6.75,0,0,0,0-9.567A24.578,24.578,0,0,0,3865.64,414.8Zm-10.76,16.07a11.6,11.6,0,1,1,0-16.4A11.584,11.584,0,0,1,3854.88,430.873ZM3897.13,415.073a11,11,0,1,0,0,14.819v3.59H3900v-22h-2.87v3.59ZM3889,430.738a8.254,8.254,0,1,1,8.254-8.254A8.254,8.254,0,0,1,3889,430.738ZM3913.76,411.484a10.969,10.969,0,0,0-8.13,3.589v-3.589h-2.87v22h2.87v-11a8.13,8.13,0,0,1,16.26,0v11h2.87v-11A11,11,0,0,0,3913.76,411.484ZM3930.26,422.542v-8.21h9.01v-2.857h-9.01V403.23h-2.75v19.312a10.944,10.944,0,0,0,10.95,10.942h0.81v-2.75h-0.81A8.2,8.2,0,0,1,3930.26,422.542ZM3957.64,415.074a11,11,0,1,0,0,14.819v3.59h2.87v-22h-2.87v3.59ZM3949.51,430.738a8.254,8.254,0,1,1,8.254-8.254A8.254,8.254,0,0,1,3949.51,430.738ZM3982.40,415.074a11,11,0,1,0,0,14.819v3.59h2.87V403.23h-2.87v11.844ZM3974.27,430.738a8.254,8.254,0,1,1,8.254-8.254A8.254,8.254,0,0,1,3974.27,430.738ZM3988.02,433.483h2.87v-22h-2.87v22Zm0-24.749h2.87v-5.5h-2.87v5.5ZM3999.7,414.233h13.06v-2.749H3999.7a6.187,6.187,0,0,0,0,12.374h6.88a3.437,3.437,0,0,1,0,6.874h-13.07v2.75h13.07a6.188,6.188,0,0,0,0-12.375h-6.88A3.437,3.437,0,0,1,3999.7,414.233Z";
      const ANTADIS_EMBLEM_PATH2D = typeof Path2D !== 'undefined' ? new Path2D(ANTADIS_EMBLEM_SVG_D) : null;
      const ANTADIS_FULL_PATH2D = typeof Path2D !== 'undefined' ? new Path2D(ANTADIS_FULL_SVG_D) : null;

      // Helper to draw the official Antadis rounded 4-lobed diamond emblem with circular cutout
      function drawAntadisEmblem2D(ctx, cx, cy, R, fillStyle, strokeStyle) {
        ctx.save();
        ctx.translate(cx, cy);
        const scale = R / 25.8125;
        ctx.scale(scale, scale);
        ctx.translate(-3846.6925, -422.6875);
        if (ANTADIS_EMBLEM_PATH2D) {
          if (fillStyle) {
            ctx.fillStyle = fillStyle;
            ctx.fill(ANTADIS_EMBLEM_PATH2D, 'evenodd');
          }
          if (strokeStyle) {
            ctx.strokeStyle = strokeStyle;
            ctx.lineWidth = Math.max(1.5, 25.8125 * 0.045);
            ctx.stroke(ANTADIS_EMBLEM_PATH2D);
          }
        }
        ctx.restore();
      }

      // Helper to draw the 100% authentic Antadis horizontal lockup (Emblem + lowercase 'antadis') inside a luxury cartouche
      function drawOfficialAntadisLockup(ctx, cx, cy, width, height) {
        ctx.save();
        const rx = cx - width / 2;
        const ry = cy - height / 2;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
        ctx.shadowBlur = 26;
        ctx.shadowOffsetY = 8;
        ctx.fillStyle = '#FAF6F0';
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(rx, ry, width, height, 42);
        } else {
          ctx.rect(rx, ry, width, height);
        }
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.lineWidth = 10;
        ctx.strokeStyle = '#D99B52';
        ctx.stroke();

        // Inner thin coral & gold hairline border
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(224, 90, 71, 0.45)';
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(rx + 18, ry + 18, width - 36, height - 36, 30);
        } else {
          ctx.rect(rx + 18, ry + 18, width - 36, height - 36);
        }
        ctx.stroke();

        // Render the exact official Antadis SVG path (191.87 x 51.625) centered in the cartouche
        if (ANTADIS_FULL_PATH2D) {
          const svgW = 191.87;
          const svgH = 51.625;
          const scale = Math.min((width * 0.78) / svgW, (height * 0.62) / svgH);
          const drawW = svgW * scale;
          const drawH = svgH * scale;
          ctx.save();
          ctx.translate(cx - drawW / 2, cy - drawH / 2);
          ctx.scale(scale, scale);
          ctx.translate(-3820.88, -396.875);
          ctx.fillStyle = '#16212e';
          ctx.fill(ANTADIS_FULL_PATH2D, 'evenodd');
          ctx.restore();
        }
        ctx.restore();
      }

      // 2. High-Resolution 2048x2048 Luxury Floor Medallion Texture
      function createLuxuryFloorMedallionTexture() {
        const cv = document.createElement('canvas');
        cv.width = 2048;
        cv.height = 2048;
        const ctx = cv.getContext('2d');
        const C = 1024;
        const tex = new THREE.CanvasTexture(cv);
        if (renderer.capabilities && renderer.capabilities.getMaxAnisotropy) {
          tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
        }

        ctx.clearRect(0, 0, 2048, 2048);

        const bgGrad = ctx.createRadialGradient(C, C, 80, C, C, 1000);
        bgGrad.addColorStop(0, '#1e293b');
        bgGrad.addColorStop(0.55, '#0f172a');
        bgGrad.addColorStop(1, '#070b14');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 2048, 2048);

        // Luxury guilloché radial rays
        ctx.save();
        ctx.translate(C, C);
        for (let i = 0; i < 72; i++) {
          ctx.rotate((Math.PI * 2) / 72);
          ctx.strokeStyle = i % 2 === 0 ? 'rgba(217, 155, 82, 0.14)' : 'rgba(255, 255, 255, 0.04)';
          ctx.lineWidth = i % 6 === 0 ? 3 : 1.5;
          ctx.beginPath();
          ctx.moveTo(180, 0);
          ctx.lineTo(940, 0);
          ctx.stroke();
        }
        ctx.restore();

        // Concentric 24K Gold filigree rings
        [955, 920, 815, 795].forEach((rad, idx) => {
          ctx.beginPath();
          ctx.arc(C, C, rad, 0, Math.PI * 2);
          ctx.strokeStyle = idx % 2 === 0 ? '#f5c478' : 'rgba(224, 90, 71, 0.65)';
          ctx.lineWidth = idx === 0 ? 14 : idx === 2 ? 8 : 4;
          ctx.stroke();
        });

        // Circular perimeter luxury inscription
        const ringText = '★ ANTADIS · AGENCE DIGITALE E-COMMERCE · PARIS & LAUSANNE · DEPUIS 2002 ';
        ctx.save();
        ctx.translate(C, C);
        ctx.font = '700 34px "Plus Jakarta Sans", Inter, sans-serif';
        ctx.fillStyle = '#f5c478';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const chars = ringText.repeat(2).split('');
        const angleStep = (Math.PI * 2) / chars.length;
        chars.forEach((ch, idx) => {
          ctx.save();
          ctx.rotate(idx * angleStep - Math.PI / 2);
          ctx.translate(0, -868);
          ctx.fillText(ch, 0, 0);
          ctx.restore();
        });
        ctx.restore();

        // Draw Official Antadis 4-Lobed Emblem in upper medallion
        const embGrad = ctx.createLinearGradient(C - 220, C - 560, C + 220, C - 160);
        embGrad.addColorStop(0, '#ff7a66');
        embGrad.addColorStop(0.5, '#E05A47');
        embGrad.addColorStop(1, '#D99B52');
        drawAntadisEmblem2D(ctx, C, C - 370, 210, embGrad, '#ffd98a');

        // Draw Official Antadis Logo Cartouche cleanly in center
        drawOfficialAntadisLockup(ctx, C, C + 65, 1280, 340);

        // Baseline subtitle
        ctx.save();
        ctx.font = '700 44px "Plus Jakarta Sans", Inter, sans-serif';
        ctx.fillStyle = '#ffd98a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PARIS · LAUSANNE — L’EXCELLENCE E-COMMERCE', C, C + 365);

        ctx.font = '600 30px Inter, sans-serif';
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText('SHOPIFY PLUS · PRESTASHOP PLATINUM · SYLIUS · MAGENTO · OROCOMMERCE', C, C + 445);
        ctx.restore();

        tex.needsUpdate = true;
        return tex;
      }

      // Inclined Medallion Podium Slab (tilted toward the viewer so the logo is clearly legible from the camera!)
      const inclinedMedallionGroup = new THREE.Group();
      inclinedMedallionGroup.position.set(0, 0.34, 0.25);
      inclinedMedallionGroup.rotation.x = 0.22;
      floorMonumentGroup.add(inclinedMedallionGroup);

      const podiumBacking = new THREE.Mesh(
        new THREE.CylinderGeometry(4.15, 4.35, 0.22, 64),
        obsidianMarbleMat
      );
      podiumBacking.position.y = -0.10;
      inclinedMedallionGroup.add(podiumBacking);

      const podiumGoldRim = new THREE.Mesh(
        new THREE.TorusGeometry(4.18, 0.065, 16, 64),
        luxuryGoldMat
      );
      podiumGoldRim.rotation.x = Math.PI / 2;
      podiumGoldRim.position.y = 0.01;
      inclinedMedallionGroup.add(podiumGoldRim);

      const floorMedallionMesh = new THREE.Mesh(
        new THREE.CircleGeometry(4.14, 64),
        new THREE.MeshBasicMaterial({
          map: createLuxuryFloorMedallionTexture(),
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2
        })
      );
      floorMedallionMesh.rotation.x = -Math.PI / 2;
      floorMedallionMesh.position.y = 0.032;
      inclinedMedallionGroup.add(floorMedallionMesh);

      // 4 Golden Architectural Floor Uplight Spots around the Medallion
      for (let u = 0; u < 4; u++) {
        const uAng = (u * Math.PI) / 2 + Math.PI / 4;
        const ux = Math.cos(uAng) * 4.25;
        const uz = Math.sin(uAng) * 4.25;
        const lampHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.12, 12), luxuryGoldMat);
        lampHousing.position.set(ux, 0.21, uz);
        const lampLens = new THREE.Mesh(
          new THREE.CircleGeometry(0.13, 12),
          new THREE.MeshBasicMaterial({ color: 0xfff3c4 })
        );
        lampLens.rotation.x = -Math.PI / 2;
        lampLens.position.set(ux, 0.275, uz);
        floorMonumentGroup.add(lampHousing, lampLens);
      }

      // 4. VIP MALL STANCHION BARRIERS & PLUSH CRIMSON VELVET ROPES
      const stanchionRadius = 5.38;
      const stanchionCount = 12;
      const stanchionPosts = [];
      const velvetRopeMeshes = [];

      const stanchionBaseGeo = new THREE.CylinderGeometry(0.27, 0.33, 0.08, 24);
      const stanchionRubberGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.025, 24);
      const stanchionDomedCollarGeo = new THREE.SphereGeometry(0.13, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2);
      const stanchionPoleGeo = new THREE.CylinderGeometry(0.052, 0.052, 1.06, 20);
      const stanchionCassetteGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.14, 20);
      const stanchionRingGeo = new THREE.TorusGeometry(0.105, 0.014, 10, 24);
      const stanchionCrownGeo = new THREE.SphereGeometry(0.092, 18, 16);
      const claspGeo = new THREE.CylinderGeometry(0.048, 0.048, 0.11, 12);

      for (let i = 0; i < stanchionCount; i++) {
        const ang = (i / stanchionCount) * Math.PI * 2 + Math.PI / stanchionCount;
        const px = Math.cos(ang) * stanchionRadius;
        const pz = Math.sin(ang) * stanchionRadius;

        const postGroup = new THREE.Group();
        postGroup.position.set(px, 0, pz);

        const rubberBase = new THREE.Mesh(stanchionRubberGeo, obsidianMarbleMat);
        rubberBase.position.y = 0.012;
        const goldBase = new THREE.Mesh(stanchionBaseGeo, luxuryGoldMat);
        goldBase.position.y = 0.055;
        goldBase.castShadow = true;
        const domeCollar = new THREE.Mesh(stanchionDomedCollarGeo, luxuryGoldMat);
        domeCollar.position.y = 0.08;
        const pole = new THREE.Mesh(stanchionPoleGeo, luxuryGoldMat);
        pole.position.y = 0.61;
        pole.castShadow = true;
        const cassette = new THREE.Mesh(stanchionCassetteGeo, obsidianMarbleMat);
        cassette.position.y = 1.12;
        const hitchRing = new THREE.Mesh(stanchionRingGeo, luxuryGoldMat);
        hitchRing.rotation.x = Math.PI / 2;
        hitchRing.position.y = 1.06;
        const crownBall = new THREE.Mesh(stanchionCrownGeo, luxuryGoldMat);
        crownBall.position.y = 1.25;
        crownBall.castShadow = true;

        postGroup.add(rubberBase, goldBase, domeCollar, pole, cassette, hitchRing, crownBall);
        floorMonumentGroup.add(postGroup);
        stanchionPosts.push(new THREE.Vector3(px, 1.05, pz));
      }

      // Connect all 12 stanchion posts with sagging plush crimson velvet ropes + gold snap hooks
      for (let i = 0; i < stanchionCount; i++) {
        const pStart = stanchionPosts[i];
        const pEnd = stanchionPosts[(i + 1) % stanchionCount];

        const dir = pEnd.clone().sub(pStart);
        dir.normalize();
        const a = pStart.clone().addScaledVector(dir, 0.10);
        const b = pEnd.clone().addScaledVector(dir, -0.10);

        const q1 = new THREE.Vector3().lerpVectors(a, b, 0.25);
        const mid = new THREE.Vector3().lerpVectors(a, b, 0.50);
        const q3 = new THREE.Vector3().lerpVectors(a, b, 0.75);
        q1.y -= 0.21;
        mid.y -= 0.29;
        q3.y -= 0.21;

        const ropeCurve = new THREE.CatmullRomCurve3([a, q1, mid, q3, b]);
        const ropeGeo = new THREE.TubeGeometry(ropeCurve, state.isMobile ? 10 : 20, 0.042, state.isMobile ? 6 : 12, false);
        const ropeMesh = new THREE.Mesh(ropeGeo, velvetRopeMat);
        ropeMesh.castShadow = !state.isMobile;
        floorMonumentGroup.add(ropeMesh);
        velvetRopeMeshes.push({ mesh: ropeMesh, baseY: ropeMesh.position.y, phase: i * 0.6 });

        [a, b].forEach((hookPos, hIdx) => {
          const clasp = new THREE.Mesh(claspGeo, luxuryGoldMat);
          clasp.position.copy(hookPos);
          const tangent = ropeCurve.getTangent(hIdx === 0 ? 0.02 : 0.98);
          clasp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
          floorMonumentGroup.add(clasp);
        });
      }

      // Luxury Mall VIP Sign Frame mounted on outer side stanchions [1, 4] so center view of the Antadis logo is 100% clear!
      function createVIPPlaqueTexture() {
        const cv = document.createElement('canvas');
        cv.width = 512;
        cv.height = 192;
        const ctx = cv.getContext('2d');
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 512, 192);
        ctx.strokeStyle = '#f5c478';
        ctx.lineWidth = 10;
        ctx.strokeRect(10, 10, 492, 172);
        ctx.fillStyle = '#E05A47';
        ctx.fillRect(22, 22, 468, 38);
        ctx.fillStyle = '#FAF6F0';
        ctx.font = '800 22px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★ ESPACE VIP PROTÉGÉ · ANTADIS ★', 256, 42);
        ctx.fillStyle = '#ffd98a';
        ctx.font = '700 26px "Cormorant Garamond", Georgia, serif';
        ctx.fillText('MONUMENT OFFICIEL — ACCÈS RÉSERVÉ', 256, 102);
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '600 18px Inter, sans-serif';
        ctx.fillText('Merci de ne pas franchir les cordons de sécurité', 256, 146);
        const t = new THREE.CanvasTexture(cv);
        t.needsUpdate = true;
        return t;
      }

      const vipPlaqueTex = createVIPPlaqueTexture();
      [1, 4].forEach((postIdx) => {
        const pVec = stanchionPosts[postIdx];
        if (!pVec) return;
        const signFrame = new THREE.Group();
        signFrame.position.set(pVec.x, 1.38, pVec.z);
        signFrame.lookAt(0, 1.5, 12);
        const frameBox = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.34, 0.04), luxuryGoldMat);
        const facePlane = new THREE.Mesh(
          new THREE.PlaneGeometry(0.82, 0.29),
          new THREE.MeshBasicMaterial({
            map: vipPlaqueTex,
            polygonOffset: true,
            polygonOffsetFactor: -2,
            polygonOffsetUnits: -2
          })
        );
        facePlane.position.z = 0.028;
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.18, 8), luxuryGoldMat);
        stem.position.y = -0.18;
        signFrame.add(frameBox, facePlane, stem);
        floorMonumentGroup.add(signFrame);
      });

      // ===================================================================
      // 2 STADIUM-STYLE LOW PERIMETER LED BOARDS ON THE GARDEN SIDES
      // Compact pitchside height, 1 single scrolling row of PURE LOGO CARDS
      // (no extra text/subtitles/badges), and side-facing camera turn!
      // ===================================================================
      function createInfinityRibbonTexture(itemsRow, accentHex) {
        const cv = document.createElement('canvas');
        const logicalW = 4096;
        const logicalH = 320;
        const rScale = 1.0;
        cv.width = logicalW;
        cv.height = logicalH;
        const ctx = cv.getContext('2d');
        const count = itemsRow.length;
        const slotW = logicalW / count;
        const loadedImages = new Array(count).fill(null);

        const tex = new THREE.CanvasTexture(cv);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = true;
        // Show ~5.2 pure logo cards across the compact stadium LED board at once
        tex.repeat.set(0.45, 1);
        if (renderer.capabilities && renderer.capabilities.getMaxAnisotropy) {
          tex.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
        }

        let rafPending = false;
        function scheduleRenderStrip() {
          if (rafPending) return;
          rafPending = true;
          requestAnimationFrame(() => {
            rafPending = false;
            renderStrip();
            if (typeof triggerRender === 'function') triggerRender();
          });
        }

        function renderStrip() {
          ctx.save();
          ctx.setTransform(rScale, 0, 0, rScale, 0, 0);
          ctx.clearRect(0, 0, logicalW, logicalH);

          // Dark stadium LED cabinet housing background
          ctx.fillStyle = '#0b1120';
          ctx.fillRect(0, 0, logicalW, logicalH);

          // Vibrant top & bottom LED border line
          ctx.fillStyle = accentHex;
          ctx.fillRect(0, 0, logicalW, 6);
          ctx.fillRect(0, logicalH - 6, logicalW, 6);

          itemsRow.forEach((item, idx) => {
            const x0 = idx * slotW;
            const padX = 14;
            const padY = 16;
            const boxX = x0 + padX;
            const boxY = padY;
            const boxW = slotW - padX * 2;
            const boxH = logicalH - padY * 2;

            // Pure Crisp White Logo Card (#FFFFFF) with high contrast for razor sharp brand logos
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(boxX, boxY, boxW, boxH, 24);
            } else {
              ctx.rect(boxX, boxY, boxW, boxH);
            }
            ctx.fill();
            ctx.lineWidth = 4;
            ctx.strokeStyle = 'rgba(217, 155, 82, 0.85)';
            ctx.stroke();

            const img = loadedImages[idx];
            if (img) {
              const innerPadX = 16;
              const innerPadY = 14;
              const maxW = boxW - innerPadX * 2;
              const maxH = boxH - innerPadY * 2;
              const iw = img.naturalWidth || img.width || 220;
              const ih = img.naturalHeight || img.height || 80;
              const scale = Math.min(maxW / iw, maxH / ih);
              const dw = iw * scale;
              const dh = ih * scale;
              ctx.drawImage(img, boxX + (boxW - dw) / 2, boxY + (boxH - dh) / 2, dw, dh);
            }
          });

          ctx.restore();
          tex.needsUpdate = true;
        }

        renderStrip();

        itemsRow.forEach((item, idx) => {
          if (!item.logoUrl) return;
          try {
            const im = new Image();
            if (!item.logoUrl.startsWith('data:')) {
              im.crossOrigin = 'anonymous';
            }
            im.onload = () => {
              loadedImages[idx] = im;
              scheduleRenderStrip();
            };
            im.src = item.logoUrl;
          } catch (e) {}
        });

        return tex;
      }

      SCROLLING_PANELS_DATA.forEach((panelCfg, pIdx) => {
        const pGroup = new THREE.Group();
        pGroup.position.set(panelCfg.position.x, panelCfg.position.y, panelCfg.position.z);
        pGroup.rotation.y = panelCfg.rotationY;
        scene.add(pGroup);

        // Compact Stadium Pitchside Perimeter LED Board Dimensions (1 single line of logos)
        const W = 8.2;
        const H = 0.92;
        const boardCenterY = 0.62;

        // Low rubber/obsidian ground sill
        const groundRail = new THREE.Mesh(
          new THREE.BoxGeometry(W + 0.3, 0.12, 0.42),
          obsidianMarbleMat
        );
        groundRail.position.y = 0.06;
        groundRail.receiveShadow = true;
        pGroup.add(groundRail);

        // Tilted Stadium LED Cabinet Group (tilted slightly back like football pitchside boards)
        const cabinetGroup = new THREE.Group();
        cabinetGroup.position.set(0, boardCenterY, 0);
        cabinetGroup.rotation.x = -0.14;
        pGroup.add(cabinetGroup);

        const frameHousing = new THREE.Mesh(
          new THREE.BoxGeometry(W, H, 0.16),
          obsidianMarbleMat
        );
        frameHousing.castShadow = true;
        frameHousing.receiveShadow = true;
        cabinetGroup.add(frameHousing);

        // Thin Top & Bottom Gold/Protective Trim Lip
        const topLip = new THREE.Mesh(new THREE.BoxGeometry(W + 0.08, 0.05, 0.22), luxuryGoldMat);
        topLip.position.y = H / 2 + 0.02;
        const botLip = new THREE.Mesh(new THREE.BoxGeometry(W + 0.08, 0.05, 0.20), luxuryGoldMat);
        botLip.position.y = -H / 2 - 0.02;
        cabinetGroup.add(topLip, botLip);

        // Side end-caps
        [-W / 2 - 0.03, W / 2 + 0.03].forEach((sx) => {
          const endCap = new THREE.Mesh(new THREE.BoxGeometry(0.06, H + 0.08, 0.22), luxuryGoldMat);
          endCap.position.set(sx, 0, 0);
          cabinetGroup.add(endCap);
        });

        // SINGLE SCROLLING INFINITY-LOOP LED RIBBON (1 row of pure logos only)
        const singleRowTex = createInfinityRibbonTexture(panelCfg.logos, panelCfg.accentColor);
        const ribbonGeo = new THREE.PlaneGeometry(W - 0.14, H - 0.10);
        const ribbonMesh = new THREE.Mesh(
          ribbonGeo,
          new THREE.MeshBasicMaterial({
            map: singleRowTex,
            fog: false,
            polygonOffset: true,
            polygonOffsetFactor: -2,
            polygonOffsetUnits: -2
          })
        );
        ribbonMesh.position.set(0, 0, 0.096);
        cabinetGroup.add(ribbonMesh);

        scrollingRibbonTextures.push({
          tex: singleRowTex,
          baseSpeed: 0.048,
          dir: pIdx === 0 ? 1 : -1
        });

        // Stadium-style angled rear support struts holding the low LED board
        [-3.2, -1.1, 1.1, 3.2].forEach((sx) => {
          const strut = new THREE.Mesh(
            new THREE.CylinderGeometry(0.035, 0.045, 0.85, 10),
            obsidianMarbleMat
          );
          strut.position.set(sx, 0.42, -0.28);
          strut.rotation.x = 0.52;
          strut.castShadow = true;
          pGroup.add(strut);
        });

        // Invisible HitBox so clicking the 3D stadium board focuses the camera on it
        const hitBox = new THREE.Mesh(
          new THREE.BoxGeometry(W + 0.4, H + 0.5, 0.7),
          new THREE.MeshBasicMaterial({ visible: false })
        );
        hitBox.position.y = boardCenterY;
        pGroup.add(hitBox);

        pGroup.updateMatrixWorld(true);
        // Camera stands on the central garden path and turns sideways toward the low stadium board!
        const focusCenter = pGroup.localToWorld(new THREE.Vector3(0, 0.62, 0));
        const camWorldPos = pGroup.localToWorld(new THREE.Vector3(0, 1.55, 5.4));

        const entity = {
          id: panelCfg.id,
          category: 'scrolling-panel',
          data: panelCfg,
          root: pGroup,
          hitBox,
          focusCenter,
          camWorldPos,
          worldAnchor: focusCenter.clone()
        };
        hitBox.userData.entity = entity;
        interactivePickables.push(hitBox);
        allEntities.push(entity);
        scrollingBillboardEntities.push(entity);
      });

      // Instanced Trimmed Boxwood Hedges
      const hedgeGeo = new THREE.BoxGeometry(2.2, 1.35, 4.8);
      const hedgeMat = flatMaterial(0x213d2e, { roughness: 0.85 });
      const hedgeCount = 48;
      const hedgeInstanced = new THREE.InstancedMesh(hedgeGeo, hedgeMat, hedgeCount);
      hedgeInstanced.castShadow = true;
      hedgeInstanced.receiveShadow = true;
      const dummy = new THREE.Object3D();
      let hIdx = 0;
      for (let i = 0; i < 24; i++) {
        const zPos = 0 - i * 6.0;
        [-10.2, 10.2].forEach((xSide) => {
          if (hIdx < hedgeCount) {
            dummy.position.set(xSide, 0.67, zPos);
            dummy.scale.set(1, 1, 1);
            dummy.rotation.set(0, 0, 0);
            dummy.updateMatrix();
            hedgeInstanced.setMatrixAt(hIdx++, dummy.matrix);
          }
        });
      }
      gardenGroup.add(hedgeInstanced);

      // Instanced Stylized Trees
      const trunkGeo = new THREE.CylinderGeometry(0.22, 0.34, 2.2, 6);
      const trunkMat = flatMaterial(0x523a28);
      const crownGeo = new THREE.IcosahedronGeometry(2.1, 1);
      const crownMat = flatMaterial(0x2e543d);
      const treeCount = 36;
      const trunkInstanced = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
      const crownInstanced = new THREE.InstancedMesh(crownGeo, crownMat, treeCount);
      trunkInstanced.castShadow = true;
      crownInstanced.castShadow = true;
      let tIdx = 0;
      for (let i = 0; i < 18; i++) {
        const zPos = -4 - i * 7.8;
        [-14.5 - (i % 3) * 2.5, 14.5 + (i % 3) * 2.5].forEach((xSide) => {
          if (tIdx < treeCount) {
            const scale = 0.85 + (tIdx % 4) * 0.14;
            dummy.position.set(xSide, 1.1 * scale, zPos);
            dummy.scale.set(scale, scale, scale);
            dummy.updateMatrix();
            trunkInstanced.setMatrixAt(tIdx, dummy.matrix);

            dummy.position.set(xSide, 3.3 * scale, zPos);
            dummy.scale.set(scale, scale * 1.25, scale);
            dummy.updateMatrix();
            crownInstanced.setMatrixAt(tIdx, dummy.matrix);
            tIdx++;
          }
        });
      }
      gardenGroup.add(trunkInstanced, crownInstanced);

      // Instanced Parisian Street Lamps with Luminous Glowing Bulbs & Ground Pools ("L Bolat dial l jarda")
      const lampPostGeo = new THREE.CylinderGeometry(0.08, 0.14, 3.8, 6);
      const lampPostMat = flatMaterial(0x1f2937, { metalness: 0.4, roughness: 0.5 });
      const lampBulbGeo = new THREE.OctahedronGeometry(0.32, 1);
      const lampBulbMat = new THREE.MeshStandardMaterial({
        color: 0xffe4a3,
        emissive: 0xffb347,
        emissiveIntensity: 0.85,
        flatShading: true
      });
      const lampCount = 20;
      const lampPostInst = new THREE.InstancedMesh(lampPostGeo, lampPostMat, lampCount);
      const lampBulbInst = new THREE.InstancedMesh(lampBulbGeo, lampBulbMat, lampCount);
      let lIdx = 0;
      for (let i = 0; i < 10; i++) {
        const zPos = -5 - i * 11.5;
        [-7.8, 7.8].forEach((xSide) => {
          if (lIdx < lampCount) {
            dummy.position.set(xSide, 1.9, zPos);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            lampPostInst.setMatrixAt(lIdx, dummy.matrix);

            dummy.position.set(xSide, 3.95, zPos);
            dummy.updateMatrix();
            lampBulbInst.setMatrixAt(lIdx, dummy.matrix);

            // Warm ground light pool beneath each avenue streetlight
            const poolMat = new THREE.MeshBasicMaterial({
              map: lightPoolTexture,
              transparent: true,
              opacity: 0.25,
              depthWrite: false,
              polygonOffset: true,
              polygonOffsetFactor: -3,
              polygonOffsetUnits: -3
            });
            const pool = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), poolMat);
            pool.rotation.x = -Math.PI / 2;
            pool.position.set(xSide, 0.045, zPos);
            gardenGroup.add(pool);
            avenueGroundGlowMeshes.push(poolMat);

            lIdx++;
          }
        });

        // Staggered active PointLights along the garden avenue (desktop only; mobile uses ground light pools + pooled focus light)
        if (!isLowPowerMobile && i % 2 === 0) {
          const sideX = (i % 4 === 0) ? -7.2 : 7.2;
          const aveLight = new THREE.PointLight(0xffdf99, 1.1, 16, 1.2);
          aveLight.position.set(sideX, 3.8, zPos);
          gardenGroup.add(aveLight);
          avenueLampLights.push(aveLight);
        }
      }
      gardenGroup.add(lampPostInst, lampBulbInst);

      // -------------------------------------------------------------------
      // -------------------------------------------------------------------
      // 5. ARCHITECTURAL LOW-POLY EIFFEL TOWER (Tour Eiffel - 330m Model)
      // Integrated from authentic mathematical low-poly model with Paris
      // night illumination, internal lamps, searchlight beacon & sparkles!
      // -------------------------------------------------------------------
      const eiffelGroup = new THREE.Group();
      eiffelGroup.position.set(-18, 0, -165);
      eiffelGroup.scale.setScalar(0.32);
      eiffelGroup.rotation.y = 0.24;
      scene.add(eiffelGroup);

      const M_eiffel = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8, metalness: 0.1, flatShading: true }, o));
      const eiffelIron = M_eiffel(0x6a5646, { roughness: 0.65, metalness: 0.35, side: THREE.DoubleSide });
      const eiffelPlat = M_eiffel(0x8d7b6a);
      const eiffelLight = M_eiffel(0xd8ccb6);
      const eiffelStone = M_eiffel(0xbdb5a5);
      const eiffelGlow = [eiffelIron, eiffelPlat, eiffelLight];
      eiffelGlow.forEach(m => m.emissive.set(0xffa63a));

      const W_eiff = y => 2.5 + 59.5 * Math.exp(-y / 90);      // demi-largeur extérieure
      const P_eiff = y => 1 + 7 * Math.exp(-y / 60);           // demi-taille d'un pilier
      const R_eiff = y => 0.32 + 0.55 * Math.exp(-y / 70);     // épaisseur des poutres
      const V_eiff = (x, y, z) => new THREE.Vector3(x, y, z);

      /* ---------- Poutres fusionnées en une seule géométrie ---------- */
      const eiffelP3 = [];
      const u_eiff = new THREE.Vector3(), v_eiff = new THREE.Vector3(), d_eiff = new THREE.Vector3();
      const o_eiff = [[-1, -1], [1, -1], [1, 1], [-1, 1]];

      function eiffelBeam(a, b, r) {
        d_eiff.subVectors(b, a);
        const L = d_eiff.length();
        if (L < 1e-3) return;
        d_eiff.divideScalar(L);
        (Math.abs(d_eiff.y) < 0.9 ? u_eiff.set(0, 1, 0) : u_eiff.set(1, 0, 0)).cross(d_eiff).normalize();
        v_eiff.crossVectors(d_eiff, u_eiff);
        const A = [], B = [];
        for (const [s, t] of o_eiff) {
          const x = (u_eiff.x * s + v_eiff.x * t) * r, y = (u_eiff.y * s + v_eiff.y * t) * r, z = (u_eiff.z * s + v_eiff.z * t) * r;
          A.push([a.x + x, a.y + y, a.z + z]);
          B.push([b.x + x, b.y + y, b.z + z]);
        }
        for (let k = 0; k < 4; k++) {
          const j = (k + 1) % 4;
          eiffelP3.push(...A[k], ...A[j], ...B[j], ...A[k], ...B[j], ...B[k]);
        }
      }

      const eiffelNode = (y, sx, sz, ax, az) => {
        const p = P_eiff(y), c = W_eiff(y) - p;
        return V_eiff(sx * c + ax * p, y, sz * c + az * p);
      };

      function eiffelSection(y0, y1, brace) {
        const r = R_eiff((y0 + y1) / 2);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (let i = 0; i < 4; i++) {
          const [ax, az] = o_eiff[i], [bx, bz] = o_eiff[(i + 1) % 4];
          const a0 = eiffelNode(y0, sx, sz, ax, az), a1 = eiffelNode(y1, sx, sz, ax, az);
          const b0 = eiffelNode(y0, sx, sz, bx, bz), b1 = eiffelNode(y1, sx, sz, bx, bz);
          eiffelBeam(a0, a1, r);
          eiffelBeam(a1, b1, r * 0.8);
          eiffelBeam(a0, b1, r * 0.55);
          eiffelBeam(b0, a1, r * 0.55);
        }
        if (brace) {
          for (const s of [-1, 1]) {
            for (const f of [[-1, s, 1, s, 1, s, -1, s], [s, -1, s, 1, s, 1, s, -1]]) {
              const A0 = eiffelNode(y0, f[0], f[1], f[2], f[3]), A1 = eiffelNode(y1, f[0], f[1], f[2], f[3]);
              const B0 = eiffelNode(y0, f[4], f[5], f[6], f[7]), B1 = eiffelNode(y1, f[4], f[5], f[6], f[7]);
              eiffelBeam(A0, B1, r * 0.5);
              eiffelBeam(B0, A1, r * 0.5);
              eiffelBeam(A1, B1, r * 0.6);
            }
          }
        }
      }

      for (const L of [[0, 9, 19, 30, 42, 57], [57, 72, 87, 101, 115], [115, 135, 158, 185, 220, 250, 276]]) {
        for (let i = 0; i < L.length - 1; i++) {
          eiffelSection(L[i], L[i + 1], L[i] >= 57);
        }
      }

      function eiffelArch(face, sg) {
        const cy = 12, ry = 40, rx = W_eiff(cy) - 2 * P_eiff(cy), N = 14;
        const rings = [1, 0.9].map(k => {
          const a = [];
          for (let i = 0; i <= N; i++) {
            const t = (Math.PI * i) / N, y = cy + ry * k * Math.sin(t), x = rx * k * Math.cos(t), z = sg * (W_eiff(y) - 1);
            a.push(face ? V_eiff(z, y, x) : V_eiff(x, y, z));
          }
          return a;
        });
        for (let i = 0; i < N; i++) {
          eiffelBeam(rings[0][i], rings[0][i + 1], 0.9);
          eiffelBeam(rings[1][i], rings[1][i + 1], 0.7);
          eiffelBeam(rings[0][i], rings[1][i], 0.5);
          eiffelBeam(rings[0][i], rings[1][i + 1], 0.4);
        }
        eiffelBeam(rings[0][N], rings[1][N], 0.5);
      }
      for (const sg of [-1, 1]) {
        eiffelArch(0, sg);
        eiffelArch(1, sg);
      }

      const eiffelGeo = new THREE.BufferGeometry();
      eiffelGeo.setAttribute('position', new THREE.Float32BufferAttribute(eiffelP3, 3));
      eiffelGeo.computeVertexNormals();
      const towerMesh = new THREE.Mesh(eiffelGeo, eiffelIron);
      towerMesh.castShadow = true;
      towerMesh.receiveShadow = true;
      eiffelGroup.add(towerMesh);

      /* ---------- Plateformes, cabines, lanternes & antenne ---------- */
      const eiffelBox = (w, h, dd, x, y, z, m, cs = true) => {
        const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, dd), m);
        b.position.set(x, y, z);
        b.castShadow = cs;
        b.receiveShadow = true;
        eiffelGroup.add(b);
        return b;
      };

      function eiffelPlatform(y, half, h) {
        eiffelBox(half * 2, h, half * 2, 0, y, 0, eiffelPlat);
        eiffelBox(half * 2 - 6, h * 0.9, half * 2 - 6, 0, y - h, 0, eiffelIron);
        const t = y + h / 2 + 0.7, w = half * 2;
        eiffelBox(w, 1.4, 0.4, 0, t, half, eiffelLight);
        eiffelBox(w, 1.4, 0.4, 0, t, -half, eiffelLight);
        eiffelBox(0.4, 1.4, w, half, t, 0, eiffelLight);
        eiffelBox(0.4, 1.4, w, -half, t, 0, eiffelLight);
      }
      eiffelPlatform(57, W_eiff(57) + 3, 2.6);
      eiffelPlatform(115, W_eiff(115) + 2.5, 2);
      eiffelPlatform(276, W_eiff(276) + 3, 1.6);

      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          eiffelBox(20, 2.2, 20, sx * (W_eiff(0) - P_eiff(0)), 1.1, sz * (W_eiff(0) - P_eiff(0)), eiffelStone);
        }
      }

      const eiffelCyl = (rt, rb, h, y, m, seg = 8) => {
        const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
        c.position.y = y;
        c.castShadow = true;
        eiffelGroup.add(c);
        return c;
      };
      eiffelCyl(3.9, 4.4, 9, 281.3, eiffelPlat);
      eiffelCyl(4.5, 4.5, 1.1, 281.3, eiffelLight);
      eiffelCyl(1, 3.2, 16, 293.8, eiffelIron);
      eiffelCyl(0.25, 0.6, 28, 315.8, eiffelIron, 6);

      // Red flashing aviation obstacle beacon at summit (y = 330)
      const eiffelBeacon = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.0, 0),
        new THREE.MeshBasicMaterial({ color: 0xff3b30, fog: false })
      );
      eiffelBeacon.position.y = 330;
      eiffelGroup.add(eiffelBeacon);

      // Dual-Beam Sweeping Parisian Searchlight Beacon (Phare de la Tour Eiffel)
      const beaconPivot = new THREE.Group();
      beaconPivot.position.y = 330;
      const beaconOrb = new THREE.Mesh(
        new THREE.SphereGeometry(1.4, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0xfff6d0, fog: false })
      );
      const beaconConeMat = new THREE.MeshBasicMaterial({
        color: 0xffe8a0,
        transparent: true,
        opacity: 0.16,
        side: THREE.DoubleSide,
        depthWrite: false,
        fog: false
      });
      const beaconCone1 = new THREE.Mesh(new THREE.ConeGeometry(8.5, 85, 14, 1, true), beaconConeMat);
      beaconCone1.rotation.z = Math.PI / 2;
      beaconCone1.position.x = 42.5;
      const beaconCone2 = new THREE.Mesh(new THREE.ConeGeometry(8.5, 85, 14, 1, true), beaconConeMat);
      beaconCone2.rotation.z = -Math.PI / 2;
      beaconCone2.position.x = -42.5;
      beaconPivot.add(beaconOrb, beaconCone1, beaconCone2);
      eiffelGroup.add(beaconPivot);

      // Internal Architectural Sodium-Gold PointLights at platforms (y = 45, 110, 270)
      const eiffelLite = state.isMobile || (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
      const eiffelLamps = (eiffelLite ? [] : [45, 110, 270]).map(y => {
        const l = new THREE.PointLight(0xffb347, 0, 70, 1.2);
        l.position.set(0, y, 0);
        eiffelGroup.add(l);
        return l;
      });

      // Eiffel Tower Night Illumination: unfogged golden glow shell + halo + lattice sparkles
      // (fog was washing the tower out in dark mode, so the glow layers ignore fog)
      const eiffelShellMat = new THREE.MeshBasicMaterial({
        color: 0xffa63a,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
        fog: false
      });
      const eiffelShell = new THREE.Mesh(eiffelGeo, eiffelShellMat);
      eiffelShell.visible = true;
      eiffelGroup.add(eiffelShell);

      // Soft golden halo around the whole tower
      const eiffelHaloCanvas = document.createElement('canvas');
      eiffelHaloCanvas.width = eiffelHaloCanvas.height = 128;
      (() => {
        const g = eiffelHaloCanvas.getContext('2d');
        const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
        grad.addColorStop(0, 'rgba(255,190,90,0.85)');
        grad.addColorStop(0.35, 'rgba(255,160,60,0.28)');
        grad.addColorStop(1, 'rgba(255,140,40,0)');
        g.fillStyle = grad;
        g.fillRect(0, 0, 128, 128);
      })();
      const eiffelHaloMat = new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(eiffelHaloCanvas),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false
      });
      const eiffelHalo = new THREE.Sprite(eiffelHaloMat);
      eiffelHalo.scale.set(260, 420, 1);
      eiffelHalo.position.set(0, 165, 0);
      eiffelHalo.visible = true;
      eiffelGroup.add(eiffelHalo);

      // Champagne sparkles placed ON the iron lattice, with per-point twinkle
      const eiffelSparkleCount = eiffelLite ? 130 : 320;
      const eiffelSparklePos = new Float32Array(eiffelSparkleCount * 3);
      const eiffelSparklePhase = new Float32Array(eiffelSparkleCount);
      const eiffelSparkleSize = new Float32Array(eiffelSparkleCount);
      const eiffelVertTotal = eiffelP3.length / 3;
      for (let i = 0; i < eiffelSparkleCount; i++) {
        let vi = Math.floor(Math.random() * eiffelVertTotal);
        for (let tries = 0; tries < 6 && eiffelP3[vi * 3 + 1] < 4; tries++) vi = Math.floor(Math.random() * eiffelVertTotal);
        eiffelSparklePos[i * 3] = eiffelP3[vi * 3];
        eiffelSparklePos[i * 3 + 1] = eiffelP3[vi * 3 + 1];
        eiffelSparklePos[i * 3 + 2] = eiffelP3[vi * 3 + 2];
        eiffelSparklePhase[i] = Math.random();
        eiffelSparkleSize[i] = 5 + Math.random() * 7;
      }
      const eiffelSparkleGeo = new THREE.BufferGeometry();
      eiffelSparkleGeo.setAttribute('position', new THREE.BufferAttribute(eiffelSparklePos, 3));
      eiffelSparkleGeo.setAttribute('aPhase', new THREE.BufferAttribute(eiffelSparklePhase, 1));
      eiffelSparkleGeo.setAttribute('aSize', new THREE.BufferAttribute(eiffelSparkleSize, 1));
      const eiffelSparkleMat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uScale: { value: 400 },
          uOpacity: { value: 0 },
          uBurst: { value: 0 },
          uMaxSize: { value: eiffelLite ? 22.0 : 40.0 }
        },
        vertexShader: `
          attribute float aPhase;
          attribute float aSize;
          uniform float uTime;
          uniform float uScale;
          uniform float uOpacity;
          uniform float uBurst;
          uniform float uMaxSize;
          varying float vA;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            float speed = mix(1.6, 6.5, uBurst);
            float t = sin(uTime * speed + aPhase * 6.2831);
            float tw = pow(max(t, 0.0), mix(5.0, 1.6, uBurst));
            vA = tw * uOpacity;
            gl_PointSize = clamp(aSize * (0.35 + tw) * uScale / -mv.z, 1.0, uMaxSize);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: `
          varying float vA;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            float core = smoothstep(0.5, 0.0, d);
            float a = core * core * vA;
            if (a < 0.003) discard;
            gl_FragColor = vec4(vec3(1.0, 0.88, 0.6) * (0.65 + core), a);
          }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const eiffelSparkles = new THREE.Points(eiffelSparkleGeo, eiffelSparkleMat);
      eiffelSparkles.frustumCulled = true;
      eiffelSparkles.visible = true;
      eiffelGroup.add(eiffelSparkles);

      // The tower is far in the background: shadow casting/receiving there is wasted GPU work
      eiffelGroup.traverse(o => {
        if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; }
      });
      // -------------------------------------------------------------------
      // 6. USER-PROVIDED CHARACTERS.JS FACTORY & ARCHETYPES
      // -------------------------------------------------------------------
      const T = THREE;
      const STYLE = { accent: 0xffd98a, ink: 0x2b2430, cream: 0xf3e9d2, gold: 0xe3b95a, green: 0x2f5d46, blue: 0x5f7388, stone: 0xd9cdb4, wood: 0x8a6a45 };

      const CHARACTER_DEFS = [
        { id: 'conseil', role: 'conseil', title: 'Conseil et transformation digitale', blurb: 'Identifier les leviers de croissance et les atouts qui vous différencient.', skin: 0xf1c27d, hair: 0x3a2a20, hairStyle: 'short', shirt: 0x2f5d46, pants: 0x2b2f3a },
        { id: 'ux', role: 'ux', title: 'UX e-commerce et CRO', blurb: 'Améliorer le parcours d’achat pour augmenter la conversion.', skin: 0xc68642, hair: 0x1a1a1a, hairStyle: 'bun', shirt: 0xe3b95a, pants: 0x2b2f3a },
        { id: 'design', role: 'design', title: 'Design d’expériences', blurb: 'Identité, direction artistique et UI pour une marque cohérente.', skin: 0xe8b48a, hair: 0xb5651d, hairStyle: 'long', shirt: 0xf3e9d2, pants: 0x5f7388 },
        { id: 'dev', role: 'dev', title: 'Développements', blurb: 'Un développement guidé par la logique métier de votre commerce.', skin: 0x8d5524, hair: 0x111111, hairStyle: 'cap', shirt: 0x5f7388, pants: 0x2b2f3a },
        { id: 'si', role: 'si', title: 'Architecture et connexions SI', blurb: 'Relier la boutique au PIM, CRM, OMS et ERP.', skin: 0xf1c27d, hair: 0x6b6b6b, hairStyle: 'short', shirt: 0x3f5f7a, pants: 0x2b2f3a },
        { id: 'heytens', role: 'heytens', title: 'Heytens', blurb: 'Le digital et l’IA au service d’un savoir-faire artisanal.', skin: 0xe8b48a, hair: 0x7a4a2a, hairStyle: 'bun', shirt: 0xf3e9d2, pants: 0x6b4f36, apron: 0x8a5a3a },
        { id: 'izipizi', role: 'izipizi', title: 'Izipizi', blurb: 'Replatforming Shopify pour le marché international.', skin: 0xc68642, hair: 0x1a1a1a, hairStyle: 'long', shirt: 0xe98aa0, pants: 0x3a3a48 },
        { id: 'raymondweil', role: 'raymondweil', title: 'Raymond Weil', blurb: 'La vitrine internationale d’une maison horlogère suisse.', skin: 0xf1c27d, hair: 0x2b2b2b, hairStyle: 'short', shirt: 0x1f2a44, pants: 0x1f2a44 }
      ];

      const charMatCache = new Map();
      const charMat = (c) => {
        let m = charMatCache.get(c);
        if (!m) {
          m = new T.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.85, metalness: 0 });
          charMatCache.set(c, m);
        }
        return m;
      };
      const HULL = new T.MeshBasicMaterial({ color: STYLE.accent, side: T.BackSide });
      const B = (w, h, d) => new T.BoxGeometry(w, h, d);
      function mesh(geo, m, x = 0, y = 0, z = 0, par) {
        const o = new T.Mesh(geo, m);
        o.position.set(x, y, z);
        o.castShadow = o.receiveShadow = !state.isMobile;
        if (par) par.add(o);
        return o;
      }
      const add = (par, geo, c, x, y, z) => mesh(geo, charMat(c), x, y, z, par);
      function link(par, a, b, m, th = 0.03) {
        const d = b.clone().sub(a);
        const o = mesh(B(th, th, 1), m, 0, 0, 0, par);
        o.position.copy(a).addScaledVector(d, 0.5);
        o.scale.z = d.length();
        o.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), d.normalize());
        return o;
      }
      function label(text, list) {
        const cv = document.createElement('canvas');
        cv.width = 128;
        cv.height = 48;
        const x = cv.getContext('2d');
        x.fillStyle = 'rgba(43,36,48,.8)';
        x.fillRect(0, 0, 128, 48);
        x.fillStyle = '#f3e9d2';
        x.font = '700 26px sans-serif';
        x.textAlign = 'center';
        x.textBaseline = 'middle';
        x.fillText(text, 64, 26);
        const tx = new T.CanvasTexture(cv);
        const sm = new T.SpriteMaterial({ map: tx, depthTest: false });
        list.push(tx, sm);
        const sp = new T.Sprite(sm);
        sp.scale.set(0.52, 0.2, 1);
        return sp;
      }

      function makeBody(d) {
        const g = new T.Group(), body = new T.Group();
        g.add(body);
        const P = (geo, c, x, y, z, par = body) => add(par, geo, c, x, y, z);
        const limb = (x, y) => {
          const l = new T.Group();
          l.position.set(x, y, 0);
          body.add(l);
          return l;
        };
        const legL = limb(-0.15, 0.8), legR = limb(0.15, 0.8), armL = limb(-0.4, 1.5), armR = limb(0.4, 1.5);
        [legL, legR].forEach((l) => {
          P(B(0.22, 0.8, 0.24), d.pants, 0, -0.4, 0, l);
          P(B(0.24, 0.1, 0.34), 0x1a1720, 0, -0.77, 0.05, l);
        });
        [armL, armR].forEach((a) => {
          P(B(0.19, 0.55, 0.19), d.shirt, 0, -0.28, 0, a);
          P(B(0.15, 0.16, 0.15), d.skin, 0, -0.63, 0, a);
        });
        const torso = P(B(0.62, 0.78, 0.36), d.shirt, 0, 1.2, 0);
        const head = P(new T.IcosahedronGeometry(0.3, 1), d.skin, 0, 1.92, 0);
        const dome = (r) => new T.SphereGeometry(r, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2);
        P(dome(0.33), d.hair, 0, 0.03, -0.02, head);
        if (d.hairStyle === 'long') P(B(0.5, 0.55, 0.14), d.hair, 0, -0.18, -0.2, head);
        if (d.hairStyle === 'bun') P(new T.IcosahedronGeometry(0.12, 0), d.hair, 0, 0.34, -0.05, head);
        if (d.hairStyle === 'cap') {
          P(dome(0.36), STYLE.gold, 0, 0.05, 0, head);
          P(B(0.34, 0.03, 0.22), STYLE.gold, 0, 0.1, 0.3, head);
        }
        P(B(0.06, 0.08, 0.04), 0x1a1720, -0.1, -0.02, 0.28, head);
        P(B(0.06, 0.08, 0.04), 0x1a1720, 0.1, -0.02, 0.28, head);
        return { g, body, legL, legR, armL, armR, torso, head };
      }

      function addHulls(root) {
        const list = [];
        root.traverse((o) => { if (o.isMesh) list.push(o); });
        return list.map((o) => {
          const h = new T.Mesh(o.geometry, HULL);
          h.scale.setScalar(1.09);
          h.visible = false;
          o.add(h);
          return h;
        });
      }

      const ROLES = {
        conseil(c, X) {
          c.pose.armR = [-0.2, 1.25];
          c.wave = false;
          const bd = new T.Group();
          bd.position.set(1.5, 1.55, 0);
          bd.rotation.y = -0.35;
          c.g.add(bd);
          add(bd, B(1.7, 1.15, 0.06), STYLE.cream);
          [-0.65, 0.65].forEach((x) => add(bd, B(0.05, 1, 0.05), STYLE.wood, x, -1.05, -0.05));
          const pts = [[-0.6, 0.25], [-0.2, -0.2], [0.2, 0.25], [0.6, -0.15]].map((p) => new T.Vector3(p[0], p[1], 0.06));
          const lm = X.own(STYLE.gold, 0x7a5a10);
          for (let i = 0; i < 3; i++) link(bd, pts[i], pts[i + 1], lm, 0.035);
          const nodes = pts.map((p, i) => mesh(new T.IcosahedronGeometry(0.1, 0), X.own(i % 2 ? STYLE.blue : STYLE.green, 0x101820), p.x, p.y, 0.08, bd));
          return (t, h) => {
            nodes.forEach((n, i) => n.scale.setScalar(1 + 0.45 * Math.max(0, Math.sin(t * 2.2 - i * 0.9)) * (0.35 + 0.65 * h)));
            c.armR.rotation.z = 1.25 + Math.sin(t * 2) * 0.05 * (1 + h * 2);
          };
        },
        ux(c, X) {
          c.body.rotation.y = 0.9;
          c.pose.armR = [-1.2, 0];
          c.wave = false;
          const sc = new T.Group();
          sc.position.set(1.55, 1.45, 0.5);
          sc.rotation.y = -0.2;
          c.g.add(sc);
          add(sc, B(1.6, 1.1, 0.07), STYLE.ink);
          add(sc, B(0.1, 0.9, 0.08), STYLE.ink, 0, -1, -0.05);
          add(sc, B(0.6, 0.05, 0.4), STYLE.ink, 0, -1.43, -0.05);
          const cv = document.createElement('canvas');
          cv.width = 320;
          cv.height = 200;
          const g2 = cv.getContext('2d');
          const tx = new T.CanvasTexture(cv), pm = new T.MeshBasicMaterial({ map: tx }), pg = new T.PlaneGeometry(1.5, 0.96);
          X.list.push(tx, pm, pg);
          const scr = new T.Mesh(pg, pm);
          scr.position.z = 0.04;
          sc.add(scr);
          const draw = (v) => {
            const b = v > 2.5;
            g2.fillStyle = b ? '#fff7e6' : '#e8e8ea';
            g2.fillRect(0, 0, 320, 200);
            g2.fillStyle = b ? '#2f5d46' : '#b9b9bf';
            g2.fillRect(0, 0, 320, 26);
            g2.fillStyle = b ? '#e3b95a' : '#cfcfd4';
            g2.fillRect(16, 40, 288, 70);
            g2.fillStyle = b ? '#2b2430' : '#c4c4ca';
            g2.fillRect(16, 122, 170, 10);
            g2.fillRect(16, 140, 120, 10);
            g2.fillStyle = b ? '#2f5d46' : '#bdbdc4';
            g2.fillRect(210, 122, 94, 32);
            g2.fillStyle = '#2b2430';
            g2.font = '700 26px sans-serif';
            g2.fillText((b ? 'B   ' : 'A   ') + v.toFixed(1) + '%', 16, 184);
            tx.needsUpdate = true;
          };
          let cur = 1.8, last = -1;
          return (t, h, dt) => {
            cur += ((h > 0.5 ? 3.2 : 1.8) - cur) * Math.min(1, dt * 3);
            const r = Math.round(cur * 10);
            if (r !== last) {
              last = r;
              draw(r / 10);
            }
            c.armR.rotation.x = -1.2 + Math.sin(t * 5) * 0.03 * h;
          };
        },
        design(c, X) {
          c.body.rotation.y = 0.6;
          c.pose.armL = [-1, 0];
          c.pose.armR = [-1.35, 0.3];
          c.wave = false;
          const PAL = [[0xe3b95a, 0x2f5d46, 0x5f7388], [0xe9677a, 0x3fc1b0, 0xffe08a], [0x8b6cff, 0xffb703, 0x2ec4b6]], BG = [0xf8f0dc, 0xe9f6f3, 0x2b2430];
          const cols = PAL[0].map((x) => X.own(x)), bg = X.own(BG[0]);
          const es = new T.Group();
          es.position.set(1.5, 1.4, 0.2);
          es.rotation.y = -0.3;
          c.g.add(es);
          mesh(B(1.25, 0.95, 0.05), bg, 0, 0, 0, es);
          [-0.45, 0.45].forEach((x) => add(es, B(0.05, 1, 0.05), STYLE.wood, x, -0.9, -0.05));
          mesh(new T.IcosahedronGeometry(0.2, 0), cols[0], -0.35, 0.12, 0.05, es);
          mesh(B(0.3, 0.3, 0.04), cols[1], 0.1, 0.15, 0.04, es);
          mesh(new T.CylinderGeometry(0.18, 0.18, 0.04, 6), cols[2], 0.4, -0.2, 0.04, es).rotation.x = Math.PI / 2;
          mesh(B(0.8, 0.07, 0.03), cols[1], -0.1, -0.3, 0.04, es);
          const pl = mesh(new T.CylinderGeometry(0.27, 0.27, 0.04, 8), charMat(0xd9b98c), 0, -0.72, 0.1, c.armL);
          pl.rotation.x = Math.PI / 2 + 1;
          [[-0.1, 0.08], [0.08, 0.1], [0.12, -0.06], [-0.08, -0.1]].forEach((p, i) => mesh(new T.IcosahedronGeometry(0.045, 0), cols[i % 3], p[0], 0.04, p[1], pl));
          const br = new T.Group();
          br.position.set(0, -0.7, 0.05);
          c.armR.add(br);
          mesh(new T.CylinderGeometry(0.018, 0.018, 0.5, 5), charMat(STYLE.wood), 0, -0.2, 0, br);
          mesh(B(0.04, 0.1, 0.04), cols[0], 0, -0.5, 0, br);
          return (t, h) => {
            const k = h > 0.5 ? 1 + Math.floor(t * 1.6) % 2 : 0;
            cols.forEach((m, i) => m.color.setHex(PAL[k][i]));
            bg.color.setHex(BG[k]);
            c.armR.rotation.z = 0.3 + Math.sin(t * 4) * 0.15 * (0.3 + h);
            c.armR.rotation.x = -1.35 + Math.sin(t * 2.7) * 0.05;
          };
        },
        dev(c, X) {
          c.body.rotation.y = 1.2;
          c.pose.armL = [-1.15, 0.05];
          c.pose.armR = [-1.15, -0.05];
          c.wave = false;
          const dk = new T.Group();
          dk.position.set(1.1, 0, 0.5);
          dk.rotation.y = -0.1;
          c.g.add(dk);
          add(dk, B(1.3, 0.07, 0.7), 0xe3c9a0, 0, 1, 0);
          [[-0.58, -0.28], [0.58, -0.28], [-0.58, 0.28], [0.58, 0.28]].forEach((p) => add(dk, B(0.06, 1, 0.06), STYLE.wood, p[0], 0.5, p[1]));
          add(dk, B(0.8, 0.04, 0.5), 0x8b8696, 0, 1.06, 0.05);
          const sg = new T.Group();
          sg.position.set(0, 1.08, -0.2);
          sg.rotation.x = -0.25;
          dk.add(sg);
          add(sg, B(0.8, 0.55, 0.03), STYLE.ink, 0, 0.28, 0);
          mesh(B(0.7, 0.45, 0.01), X.own(0x12303a, 0x1a5a66), 0, 0.28, 0.02, sg);
          const pm = X.own(0x7ff0c8, 0x3fd6a0);
          [0.5, 0.35, 0.6, 0.25, 0.45].forEach((w, i) => mesh(B(w * 0.5, 0.03, 0.01), pm, -0.3 + w * 0.25, 0.43 - i * 0.07, 0.03, sg));
          const ps = [...Array(14)].map((_, i) => mesh(B(0.1 + (i % 4) * 0.05, 0.025, 0.025), pm, 0, 0, 0, dk));
          return (t, h) => {
            c.armL.rotation.x = -1.15 + Math.sin(t * 13) * 0.05;
            c.armR.rotation.x = -1.15 + Math.cos(t * 13) * 0.05;
            ps.forEach((m, i) => {
              const p = (t * 0.4 + i / 14) % 1;
              m.position.set(-0.3 + (i % 5) * 0.15 + Math.sin(t + i) * 0.04, 1.45 + p * 1.3, -0.1);
              m.scale.setScalar(i < 4 + 10 * h ? Math.sin(p * Math.PI) : 0);
            });
          };
        },
        si(c, X) {
          c.body.rotation.y = 0.5;
          c.pose.armR = [-0.4, 1.1];
          c.wave = false;
          add(c.g, new T.CylinderGeometry(0.55, 0.62, 0.08, 12), STYLE.blue, 1.45, 0.04, 0.1);
          const hg = new T.Group();
          hg.position.set(1.45, 1.6, 0.1);
          c.g.add(hg);
          const hm = new T.MeshStandardMaterial({ color: 0x9ad0ff, emissive: 0x4a90d9, emissiveIntensity: 0.9, flatShading: true, transparent: true, opacity: 0.85 });
          const beam = new T.MeshBasicMaterial({ color: 0x9ad0ff, transparent: true, opacity: 0.14, side: T.DoubleSide, depthWrite: false });
          X.list.push(hm, beam);
          mesh(new T.CylinderGeometry(0.3, 0.5, 1.5, 10, 1, true), beam, 0, -0.8, 0, hg);
          const ctr = new T.Vector3(), store = mesh(B(0.3, 0.3, 0.3), X.own(STYLE.gold, 0x7a5a10), 0, 0, 0, hg);
          const ends = [['PIM', -0.65, 0.5, 0.1], ['CRM', 0.65, 0.5, -0.1], ['OMS', -0.65, -0.45, -0.1], ['ERP', 0.65, -0.45, 0.1]].map((n) => {
            const p = new T.Vector3(n[1], n[2], n[3]);
            mesh(new T.IcosahedronGeometry(0.12, 0), hm, p.x, p.y, p.z, hg);
            link(hg, ctr, p, hm, 0.025);
            const sp = label(n[0], X.list);
            sp.position.set(p.x, p.y + 0.22, p.z);
            hg.add(sp);
            return p;
          });
          const sb = label('Boutique', X.list);
          sb.position.set(0, 0.3, 0);
          hg.add(sb);
          const pul = ends.map(() => mesh(new T.IcosahedronGeometry(0.05, 0), X.own(STYLE.gold, 0xffcc55), 0, 0, 0, hg));
          return (t, h) => {
            hg.rotation.y = Math.sin(t * 0.5) * 0.5;
            store.rotation.y = t;
            pul.forEach((m, i) => m.position.lerpVectors(ctr, ends[i], (t * (0.4 + 0.9 * h) + i * 0.25) % 1));
          };
        },
        heytens(c, X) {
          c.pose.armL = [-1.3, 0.1];
          c.pose.armR = [-1.3, -0.1];
          c.wave = false;
          add(c.body, B(0.5, 0.62, 0.05), c.d.apron, 0, 1.12, 0.2);
          const v = new T.Group();
          v.position.set(0, 1.1, 0.72);
          c.body.add(v);
          mesh(new T.IcosahedronGeometry(0.27, 0), charMat(STYLE.cream), 0, 0, 0, v).scale.y = 1.25;
          add(v, new T.CylinderGeometry(0.1, 0.14, 0.22, 6), STYLE.cream, 0, 0.38, 0);
          add(v, new T.CylinderGeometry(0.15, 0.1, 0.06, 6), STYLE.blue, 0, 0.52, 0);
          add(v, new T.TorusGeometry(0.27, 0.03, 4, 8), STYLE.blue, 0, 0, 0).rotation.x = Math.PI / 2;
          add(c.g, new T.CylinderGeometry(0.3, 0.3, 0.08, 8), STYLE.wood, -1.1, 0.5, 0.1);
          [0, 2.1, 4.2].forEach((a) => add(c.g, B(0.06, 0.5, 0.06), STYLE.wood, -1.1 + Math.cos(a) * 0.2, 0.25, 0.1 + Math.sin(a) * 0.2));
          const sp = [0, 1, 2].map(() => mesh(new T.OctahedronGeometry(0.07), X.own(STYLE.gold, 0xffcc55), 0, 0, 0, c.g));
          return (t, h) => sp.forEach((m, i) => {
            const a = t * (1 + 3 * h) + i * 2.1;
            m.position.set(Math.cos(a) * (0.45 + 0.15 * h), 1.2 + Math.sin(a * 1.3) * 0.3, 0.72 + Math.sin(a) * (0.45 + 0.15 * h));
            m.scale.setScalar(1 + h * 0.6);
            m.rotation.y = a;
          });
        },
        izipizi(c, X) {
          c.pose.armL = [-2.3, -0.2];
          const fm = X.own(0xe98aa0), FR = [0xe9677a, 0x3fc1b0, 0xffb703];
          [-0.1, 0.1].forEach((x) => mesh(new T.TorusGeometry(0.1, 0.022, 5, 10), fm, x, 0, 0.31, c.head));
          mesh(B(0.06, 0.02, 0.02), fm, 0, 0.02, 0.31, c.head);
          const gl = new T.Group();
          gl.position.set(0, -0.85, 0.08);
          gl.rotation.x = 2.3;
          gl.scale.setScalar(2.2);
          c.armL.add(gl);
          [-0.12, 0.12].forEach((x) => mesh(new T.TorusGeometry(0.1, 0.022, 5, 10), fm, x, 0, 0, gl));
          mesh(B(0.08, 0.02, 0.02), fm, 0, 0.03, 0, gl);
          const gb = new T.Group();
          gb.position.set(1.5, 1.2, 0);
          c.g.add(gb);
          mesh(new T.IcosahedronGeometry(0.46, 1), charMat(STYLE.blue), 0, 0, 0, gb);
          [[0.3, 0.25, 0.3], [-0.3, 0.1, 0.34], [0.05, -0.3, 0.4], [0.3, -0.2, -0.35], [-0.2, 0.25, -0.38]].forEach((p) => {
            mesh(new T.IcosahedronGeometry(0.16, 0), charMat(0x6aa06a), p[0], p[1], p[2], gb).scale.z = 0.5;
          });
          add(gb, new T.TorusGeometry(0.62, 0.015, 4, 24), STYLE.gold).rotation.x = 1.2;
          add(c.g, new T.CylinderGeometry(0.04, 0.04, 0.74, 5), STYLE.wood, 1.5, 0.37, 0);
          add(c.g, new T.CylinderGeometry(0.3, 0.34, 0.06, 8), STYLE.wood, 1.5, 0.03, 0);
          return (t, h) => {
            gb.rotation.y = t * (0.4 + 2.2 * h);
            fm.color.setHex(h > 0.3 ? FR[Math.floor(t * 2.5) % 3] : 0xe98aa0);
          };
        },
        raymondweil(c, X) {
          add(c.body, B(0.1, 0.5, 0.02), 0xb23a48, 0, 1.15, 0.19);
          add(c.body, B(0.2, 0.18, 0.02), 0xffffff, 0, 1.52, 0.19);
          mesh(new T.CylinderGeometry(0.09, 0.09, 0.05, 10), charMat(STYLE.gold), -0.1, -0.5, 0, c.armL).rotation.z = Math.PI / 2;
          add(c.g, new T.CylinderGeometry(0.42, 0.5, 0.6, 8), STYLE.stone, 1.5, 0.3, 0);
          const w = new T.Group();
          w.position.set(1.5, 1.32, 0);
          c.g.add(w);
          add(w, new T.TorusGeometry(0.42, 0.07, 6, 16), STYLE.gold);
          add(w, B(0.26, 0.3, 0.05), STYLE.ink, 0, 0.64, 0);
          add(w, B(0.26, 0.3, 0.05), STYLE.ink, 0, -0.64, 0);
          add(w, new T.CylinderGeometry(0.38, 0.38, 0.05, 16), STYLE.cream, 0, 0, 0).rotation.x = Math.PI / 2;
          for (let i = 0; i < 12; i++) {
            const a = (i * Math.PI) / 6;
            add(w, B(0.02, 0.07, 0.02), STYLE.ink, Math.sin(a) * 0.3, Math.cos(a) * 0.3, 0.04).rotation.z = -a;
          }
          const hand = (len, th) => {
            const p = new T.Group();
            p.position.z = 0.05;
            w.add(p);
            mesh(B(th, len, 0.02), charMat(STYLE.ink), 0, len / 2 - 0.02, 0, p);
            return p;
          };
          const hh = hand(0.2, 0.04), mm = hand(0.3, 0.03);
          return (t, h) => {
            mm.rotation.z = -t * (0.5 + 6 * h);
            hh.rotation.z = (-t * (0.5 + 6 * h)) / 12;
            w.rotation.y = Math.sin(t * 0.5) * 0.3;
          };
        }
      };

      function createCharacter(def) {
        const list = [];
        const X = {
          def,
          list,
          own: (c, e = 0) => {
            const m = new T.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.8, emissive: e, emissiveIntensity: e ? 1 : 0 });
            list.push(m);
            return m;
          }
        };
        const c = makeBody(def);
        c.d = def;
        c.pose = { armL: [0, -0.06], armR: [0, 0.06] };
        c.wave = true;
        const hulls = addHulls(c.body);
        const tick = (ROLES[def.role] || (() => null))(c, X);
        add(c.g, new T.CylinderGeometry(1.5, 1.6, 0.18, 10), STYLE.stone, 0.7, -0.09, 0);
        const hit = new T.Mesh(B(3, 2.8, 1.8), new T.MeshBasicMaterial({ visible: false }));
        hit.position.set(0.7, 1.3, 0.2);
        c.g.add(hit);
        c.g.userData = { id: def.id, def, focus: new T.Vector3(0.7, 1.3, 0) };
        const ph = Math.random() * 6;
        let h = 0, target = 0;
        const api = {
          id: def.id,
          def,
          group: c.g,
          hit,
          setHover(v) {
            target = v ? 1 : 0;
            hulls.forEach((o) => { o.visible = v; });
          },
          update(t, dt = 0.016) {
            h += (target - h) * Math.min(1, dt * 7);
            const [lx, lz] = c.pose.armL, [rx, rz] = c.pose.armR;
            c.armL.rotation.set(lx + Math.sin(t * 1.4 + ph) * 0.03, 0, lz);
            c.armR.rotation.set(rx + Math.sin(t * 1.4 + ph + 1) * 0.03, 0, rz);
            if (c.wave) {
              c.armR.rotation.x = T.MathUtils.lerp(c.armR.rotation.x, -2.7, h);
              c.armR.rotation.z = T.MathUtils.lerp(c.armR.rotation.z, 0.35 + Math.sin(t * 9) * 0.4, h);
            }
            c.torso.position.y = 1.2 + Math.sin(t * 1.6 + ph) * 0.012;
            c.head.rotation.y = Math.sin(t * 0.6 + ph) * 0.2 * (1 - h * 0.7);
            if (tick) tick(t, h, dt);
          },
          dispose() {
            c.g.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
            list.forEach((x) => x.dispose());
          }
        };
        hit.userData.owner = api;
        return api;
      }

      function createCharacterWithStand(item, category) {
        const baseDef = CHARACTER_DEFS.find((d) => d.id === item.role || d.role === item.role) || CHARACTER_DEFS[0];
        const mergedDef = Object.assign({}, baseDef, {
          title: item.title || item.client || baseDef.title,
          blurb: item.shortDescription || item.shortSummary || baseDef.blurb
        });

        const charApi = createCharacter(mergedDef);
        const root = charApi.group;

        const xOffset = item.position.x > 0 ? -0.85 : item.position.x < 0 ? -0.35 : -0.65;
        root.position.set(item.position.x + xOffset, item.position.y + 0.18, item.position.z);
        root.rotation.y = item.position.x < 0 ? 0.28 : item.position.x > 0 ? -0.32 : 0;
        scene.add(root);
        root.updateMatrixWorld(true);

        // Ornate Parisian Streetlamp / Lantern for this Character Stand ("L Bola dial l personnage")
        const isLeft = item.position.x < 0;
        const isCenter = Math.abs(item.position.x) < 0.5;
        const lampX = item.role === 'heytens' ? 1.45 : (isLeft ? -0.75 : (isCenter ? 1.45 : 1.95));
        const lampZ = 0.35;

        const lampStandGroup = new THREE.Group();
        lampStandGroup.position.set(lampX, 0, lampZ);
        root.add(lampStandGroup);

        const lBase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.18, 8), obsidianMarbleMat);
        lBase.position.y = 0.09;
        const lShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 2.1, 8), obsidianMarbleMat);
        lShaft.position.y = 1.14;
        lShaft.castShadow = true;
        const lTrim = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.018, 8, 16), luxuryGoldMat);
        lTrim.rotation.x = Math.PI / 2;
        lTrim.position.y = 2.05;
        const lCap = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.16, 6), luxuryGoldMat);
        lCap.position.y = 2.45;
        const lGlass = new THREE.Mesh(
          new THREE.CylinderGeometry(0.16, 0.12, 0.32, 6, 1, true),
          new THREE.MeshStandardMaterial({
            color: 0xffe8ba,
            transparent: true,
            opacity: 0.55,
            roughness: 0.1,
            metalness: 0.3
          })
        );
        lGlass.position.y = 2.26;

        const bulbMat = new THREE.MeshStandardMaterial({
          color: 0xfff6d0,
          emissive: 0xffb03a,
          emissiveIntensity: 1.0,
          roughness: 0.2,
          metalness: 0.1
        });
        const bulbMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 1), bulbMat);
        bulbMesh.position.y = 2.26;

        lampStandGroup.add(lBase, lShaft, lTrim, lCap, lGlass, bulbMesh);

        // Active Warm PointLight inside the Lantern ("Lighting dial l bola" - pooled on mobile for 60fps shader speed)
        let standLight = null;
        if (!isLowPowerMobile) {
          standLight = new THREE.PointLight(0xffdf99, 1.15, 12, 1.2);
          standLight.position.set(0, 2.26, 0);
          lampStandGroup.add(standLight);
        }

        // Luminous ground light pool on the pedestal
        const glowMat = new THREE.MeshBasicMaterial({
          map: lightPoolTexture,
          transparent: true,
          opacity: 0.32,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -3,
          polygonOffsetUnits: -3
        });
        const groundGlow = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), glowMat);
        groundGlow.rotation.x = -Math.PI / 2;
        groundGlow.position.set(0.7, 0.03, 0);
        root.add(groundGlow);

        characterLanternLights.push({
          light: standLight,
          bulbMat: bulbMat,
          glowMat: glowMat
        });

        const localMid = item.role === 'heytens'
          ? new THREE.Vector3(-0.3, 1.32, 0.2)
          : new THREE.Vector3(0.72, 1.38, 0.12);
        const focusCenter = root.localToWorld(localMid.clone());

        const entity = {
          id: item.id,
          category,
          data: item,
          root,
          charApi,
          hitBox: charApi.hit,
          focusCenter,
          worldAnchor: focusCenter.clone()
        };

        charApi.hit.userData.entity = entity;
        interactivePickables.push(charApi.hit);
        allEntities.push(entity);

        return entity;
      }

      // Build Zone 1: 5 Service Stands
      TEAM_DATA.forEach((item) => {
        standEntities.push(createCharacterWithStand(item, 'service'));
      });

      // Build Zone 4: 3 Expertise Kiosks with Animated Dioramas
      EXPERTISES_DATA.forEach((kiosk) => {
        const kGroup = new THREE.Group();
        kGroup.position.set(kiosk.position.x, kiosk.position.y, kiosk.position.z);
        kGroup.rotation.y = kiosk.position.x < 0 ? 0.25 : kiosk.position.x > 0 ? -0.25 : 0;
        scene.add(kGroup);

        const base = new THREE.Mesh(
          new THREE.CylinderGeometry(2.15, 2.4, 0.28, 24),
          creamMarbleMat
        );
        base.position.y = 0.14;
        base.receiveShadow = true;
        kGroup.add(base);

        const innerRing = new THREE.Mesh(
          new THREE.CylinderGeometry(1.85, 1.98, 0.18, 24),
          obsidianMarbleMat
        );
        innerRing.position.y = 0.32;
        innerRing.receiveShadow = true;
        kGroup.add(innerRing);

        const goldRim = new THREE.Mesh(
          new THREE.TorusGeometry(1.9, 0.045, 12, 36),
          luxuryGoldMat
        );
        goldRim.rotation.x = Math.PI / 2;
        goldRim.position.y = 0.41;
        kGroup.add(goldRim);

        // 2 Golden Pavilion Columns supporting an Overhead Pediment Sign
        [-1.45, 1.45].forEach((cx) => {
          const col = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.1, 2.55, 12),
            luxuryGoldMat
          );
          col.position.set(cx, 1.65, -0.35);
          col.castShadow = true;
          kGroup.add(col);
        });

        // Kiosk Header Pediment Texture
        const kCanvas = document.createElement('canvas');
        kCanvas.width = 768;
        kCanvas.height = 192;
        const kCtx = kCanvas.getContext('2d');
        kCtx.fillStyle = '#0f172a';
        kCtx.fillRect(0, 0, 768, 192);
        kCtx.strokeStyle = kiosk.accentColor;
        kCtx.lineWidth = 10;
        kCtx.strokeRect(8, 8, 752, 176);
        kCtx.fillStyle = '#ffd98a';
        kCtx.font = '700 22px "Plus Jakarta Sans", Inter, sans-serif';
        kCtx.textAlign = 'center';
        kCtx.fillText(kiosk.archetypeRole.toUpperCase(), 384, 54);
        kCtx.fillStyle = '#FAF6F0';
        kCtx.font = '800 42px "Cormorant Garamond", Georgia, serif';
        kCtx.fillText(kiosk.title, 384, 124);
        const kTex = new THREE.CanvasTexture(kCanvas);
        kTex.needsUpdate = true;

        const signBacking = new THREE.Mesh(
          new THREE.BoxGeometry(3.25, 0.78, 0.14),
          obsidianMarbleMat
        );
        signBacking.position.set(0, 2.95, -0.35);
        signBacking.castShadow = true;
        const signFace = new THREE.Mesh(
          new THREE.PlaneGeometry(3.1, 0.68),
          new THREE.MeshBasicMaterial({
            map: kTex,
            polygonOffset: true,
            polygonOffsetFactor: -2,
            polygonOffsetUnits: -2
          })
        );
        signFace.position.set(0, 2.95, -0.265);
        kGroup.add(signBacking, signFace);

        // Animated 3D Diorama Centerpiece per Expertise (B2C, B2B, Omnicanal)
        const dioramaGroup = new THREE.Group();
        dioramaGroup.position.set(0, 1.35, 0.15);
        kGroup.add(dioramaGroup);

        const accentMat = flatMaterial(kiosk.accentColor, {
          emissive: kiosk.accentColor,
          emissiveIntensity: 0.25,
          metalness: 0.35,
          roughness: 0.35
        });

        let updateDiorama = null;
        if (kiosk.kioskIndex === 0) {
          // B2C: Luxury Flagship Bag + Orbiting Conversion Gems
          const bagBody = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.88, 0.42), accentMat);
          bagBody.castShadow = true;
          const handle1 = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.035, 8, 20, Math.PI), luxuryGoldMat);
          handle1.position.set(0, 0.44, 0.12);
          const handle2 = handle1.clone();
          handle2.position.z = -0.12;
          dioramaGroup.add(bagBody, handle1, handle2);

          const gems = [0, 1, 2].map(( idx) => {
            const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), luxuryGoldMat);
            dioramaGroup.add(gem);
            return { gem, idx };
          });
          updateDiorama = (t, isFocused) => {
            dioramaGroup.rotation.y = t * (isFocused ? 1.1 : 0.45);
            dioramaGroup.position.y = 1.35 + Math.sin(t * 2.2) * 0.08;
            gems.forEach(({ gem, idx }) => {
              const a = t * 1.8 + idx * ((Math.PI * 2) / 3);
              gem.position.set(Math.cos(a) * 0.85, Math.sin(a * 2) * 0.22, Math.sin(a) * 0.85);
              gem.rotation.y = a;
            });
          };
        } else if (kiosk.kioskIndex === 1) {
          // B2B: Modular Enterprise Cube Matrix + Synchronized SI Rings
          const coreCube = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.68, 0.68), accentMat);
          const orbitRing1 = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.035, 10, 32), luxuryGoldMat);
          const orbitRing2 = new THREE.Mesh(new THREE.TorusGeometry(0.96, 0.03, 10, 32), creamMarbleMat);
          orbitRing2.rotation.x = Math.PI / 3;
          dioramaGroup.add(coreCube, orbitRing1, orbitRing2);
          updateDiorama = (t, isFocused) => {
            const spd = isFocused ? 1.4 : 0.6;
            coreCube.rotation.x = t * 0.7 * spd;
            coreCube.rotation.y = t * 0.9 * spd;
            orbitRing1.rotation.y = -t * spd;
            orbitRing2.rotation.z = t * 0.8 * spd;
            dioramaGroup.position.y = 1.35 + Math.cos(t * 2.0) * 0.07;
          };
        } else {
          // Omnicanal: Physical Boutique Arch + Web Cloud Sync Pulse
          const arch = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.08, 10, 28, Math.PI), luxuryGoldMat);
          arch.position.y = -0.1;
          const pillarL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.65, 0.14), luxuryGoldMat);
          pillarL.position.set(-0.62, -0.42, 0);
          const pillarR = pillarL.clone();
          pillarR.position.x = 0.62;
          const parcel = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.46, 0.46), accentMat);
          parcel.position.y = 0.05;
          dioramaGroup.add(arch, pillarL, pillarR, parcel);
          updateDiorama = (t, isFocused) => {
            dioramaGroup.rotation.y = Math.sin(t * 0.9) * 0.45;
            parcel.rotation.y = t * (isFocused ? 1.8 : 0.8);
            parcel.position.y = 0.05 + Math.sin(t * 3.0) * 0.12;
          };
        }

        // Warm Pendant Downlight under the Pediment ("Bola du Kiosque" - pooled on mobile)
        let kLight = null;
        if (!isLowPowerMobile) {
          kLight = new THREE.PointLight(0xffdf99, 1.1, 8.5, 1.2);
          kLight.position.set(0, 2.7, 0.2);
          kGroup.add(kLight);
        }

        const kGlowMat = new THREE.MeshBasicMaterial({
          map: lightPoolTexture,
          transparent: true,
          opacity: 0.35,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -3,
          polygonOffsetUnits: -3
        });
        const kGroundGlow = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2), kGlowMat);
        kGroundGlow.rotation.x = -Math.PI / 2;
        kGroundGlow.position.set(0, 0.045, 0.2);
        kGroup.add(kGroundGlow);

        kioskLights.push({ light: kLight, glowMat: kGlowMat });

        const hitBox = new THREE.Mesh(
          new THREE.BoxGeometry(3.8, 3.5, 3.2),
          new THREE.MeshBasicMaterial({ visible: false })
        );
        hitBox.position.y = 1.75;
        kGroup.add(hitBox);

        kGroup.updateMatrixWorld(true);
        const focusCenter = kGroup.localToWorld(new THREE.Vector3(0, 1.65, 0));
        const camWorldPos = kGroup.localToWorld(new THREE.Vector3(0, 2.2, 6.8));

        const entity = {
          id: kiosk.id,
          category: 'expertise',
          data: kiosk,
          root: kGroup,
          hitBox,
          focusCenter,
          camWorldPos,
          worldAnchor: focusCenter.clone(),
          updateDiorama
        };
        hitBox.userData.entity = entity;
        interactivePickables.push(hitBox);
        allEntities.push(entity);
        kioskEntities.push(entity);
      });

      // Build Zone 5: 3 Client Realisations (Heytens, Izipizi, Raymond Weil)
      PROJECTS_DATA.forEach((proj) => {
        projectEntities.push(createCharacterWithStand(proj, 'project'));
      });

      // Build Zone 6: Grand Parisian Fountain at Finale Plaza (z = -123)
      const fountainGroup = new THREE.Group();
      fountainGroup.position.set(0, 0, -123);
      scene.add(fountainGroup);

      const basinOuter = new THREE.Mesh(
        new THREE.CylinderGeometry(5.6, 6.1, 0.55, 48),
        creamMarbleMat
      );
      basinOuter.position.y = 0.275;
      basinOuter.receiveShadow = true;
      fountainGroup.add(basinOuter);

      const waterMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        roughness: 0.15,
        metalness: 0.45,
        emissive: 0x0284c7,
        emissiveIntensity: 0.32,
        transparent: true,
        opacity: 0.88
      });
      const basinWater = new THREE.Mesh(
        new THREE.CylinderGeometry(5.15, 5.15, 0.42, 48),
        waterMat
      );
      basinWater.position.y = 0.34;
      fountainGroup.add(basinWater);

      const tierMid = new THREE.Mesh(
        new THREE.CylinderGeometry(2.2, 2.6, 0.9, 32),
        obsidianMarbleMat
      );
      tierMid.position.y = 0.85;
      fountainGroup.add(tierMid);

      const tierTopBowl = new THREE.Mesh(
        new THREE.CylinderGeometry(2.6, 1.4, 0.38, 32),
        luxuryGoldMat
      );
      tierTopBowl.position.y = 1.45;
      fountainGroup.add(tierTopBowl);

      const centralSpire = new THREE.Mesh(
        new THREE.ConeGeometry(0.55, 2.3, 16),
        luxuryGoldMat
      );
      centralSpire.position.y = 2.7;
      fountainGroup.add(centralSpire);

      const fountainCrownOrb = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.42, 0),
        luxuryCoralMat
      );
      fountainCrownOrb.position.y = 4.05;
      fountainGroup.add(fountainCrownOrb);

      // Animated Water Droplets Ring
      const waterDroplets = [];
      const dropGeo = new THREE.SphereGeometry(0.09, 8, 8);
      const dropMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
      for (let d = 0; d < 24; d++) {
        const drop = new THREE.Mesh(dropGeo, dropMat);
        fountainGroup.add(drop);
        waterDroplets.push({
          mesh: drop,
          angle: (d / 24) * Math.PI * 2,
          phase: (d / 24) * Math.PI * 2
        });
      }

      // Golden Hour Floating Garden Dust / Light Particles
      const particleCount = state.isMobile ? 90 : 180;
      const particlePositions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        particlePositions[i * 3] = (Math.random() - 0.5) * 34;
        particlePositions[i * 3 + 1] = 0.6 + Math.random() * 6.5;
        particlePositions[i * 3 + 2] = 6 - Math.random() * 140;
      }
      const particleGeo = new THREE.BufferGeometry();
      particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
      const particleMat = new THREE.PointsMaterial({
        color: 0xffe4a0,
        size: 0.16,
        transparent: true,
        opacity: 0.65
      });
      const gardenParticles = new THREE.Points(particleGeo, particleMat);
      scene.add(gardenParticles);

      // -------------------------------------------------------------------
      // 7. 13-STATION GUIDED TOUR DEFINITIONS & CAMERA WAYPOINTS
      // -------------------------------------------------------------------
      function computeStandCameraWaypoints(entity, dist = 5.4, height = 2.15) {
        const fc = entity.focusCenter;
        // Desktop: shift camera slightly toward the central gravel path so character & prop sit next to the side panel
        const isLeftStand = entity.data.position.x < 0;
        const camX = fc.x + (isLeftStand ? 1.55 : -1.55);
        const camZ = fc.z + dist;
        const lookX = fc.x + (isLeftStand ? 0.55 : -0.55);
        // Mobile wide-angle: center character + 3D prop horizontally, step back slightly, and frame above the 17vh bottom card
        const mobCamX = fc.x + (isLeftStand ? 0.45 : -0.45);
        const mobCamZ = fc.z + dist + 1.45;
        const mobLookX = fc.x;
        return {
          camPos: new THREE.Vector3(camX, height, camZ),
          lookAt: new THREE.Vector3(lookX, fc.y + 0.08, fc.z),
          mobileCamPos: new THREE.Vector3(mobCamX, height + 0.2, mobCamZ),
          mobileLookAt: new THREE.Vector3(mobLookX, fc.y - 0.14, fc.z)
        };
      }

      const STATIONS = [
        // Station 0: Entrée & Monument VIP Antadis
        {
          index: 0,
          zone: 0,
          stepCode: '00 / 12',
          categoryLabel: 'Entrée du Jardin · Monument VIP',
          shortName: 'Entrée du Jardin',
          title: 'Antadis · Paris & Lausanne',
          subtitle: 'L’Art du Commerce Digital — Jardin Parisien & Monument Officiel VIP.',
          camPos: new THREE.Vector3(0, 3.85, 8.8),
          lookAt: new THREE.Vector3(0, 1.35, -5.2),
          panelSide: 'right',
          type: 'hero'
        },
        // Stations 1..5: The 5 Service Stands
        ...standEntities.map((ent, idx) => {
          const wp = computeStandCameraWaypoints(ent, 5.2, 2.05);
          return {
            index: idx + 1,
            zone: 1,
            stepCode: String(idx + 1).padStart(2, '0') + ' / 12',
            categoryLabel: ent.data.archetypeRole,
            shortName: ent.data.title,
            title: ent.data.title,
            subtitle: ent.data.shortDescription,
            camPos: wp.camPos,
            lookAt: wp.lookAt,
            mobileCamPos: wp.mobileCamPos,
            mobileLookAt: wp.mobileLookAt,
            panelSide: ent.data.position.x < 0 ? 'right' : 'left',
            type: 'service',
            entity: ent
          };
        }),
        // Station 6: Scrolling Billboard 01 — Partners & Clients (Infinity Loop)
        {
          index: 6,
          zone: 2,
          stepCode: '06 / 12',
          categoryLabel: SCROLLING_PANELS_DATA[0].archetypeRole,
          shortName: 'Partenaires & Clients ∞',
          title: SCROLLING_PANELS_DATA[0].title,
          subtitle: SCROLLING_PANELS_DATA[0].shortDescription,
          camPos: scrollingBillboardEntities[0].camWorldPos.clone(),
          lookAt: scrollingBillboardEntities[0].focusCenter.clone(),
          panelSide: 'right',
          type: 'scrolling-panel',
          entity: scrollingBillboardEntities[0]
        },
        // Station 7: Scrolling Billboard 02 — Technologies & SI (Infinity Loop)
        {
          index: 7,
          zone: 3,
          stepCode: '07 / 12',
          categoryLabel: SCROLLING_PANELS_DATA[1].archetypeRole,
          shortName: 'Technologies & SI ∞',
          title: SCROLLING_PANELS_DATA[1].title,
          subtitle: SCROLLING_PANELS_DATA[1].shortDescription,
          camPos: scrollingBillboardEntities[1].camWorldPos.clone(),
          lookAt: scrollingBillboardEntities[1].focusCenter.clone(),
          panelSide: 'left',
          type: 'scrolling-panel',
          entity: scrollingBillboardEntities[1]
        },
        // Station 8: Pavillon des Expertises (B2C, B2B, Omnicanal)
        {
          index: 8,
          zone: 4,
          stepCode: '08 / 12',
          categoryLabel: 'Pavillon des Expertises · B2C · B2B · Omnicanal',
          shortName: 'Expertises E-Commerce',
          title: 'Nos 3 Piliers d’Expertise E-Commerce',
          subtitle: 'Sélectionnez un kiosque 3D (B2C, B2B ou Omnicanal) pour inspecter son architecture et ses bénéfices métiers.',
          camPos: new THREE.Vector3(0, 3.5, -78.2),
          lookAt: new THREE.Vector3(0, 1.7, -90.0),
          panelSide: 'right',
          type: 'expertises'
        },
        // Stations 9..11: The 3 Client Projects (Heytens, Izipizi, Raymond Weil)
        ...projectEntities.map((ent, idx) => {
          const wp = computeStandCameraWaypoints(ent, 5.1, 2.05);
          return {
            index: 9 + idx,
            zone: 5,
            stepCode: String(9 + idx).padStart(2, '0') + ' / 12',
            categoryLabel: 'Galerie des Réalisations · ' + ent.data.sector,
            shortName: 'Projet ' + ent.data.client,
            title: ent.data.client,
            subtitle: ent.data.shortSummary,
            camPos: wp.camPos,
            lookAt: wp.lookAt,
            mobileCamPos: wp.mobileCamPos,
            mobileLookAt: wp.mobileLookAt,
            panelSide: ent.data.position.x <= 0 ? 'right' : 'left',
            type: 'project',
            entity: ent
          };
        }),
        // Station 12: Fontaine Finale & Contact Drawer
        {
          index: 12,
          zone: 6,
          stepCode: '12 / 12',
          categoryLabel: 'Place Finale · Paris & Lausanne',
          shortName: 'Contact & Fontaine 3D',
          title: 'Construisons votre prochain succès e-commerce',
          subtitle: 'Nos équipes à Paris et Lausanne vous accompagnent du conseil stratégique au run technico-fonctionnel.',
          camPos: new THREE.Vector3(0, 4.4, -110.5),
          lookAt: new THREE.Vector3(-2.5, 3.2, -126.0),
          panelSide: 'right',
          type: 'contact'
        }
      ];

      // -------------------------------------------------------------------
      // 8. DOM REFERENCES & REACTIVE HUD RENDERING
      // -------------------------------------------------------------------
      const dom = {
        loaderOverlay: document.getElementById('loader-overlay'),
        loaderBar: document.getElementById('loader-bar'),
        loaderStepLabel: document.getElementById('loader-step-label'),
        loaderPercent: document.getElementById('loader-percent'),
        btnEnterGarden: document.getElementById('btn-enter-garden'),
        headerStationBadge: document.getElementById('header-station-badge'),
        headerStationName: document.getElementById('header-station-name'),
        solarTimeLabel: document.getElementById('solar-time-label'),
        btnHeaderPrev: document.getElementById('btn-header-prev'),
        btnHeaderNext: document.getElementById('btn-header-next'),
        btnTheme: document.getElementById('btn-theme'),
        btnHeaderContact: document.getElementById('btn-header-contact'),
        zoneNavBtns: Array.from(document.querySelectorAll('.zone-nav-btn')),
        scrollPctReadout: document.getElementById('scroll-pct-readout'),
        zone0Overlay: document.getElementById('zone0-overlay'),
        btnHeroStartScroll: document.getElementById('btn-hero-start-scroll'),
        heroStationBtns: Array.from(document.querySelectorAll('[data-hero-station]')),
        reactivePanel: document.getElementById('reactive-station-panel'),
        btnToggleCardContent: document.getElementById('btn-toggle-card-content'),
        cardToggleLabel: document.getElementById('card-toggle-label'),
        cardToggleArrow: document.getElementById('card-toggle-arrow'),
        stationCollapsibleBody: document.getElementById('station-collapsible-body'),
        stationStepPill: document.getElementById('station-step-pill'),
        stationCategoryLabel: document.getElementById('station-category-label'),
        stationTitle: document.getElementById('station-title'),
        stationSubtitle: document.getElementById('station-subtitle'),
        stationTabs: document.getElementById('station-tabs'),
        stationReactiveBox: document.getElementById('station-reactive-box'),
        stationExternalLink: document.getElementById('station-external-link'),
        stationLinkText: document.getElementById('station-link-text'),
        btnStationCaseStudy: document.getElementById('btn-station-case-study'),
        btnPrevStation: document.getElementById('btn-prev-station'),
        btnNextStation: document.getElementById('btn-next-station'),
        projectSidePanel: document.getElementById('project-side-panel'),
        panelClientName: document.getElementById('panel-client-name'),
        panelSectorBadge: document.getElementById('panel-sector-badge'),
        panelShortSummary: document.getElementById('panel-short-summary'),
        panelChallenge: document.getElementById('panel-challenge'),
        panelSolution: document.getElementById('panel-solution'),
        panelStackTags: document.getElementById('panel-stack-tags'),
        panelMetrics: document.getElementById('panel-metrics'),
        panelCaseUrl: document.getElementById('panel-case-url'),
        panelClientUrl: document.getElementById('panel-client-url'),
        btnCloseProjectPanel: document.getElementById('btn-close-project-panel'),
        zone4Overlay: document.getElementById('zone4-overlay'),
        btnToggleFooterSize: document.getElementById('btn-toggle-footer-size'),
        footerToggleLabel: document.getElementById('footer-toggle-label'),
        footerToggleIcon: document.getElementById('footer-toggle-icon'),
        footerCollapsibleBody: document.getElementById('footer-collapsible-body'),
        btnOpenContactModal: document.getElementById('btn-open-contact-modal'),
        contactModal: document.getElementById('contact-modal'),
        btnCloseContactModal: document.getElementById('btn-close-contact-modal'),
        contactForm: document.getElementById('contact-form'),
        contactFeedback: document.getElementById('contact-feedback')
      };

      // Bind HTML partner/client <img> tags in Loader & Footer to embedded REAL_LOGOS data URIs for 100% reliability
      const HTML_LOGO_MAP = [
        ['shopify', REAL_LOGOS.shopify],
        ['prestashop', REAL_LOGOS.prestashop],
        ['sylius', REAL_LOGOS.sylius],
        ['magento', REAL_LOGOS.magento],
        ['orocommerce', REAL_LOGOS.orocommerce],
        ['planet', REAL_LOGOS.proximis],
        ['izipizi', REAL_LOGOS.izipizi],
        ['nuxe', REAL_LOGOS.nuxe],
        ['petrossian', REAL_LOGOS.petrossian],
        ['dammann', REAL_LOGOS.dammann],
        ['bleu_libellule', REAL_LOGOS.bleu_libellule],
        ['monceau_fleurs', REAL_LOGOS.monceau_fleurs],
        ['de_neuville', REAL_LOGOS.de_neuville],
        ['tectona', REAL_LOGOS.tectona],
        ['lcdl', REAL_LOGOS.compagnie_du_lit],
        ['centrakor', REAL_LOGOS.centrakor],
        ['logo_but', REAL_LOGOS.but],
        ['tbs_logo', REAL_LOGOS.tbs],
        ['qoqa', REAL_LOGOS.qoqa]
      ];
      document.querySelectorAll('#loader-overlay img, #zone4-overlay img').forEach((imgEl) => {
        const src = (imgEl.getAttribute('src') || '').toLowerCase();
        for (let i = 0; i < HTML_LOGO_MAP.length; i++) {
          if (src.includes(HTML_LOGO_MAP[i][0]) && HTML_LOGO_MAP[i][1]) {
            imgEl.src = HTML_LOGO_MAP[i][1];
            break;
          }
        }
      });

      // Attach automatic fallback badge for any external <img> in .antadis-logo-chip that fails to load
      document.querySelectorAll('.antadis-logo-chip img').forEach((imgEl) => {
        imgEl.addEventListener('error', function () {
          const altText = this.getAttribute('alt') || 'Antadis';
          const parent = this.parentElement;
          this.style.display = 'none';
          if (parent && !parent.querySelector('.antadis-logo-fallback')) {
            const span = document.createElement('span');
            span.className = 'antadis-logo-fallback';
            span.textContent = altText;
            parent.appendChild(span);
          }
        });
      });

      const ZONE_TO_STATION = {
        0: 0,
        1: 1,
        2: 6,
        3: 7,
        4: 8,
        5: 9,
        6: 12
      };

      function scrollToStation(stationIdx) {
        const clamped = Math.max(0, Math.min(STATIONS.length - 1, stationIdx));
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const targetRatio = clamped / (STATIONS.length - 1);
        window.scrollTo({
          top: targetRatio * maxScroll,
          behavior: 'smooth'
        });
      }

      function updateLeftRailActiveZone(zoneIdx) {
        dom.zoneNavBtns.forEach((btn) => {
          const btnZone = Number(btn.getAttribute('data-zone-jump'));
          const dot = btn.querySelector('.zone-dot');
          if (btnZone === zoneIdx) {
            btn.className = 'zone-nav-btn group flex items-center gap-2 text-left px-2.5 py-1.5 rounded-xl transition bg-[#E05A47]/25 text-white';
            if (dot) dot.className = 'zone-dot w-2.5 h-2.5 rounded-full bg-[#E05A47] ring-4 ring-[#E05A47]/30 transition shrink-0';
          } else {
            btn.className = 'zone-nav-btn group flex items-center gap-2 text-left px-2.5 py-1.5 rounded-xl transition text-amber-100/70 hover:text-white';
            if (dot) dot.className = 'zone-dot w-2 h-2 rounded-full bg-amber-200/40 transition shrink-0';
          }
        });
      }

      function openProjectPanel(projData) {
        if (!projData) return;
        state.zoomedProject = projData;
        dom.panelClientName.textContent = projData.client;
        dom.panelSectorBadge.textContent = projData.sector;
        dom.panelShortSummary.textContent = projData.shortSummary;
        dom.panelChallenge.textContent = projData.challenge;
        dom.panelSolution.textContent = projData.solution;
        dom.panelStackTags.innerHTML = '';
        (projData.stack || []).forEach((tag) => {
          const badge = document.createElement('span');
          badge.className = 'px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold';
          badge.textContent = tag;
          dom.panelStackTags.appendChild(badge);
        });
        dom.panelMetrics.textContent = projData.metrics;
        dom.panelCaseUrl.href = projData.caseStudyUrl || 'https://www.antadis.com/references-antadis/';
        dom.panelClientUrl.href = projData.clientUrl || 'https://www.antadis.com/';

        dom.projectSidePanel.classList.remove('hidden');
        requestAnimationFrame(() => {
          dom.projectSidePanel.classList.remove('translate-x-full');
        });
      }

      function closeProjectPanel() {
        state.zoomedProject = null;
        dom.projectSidePanel.classList.add('translate-x-full');
        setTimeout(() => {
          if (!state.zoomedProject) {
            dom.projectSidePanel.classList.add('hidden');
          }
        }, 450);
      }

      function renderStationReactiveContent(station) {
        dom.stationTabs.innerHTML = '';
        dom.stationReactiveBox.innerHTML = '';

        // 1. Service Stand or Client Project Station
        if (station.type === 'service' || station.type === 'project') {
          const item = station.entity.data;
          const tabs = item.tabs || [];
          const activeTab = tabs[state.activeTabIndex] || tabs[0];

          tabs.forEach((tObj, tIdx) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            const isSel = tIdx === state.activeTabIndex;
            btn.className = isSel
              ? 'px-3 py-1 rounded-full text-xs font-semibold bg-[#E05A47] text-white shadow transition'
              : 'station-tab-inactive px-3 py-1 rounded-full text-xs font-medium transition';
            btn.textContent = tObj.label;
            btn.addEventListener('click', () => {
              state.activeTabIndex = tIdx;
              renderStationReactiveContent(station);
            });
            dom.stationTabs.appendChild(btn);
          });

          if (activeTab) {
            const metricsHtml = (activeTab.metrics || []).map((m) => `
              <div class="space-y-1">
                <div class="flex items-center justify-between text-xs">
                  <span class="metric-label-txt font-medium">${m.k}</span>
                  <span class="metric-val-txt font-bold font-mono">${m.v}</span>
                </div>
                <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-[#D99B52] to-[#E05A47] rounded-full transition-all duration-500" style="width: ${m.pct || 85}%"></div>
                </div>
              </div>
            `).join('');

            dom.stationReactiveBox.innerHTML = `
              <div class="reactive-box-headline text-xs font-bold uppercase tracking-wider text-amber-300">${activeTab.headline}</div>
              <p class="reactive-box-detail text-xs text-amber-100/85 leading-relaxed">${activeTab.detail}</p>
              <div class="pt-1 space-y-2.5">${metricsHtml}</div>
            `;
          }

          if (station.type === 'project') {
            dom.stationExternalLink.href = item.clientUrl || 'https://www.antadis.com/';
            dom.stationLinkText.textContent = 'Visiter ' + item.client + ' ↗';
            dom.btnStationCaseStudy.classList.remove('hidden');
            dom.btnStationCaseStudy.onclick = () => openProjectPanel(item);
          } else {
            dom.stationExternalLink.href = item.url || 'https://www.antadis.com/';
            dom.stationLinkText.textContent = 'Explorer ce pôle sur antadis.com';
            dom.btnStationCaseStudy.classList.add('hidden');
          }
          return;
        }

        // 2. Infinity-Loop Scrolling Billboard Station (Partners or Technologies)
        if (station.type === 'scrolling-panel') {
          const panelCfg = station.entity.data;
          const tabs = panelCfg.tabs || [];
          const activeTab = tabs[state.activeTabIndex] || tabs[0];

          tabs.forEach((tObj, tIdx) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            const isSel = tIdx === state.activeTabIndex;
            btn.className = isSel
              ? 'px-3 py-1 rounded-full text-xs font-semibold bg-[#E05A47] text-white shadow transition'
              : 'station-tab-inactive px-3 py-1 rounded-full text-xs font-medium transition';
            btn.textContent = tObj.label;
            btn.addEventListener('click', () => {
              state.activeTabIndex = tIdx;
              renderStationReactiveContent(station);
            });
            dom.stationTabs.appendChild(btn);
          });

          const filteredLogos = (panelCfg.logos || []).filter(
            (l) => !activeTab || activeTab.filter === 'all' || l.cat === activeTab.filter
          );

          const chipsHtml = filteredLogos.slice(0, 8).map((l) => `
            <span class="billboard-chip px-2.5 py-1 rounded-lg bg-slate-900 border border-amber-300/25 text-[11px] font-semibold text-amber-100 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full" style="background:${l.color || '#E05A47'}"></span>
              <span>${l.name}</span>
            </span>
          `).join('');

          dom.stationReactiveBox.innerHTML = `
            <div class="reactive-box-headline text-xs font-bold uppercase tracking-wider text-amber-300">${activeTab ? activeTab.headline : ''}</div>
            <p class="reactive-box-detail text-xs text-amber-100/85 leading-relaxed">${activeTab ? activeTab.detail : ''}</p>
            <div class="flex flex-wrap gap-1.5 pt-1">${chipsHtml}</div>
            <div class="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <span class="text-amber-200/80 font-mono">Contrôle Panneau 3D ∞ :</span>
              <div class="flex items-center gap-1.5">
                <button type="button" id="btn-marquee-toggle" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-200 border border-slate-600 font-semibold transition">
                  ${state.marqueePaused ? '▶ Lecture' : '⏸ Pause'}
                </button>
                <button type="button" id="btn-marquee-speed" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-200 border border-slate-600 font-semibold transition">
                  Vitesse x${state.marqueeSpeedMultiplier}
                </button>
                <button type="button" id="btn-marquee-dir" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-200 border border-slate-600 font-semibold transition">
                  ⇄ Sens
                </button>
              </div>
            </div>
          `;

          const btnToggle = document.getElementById('btn-marquee-toggle');
          const btnSpeed = document.getElementById('btn-marquee-speed');
          const btnDir = document.getElementById('btn-marquee-dir');
          if (btnToggle) {
            btnToggle.addEventListener('click', () => {
              state.marqueePaused = !state.marqueePaused;
              renderStationReactiveContent(station);
            });
          }
          if (btnSpeed) {
            btnSpeed.addEventListener('click', () => {
              state.marqueeSpeedMultiplier = state.marqueeSpeedMultiplier === 1 ? 2.2 : 1;
              renderStationReactiveContent(station);
            });
          }
          if (btnDir) {
            btnDir.addEventListener('click', () => {
              state.marqueeDirection *= -1;
            });
          }

          dom.stationExternalLink.href = panelCfg.url || 'https://www.antadis.com/';
          dom.stationLinkText.textContent = 'Voir toutes les références sur antadis.com';
          dom.btnStationCaseStudy.classList.add('hidden');
          return;
        }

        // 3. Expertises Pavilion Station (B2C, B2B, Omnicanal)
        if (station.type === 'expertises') {
          const expDetails = [
            {
              headline: 'Flagships B2C · DNVB, Marques & Pure Players',
              detail: 'Expériences de marque immersives, storytelling éditorial, personnalisation IA et tunnels de conversion mobile-first sous Shopify Plus, PrestaShop Platinum et Sylius.',
              metrics: [
                { k: 'Croissance Taux de Conv.', v: '+38% moyenne', pct: 92 },
                { k: 'Temps Chargement Mobile', v: '< 1.2s LCP', pct: 95 }
              ]
            },
            {
              headline: 'Portails B2B & Catalogues Industriels Complexes',
              detail: 'Grilles tarifaires par compte, devis en ligne, commandes rapides par SKU/CSV, gestion multi-acheteurs et synchronisation ERP (SAP, Sage, Dynamics 365, Cegid).',
              metrics: [
                { k: 'Digitalisation Commandes', v: '+75% self-care', pct: 91 },
                { k: 'Capacité Catalogue', v: '500k+ SKU', pct: 96 }
              ]
            },
            {
              headline: 'Commerce Unifié & Réseaux de Points de Vente',
              detail: 'Stock unifié temps réel (OMS Planet Proximis), Click & Collect 1h, Ship-from-Store, e-réservation et prise de rendez-vous en boutique.',
              metrics: [
                { k: 'Chiffre d’Affaires Omnicanal', v: '+29% drive-to-store', pct: 89 },
                { k: 'Ruptures de Stock Évitées', v: '-45% grâce à l’OMS', pct: 93 }
              ]
            }
          ];

          EXPERTISES_DATA.forEach((kiosk, kIdx) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            const isSel = kIdx === state.activeExpertiseIndex;
            btn.className = isSel
              ? 'px-3 py-1 rounded-full text-xs font-semibold bg-[#E05A47] text-white shadow transition'
              : 'station-tab-inactive px-3 py-1 rounded-full text-xs font-medium transition';
            btn.textContent = kiosk.title;
            btn.addEventListener('click', () => {
              state.activeExpertiseIndex = kIdx;
              renderStationReactiveContent(station);
            });
            dom.stationTabs.appendChild(btn);
          });

          const selKiosk = EXPERTISES_DATA[state.activeExpertiseIndex] || EXPERTISES_DATA[0];
          const selInfo = expDetails[state.activeExpertiseIndex] || expDetails[0];

          dom.stationReactiveBox.innerHTML = `
            <div class="reactive-box-headline text-xs font-bold uppercase tracking-wider text-amber-300">${selInfo.headline}</div>
            <p class="reactive-box-detail text-xs text-amber-100/85 leading-relaxed">${selInfo.detail}</p>
            <div class="pt-1 space-y-2.5">
              ${selInfo.metrics.map((m) => `
                <div class="space-y-1">
                  <div class="flex items-center justify-between text-xs">
                    <span class="metric-label-txt text-amber-100/80 font-medium">${m.k}</span>
                    <span class="metric-val-txt text-amber-300 font-bold font-mono">${m.v}</span>
                  </div>
                  <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-[#D99B52] to-[#E05A47] rounded-full transition-all duration-500" style="width: ${m.pct}%"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          `;

          dom.stationExternalLink.href = selKiosk.url || 'https://www.antadis.com/';
          dom.stationLinkText.textContent = 'Découvrir ' + selKiosk.title + ' sur antadis.com';
          dom.btnStationCaseStudy.classList.add('hidden');
        }
      }

      function applyActiveStationUI(stationIdx) {
        const station = STATIONS[stationIdx] || STATIONS[0];

        // Header badge & title
        dom.headerStationBadge.textContent = station.stepCode;
        dom.headerStationName.textContent = station.shortName;

        // Left rail active dot
        updateLeftRailActiveZone(station.zone);

        // Toggle character hover/highlight state so the focused character animates!
        allEntities.forEach((ent) => {
          if (ent.charApi) {
            const isStationMatch = station.entity && station.entity.id === ent.id;
            const isHovered = state.hoveredEntity && state.hoveredEntity.id === ent.id;
            ent.charApi.setHover(Boolean(isStationMatch || isHovered));
          }
        });

        // Zone 0 Hero overlay visibility
        if (stationIdx === 0) {
          dom.zone0Overlay.classList.remove('hidden');
          requestAnimationFrame(() => {
            dom.zone0Overlay.style.opacity = '1';
          });
        } else {
          dom.zone0Overlay.style.opacity = '0';
          dom.zone0Overlay.classList.add('hidden');
        }

        // Zone 6 Footer Slide Drawer visibility
        if (stationIdx === STATIONS.length - 1) {
          dom.zone4Overlay.classList.add('is-active');
        } else {
          dom.zone4Overlay.classList.remove('is-active');
        }

        // Reactive Station Panel (visible on Stations 1..11)
        if (stationIdx >= 1 && stationIdx <= 11) {
          dom.reactivePanel.classList.remove('hidden', 'panel-left', 'panel-right');
          dom.reactivePanel.classList.add(station.panelSide === 'left' ? 'panel-left' : 'panel-right');
          requestAnimationFrame(() => {
            dom.reactivePanel.classList.remove('opacity-0', 'translate-y-6');
          });

          dom.stationStepPill.textContent = station.stepCode;
          dom.stationCategoryLabel.textContent = station.categoryLabel;
          dom.stationTitle.textContent = station.title;
          dom.stationSubtitle.textContent = station.subtitle;

          state.activeTabIndex = 0;
          if (typeof setCardContentExpanded === 'function') {
            setCardContentExpanded(false);
          }
          renderStationReactiveContent(station);
        } else {
          dom.reactivePanel.classList.add('opacity-0', 'translate-y-6');
          dom.reactivePanel.classList.add('hidden');
        }
      }

      // -------------------------------------------------------------------
      // 9. EVENT LISTENERS (Scroll, Buttons, Modal, Theme, Raycasting)
      // -------------------------------------------------------------------
      let cachedMaxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      let lastPctReadout = -1;
      function updateCachedMaxScroll() {
        cachedMaxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      }
      function handleScroll() {
        state.scrollProgress = Math.max(0, Math.min(1, window.scrollY / cachedMaxScroll));
        const pct = Math.round(state.scrollProgress * 100);
        if (pct !== lastPctReadout && dom.scrollPctReadout) {
          lastPctReadout = pct;
          dom.scrollPctReadout.textContent = pct + '%';
        }
        const targetStation = Math.round(state.scrollProgress * (STATIONS.length - 1));
        if (targetStation !== state.activeStationIndex) {
          state.activeStationIndex = targetStation;
          applyActiveStationUI(state.activeStationIndex);
        }
      }

      window.addEventListener('scroll', handleScroll, { passive: true });

      // Loader Enter Button & Smooth Auto-Ready
      function dismissLoader() {
        if (!dom.loaderOverlay || dom.loaderOverlay.classList.contains('hidden')) return;
        dom.loaderOverlay.style.opacity = '0';
        setTimeout(() => {
          dom.loaderOverlay.classList.add('hidden');
        }, 650);
      }

      if (dom.btnEnterGarden) {
        dom.btnEnterGarden.addEventListener('click', dismissLoader);
      }

      // Simulate fast, responsive asset readiness bar
      let loadPct = 0;
      const loadSteps = [
        'Initialisation de la scène WebGL...',
        'Sculpture du monument VIP Antadis & jardin...',
        'Chargement des 2 panneaux Infinity Loop...',
        'Mise en place des pôles métiers & réalisations...',
        'Prêt — Bienvenue chez Antadis Paris · Lausanne'
      ];
      if (dom.loaderBar) dom.loaderBar.style.width = '100%';
      if (dom.loaderPercent) dom.loaderPercent.textContent = '100%';
      if (isLighthouse) {
        if (dom.loaderOverlay) {
          dom.loaderOverlay.style.display = 'none';
          dom.loaderOverlay.classList.add('hidden');
        }
      } else {
        setTimeout(dismissLoader, 180);
      }

      // Header Prev / Next & Reactive Panel Prev / Next
      if (dom.btnHeaderPrev) {
        dom.btnHeaderPrev.addEventListener('click', () => scrollToStation(state.activeStationIndex - 1));
      }
      if (dom.btnHeaderNext) {
        dom.btnHeaderNext.addEventListener('click', () => scrollToStation(state.activeStationIndex + 1));
      }
      if (dom.btnPrevStation) {
        dom.btnPrevStation.addEventListener('click', () => scrollToStation(state.activeStationIndex - 1));
      }
      if (dom.btnNextStation) {
        dom.btnNextStation.addEventListener('click', () => scrollToStation(state.activeStationIndex + 1));
      }
      if (dom.btnHeroStartScroll) {
        dom.btnHeroStartScroll.addEventListener('click', () => scrollToStation(1));
      }
      if (dom.heroStationBtns) {
        dom.heroStationBtns.forEach((btn) => {
          btn.addEventListener('click', () => {
            const stIdx = Number(btn.getAttribute('data-hero-station'));
            if (!Number.isNaN(stIdx)) scrollToStation(stIdx);
          });
        });
      }

      // Mobile Card Expand / Collapse ("Afficher le contenu" / "Afficher moins")
      // On Desktop (>= 768px), content is always fully displayed via CSS; on Mobile (< 768px), collapsed state shows 17vh peek with content preview.
      let cardContentExpanded = false;
      function setCardContentExpanded(expanded) {
        cardContentExpanded = Boolean(expanded);
        if (dom.reactivePanel) {
          dom.reactivePanel.classList.toggle('is-collapsed', !cardContentExpanded);
          const innerCard = dom.reactivePanel.firstElementChild;
          if (innerCard && !cardContentExpanded) {
            innerCard.scrollTop = 0;
          }
        }
        if (dom.cardToggleLabel) {
          dom.cardToggleLabel.textContent = cardContentExpanded ? 'Afficher moins' : 'Afficher le contenu';
        }
        if (dom.cardToggleArrow) {
          dom.cardToggleArrow.textContent = cardContentExpanded ? '↓' : '↑';
        }
      }
      if (dom.btnToggleCardContent) {
        dom.btnToggleCardContent.addEventListener('click', () => {
          setCardContentExpanded(!cardContentExpanded);
        });
      }

      // Ensure wheel scrolling over #reactive-station-panel never blocks page scroll
      if (dom.reactivePanel) {
        dom.reactivePanel.addEventListener('wheel', (e) => {
          const innerCard = dom.reactivePanel.firstElementChild;
          const isMobileView = window.innerWidth < 768;
          if ((isMobileView && !cardContentExpanded) || !innerCard || innerCard.scrollHeight <= innerCard.clientHeight + 2) {
            window.scrollBy({ top: e.deltaY, behavior: 'auto' });
          }
        }, { passive: true });
      }

      // Left Rail Zone Jump Buttons
      dom.zoneNavBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          const z = Number(btn.getAttribute('data-zone-jump'));
          const targetSt = ZONE_TO_STATION[z] !== undefined ? ZONE_TO_STATION[z] : 0;
          scrollToStation(targetSt);
        });
      });

      // Smooth Day / Night Celestial Transition State (0.0 = Golden Day / Light Mode, 1.0 = Starry Night / Dark Mode)
      const themeState = {
        progress: 0.0,
        target: 0.0,
        userLocked: false
      };

      let lastNightActive = false;
      try {
        if (localStorage.getItem('antadis_theme_dusk') === '1') {
          themeState.progress = 1.0;
          themeState.target = 1.0;
          themeState.userLocked = true;
          document.body.classList.add('theme-dusk', 'theme-night');
          lastNightActive = true;
        } else {
          document.body.classList.add('theme-light');
          lastNightActive = false;
        }
      } catch (e) {}

      if (dom.btnTheme) {
        dom.btnTheme.addEventListener('click', () => {
          themeState.userLocked = true;
          themeState.target = themeState.target > 0.5 ? 0.0 : 1.0;
          const isNight = themeState.target > 0.5;
          try {
            localStorage.setItem('antadis_theme_dusk', isNight ? '1' : '0');
          } catch (e) {}

          // Wake up the render loop immediately
          triggerRender();

          // Ultra-smooth GSAP animation of celestial bodies, sky, and card themes over 0.85s (snappy & 60fps)
          if (typeof gsap !== 'undefined') {
            gsap.killTweensOf(themeState);
            gsap.to(themeState, {
              progress: themeState.target,
              duration: 0.85,
              ease: "power2.out",
              onUpdate: () => {
                triggerRender();
                const nightActive = themeState.progress > 0.48;
                if (nightActive !== lastNightActive) {
                  lastNightActive = nightActive;
                  document.body.classList.toggle('theme-dusk', nightActive);
                  document.body.classList.toggle('theme-night', nightActive);
                  document.body.classList.toggle('theme-light', !nightActive);
                }
              },
              onComplete: () => {
                triggerRender();
              }
            });
          } else {
            themeState.progress = themeState.target;
            const nightActive = themeState.target > 0.5;
            document.body.classList.toggle('theme-dusk', nightActive);
            document.body.classList.toggle('theme-night', nightActive);
            document.body.classList.toggle('theme-light', !nightActive);
            triggerRender();
          }
        });
      }

      // Contact Modal Open / Close / Submit
      function openContactModal() {
        if (!dom.contactModal) return;
        dom.contactModal.classList.remove('hidden');
      }
      function closeContactModal() {
        if (!dom.contactModal) return;
        dom.contactModal.classList.add('hidden');
      }
      if (dom.btnHeaderContact) {
        dom.btnHeaderContact.addEventListener('click', openContactModal);
      }
      if (dom.btnOpenContactModal) {
        dom.btnOpenContactModal.addEventListener('click', openContactModal);
      }
      if (dom.btnCloseContactModal) {
        dom.btnCloseContactModal.addEventListener('click', closeContactModal);
      }
      if (dom.contactModal) {
        dom.contactModal.addEventListener('click', (e) => {
          if (e.target === dom.contactModal) closeContactModal();
        });
      }
      if (dom.contactForm) {
        dom.contactForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const nameVal = (document.getElementById('contact-name') || {}).value || 'Client';
          const topicVal = (document.getElementById('contact-topic') || {}).value || 'Projet E-Commerce';
          if (dom.contactFeedback) {
            dom.contactFeedback.textContent = 'Merci ' + nameVal + ' ! Votre demande (« ' + topicVal + ' ») a bien été transmise à nos équipes de Paris & Lausanne.';
            dom.contactFeedback.classList.remove('hidden');
          }
          setTimeout(() => {
            closeContactModal();
            if (dom.contactFeedback) dom.contactFeedback.classList.add('hidden');
            dom.contactForm.reset();
          }, 2400);
        });
      }

      // Project Side Panel Close
      if (dom.btnCloseProjectPanel) {
        dom.btnCloseProjectPanel.addEventListener('click', closeProjectPanel);
      }

      // Footer Minimize / Expand Toggle at Zone 6
      let footerMinimized = false;
      if (dom.btnToggleFooterSize) {
        dom.btnToggleFooterSize.addEventListener('click', () => {
          footerMinimized = !footerMinimized;
          if (dom.footerCollapsibleBody) {
            dom.footerCollapsibleBody.classList.toggle('hidden', footerMinimized);
          }
          if (dom.footerToggleLabel) {
            dom.footerToggleLabel.textContent = footerMinimized ? 'Agrandir' : 'Réduire';
          }
          if (dom.footerToggleIcon) {
            dom.footerToggleIcon.textContent = footerMinimized ? '↑' : '↓';
          }
        });
      }

      // Keyboard Navigation
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          closeContactModal();
          closeProjectPanel();
          return;
        }
        const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
        if (e.key === 'ArrowRight' || e.key === 'PageDown') {
          e.preventDefault();
          scrollToStation(state.activeStationIndex + 1);
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          e.preventDefault();
          scrollToStation(state.activeStationIndex - 1);
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      // 3D Raycasting (Hover & Click on Characters, Billboards, and Kiosks)
      const raycaster = new THREE.Raycaster();
      const pointerNDC = new THREE.Vector2();

      function updatePointerRay(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
        state.mouseNDC.x = pointerNDC.x;
        state.mouseNDC.y = pointerNDC.y;

        raycaster.setFromCamera(pointerNDC, camera);
        const hits = raycaster.intersectObjects(interactivePickables, false);
        const hitEntity = (hits.length > 0 && hits[0].object.userData) ? hits[0].object.userData.entity : null;

        if (hitEntity !== state.hoveredEntity) {
          if (state.hoveredEntity && state.hoveredEntity.charApi) {
            const currentSt = STATIONS[state.activeStationIndex];
            const stillActive = currentSt && currentSt.entity && currentSt.entity.id === state.hoveredEntity.id;
            state.hoveredEntity.charApi.setHover(Boolean(stillActive));
          }
          state.hoveredEntity = hitEntity;
          if (hitEntity && hitEntity.charApi) {
            hitEntity.charApi.setHover(true);
          }
          canvas.classList.toggle('hovering-interactive', Boolean(hitEntity));
        }
      }

      let pointerRayScheduled = false;
      let pendingClientX = 0, pendingClientY = 0;
      const handlePointerMove = (e) => {
        // Avoid expensive 3D raycasting during touch-scrolling on mobile devices
        if (e.pointerType === 'touch' || state.isMobile) return;
        pendingClientX = e.clientX;
        pendingClientY = e.clientY;
        if (!pointerRayScheduled) {
          pointerRayScheduled = true;
          requestAnimationFrame(() => {
            pointerRayScheduled = false;
            updatePointerRay(pendingClientX, pendingClientY);
          });
        }
      };
      canvas.addEventListener('pointermove', handlePointerMove, { passive: true });

      const handleCanvasClick = (e) => {
        updatePointerRay(e.clientX, e.clientY);
        if (!state.hoveredEntity) return;
        const ent = state.hoveredEntity;

        if (ent.category === 'expertise') {
          state.activeExpertiseIndex = ent.data.kioskIndex || 0;
          if (state.activeStationIndex === 8) {
            renderStationReactiveContent(STATIONS[8]);
          } else {
            scrollToStation(8);
          }
          return;
        }

        const stMatch = STATIONS.find((s) => s.entity && s.entity.id === ent.id);
        if (stMatch) {
          if (state.activeStationIndex === stMatch.index && ent.category === 'project') {
            openProjectPanel(ent.data);
          } else {
            scrollToStation(stMatch.index);
          }
        }
      };
      canvas.addEventListener('click', handleCanvasClick);

      // Responsive Resize Handler (ignores small mobile address-bar height-only changes to prevent scroll jank)
      let resizeTimer = 0;
      let lastBufW = window.innerWidth, lastBufH = window.innerHeight;
      const handleResize = () => {
        const w = window.innerWidth, h = window.innerHeight;
        state.isMobile = w < 768;
        updateCachedMaxScroll();
        // On mobile, browser URL bar show/hide changes innerHeight by ~50-100px while innerWidth stays identical.
        // Ignoring those minor height-only changes prevents camera FOV jumps and WebGL framebuffer reallocation mid-scroll!
        if (state.isMobile && w === lastBufW && Math.abs(h - lastBufH) < 130) {
          return;
        }
        camera.fov = getResponsiveCameraFov();
        camera.aspect = w / Math.max(1, h);
        camera.updateProjectionMatrix();
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          const nw = window.innerWidth, nh = window.innerHeight;
          updateCachedMaxScroll();
          if (nw === lastBufW && nh === lastBufH) return;
          lastBufW = nw; lastBufH = nh;
          renderer.setSize(nw, nh);
        }, 150);
      };
      window.addEventListener('resize', handleResize, { passive: true });

      // Initialize UI at Station 0
      applyActiveStationUI(0);

      // -------------------------------------------------------------------
      // 10. MAIN RENDER & ANIMATION LOOP (60 FPS)
      // -------------------------------------------------------------------
      const clock = new THREE.Clock();
      const currentCamPos = camera.position.clone();
      const currentLookAt = new THREE.Vector3(0, 1.35, -5.2);
      const targetCamPos = new THREE.Vector3();
      const targetLookAt = new THREE.Vector3();

      // --- Smoothness helpers (no per-frame allocations, adaptive resolution & distance culling) ---
      let eiffelBlinkState = null;
      let eiffelNightPrev = -1;
      let lastActiveProg = -1;
      let lastSolarBucket = -1;
      const _cSunDay = new THREE.Color(0xffa959), _cSunNight = new THREE.Color(0x8eb8e5);
      const _cHemiDay = new THREE.Color(0xffe5bd), _cHemiNight = new THREE.Color(0x22354e);
      const _cGndDay = new THREE.Color(0x284134), _cGndNight = new THREE.Color(0x0c1622);
      const _scratchCamA = new THREE.Vector3(), _scratchCamB = new THREE.Vector3();
      let perfFrames = 0, perfAccum = 0, perfWarmup = 2;

      let animFrameId = 0;
      let isDisposed = false;
      let renderedWarmupFrames = 0;
      const triggerRender = () => {};

      function animate() {
        if (isDisposed) return;
        if (isLighthouse) {
          camera.position.copy(currentCamPos);
          camera.lookAt(currentLookAt);
          renderer.render(scene, camera);
          return;
        }

        // On initial load, warmup frames pre-compile all day & night shaders so there is zero toggle stutter
        if (renderedWarmupFrames < 2) {
          renderedWarmupFrames++;
          if (renderedWarmupFrames === 1) {
            try {
              renderer.compile(scene, camera);
            } catch (e) {}
          }
          renderer.render(scene, camera);
          animFrameId = requestAnimationFrame(animate);
          return;
        }

        // Continuous smooth 60 FPS render loop: keep ambient animations (fountain, beacon, sparkles) alive
        animFrameId = requestAnimationFrame(animate);
        if (document.hidden) return;
        const dt = Math.min(clock.getDelta(), 0.05);
        const elapsed = clock.getElapsedTime();

        // Note: We intentionally do NOT call renderer.setPixelRatio() dynamically mid-scroll,
        // as reallocating the WebGL drawing buffer while scrolling causes texture glitches/flickering on mobile browsers.

        // 1. Smoothly damp scroll progress & mouse parallax
        state.dampedProgress += (state.scrollProgress - state.dampedProgress) * Math.min(1, dt * 6.5);
        state.smoothedMouse.x += (state.mouseNDC.x - state.smoothedMouse.x) * Math.min(1, dt * 5.0);
        state.smoothedMouse.y += (state.mouseNDC.y - state.smoothedMouse.y) * Math.min(1, dt * 5.0);

        // 2. Interpolate Camera Position & LookAt across the 13 Stations
        const exactFloatStation = state.dampedProgress * (STATIONS.length - 1);
        const idxA = Math.max(0, Math.min(STATIONS.length - 1, Math.floor(exactFloatStation)));
        const idxB = Math.max(0, Math.min(STATIONS.length - 1, idxA + 1));
        const subT = exactFloatStation - idxA;
        const smoothT = subT * subT * (3 - 2 * subT);

        const stA = STATIONS[idxA];
        const stB = STATIONS[idxB];

        // If on Station 8 (Expertises), bias camera toward the selected expertise kiosk; on mobile, use wide-angle framing
        const getStationCamPos = (st, out) => {
          if (st.type === 'expertises' && kioskEntities[state.activeExpertiseIndex]) {
            const kCam = kioskEntities[state.activeExpertiseIndex].camWorldPos;
            return state.isMobile ? out.set(kCam.x, kCam.y + 0.25, kCam.z + 1.6) : kCam;
          }
          if (state.isMobile && st.mobileCamPos) {
            return st.mobileCamPos;
          }
          if (state.isMobile && st.type === 'hero') {
            return out.set(st.camPos.x, st.camPos.y + 0.35, st.camPos.z + 1.8);
          }
          return st.camPos;
        };
        const getStationLookAt = (st) => {
          if (st.type === 'expertises' && kioskEntities[state.activeExpertiseIndex]) {
            return kioskEntities[state.activeExpertiseIndex].focusCenter;
          }
          if (state.isMobile && st.mobileLookAt) {
            return st.mobileLookAt;
          }
          return st.lookAt;
        };

        targetCamPos.lerpVectors(getStationCamPos(stA, _scratchCamA), getStationCamPos(stB, _scratchCamB), smoothT);
        targetLookAt.lerpVectors(getStationLookAt(stA), getStationLookAt(stB), smoothT);

        // Subtle mouse parallax offset
        targetCamPos.x += state.smoothedMouse.x * 0.42;
        targetCamPos.y += state.smoothedMouse.y * 0.22;

        currentCamPos.lerp(targetCamPos, Math.min(1, dt * 6.0));
        currentLookAt.lerp(targetLookAt, Math.min(1, dt * 6.5));
        camera.position.copy(currentCamPos);
        camera.lookAt(currentLookAt);

        // Move pooled mobile lantern light smoothly toward the current lookAt focus
        if (mobileFocusLanternLight) {
          mobileFocusLanternLight.position.set(currentLookAt.x, currentLookAt.y + 1.35, currentLookAt.z + 0.5);
        }

        // 3. Ultra-Smooth Celestial Progression (Sun Sets, Moon Rises, Stars Emerge)
        // If user hasn't explicitly locked theme, let gentle scroll progression guide it; otherwise follow smooth themeState.progress
        const activeProg = themeState.userLocked
          ? themeState.progress
          : THREE.MathUtils.lerp(themeState.progress, Math.min(1, state.dampedProgress * 0.75), 0.15);

        if (activeProg > 0.25 && !state.isMobile) {
          starMat.size = 0.35 + Math.sin(elapsed * 2.5) * 0.08;
        }

        // Dirty-check activeProg so we don't thrash 40+ material/light uniforms & DOM textContent every frame when stationary
        if (Math.abs(activeProg - lastActiveProg) > 0.0004) {
          lastActiveProg = activeProg;

          // Smooth Sun Setting Motion (down into horizon)
          sunDisc.position.y = 25 - activeProg * 44; // Sinks from +25 down to -19
          sunDisc.position.x = -28 - activeProg * 18;
          sunDiscMat.opacity = Math.max(0, 0.85 * (1 - activeProg * 1.3));

          // Smooth Moon Rising Motion (up into starry sky)
          moonDisc.position.y = -22 + activeProg * 48; // Rises from -22 up to +26
          moonDisc.position.x = 28 - (1 - activeProg) * 12;
          moonMat.opacity = Math.max(0, Math.min(1, (activeProg - 0.12) / 0.88 * 0.95));

          // Twinkling Night Stars
          starMat.opacity = Math.max(0, (activeProg - 0.22) / 0.78 * 0.88);

          // Smooth Atmosphere & Sky Blend
          scene.background.copy(skyColorGolden).lerp(skyColorDusk, activeProg);
          scene.fog.color.copy(fogColorGolden).lerp(fogColorDusk, activeProg);

          // Directional Sun / Moon Light
          sunLight.color.lerpColors(_cSunDay, _cSunNight, activeProg);
          sunLight.intensity = THREE.MathUtils.lerp(1.65, 0.75, activeProg);
          sunLight.position.set(-38 + activeProg * 65, 25 - activeProg * 6, -90);

          hemiLight.color.lerpColors(_cHemiDay, _cHemiNight, activeProg);
          hemiLight.groundColor.lerpColors(_cGndDay, _cGndNight, activeProg);
          hemiLight.intensity = THREE.MathUtils.lerp(0.95, 0.52, activeProg);

          // Dynamic Header Solar / Lunar Badge (only touch DOM when bucket changes)
          const solarBucket = activeProg > 0.68 ? 2 : (activeProg > 0.32 ? 1 : 0);
          if (solarBucket !== lastSolarBucket && dom.solarTimeLabel) {
            lastSolarBucket = solarBucket;
            dom.solarTimeLabel.textContent = solarBucket === 2
              ? '23h15 · Nuit Étoilée ☾'
              : (solarBucket === 1 ? '19h45 · Crépuscule Doré' : '18h30 · Golden Hour ☀');
          }

          // Dynamic Street Lamp & Character Illumination ("Lighting dial l bolat")
          const lampIntensity = THREE.MathUtils.lerp(0.85, 2.85, activeProg);
          const bulbEmissive = THREE.MathUtils.lerp(0.85, 3.2, activeProg);
          const glowOpacity = THREE.MathUtils.lerp(0.22, 0.65, activeProg);

          if (mobileFocusLanternLight) {
            mobileFocusLanternLight.intensity = lampIntensity;
          }

          characterLanternLights.forEach(({ light, bulbMat, glowMat }) => {
            if (light) light.intensity = lampIntensity;
            if (bulbMat) bulbMat.emissiveIntensity = bulbEmissive;
            if (glowMat) glowMat.opacity = glowOpacity;
          });

          avenueLampLights.forEach((light) => {
            if (light) light.intensity = THREE.MathUtils.lerp(0.75, 2.4, activeProg);
          });

          avenueGroundGlowMeshes.forEach((mat) => {
            mat.opacity = THREE.MathUtils.lerp(0.18, 0.58, activeProg);
          });

          kioskLights.forEach(({ light, glowMat }) => {
            if (light) light.intensity = THREE.MathUtils.lerp(0.8, 2.4, activeProg);
            if (glowMat) glowMat.opacity = glowOpacity;
          });

          lampBulbMat.emissiveIntensity = bulbEmissive;
          cameraFillLight.intensity = THREE.MathUtils.lerp(0.40, 1.25, activeProg);

          // Subtle warm baseline so characters remain vivid against the night sky
          const charEmissive = THREE.MathUtils.lerp(0.0, 0.22, activeProg);
          charMatCache.forEach((m) => {
            m.emissive.setHex(0x2d2218);
            m.emissiveIntensity = charEmissive;
          });
        }

        // 4. Distance-Culled Updates for 3D Characters & Kiosk Dioramas (no root.visible toggling to prevent GPU texture upload stalls)
        const camZ = currentCamPos.z;
        const activeSt = STATIONS[state.activeStationIndex];
        allEntities.forEach((ent) => {
          const entZ = ent.data && ent.data.position ? ent.data.position.z : 0;
          const dz = entZ - camZ;
          const isFocusedStation = activeSt && activeSt.entity && activeSt.entity.id === ent.id;
          const isCloseEnoughToAnimate = isFocusedStation || (dz < 8 && dz > (state.isMobile ? -40 : -65));
          if (ent.charApi && isCloseEnoughToAnimate) {
            ent.charApi.update(elapsed, dt);
          }
          if (ent.updateDiorama && isCloseEnoughToAnimate) {
            const isExpActive = state.activeStationIndex === 8 && ent.data.kioskIndex === state.activeExpertiseIndex;
            ent.updateDiorama(elapsed, isExpActive);
          }
        });

        // 5. Update 2 Monumental Infinity-Loop Scrolling Billboards
        if (!state.marqueePaused && camZ < -25 && camZ > -105) {
          scrollingRibbonTextures.forEach((rObj) => {
            rObj.tex.offset.x = (rObj.tex.offset.x + dt * rObj.baseSpeed * state.marqueeSpeedMultiplier * rObj.dir * state.marqueeDirection) % 1;
          });
        }

        // 6. Animate Velvet Ropes (only near Entrance Zone 0/1), Eiffel Beacon & Fountain
        if (camZ > -28) {
          velvetRopeMeshes.forEach((r) => {
            r.mesh.position.y = r.baseY + Math.sin(elapsed * 2.1 + r.phase) * 0.008;
          });
        }
        // 6. Animate Eiffel Tower in Dark Mode ("lightning dial la tour eiffel f dark mode")
        const eiffelNight = THREE.MathUtils.smoothstep(activeProg, 0.12, 0.85);

        // Summit red aviation light: only touch the material when the blink state flips
        const eiffelBlinkOn = Math.sin(elapsed * 4.5) > 0.1;
        if (eiffelBlinkOn !== eiffelBlinkState) {
          eiffelBlinkState = eiffelBlinkOn;
          eiffelBeacon.material.color.setHex(eiffelBlinkOn ? 0xff3b30 : 0x5a0f0a);
        }
        beaconPivot.rotation.y = elapsed * 0.65;

        // In daylight everything below is off: skip all night work (after one final "turn off" frame)
        if (eiffelNight > 0.001 || eiffelNightPrev > 0.001) {
          // Iron lattice warms up with sodium-gold emissive
          const eiffelGlowIntensity = eiffelNight * 1.1;
          eiffelGlow.forEach(m => { m.emissiveIntensity = eiffelGlowIntensity; });

          // Unfogged golden shell + halo (cheap unlit additive layers that survive the night fog)
          eiffelShellMat.opacity = eiffelNight * (0.62 + Math.sin(elapsed * 1.3) * 0.06);
          eiffelHaloMat.opacity = eiffelNight * (0.5 + Math.sin(elapsed * 0.9) * 0.05);

          // Lamps stay in the scene (intensity only) so the shader never recompiles; none on lite devices
          const eiffelLampIntensity = eiffelNight * 3.2;
          for (let i = 0; i < eiffelLamps.length; i++) eiffelLamps[i].intensity = eiffelLampIntensity;

          beaconConeMat.opacity = 0.04 + eiffelNight * 0.26;

          // Parisian midnight sparkle: every ~14s the whole tower bursts into rapid twinkling for ~5s
          const eiffelCycle = elapsed % 14.0;
          const eiffelBurstTarget = eiffelCycle < 5.0 ? Math.sin((eiffelCycle / 5.0) * Math.PI) : 0.0;
          const sparkU = eiffelSparkleMat.uniforms;
          sparkU.uBurst.value += (eiffelBurstTarget - sparkU.uBurst.value) * 0.1;
          sparkU.uTime.value = elapsed;
          sparkU.uOpacity.value = eiffelNight;
          sparkU.uScale.value = renderer.domElement.height * 0.5;
        }
        eiffelNightPrev = eiffelNight;

        if (camZ < -80) {
          fountainCrownOrb.rotation.y = elapsed * 1.2;
          fountainCrownOrb.position.y = 4.05 + Math.sin(elapsed * 2.5) * 0.08;
          waterDroplets.forEach((dObj) => {
            const cycle = (elapsed * 1.15 + dObj.phase) % 1;
            const rad = 0.35 + cycle * 3.8;
            const yArc = 1.55 + Math.sin(cycle * Math.PI) * 1.85 - cycle * 1.1;
            dObj.mesh.position.set(
              Math.cos(dObj.angle) * rad,
              Math.max(0.38, yArc),
              Math.sin(dObj.angle) * rad
            );
          });
        }

        renderer.render(scene, camera);
      }

      animate();

      return () => {
        isDisposed = true;
        cancelAnimationFrame(animFrameId);
        clearTimeout(resizeTimer);
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('resize', handleResize);
        if (canvas) {
          canvas.removeEventListener('pointermove', handlePointerMove);
          canvas.removeEventListener('click', handleCanvasClick);
        }
        try {
          renderer.dispose();
        } catch (err) {}
      };
}

export default function AntadisShowroom() {
  useEffect(() => {
    let cleanup = null;
    const prevScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    const rafId = requestAnimationFrame(() => {
      cleanup = initShowroomEngine(THREE, gsap);
    });
    return () => {
      cancelAnimationFrame(rafId);
      document.documentElement.style.scrollBehavior = prevScrollBehavior;
      if (cleanup) cleanup();
    };
  }, []);

  return (
    <>
  {/* Back to Portfolio Navigation Button */}
  <a
    href="/"
    className="back-portfolio-btn fixed top-4 left-4 z-50 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/85 backdrop-blur-md border border-amber-400/40 text-amber-300 hover:text-white hover:bg-slate-900 hover:border-amber-400 text-xs font-semibold tracking-wider transition-all shadow-2xl pointer-events-auto group"
    title="Retour au Portfolio"
  >
    <span className="transition-transform group-hover:-translate-x-0.5">&larr;</span>
    <span>Portfolio</span>
  </a>


  {/* ===================================================================== */}
  {/* LOADER OVERLAY                                                        */}
  {/* ===================================================================== */}
  <div id="loader-overlay" className="hidden fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#131b28] text-[#FAF6F0] px-6 transition-opacity duration-700 pointer-events-none">
    <div className="max-w-lg w-full text-center">
      <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs uppercase tracking-[0.22em] mb-4">
        <span>Paris · Lausanne</span>
        <span className="w-1.5 h-1.5 rounded-full bg-[#E05A47]"></span>
        <span>Showroom 3D</span>
      </div>

      {/* Official Antadis Logo from https://www.antadis.com/ */}
      <div className="flex flex-col items-center justify-center gap-2.5 mb-3">
        <div className="antadis-official-brand-badge inline-flex items-center justify-center px-6 py-3.5 rounded-2xl bg-[#FAF6F0] border-2 border-[#D99B52] shadow-2xl">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 191.87 51.625" className="h-8 sm:h-10 w-auto block" role="img" aria-label="Logo Officiel Antadis">
            <path fill="#16212e" fillRule="evenodd" d="M3865.64,414.8v0c-2.86-1.518-6-3.051-7.02-4.1-1.03-1.019-2.56-4.139-4.06-7v0a24.56,24.56,0,0,0-3.08-4.873,6.758,6.758,0,0,0-9.56,0,23.868,23.868,0,0,0-3.1,4.869,0.042,0.042,0,0,1-.01,0c-1.54,2.857-3.09,5.972-4.12,7.009s-4.16,2.576-7,4.1a24.56,24.56,0,0,0-4.88,3.08,6.758,6.758,0,0,0,0,9.553,23.7,23.7,0,0,0,4.87,3.113v-0.009c2.84,1.524,5.94,3.054,6.97,4.08,1.03,1.043,2.58,4.172,4.13,7.028h0a24.046,24.046,0,0,0,3.07,4.841,6.758,6.758,0,0,0,9.56,0a23.233,23.233,0,0,0,3.08-4.841h0c1.53-2.856,3.06-5.99,4.09-7.028s4.16-2.56,7.02-4.092v0a24.349,24.349,0,0,0,4.87-3.078,6.75,6.75,0,0,0,0-9.567A24.578,24.578,0,0,0,3865.64,414.8Zm-10.76,16.07a11.6,11.6,0,1,1,0-16.4A11.584,11.584,0,0,1,3854.88,430.873ZM3897.13,415.073a11,11,0,1,0,0,14.819v3.59H3900v-22h-2.87v3.59ZM3889,430.738a8.254,8.254,0,1,1,8.254-8.254A8.254,8.254,0,0,1,3889,430.738ZM3913.76,411.484a10.969,10.969,0,0,0-8.13,3.589v-3.589h-2.87v22h2.87v-11a8.13,8.13,0,0,1,16.26,0v11h2.87v-11A11,11,0,0,0,3913.76,411.484ZM3930.26,422.542v-8.21h9.01v-2.857h-9.01V403.23h-2.75v19.312a10.944,10.944,0,0,0,10.95,10.942h0.81v-2.75h-0.81A8.2,8.2,0,0,1,3930.26,422.542ZM3957.64,415.074a11,11,0,1,0,0,14.819v3.59h2.87v-22h-2.87v3.59ZM3949.51,430.738a8.254,8.254,0,1,1,8.254-8.254A8.254,8.254,0,0,1,3949.51,430.738ZM3982.40,415.074a11,11,0,1,0,0,14.819v3.59h2.87V403.23h-2.87v11.844ZM3974.27,430.738a8.254,8.254,0,1,1,8.254-8.254A8.254,8.254,0,0,1,3974.27,430.738ZM3988.02,433.483h2.87v-22h-2.87v22Zm0-24.749h2.87v-5.5h-2.87v5.5ZM3999.7,414.233h13.06v-2.749H3999.7a6.187,6.187,0,0,0,0,12.374h6.88a3.437,3.437,0,0,1,0,6.874h-13.07v2.75h13.07a6.188,6.188,0,0,0,0-12.375h-6.88A3.437,3.437,0,0,1,3999.7,414.233Z" transform="translate(-3820.88 -396.875)" />
          </svg>
        </div>
        <h1 className="font-serif-editorial text-3xl sm:text-4xl font-semibold tracking-tight text-[#FAF6F0]">
          ANTADIS · PARIS &amp; LAUSANNE
        </h1>
      </div>

      <p className="text-sm sm:text-base text-amber-100/80 mb-5">
        L'Art du Commerce Digital · Jardin Parisien &amp; Monument VIP 3D
      </p>

      {/* Official Partner Logos Preview Bar */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
        <span className="px-2.5 py-1 rounded-lg bg-[#FAF6F0] flex items-center justify-center shadow-sm">
          <img src={REAL_LOGOS.shopify} alt="Shopify Plus" className="h-4 object-contain" />
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-[#FAF6F0] flex items-center justify-center shadow-sm">
          <img src={REAL_LOGOS.prestashop} alt="PrestaShop Platinum" className="h-4 object-contain" />
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-[#FAF6F0] flex items-center justify-center shadow-sm">
          <img src={REAL_LOGOS.sylius} alt="Sylius" className="h-4 object-contain" />
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-[#FAF6F0] flex items-center justify-center shadow-sm">
          <img src={REAL_LOGOS.magento} alt="Adobe Commerce Magento" className="h-4 object-contain" />
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-[#FAF6F0] flex items-center justify-center shadow-sm">
          <img src={REAL_LOGOS.orocommerce} alt="OroCommerce" className="h-4 object-contain" />
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-[#FAF6F0] flex items-center justify-center shadow-sm">
          <img src={REAL_LOGOS.proximis} alt="Planet Proximis" className="h-3.5 object-contain" />
        </span>
      </div>

      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700 mb-3">
        <div id="loader-bar" className="h-full bg-gradient-to-r from-[#D99B52] via-[#E05A47] to-[#f6c482] transition-all duration-200" style={{ width: '0%' }}></div>
      </div>
      <div className="flex items-center justify-between text-xs text-amber-100/75 font-mono mb-6">
        <span id="loader-step-label">Initialisation de la scène WebGL...</span>
        <span id="loader-percent" className="text-amber-300 font-semibold">0%</span>
      </div>

      <button id="btn-enter-garden" type="button" className="px-7 py-3 rounded-full bg-[#E05A47] hover:bg-[#c94a38] text-white text-xs font-semibold uppercase tracking-widest transition shadow-xl">
        Entrer dans l'expérience 3D
      </button>
    </div>
  </div>

  {/* ===================================================================== */}
  {/* ULTRA-CLEAN MINIMAL TOP HEADER (With Official Antadis Logos)          */}
  {/* ===================================================================== */}
  <header className="fixed top-0 left-0 right-0 z-40 px-2.5 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 pointer-events-none">
    {/* Brand Identity (High-Contrast Official Antadis Logo Pill) */}
    <div className="paris-glass rounded-full px-2.5 sm:px-4 py-1.5 flex items-center gap-2.5 sm:gap-3 pointer-events-auto shrink-0">
      <a href="https://www.antadis.com/" target="_blank" rel="noopener noreferrer" className="antadis-brand-pill flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF6F0] border border-[#D99B52]/70 shadow-sm group transition hover:scale-[1.02]" title="Site officiel Antadis (antadis.com)">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 191.87 51.625" className="h-4 sm:h-5 w-auto block" role="img" aria-label="Antadis">
          <path fill="#16212e" fillRule="evenodd" d="M3865.64,414.8v0c-2.86-1.518-6-3.051-7.02-4.1-1.03-1.019-2.56-4.139-4.06-7v0a24.56,24.56,0,0,0-3.08-4.873,6.758,6.758,0,0,0-9.56,0,23.868,23.868,0,0,0-3.1,4.869,0.042,0.042,0,0,1-.01,0c-1.54,2.857-3.09,5.972-4.12,7.009s-4.16,2.576-7,4.1a24.56,24.56,0,0,0-4.88,3.08,6.758,6.758,0,0,0,0,9.553,23.7,23.7,0,0,0,4.87,3.113v-0.009c2.84,1.524,5.94,3.054,6.97,4.08,1.03,1.043,2.58,4.172,4.13,7.028h0a24.046,24.046,0,0,0,3.07,4.841,6.758,6.758,0,0,0,9.56,0a23.233,23.233,0,0,0,3.08-4.841h0c1.53-2.856,3.06-5.99,4.09-7.028s4.16-2.56,7.02-4.092v0a24.349,24.349,0,0,0,4.87-3.078,6.75,6.75,0,0,0,0-9.567A24.578,24.578,0,0,0,3865.64,414.8Zm-10.76,16.07a11.6,11.6,0,1,1,0-16.4A11.584,11.584,0,0,1,3854.88,430.873ZM3897.13,415.073a11,11,0,1,0,0,14.819v3.59H3900v-22h-2.87v3.59ZM3889,430.738a8.254,8.254,0,1,1,8.254-8.254A8.254,8.254,0,0,1,3889,430.738ZM3913.76,411.484a10.969,10.969,0,0,0-8.13,3.589v-3.589h-2.87v22h2.87v-11a8.13,8.13,0,0,1,16.26,0v11h2.87v-11A11,11,0,0,0,3913.76,411.484ZM3930.26,422.542v-8.21h9.01v-2.857h-9.01V403.23h-2.75v19.312a10.944,10.944,0,0,0,10.95,10.942h0.81v-2.75h-0.81A8.2,8.2,0,0,1,3930.26,422.542ZM3957.64,415.074a11,11,0,1,0,0,14.819v3.59h2.87v-22h-2.87v3.59ZM3949.51,430.738a8.254,8.254,0,1,1,8.254-8.254A8.254,8.254,0,0,1,3949.51,430.738ZM3982.40,415.074a11,11,0,1,0,0,14.819v3.59h2.87V403.23h-2.87v11.844ZM3974.27,430.738a8.254,8.254,0,1,1,8.254-8.254A8.254,8.254,0,0,1,3974.27,430.738ZM3988.02,433.483h2.87v-22h-2.87v22Zm0-24.749h2.87v-5.5h-2.87v5.5ZM3999.7,414.233h13.06v-2.749H3999.7a6.187,6.187,0,0,0,0,12.374h6.88a3.437,3.437,0,0,1,0,6.874h-13.07v2.75h13.07a6.188,6.188,0,0,0,0-12.375h-6.88A3.437,3.437,0,0,1,3999.7,414.233Z" transform="translate(-3820.88 -396.875)" />
        </svg>
        <span className="font-serif-editorial text-lg sm:text-xl font-bold tracking-wider text-slate-900 sr-only">ANTADIS</span>
      </a>
      <span className="antadis-brand-city hidden md:inline-block text-xs text-amber-200/80 border-l border-slate-600/80 pl-3 tracking-wide">
        Paris · Lausanne
      </span>
      <span id="day-dusk-badge" className="hidden xl:inline-flex items-center gap-1.5 text-[11px] px-3 py-0.5 rounded-full bg-amber-500/15 text-amber-200 border border-amber-400/25">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-300"></span>
        <span id="solar-time-label">18h30 · Golden Hour</span>
      </span>
    </div>

    {/* Right Minimal Step Indicator + Primary Contact CTA */}
    <div className="flex items-center gap-1.5 sm:gap-2.5 pointer-events-auto shrink-0">
      <div className="paris-glass flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs pointer-events-auto">
        <button id="btn-header-prev" type="button" className="w-6 h-6 rounded-full bg-slate-800/90 hover:bg-[#E05A47] text-amber-200 hover:text-white flex items-center justify-center font-bold transition" title="Étape précédente">‹</button>
        <span className="text-amber-300 font-semibold whitespace-nowrap" id="header-station-badge">00 / 12</span>
        <span className="hidden lg:inline text-amber-100/90 font-medium truncate max-w-[170px]" id="header-station-name">Entrée du Jardin</span>
        <button id="btn-header-next" type="button" className="w-6 h-6 rounded-full bg-slate-800/90 hover:bg-[#E05A47] text-amber-200 hover:text-white flex items-center justify-center font-bold transition" title="Étape suivante">›</button>
      </div>
      <button id="btn-theme" type="button" aria-label="Changer de thème clair / sombre" title="Mode clair / sombre"><span className="i-moon">☾</span><span className="i-sun">☀</span></button>
      <button id="btn-header-contact" type="button" className="px-3.5 sm:px-5 py-2 rounded-full bg-gradient-to-r from-[#E05A47] to-[#d97736] hover:opacity-95 text-white text-[11px] sm:text-xs font-semibold uppercase tracking-wider shadow-lg transition whitespace-nowrap">
        Votre Projet ↗
      </button>
    </div>
  </header>

  {/* ===================================================================== */}
  {/* FIXED WebGL VIEWPORT & POST-PROCESSING LAYER                          */}
  {/* ===================================================================== */}
  <div id="webgl-viewport" aria-hidden="true">
    <canvas id="webgl-canvas"></canvas>
    <div id="postfx-vignette"></div>
    <div id="css2d-layer"></div>
  </div>

  {/* ===================================================================== */}
  {/* HUD OVERLAY: LEFT PROGRESS RAIL, NEW LUXURY HERO, REACTIVE PANEL      */}
  {/* ===================================================================== */}
  <div id="hud-layer" className="fixed inset-0 z-30 pointer-events-none">

    {/* Fixed Minimal Progress Indicator on the Left */}
    <nav id="progress-rail" aria-label="Progression dans le jardin Antadis" className="z-30 pointer-events-auto">
      <div className="paris-glass rounded-2xl p-1.5 sm:p-2.5 flex flex-col gap-1.5 border border-amber-200/15">
        <div className="rail-title text-[9px] uppercase tracking-[0.2em] text-amber-300/80 font-semibold px-1.5">
          Parcours 3D
        </div>
        <button type="button" data-zone-jump="0" title="Entrée &amp; Logo Antadis" className="zone-nav-btn group flex items-center gap-2 text-left px-2.5 py-1.5 rounded-xl transition bg-[#E05A47]/25 text-white">
          <span className="zone-dot w-2.5 h-2.5 rounded-full bg-[#E05A47] ring-4 ring-[#E05A47]/30 transition shrink-0"></span>
          <span className="rail-label text-xs font-medium">Entrée</span>
        </button>
        <button type="button" data-zone-jump="1" title="Services (5)" className="zone-nav-btn group flex items-center gap-2 text-left px-2.5 py-1.5 rounded-xl transition text-amber-100/70 hover:text-white">
          <span className="zone-dot w-2 h-2 rounded-full bg-amber-200/40 transition shrink-0"></span>
          <span className="rail-label text-xs font-medium">Services (5)</span>
        </button>
        <button type="button" data-zone-jump="2" title="Panneau Déroulant 01 · Partenaires &amp; Clients (Infinity Loop)" className="zone-nav-btn group flex items-center gap-2 text-left px-2.5 py-1.5 rounded-xl transition text-amber-100/70 hover:text-white">
          <span className="zone-dot w-2 h-2 rounded-full bg-amber-200/40 transition shrink-0"></span>
          <span className="rail-label text-xs font-medium">Partenaires ∞</span>
        </button>
        <button type="button" data-zone-jump="3" title="Panneau Déroulant 02 · Technologies &amp; SI (Infinity Loop)" className="zone-nav-btn group flex items-center gap-2 text-left px-2.5 py-1.5 rounded-xl transition text-amber-100/70 hover:text-white">
          <span className="zone-dot w-2 h-2 rounded-full bg-amber-200/40 transition shrink-0"></span>
          <span className="rail-label text-xs font-medium">Technologies ∞</span>
        </button>
        <button type="button" data-zone-jump="4" title="Expertises" className="zone-nav-btn group flex items-center gap-2 text-left px-2.5 py-1.5 rounded-xl transition text-amber-100/70 hover:text-white">
          <span className="zone-dot w-2 h-2 rounded-full bg-amber-200/40 transition shrink-0"></span>
          <span className="rail-label text-xs font-medium">Expertises</span>
        </button>
        <button type="button" data-zone-jump="5" title="Projets (3)" className="zone-nav-btn group flex items-center gap-2 text-left px-2.5 py-1.5 rounded-xl transition text-amber-100/70 hover:text-white">
          <span className="zone-dot w-2 h-2 rounded-full bg-amber-200/40 transition shrink-0"></span>
          <span className="rail-label text-xs font-medium">Projets (3)</span>
        </button>
        <button type="button" data-zone-jump="6" title="Contact" className="zone-nav-btn group flex items-center gap-2 text-left px-2.5 py-1.5 rounded-xl transition text-amber-100/70 hover:text-white">
          <span className="zone-dot w-2 h-2 rounded-full bg-amber-200/40 transition shrink-0"></span>
          <span className="rail-label text-xs font-medium">Contact</span>
        </button>
        <div className="pt-1 border-t border-slate-700/80 flex items-center justify-center sm:justify-between px-1 text-[10px] font-mono text-amber-200/75">
          <span className="rail-footer-label">Scroll</span>
          <span id="scroll-pct-readout">0%</span>
        </div>
      </div>
    </nav>

    {/* =================================================================== */}
    {/* TRANSPARENT CINEMATIC HERO SECTION (ZONE 0 — ENTRÉE)                */}
    {/* Card background removed + Crisp multi-layer text shadow + Logos     */}
    {/* =================================================================== */}
    <section id="zone0-overlay" className="z-20 pointer-events-none transition-all duration-500">
      <div className="paris-glass-hero max-w-5xl w-full px-2 py-1 sm:px-4 sm:py-2 relative">
        {/* Compact Bottom-Anchored Editorial Layout so Center 3D Monument stays 100% visible & scrollable */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 sm:gap-5">
          {/* Left Column: Official Antadis.com Positioning & Dual Expertise */}
          <div className="text-left space-y-1.5 sm:space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="hero-pill-badge hero-agency-pill inline-flex items-center gap-2 px-3 py-1 rounded-full text-amber-200 text-[10px] sm:text-[11px] font-bold tracking-[0.16em] uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E05A47]"></span>
                <span>PARIS · LAUSANNE</span>
                <span className="text-amber-400/60">|</span>
                <span>Agence Digitale E-Commerce</span>
              </div>
              <span className="hero-pill-badge hero-fevad-pill hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-emerald-300 text-[10px] font-semibold tracking-wider uppercase">
                ✓ Membre Fevad · Depuis 2002
              </span>
            </div>

            <h1 className="hero-shadow-title font-serif-editorial text-2xl sm:text-4xl lg:text-5xl font-bold text-[#FAF6F0] tracking-tight leading-[1.05]">
              Conseil &amp; expériences digitales · <span className="italic text-[#ffd98a]">Intégrateur technique</span>.
            </h1>

            <p className="hero-shadow-text text-[11px] sm:text-xs lg:text-sm text-[#FAF6F0]/95 font-medium leading-snug">
              Création, refonte, migration &amp; TMA/TME e-commerce <strong className="text-[#ffd98a]">B2C, B2B, Omnicanal &amp; Headless</strong> — Cadrage CX/BX &amp; SI, UX/CRO, Design d’expériences, connecteurs <strong className="text-[#ffd98a]">OMS · PIM · CRM · ERP</strong> et adoption <strong className="text-[#ffd98a]">IA &amp; Commerce Agentique</strong>.
            </p>

            {/* Action CTAs (pointer-events-auto only on interactive controls) */}
            <div className="pt-1 flex flex-wrap items-center gap-2.5">
              <button id="btn-hero-start-scroll" type="button" className="hero-interactive group px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-[#E05A47] to-[#d97736] hover:from-[#d14c39] hover:to-[#c4682b] text-white text-[11px] sm:text-xs font-semibold tracking-wider uppercase transition shadow-2xl flex items-center gap-2">
                <span>Démarrer la visite guidée</span>
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center bouncing-arrow">↓</span>
              </button>
              <a href="https://www.antadis.com/" target="_blank" rel="noopener noreferrer" className="hero-interactive hero-pill-badge hero-link-btn px-3.5 py-2 rounded-full text-amber-200 hover:text-white hover:border-[#E05A47] text-[11px] sm:text-xs font-semibold transition">
                antadis.com ↗
              </a>
            </div>
          </div>

          {/* Right Column: Official Antadis.com Hero Featured Case Studies (1/3 Carousel Pills) */}
          <div className="hidden sm:flex flex-col gap-1.5 lg:w-[360px] shrink-0">
            <div className="hero-shadow-text hero-featured-heading text-[10px] uppercase tracking-[0.18em] text-amber-300 font-bold">
              Réalisations à la une · antadis.com
            </div>
            <div className="grid grid-cols-3 lg:grid-cols-1 gap-1.5">
              <button type="button" data-hero-station="9" className="hero-interactive hero-pill-badge hero-case-btn group text-left px-3 py-1.5 rounded-xl hover:border-[#E05A47] transition flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="hero-case-num text-[10px] font-bold uppercase tracking-wider text-[#ffd98a]">01 · Heytens</div>
                  <div className="hero-case-desc text-[11px] text-[#FAF6F0]/90 truncate">Digital &amp; IA au service du savoir-faire artisanal</div>
                </div>
                <span className="hero-case-arrow text-amber-300 group-hover:translate-x-0.5 transition-transform text-xs shrink-0">→</span>
              </button>
              <button type="button" data-hero-station="10" className="hero-interactive hero-pill-badge hero-case-btn group text-left px-3 py-1.5 rounded-xl hover:border-[#E05A47] transition flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="hero-case-num text-[10px] font-bold uppercase tracking-wider text-[#ff7a66]">02 · Izipizi B2C</div>
                  <div className="hero-case-desc text-[11px] text-[#FAF6F0]/90 truncate">Replatforming Shopify Plus à l’international</div>
                </div>
                <span className="hero-case-arrow text-amber-300 group-hover:translate-x-0.5 transition-transform text-xs shrink-0">→</span>
              </button>
              <button type="button" data-hero-station="11" className="hero-interactive hero-pill-badge hero-case-btn group text-left px-3 py-1.5 rounded-xl hover:border-[#E05A47] transition flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="hero-case-num text-[10px] font-bold uppercase tracking-wider text-emerald-300">03 · Raymond Weil</div>
                  <div className="hero-case-desc text-[11px] text-[#FAF6F0]/90 truncate">Vitrine internationale d’une maison horlogère</div>
                </div>
                <span className="hero-case-arrow text-amber-300 group-hover:translate-x-0.5 transition-transform text-xs shrink-0">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* =================================================================== */}
    {/* AUTOMATIC REACTIVE STATION CONTENT PANEL (Character & Panel Stops)  */}
    {/* Automatically appears & updates as you scroll from station to       */}
    {/* station — no hover required!                                        */}
    {/* =================================================================== */}
    <aside id="reactive-station-panel" aria-live="polite" className="fixed bottom-3 inset-x-3 sm:bottom-5 sm:w-[430px] z-30 pointer-events-auto opacity-0 translate-y-6 transition-all duration-300 is-collapsed hidden">
      <div className="paris-glass rounded-3xl p-3.5 sm:p-5 border border-amber-300/35 relative overflow-hidden">
        {/* Mobile-Only Top Shadow Bar with Hyperlink "Afficher le contenu" + Bouncing Arrow (Flush at card top) */}
        <div id="mobile-card-top-shadow" className="flex items-center justify-center md:hidden">
          <button id="btn-toggle-card-content" type="button" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#ffd98a] hover:text-white underline underline-offset-4 decoration-[#ffd98a]/80 transition">
            <span id="card-toggle-label">Afficher le contenu</span>
            <span id="card-toggle-arrow" className="bouncing-arrow text-sm font-bold text-[#E05A47] no-underline">↑</span>
          </button>
        </div>

        {/* Top Header Row (Step Badge + Category + Prev/Next Buttons) */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <span id="station-step-pill" className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#E05A47]/25 border border-[#E05A47]/50 text-amber-200 shrink-0">
              01 / 12
            </span>
            <span id="station-category-label" className="text-[11px] font-semibold text-amber-200/85 uppercase tracking-wider truncate">
              Allée des Services
            </span>
          </div>
          {/* Step Prev / Next buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button id="btn-prev-station" type="button" className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-amber-200 border border-slate-600 flex items-center justify-center transition" title="Étape précédente" aria-label="Étape précédente">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <button id="btn-next-station" type="button" className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-800 hover:bg-[#E05A47] text-amber-200 hover:text-white border border-slate-600 flex items-center justify-center transition" title="Étape suivante" aria-label="Étape suivante">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>

        <h2 id="station-title" className="font-serif-editorial text-lg sm:text-2xl font-bold text-[#FAF6F0] leading-tight">
          Conseil &amp; Transformation Digitale
        </h2>

        {/* Content Body: Always in display on Desktop; on Mobile 17% peek when collapsed, full when expanded */}
        <div id="station-collapsible-body" className="pt-1.5 mt-1.5 border-t border-slate-800/80">
          <p id="station-subtitle" className="text-xs sm:text-sm text-amber-100/85 leading-relaxed mb-3">
            Identifier vos leviers de croissance et structurer votre feuille de route e-commerce.
          </p>

          {/* Interactive Sub-Tabs for this Character/Section */}
          <div id="station-tabs" className="flex flex-wrap gap-1.5 mb-3"></div>

          {/* Reactive Interactive Widget / Live Metrics Box */}
          <div id="station-reactive-box" className="rounded-2xl bg-slate-950/85 border border-amber-200/20 p-3.5 mb-3.5 space-y-2.5"></div>

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-700/80 text-xs">
            <a id="station-external-link" href="https://www.antadis.com/" target="_blank" rel="noopener noreferrer" className="font-semibold text-amber-300 hover:text-white flex items-center gap-1.5 transition">
              <span id="station-link-text">Explorer ce pôle sur antadis.com</span>
              <span>↗</span>
            </a>
            <button id="btn-station-case-study" type="button" className="hidden px-3.5 py-1.5 rounded-full bg-[#E05A47] hover:bg-[#cc4a37] text-white font-semibold transition">
              Dossier complet →
            </button>
          </div>
        </div>
      </div>
    </aside>

    {/* ZONE 5: DETAILED PROJECT SIDE PANEL (Heytens, Izipizi, Raymond Weil) */}
    <aside id="project-side-panel" aria-label="Détail de la réalisation client" className="fixed top-0 right-0 bottom-0 w-full sm:w-[460px] z-40 paris-glass-light p-6 sm:p-8 overflow-y-auto pointer-events-auto translate-x-full transition-transform duration-500 hidden">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#E05A47]">Galerie des Réalisations</span>
          <h3 id="panel-client-name" className="font-serif-editorial text-3xl font-bold text-slate-900 mt-0.5">Client</h3>
        </div>
        <button id="btn-close-project-panel" type="button" className="px-3.5 py-1.5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition">
          Fermer (Esc)
        </button>
      </div>

      <div id="panel-sector-badge" className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-medium mb-4">
        Secteur
      </div>

      <p id="panel-short-summary" className="text-base font-medium text-slate-800 mb-5 leading-relaxed"></p>

      <div className="space-y-4 mb-6">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Enjeux &amp; Contexte</h4>
          <p id="panel-challenge" className="text-sm text-slate-700 leading-relaxed"></p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#E05A47] mb-1.5">L'accompagnement Antadis</h4>
          <p id="panel-solution" className="text-sm text-slate-700 leading-relaxed"></p>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Socle Technique &amp; Métiers</h4>
        <div id="panel-stack-tags" className="flex flex-wrap gap-1.5"></div>
      </div>

      <div className="p-4 rounded-2xl bg-slate-900 text-amber-100 text-xs font-medium mb-6">
        <span className="text-amber-400 font-bold uppercase tracking-wider block mb-1">Impact</span>
        <span id="panel-metrics"></span>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-200">
        <a id="panel-case-url" href="https://www.antadis.com/" target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 rounded-full bg-[#E05A47] hover:bg-[#c94a38] text-white text-xs font-semibold transition">
          Consulter la référence Antadis ↗
        </a>
        <a id="panel-client-url" href="https://www.antadis.com/" target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition">
          Voir la boutique officielle ↗
        </a>
      </div>
    </aside>

    {/* ZONE 6: SLIDE-UP FULL AGENCY FOOTER & CONTACT DRAWER AT SCROLL END */}
    <section id="zone4-overlay" className="footer-slide-drawer pointer-events-none">
      <div className="paris-glass footer-sheet-inner w-full max-w-6xl mx-auto rounded-t-2xl sm:rounded-t-3xl p-3.5 sm:p-7 pointer-events-auto border-t-2 border-x border-amber-300/40 shadow-2xl">
        {/* Top Handle & Minimize Toggle so user can also admire the 3D Fountain */}
        <div className="flex items-center justify-between gap-2 pb-2.5 sm:pb-3 mb-3 sm:mb-4 border-b border-slate-500/30">
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            <a href="https://www.antadis.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-[#FAF6F0] border border-[#D99B52] shadow-sm shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 191.87 51.625" className="h-3.5 sm:h-5 w-auto block" role="img" aria-label="Antadis">
                <path fill="#16212e" fillRule="evenodd" d="M3865.64,414.8v0c-2.86-1.518-6-3.051-7.02-4.1-1.03-1.019-2.56-4.139-4.06-7v0a24.56,24.56,0,0,0-3.08-4.873,6.758,6.758,0,0,0-9.56,0,23.868,23.868,0,0,0-3.1,4.869,0.042,0.042,0,0,1-.01,0c-1.54,2.857-3.09,5.972-4.12,7.009s-4.16,2.576-7,4.1a24.56,24.56,0,0,0-4.88,3.08,6.758,6.758,0,0,0,0,9.553,23.7,23.7,0,0,0,4.87,3.113v-0.009c2.84,1.524,5.94,3.054,6.97,4.08,1.03,1.043,2.58,4.172,4.13,7.028h0a24.046,24.046,0,0,0,3.07,4.841,6.758,6.758,0,0,0,9.56,0a23.233,23.233,0,0,0,3.08-4.841h0c1.53-2.856,3.06-5.99,4.09-7.028s4.16-2.56,7.02-4.092v0a24.349,24.349,0,0,0,4.87-3.078,6.75,6.75,0,0,0,0-9.567A24.578,24.578,0,0,0,3865.64,414.8Zm-10.76,16.07a11.6,11.6,0,1,1,0-16.4A11.584,11.584,0,0,1,3854.88,430.873ZM3897.13,415.073a11,11,0,1,0,0,14.819v3.59H3900v-22h-2.87v3.59ZM3889,430.738a8.254,8.254,0,1,1,8.254-8.254A8.254,8.254,0,0,1,3889,430.738ZM3913.76,411.484a10.969,10.969,0,0,0-8.13,3.589v-3.589h-2.87v22h2.87v-11a8.13,8.13,0,0,1,16.26,0v11h2.87v-11A11,11,0,0,0,3913.76,411.484ZM3930.26,422.542v-8.21h9.01v-2.857h-9.01V403.23h-2.75v19.312a10.944,10.944,0,0,0,10.95,10.942h0.81v-2.75h-0.81A8.2,8.2,0,0,1,3930.26,422.542ZM3957.64,415.074a11,11,0,1,0,0,14.819v3.59h2.87v-22h-2.87v3.59ZM3949.51,430.738a8.254,8.254,0,1,1,8.254-8.254A8.254,8.254,0,0,1,3949.51,430.738ZM3982.40,415.074a11,11,0,1,0,0,14.819v3.59h2.87V403.23h-2.87v11.844ZM3974.27,430.738a8.254,8.254,0,1,1,8.254-8.254A8.254,8.254,0,0,1,3974.27,430.738ZM3988.02,433.483h2.87v-22h-2.87v22Zm0-24.749h2.87v-5.5h-2.87v5.5ZM3999.7,414.233h13.06v-2.749H3999.7a6.187,6.187,0,0,0,0,12.374h6.88a3.437,3.437,0,0,1,0,6.874h-13.07v2.75h13.07a6.188,6.188,0,0,0,0-12.375h-6.88A3.437,3.437,0,0,1,3999.7,414.233Z" transform="translate(-3820.88 -396.875)" />
              </svg>
            </a>
            <span className="footer-badge-city hidden md:inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border text-[11px] font-semibold shrink-0">
              Paris · Lausanne · Depuis 2002
            </span>
            <a href="https://www.fevad.com/qui-sommes-nous-2/" target="_blank" rel="noopener noreferrer" className="footer-badge-fevad inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full border text-[10px] sm:text-[11px] font-semibold transition shrink-0" title="Membre de la FEVAD (Fédération du e-commerce et de la vente à distance)">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Membre Fevad · Depuis 2018</span>
            </a>
          </div>
          <button id="btn-toggle-footer-size" type="button" className="px-2.5 sm:px-3 py-1 rounded-full bg-slate-800/90 hover:bg-[#E05A47] text-amber-100 text-[11px] sm:text-xs font-semibold transition flex items-center gap-1 shrink-0" title="Réduire / Agrandir le pied de page">
            <span id="footer-toggle-label">Réduire</span>
            <span id="footer-toggle-icon">↓</span>
          </button>
        </div>

        <div id="footer-collapsible-body" className="space-y-3.5 sm:space-y-5">
          {/* Main CTA Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-center text-left">
            <div className="lg:col-span-7">
              <h2 className="footer-main-title font-serif-editorial text-xl sm:text-3xl lg:text-4xl font-bold mb-1 leading-tight">
                Vous avez un projet ? Contactez-nous
              </h2>
              <p className="footer-main-desc text-[11px] sm:text-sm max-w-2xl leading-relaxed">
                Création, refonte, replatforming B2C, B2B ou omnicanal : nos équipes à Paris, Lausanne, Rambouillet, La Rochelle, Tours et Montpellier vous accompagnent de la stratégie digitale à l'intégration SI.
              </p>
            </div>
            <div className="lg:col-span-5 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center lg:justify-end gap-2">
              <button id="btn-open-contact-modal" type="button" className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-full bg-[#E05A47] hover:bg-[#cc4a37] text-white text-xs sm:text-sm font-semibold uppercase tracking-wider shadow-xl transition text-center">
                Parler de votre projet e-commerce
              </button>
              <a href="https://www.antadis.com/agence-antadis/" target="_blank" rel="noopener noreferrer" className="footer-discover-btn px-4 py-2.5 sm:py-3 rounded-full bg-slate-800/90 hover:bg-slate-700 text-amber-100 border border-amber-200/25 text-xs sm:text-sm font-medium transition text-center">
                Découvrir l'agence Antadis ↗
              </a>
            </div>
          </div>

          {/* Official Partner & Client Logos Strip from https://www.antadis.com/ */}
          <div className="footer-logos-box p-2.5 sm:p-3.5 rounded-2xl border space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider footer-col-title">
              <span className="truncate">Partenaires &amp; Clients Officiels</span>
              <a href="https://www.antadis.com/nos-clients/" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80 shrink-0">42+ clients →</a>
            </div>
            <div className="footer-logos-scroll flex flex-wrap items-center gap-1.5 sm:gap-2">
              <a href="https://www.antadis.com/agence-integrateur-shopify/" target="_blank" rel="noopener noreferrer" className="antadis-logo-chip" title="Shopify Plus">
                <img src={REAL_LOGOS.shopify} alt="Shopify Plus" className="h-4 object-contain" />
              </a>
              <a href="https://www.antadis.com/agence-certifiee-prestashop/" target="_blank" rel="noopener noreferrer" className="antadis-logo-chip" title="PrestaShop Platinum">
                <img src={REAL_LOGOS.prestashop} alt="PrestaShop" className="h-4 object-contain" />
              </a>
              <a href="https://www.antadis.com/technologies-partenaires/" target="_blank" rel="noopener noreferrer" className="antadis-logo-chip" title="Sylius">
                <img src={REAL_LOGOS.sylius} alt="Sylius" className="h-4 object-contain" />
              </a>
              <a href="https://www.antadis.com/technologies-partenaires/" target="_blank" rel="noopener noreferrer" className="antadis-logo-chip" title="Adobe Commerce Magento">
                <img src={REAL_LOGOS.magento} alt="Magento" className="h-4 object-contain" />
              </a>
              <a href="https://www.antadis.com/e-commerce-b2b/" target="_blank" rel="noopener noreferrer" className="antadis-logo-chip" title="OroCommerce">
                <img src={REAL_LOGOS.orocommerce} alt="OroCommerce" className="h-4 object-contain" />
              </a>
              <a href="https://www.antadis.com/technologies-partenaires/" target="_blank" rel="noopener noreferrer" className="antadis-logo-chip" title="Planet Proximis">
                <img src={REAL_LOGOS.proximis} alt="Planet Proximis" className="h-3.5 object-contain" />
              </a>
              <a href="https://www.antadis.com/references-antadis/" target="_blank" rel="noopener noreferrer" className="antadis-logo-chip" title="Izipizi">
                <img src={REAL_LOGOS.izipizi} alt="Izipizi" className="h-4 object-contain" />
              </a>
              <a href="https://www.antadis.com/references-antadis/" target="_blank" rel="noopener noreferrer" className="antadis-logo-chip" title="Nuxe">
                <img src={REAL_LOGOS.nuxe} alt="Nuxe" className="h-4 object-contain" />
              </a>
              <a href="https://www.antadis.com/references-antadis/" target="_blank" rel="noopener noreferrer" className="antadis-logo-chip" title="Petrossian">
                <img src={REAL_LOGOS.petrossian} alt="Petrossian" className="h-4 object-contain" />
              </a>
              <a href="https://www.antadis.com/references-antadis/" target="_blank" rel="noopener noreferrer" className="antadis-logo-chip" title="Dammann Frères">
                <img src={REAL_LOGOS.dammann} alt="Dammann Frères" className="h-4 object-contain" />
              </a>
              <a href="https://www.antadis.com/references-antadis/" target="_blank" rel="noopener noreferrer" className="antadis-logo-chip" title="Bleu Libellule">
                <img src={REAL_LOGOS.bleu_libellule} alt="Bleu Libellule" className="h-4 object-contain" />
              </a>
              <a href="https://www.antadis.com/references-antadis/" target="_blank" rel="noopener noreferrer" className="antadis-logo-chip" title="Monceau Fleurs">
                <img src={REAL_LOGOS.monceau_fleurs} alt="Monceau Fleurs" className="h-4 object-contain" />
              </a>
              <a href="https://www.antadis.com/references-antadis/" target="_blank" rel="noopener noreferrer" className="antadis-logo-chip" title="De Neuville">
                <img src={REAL_LOGOS.de_neuville} alt="De Neuville" className="h-4 object-contain" />
              </a>
              <a href="https://www.antadis.com/references-antadis/" target="_blank" rel="noopener noreferrer" className="antadis-logo-chip" title="Tectona Paris">
                <img src={REAL_LOGOS.tectona} alt="Tectona Paris" className="h-4 object-contain" />
              </a>
              <a href="https://www.antadis.com/references-antadis/" target="_blank" rel="noopener noreferrer" className="antadis-logo-chip" title="La Compagnie du Lit">
                <img src={REAL_LOGOS.compagnie_du_lit} alt="La Compagnie du Lit" className="h-4 object-contain" />
              </a>
              <a href="https://www.antadis.com/references-antadis/" target="_blank" rel="noopener noreferrer" className="antadis-logo-chip" title="Centrakor">
                <img src={REAL_LOGOS.centrakor} alt="Centrakor" className="h-4 object-contain" />
              </a>
              <a href="https://www.antadis.com/references-antadis/" target="_blank" rel="noopener noreferrer" className="antadis-logo-chip" title="BUT">
                <img src={REAL_LOGOS.but} alt="BUT" className="h-4 object-contain" />
              </a>
              <a href="https://www.antadis.com/projects/tbs/" target="_blank" rel="noopener noreferrer" className="antadis-logo-chip" title="TBS">
                <img src={REAL_LOGOS.tbs} alt="TBS" className="h-4 object-contain" />
              </a>
              <a href="https://www.antadis.com/antadis-suisse/" target="_blank" rel="noopener noreferrer" className="antadis-logo-chip" title="QoQa Suisse">
                <img src={REAL_LOGOS.qoqa} alt="QoQa" className="h-4 object-contain" />
              </a>
            </div>
          </div>

          {/* Multi-Column Sitemap Footer matching https://www.antadis.com/ */}
          <footer className="pt-2.5 sm:pt-3 border-t border-slate-500/30 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-left text-[11px] sm:text-xs">
            <div className="space-y-1">
              <div className="footer-col-title font-bold uppercase tracking-wider text-[10px] sm:text-[11px]">L'Agence Antadis</div>
              <ul className="footer-col-list space-y-0.5 sm:space-y-1">
                <li><a href="https://www.antadis.com/agence-antadis/" target="_blank" rel="noopener noreferrer" className="hover:underline">Antadis France (Paris)</a></li>
                <li><a href="https://www.antadis.com/antadis-suisse/" target="_blank" rel="noopener noreferrer" className="hover:underline">Antadis Suisse (Lausanne)</a></li>
                <li><a href="https://www.antadis.com/nous-rejoindre/" target="_blank" rel="noopener noreferrer" className="hover:underline">Carrières &amp; Recrutement</a></li>
                <li><a href="https://www.antadis.com/contact/" target="_blank" rel="noopener noreferrer" className="hover:underline">Nous contacter</a></li>
              </ul>
            </div>
            <div className="space-y-1">
              <div className="footer-col-title font-bold uppercase tracking-wider text-[10px] sm:text-[11px]">Nos Métiers</div>
              <ul className="footer-col-list space-y-0.5 sm:space-y-1">
                <li><a href="https://www.antadis.com/creation-de-sites-e-commerce/" target="_blank" rel="noopener noreferrer" className="hover:underline">Stratégie &amp; Cadrage SI</a></li>
                <li><a href="https://www.antadis.com/design-dinterfaces/" target="_blank" rel="noopener noreferrer" className="hover:underline">UX / CRO &amp; Design UI</a></li>
                <li><a href="https://www.antadis.com/developpements/" target="_blank" rel="noopener noreferrer" className="hover:underline">Développements &amp; Headless</a></li>
                <li><a href="https://www.antadis.com/projets-et-runs-e-commerce/" target="_blank" rel="noopener noreferrer" className="hover:underline">Projets &amp; Runs E-Commerce</a></li>
              </ul>
            </div>
            <div className="space-y-1">
              <div className="footer-col-title font-bold uppercase tracking-wider text-[10px] sm:text-[11px]">Focus &amp; Expertises</div>
              <ul className="footer-col-list space-y-0.5 sm:space-y-1">
                <li><a href="https://www.antadis.com/creation-de-sites-e-commerce/" target="_blank" rel="noopener noreferrer" className="hover:underline">E-commerce B2C</a></li>
                <li><a href="https://www.antadis.com/e-commerce-b2b/" target="_blank" rel="noopener noreferrer" className="hover:underline">E-commerce B2B</a></li>
                <li><a href="https://www.antadis.com/technologies-partenaires/" target="_blank" rel="noopener noreferrer" className="hover:underline">Technologies &amp; Partenaires</a></li>
                <li><a href="https://www.antadis.com/references-antadis/" target="_blank" rel="noopener noreferrer" className="hover:underline">Réalisations &amp; Études de cas</a></li>
              </ul>
            </div>
            <div className="space-y-1">
              <div className="footer-col-title font-bold uppercase tracking-wider text-[10px] sm:text-[11px]">Informations</div>
              <ul className="footer-col-list space-y-0.5 sm:space-y-1">
                <li><a href="https://www.antadis.com/le-blog/" target="_blank" rel="noopener noreferrer" className="hover:underline">Le Blog E-Commerce</a></li>
                <li><a href="https://www.antadis.com/plan-site/" target="_blank" rel="noopener noreferrer" className="hover:underline">Plan du site</a></li>
                <li><a href="https://www.antadis.com/mentions-legales/" target="_blank" rel="noopener noreferrer" className="hover:underline">Mentions Légales</a></li>
                <li className="pt-0.5 text-[10px] sm:text-[11px] opacity-80">© Antadis 2002–2026</li>
              </ul>
            </div>
          </footer>
        </div>
      </div>
    </section>
  </div>

  {/* ===================================================================== */}
  {/* CONTACT BRIEF MODAL                                                   */}
  {/* ===================================================================== */}
  <div id="contact-modal" className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 hidden">
    <div className="paris-glass-light max-w-lg w-full rounded-3xl p-6 sm:p-8 border border-amber-300">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#E05A47]">Paris · Lausanne</span>
          <h3 className="font-serif-editorial text-3xl font-bold text-slate-900">Contactez nos équipes</h3>
        </div>
        <button id="btn-close-contact-modal" type="button" className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold">✕</button>
      </div>
      <form id="contact-form" className="space-y-3.5 text-left">
        <div>
          <label htmlFor="contact-name" className="block text-xs font-semibold text-slate-700 mb-1">Nom &amp; Entreprise</label>
          <input id="contact-name" type="text" required placeholder="Camille Laurent · Maison Paris" className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#E05A47]" />
        </div>
        <div>
          <label htmlFor="contact-email" className="block text-xs font-semibold text-slate-700 mb-1">Email professionnel</label>
          <input id="contact-email" type="email" required placeholder="c.laurent@entreprise.fr" className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#E05A47]" />
        </div>
        <div>
          <label htmlFor="contact-topic" className="block text-xs font-semibold text-slate-700 mb-1">Périmètre du projet</label>
          <select id="contact-topic" className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:border-[#E05A47]">
            <option value="Refonte / Replatforming B2C">Refonte / Replatforming E-Commerce B2C (Shopify Plus, Sylius, PrestaShop)</option>
            <option value="Plateforme B2B & SI">Plateforme E-Commerce B2B &amp; Connexions SI (PIM, ERP, CRM)</option>
            <option value="Audit UX / CRO & Design">Audit UX / CRO &amp; Direction Artistique</option>
            <option value="Commerce Unifié & Omnicanal">Commerce Unifié &amp; Omnicanal</option>
          </select>
        </div>
        <div>
          <label htmlFor="contact-message" className="block text-xs font-semibold text-slate-700 mb-1">Votre besoin</label>
          <textarea id="contact-message" rows={3} placeholder="Objectifs, échéance, écosystème SI actuel..." className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#E05A47]"></textarea>
        </div>
        <div id="contact-feedback" className="hidden p-3 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-medium"></div>
        <div className="flex items-center justify-end gap-2 pt-2">
          <button type="submit" className="px-5 py-2.5 rounded-full bg-[#E05A47] hover:bg-[#cc4a37] text-white text-xs font-semibold uppercase tracking-wider transition">
            Envoyer la demande
          </button>
        </div>
      </form>
    </div>
  </div>

  {/* ===================================================================== */}
  {/* SCROLL TRACK FOR 3D RAIL                                              */}
  {/* ===================================================================== */}
  <div id="scroll-container" aria-hidden="true"></div>

  {/* ===================================================================== */}
  {/* APPLICATION LOGIC: CHARACTERS.JS, INFINITY BILLBOARDS & SCROLL FOCUS  */}
    </>
  );
}
