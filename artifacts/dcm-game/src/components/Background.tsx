import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  dissolution_index: number;
}

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

function dissolveColor(dissolution: number): THREE.Color {
  if (dissolution < 30) return new THREE.Color('#00B8B0');
  if (dissolution < 50) {
    const t = (dissolution - 30) / 20;
    return new THREE.Color('#00B8B0').lerp(new THREE.Color('#FFB000'), t);
  }
  if (dissolution < 70) {
    const t = (dissolution - 50) / 20;
    return new THREE.Color('#FFB000').lerp(new THREE.Color('#8C4EFF'), t);
  }
  const t = Math.min((dissolution - 70) / 30, 1);
  return new THREE.Color('#8C4EFF').lerp(new THREE.Color('#5C0010'), t);
}

function SacredGeometry({ dissolution }: { dissolution: number }) {
  const icoRef  = useRef<THREE.Mesh>(null);
  const torusRef = useRef<THREE.Mesh>(null);
  const octaRef  = useRef<THREE.Mesh>(null);

  const speedMult = 1 + dissolution / 80;

  const icoMat  = useMemo(() => new THREE.MeshBasicMaterial({ wireframe: true, transparent: true }), []);
  const torusMat = useMemo(() => new THREE.MeshBasicMaterial({ wireframe: true, transparent: true }), []);
  const octaMat  = useMemo(() => new THREE.MeshBasicMaterial({ wireframe: true, transparent: true }), []);

  useFrame((_, delta) => {
    const col = dissolveColor(dissolution);
    const baseOpacity = 0.03 + dissolution * 0.0006;

    icoMat.color   = col;
    icoMat.opacity = Math.min(baseOpacity, 0.14);
    torusMat.color = new THREE.Color('#FFB000').lerp(col, dissolution / 100);
    torusMat.opacity = Math.min(baseOpacity * 0.8, 0.10);
    octaMat.color  = new THREE.Color('#8C4EFF').lerp(col, dissolution / 120);
    octaMat.opacity = Math.min(baseOpacity * 1.2, 0.16);

    if (icoRef.current) {
      icoRef.current.rotation.x += delta * 0.08 * speedMult;
      icoRef.current.rotation.y += delta * 0.12 * speedMult;
    }
    if (torusRef.current) {
      torusRef.current.rotation.x -= delta * 0.05 * speedMult;
      torusRef.current.rotation.z += delta * 0.07 * speedMult;
    }
    if (octaRef.current) {
      octaRef.current.rotation.y += delta * 0.04 * speedMult;
      octaRef.current.rotation.z -= delta * 0.03 * speedMult;
    }
  });

  const scale = 1 + dissolution / 120;

  return (
    <>
      <mesh ref={icoRef} material={icoMat} scale={scale}>
        <icosahedronGeometry args={[3, 1]} />
      </mesh>
      <mesh ref={torusRef} material={torusMat} scale={scale * 0.9}>
        <torusKnotGeometry args={[2, 0.5, 100, 16]} />
      </mesh>
      <mesh ref={octaRef} material={octaMat} scale={scale * 1.2}>
        <octahedronGeometry args={[4, 0]} />
      </mesh>
    </>
  );
}

interface MotesProps { dissolution: number }

function CSSMotes({ dissolution }: MotesProps) {
  const count = Math.floor(dissolution / 12);
  const motes = useMemo(() => Array.from({ length: count }, (_, i) => ({
    key: i,
    left: `${5 + ((i * 17) % 90)}%`,
    delay: `${(i * 1.3) % 8}s`,
    duration: `${6 + (i % 5)}s`,
    size: `${2 + (i % 3)}px`,
    opacity: 0.2 + (dissolution / 400),
  })), [count, dissolution]);

  if (count === 0) return null;

  return (
    <>
      <style>{`
        @keyframes moteFloat {
          0%   { transform: translateY(100vh) scale(1); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 0.6; }
          100% { transform: translateY(-10vh) scale(1.5); opacity: 0; }
        }
      `}</style>
      {motes.map((m) => (
        <div
          key={m.key}
          style={{
            position: 'absolute',
            left: m.left,
            bottom: 0,
            width: m.size,
            height: m.size,
            borderRadius: '50%',
            background: dissolution >= 70 ? '#8C4EFF' : dissolution >= 50 ? '#FFB000' : '#00B8B0',
            opacity: m.opacity,
            animation: `moteFloat ${m.duration} ${m.delay} infinite linear`,
          }}
        />
      ))}
    </>
  );
}

function CSSBackground({ dissolution }: { dissolution: number }) {
  const ringColor1 = dissolution >= 70
    ? 'rgba(140,78,255,0.07)'
    : dissolution >= 50
    ? 'rgba(255,176,0,0.07)'
    : 'rgba(0,184,176,0.06)';
  const ringColor2 = dissolution >= 70
    ? 'rgba(92,0,16,0.05)'
    : 'rgba(255,176,0,0.04)';

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      zIndex: -1, pointerEvents: 'none', overflow: 'hidden', background: '#0A0A0F',
    }}>
      <style>{`
        @keyframes slowSpin  { to { transform: translate(-50%, -50%) rotate(360deg); } }
        @keyframes slowSpinR { to { transform: translate(-50%, -50%) rotate(-360deg); } }
      `}</style>
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: '70vmin', height: '70vmin',
        transform: 'translate(-50%, -50%)',
        border: `1px solid ${ringColor1}`,
        borderRadius: '50%',
        animation: 'slowSpin 60s linear infinite',
      }} />
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: '100vmin', height: '100vmin',
        transform: 'translate(-50%, -50%)',
        border: `1px solid ${ringColor2}`,
        borderRadius: '50%',
        animation: 'slowSpinR 80s linear infinite',
      }} />
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: '40vmin', height: '40vmin',
        transform: 'translate(-50%, -50%) rotate(45deg)',
        border: `1px solid rgba(140,78,255,${0.03 + dissolution * 0.0005})`,
        animation: 'slowSpin 45s linear infinite',
      }} />
      <CSSMotes dissolution={dissolution} />
    </div>
  );
}

export function Background({ dissolution_index }: Props) {
  const [webgl, setWebgl] = useState<boolean | null>(null);

  useEffect(() => {
    setWebgl(isWebGLAvailable());
  }, []);

  if (webgl === null) return <CSSBackground dissolution={dissolution_index} />;
  if (!webgl)         return <CSSBackground dissolution={dissolution_index} />;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      zIndex: -1, pointerEvents: 'none', background: '#0A0A0F',
    }}>
      <Canvas camera={{ position: [0, 0, 8] }}>
        <SacredGeometry dissolution={dissolution_index} />
      </Canvas>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden',
      }}>
        <CSSMotes dissolution={dissolution_index} />
      </div>
    </div>
  );
}
