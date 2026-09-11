import React, { useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import * as THREE from "three";

function makeCircleTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(120,180,255,0.9)");
  g.addColorStop(1, "rgba(40,120,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function generateBrainPoints(N) {
  const positions = [];
  const colors = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  const color = new THREE.Color();
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;

    const sx = x >= 0 ? 1 : -1;
    let px = Math.abs(x) * 1.12;
    let py = y * 0.92;
    let pz = z * 1.04;

    const fold = 0.05 * Math.sin(7 * theta) * Math.sin(5 * Math.asin(Math.max(-1, Math.min(1, y))));
    const f = 1 + fold;
    px *= f;
    py *= f;
    pz *= f;

    px = sx * px + sx * 0.32;

    positions.push(px, py, pz);
    const shade = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(theta));
    color.setHSL(0.58, 0.9, shade * 0.6 + 0.15);
    colors.push(color.r, color.g, color.b);
  }
  return { positions: new Float32Array(positions), colors: new Float32Array(colors) };
}

const Brain3D = forwardRef(function Brain3D({ onDispersed }, ref) {
  const mountRef = useRef(null);
  const stateRef = useRef({});

  useImperativeHandle(ref, () => ({
    disperse: () => {
      const s = stateRef.current;
      if (!s.ready || s.dispersing) return;
      s.dispersing = true;
      s.disperseStart = performance.now();
    },
  }));

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || window.innerWidth;
    const height = mount.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const N = 3200;
    const { positions, colors } = generateBrainPoints(N);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.05,
      map: makeCircleTexture(),
      vertexColors: true,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    const group = new THREE.Group();
    group.add(points);
    scene.add(group);

    const basePositions = positions.slice();
    const dirs = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const x = basePositions[i * 3];
      const y = basePositions[i * 3 + 1];
      const z = basePositions[i * 3 + 2];
      const len = Math.sqrt(x * x + y * y + z * z) || 1;
      dirs[i * 3] = x / len;
      dirs[i * 3 + 1] = y / len;
      dirs[i * 3 + 2] = z / len;
    }

    const s = stateRef.current;
    s.scene = scene;
    s.camera = camera;
    s.renderer = renderer;
    s.geometry = geometry;
    s.material = material;
    s.group = group;
    s.basePositions = basePositions;
    s.dirs = dirs;
    s.dispersing = false;
    s.ready = true;
    s.onDispersed = onDispersed;

    let raf;
    let dispersedCalled = false;

    function animate() {
      raf = requestAnimationFrame(animate);
      if (!s.dispersing) {
        group.rotation.y += 0.0025;
        group.rotation.x = Math.sin(performance.now() * 0.0003) * 0.08;
      } else {
        const t = Math.min(1, (performance.now() - s.disperseStart) / 850);
        const ease = 1 - Math.pow(1 - t, 3);
        const posAttr = geometry.attributes.position;
        for (let i = 0; i < N; i++) {
          const spread = 1.5 + ease * 3.2;
          posAttr.array[i * 3] = basePositions[i * 3] + dirs[i * 3] * spread * ease;
          posAttr.array[i * 3 + 1] = basePositions[i * 3 + 1] + dirs[i * 3 + 1] * spread * ease;
          posAttr.array[i * 3 + 2] = basePositions[i * 3 + 2] + dirs[i * 3 + 2] * spread * ease;
        }
        posAttr.needsUpdate = true;
        material.opacity = 1 - ease;
        if (t >= 1 && !dispersedCalled) {
          dispersedCalled = true;
          if (s.onDispersed) s.onDispersed();
        }
      }
      renderer.render(scene, camera);
    }
    animate();

    function onResize() {
      const w = mount.clientWidth || window.innerWidth;
      const h = mount.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      s.ready = false;
    };
  }, [onDispersed]);

  return <div ref={mountRef} className="w-full h-full" />;
});

export default Brain3D;