import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Stage, PresentationControls, Environment, Html } from '@react-three/drei';
import { Loader2 } from 'lucide-react';
import * as THREE from 'three';

interface ModelProps {
  path: string;
  autoRotate?: boolean;
  scale?: number;
}

// Loading component
const ModelLoader = () => (
  <Html center>
    <div className="flex items-center gap-2 text-primary">
      <Loader2 className="w-6 h-6 animate-spin" />
      <span className="text-sm">Loading 3D...</span>
    </div>
  </Html>
);

// 3D Model Component
const Model: React.FC<ModelProps> = ({ path, autoRotate = true, scale = 1 }) => {
  const { scene, animations } = useGLTF(path);
  const modelRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  useEffect(() => {
    if (animations && animations.length > 0) {
      mixerRef.current = new THREE.AnimationMixer(scene);
      const action = mixerRef.current.clipAction(animations[0]);
      action.play();
    }

    return () => {
      mixerRef.current?.stopAllAction();
    };
  }, [animations, scene]);

  useFrame((state, delta) => {
    if (autoRotate && modelRef.current) {
      modelRef.current.rotation.y += delta * 0.5;
    }
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });

  // Center and scale the model
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scaleFactor = 2 / maxDim;
    
    scene.position.sub(center);
    scene.scale.setScalar(scaleFactor * scale);
  }, [scene, scale]);

  return (
    <group ref={modelRef}>
      <primitive object={scene} />
    </group>
  );
};

interface Character3DViewerProps {
  modelPath: string;
  autoRotate?: boolean;
  className?: string;
  height?: number;
  interactive?: boolean;
  glowColor?: string;
}

export const Character3DViewer: React.FC<Character3DViewerProps> = ({ 
  modelPath, 
  autoRotate = true, 
  className = '',
  height = 200,
  interactive = true,
  glowColor = 'rgba(59, 130, 246, 0.5)'
}) => {
  return (
    <div 
      className={`relative rounded-xl overflow-hidden ${className}`}
      style={{ 
        height: `${height}px`,
        background: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1), transparent 70%)'
      }}
    >
      {/* Glow effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: `inset 0 0 30px ${glowColor}`,
          borderRadius: 'inherit'
        }}
      />
      
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={<ModelLoader />}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <directionalLight position={[-5, -5, -5]} intensity={0.3} />
          <pointLight position={[0, 2, 0]} intensity={0.5} color="#60a5fa" />
          
          {interactive ? (
            <PresentationControls
              global
              zoom={0.8}
              rotation={[0, 0, 0]}
              polar={[-Math.PI / 4, Math.PI / 4]}
              azimuth={[-Math.PI / 4, Math.PI / 4]}
            >
              <Model path={modelPath} autoRotate={autoRotate} />
            </PresentationControls>
          ) : (
            <Model path={modelPath} autoRotate={autoRotate} />
          )}
          
          <Environment preset="city" />
        </Suspense>
        
        {interactive && (
          <OrbitControls 
            enableZoom={false}
            enablePan={false}
            autoRotate={!interactive && autoRotate}
            autoRotateSpeed={2}
          />
        )}
      </Canvas>

      {/* Interactive hint */}
      {interactive && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-muted-foreground/60 pointer-events-none">
          👆 Drag to rotate
        </div>
      )}
    </div>
  );
};

// Preload models for better performance
export const preloadCharacterModels = () => {
  const models = [
    '/models/characters/fox.glb',
    '/models/characters/cesium-man.glb',
    '/models/characters/brainstem.glb',
    '/models/characters/crystal.glb',
    '/models/characters/cyber.glb',
  ];
  
  models.forEach(model => {
    try {
      useGLTF.preload(model);
    } catch (e) {
      console.log(`Could not preload: ${model}`);
    }
  });
};

export default Character3DViewer;
