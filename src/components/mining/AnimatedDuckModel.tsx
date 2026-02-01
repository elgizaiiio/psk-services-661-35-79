import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Stage } from '@react-three/drei';
import * as THREE from 'three';

interface DuckModelProps {
  url: string;
}

function DuckModel({ url }: DuckModelProps) {
  const { scene } = useGLTF(url);
  const meshRef = useRef<THREE.Group>(null);

  // Gentle floating animation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
    }
  });

  return (
    <group ref={meshRef} scale={1.5}>
      <primitive object={scene} />
    </group>
  );
}

interface AnimatedDuckModelProps {
  className?: string;
}

const AnimatedDuckModel: React.FC<AnimatedDuckModelProps> = ({ className = '' }) => {
  return (
    <div className={`w-full ${className}`}>
      <Canvas
        camera={{ position: [0, 0.8, 2.5], fov: 45 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 5, 5]} intensity={1.2} />
          <pointLight position={[-5, 5, -5]} intensity={0.6} color="#FFD700" />
          <pointLight position={[0, -2, 2]} intensity={0.3} color="#FACC15" />
          
          <DuckModel url="/models/characters/duck-suit.glb" />
          
          <OrbitControls 
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 2.2}
            autoRotate
            autoRotateSpeed={1}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

// Preload the model
useGLTF.preload('/models/characters/duck-suit.glb');

export default AnimatedDuckModel;
