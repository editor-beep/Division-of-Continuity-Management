import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

function SacredGeometry() {
  const meshRef = useRef<THREE.Mesh>(null);
  const torusRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.08;
      meshRef.current.rotation.y += delta * 0.12;
    }
    if (torusRef.current) {
      torusRef.current.rotation.x -= delta * 0.05;
      torusRef.current.rotation.z += delta * 0.07;
    }
  });

  return (
    <>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[3, 1]} />
        <meshBasicMaterial color="#00B8B0" wireframe transparent opacity={0.05} />
      </mesh>
      <mesh ref={torusRef}>
        <torusKnotGeometry args={[2, 0.5, 100, 16]} />
        <meshBasicMaterial color="#FFB000" wireframe transparent opacity={0.03} />
      </mesh>
    </>
  );
}

function CSSBackground() {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      zIndex: -1, pointerEvents: 'none', overflow: 'hidden', background: '#0A0A0F',
    }}>
      <style>{`
        @keyframes slowSpin { to { transform: translate(-50%, -50%) rotate(360deg); } }
        @keyframes slowSpinR { to { transform: translate(-50%, -50%) rotate(-360deg); } }
      `}</style>
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: '70vmin', height: '70vmin',
        transform: 'translate(-50%, -50%)',
        border: '1px solid rgba(0,184,176,0.06)',
        borderRadius: '50%',
        animation: 'slowSpin 60s linear infinite',
      }} />
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: '100vmin', height: '100vmin',
        transform: 'translate(-50%, -50%)',
        border: '1px solid rgba(255,176,0,0.04)',
        borderRadius: '50%',
        animation: 'slowSpinR 80s linear infinite',
      }} />
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: '40vmin', height: '40vmin',
        transform: 'translate(-50%, -50%) rotate(45deg)',
        border: '1px solid rgba(140,78,255,0.04)',
        animation: 'slowSpin 45s linear infinite',
      }} />
    </div>
  );
}

export function Background() {
  const [webgl, setWebgl] = useState<boolean | null>(null);

  useEffect(() => {
    setWebgl(isWebGLAvailable());
  }, []);

  if (webgl === null) return <CSSBackground />;
  if (!webgl) return <CSSBackground />;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1, pointerEvents: 'none' }}>
      <Canvas camera={{ position: [0, 0, 8] }}>
        <SacredGeometry />
      </Canvas>
    </div>
  );
}
