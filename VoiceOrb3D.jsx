import React, { useRef, useEffect } from "react";
import * as THREE from "three";

export default function VoiceOrb3D({ active = false, className = "" }) {
  const mountRef = useRef(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.z = 4;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const geo = new THREE.IcosahedronGeometry(1.1, 4);
    const base = geo.attributes.position.array.slice(0);
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x2979ff, wireframe: true, transparent: true, opacity: 0.85 }));
    scene.add(mesh);

    const haloGeo = new THREE.IcosahedronGeometry(1.5, 2);
    const halo = new THREE.Mesh(haloGeo, new THREE.MeshBasicMaterial({ color: 0x00b4ff, wireframe: true, transparent: true, opacity: 0.18 }));
    scene.add(halo);

    let raf;
    let time = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      time += activeRef.current ? 0.05 : 0.02;
      const pos = geo.attributes.position;
      const arr = pos.array;
      for (let i = 0; i < arr.length; i += 3) {
        const x = base[i];
        const y = base[i + 1];
        const z = base[i + 2];
        const d = Math.sin(time + x * 3) * Math.cos(time + y * 3) * 0.15 + (activeRef.current ? 0.22 : 0.07);
        const len = Math.sqrt(x * x + y * y + z * z) || 1;
        arr[i] = x + (x / len) * d;
        arr[i + 1] = y + (y / len) * d;
        arr[i + 2] = z + (z / len) * d;
      }
      pos.needsUpdate = true;
      mesh.rotation.y += 0.003;
      halo.rotation.y -= 0.004;
      halo.rotation.x += 0.002;
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!mount.clientWidth) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      geo.dispose();
      haloGeo.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className={className} />;
}