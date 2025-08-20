import React, { useEffect, useRef, useState, useMemo, Suspense } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RunwareService } from "@/lib/runware";

// Workaround: prevent R3F from deep-assigning data-* / aria-* props onto undefined nested objects
// Some hosts inject data-* attributes which r3f tries to map like instance.data.lov...
// Ensure Object3D has data and aria containers to avoid runtime crashes.
if ((THREE as any).Object3D) {
  const proto = (THREE as any).Object3D.prototype as any;
  if (!Object.getOwnPropertyDescriptor(proto, 'data')) {
    Object.defineProperty(proto, 'data', {
      configurable: true,
      get() {
        let d = (this as any).__lovData;
        if (!d || typeof d !== 'object') {
          d = { lov: { path: {} } };
          (this as any).__lovData = d;
        }
        if (!d.lov || typeof d.lov !== 'object') d.lov = { path: {} };
        if (!d.lov.path || typeof d.lov.path !== 'object') d.lov.path = {};
        return d;
      },
      set(v) {
        if (v && typeof v === 'object') {
          const base: any = (this as any).__lovData || {};
          if (!base.lov || typeof base.lov !== 'object') base.lov = {};
          if (!base.lov.path || typeof base.lov.path !== 'object') base.lov.path = {};
          Object.assign(base, v);
          (this as any).__lovData = base;
        } else {
          (this as any).__lovData = { lov: { path: {} }, value: v };
        }
      },
    });
  }
  if (!Object.getOwnPropertyDescriptor(proto, 'aria')) {
    Object.defineProperty(proto, 'aria', {
      configurable: true,
      get() {
        if (!(this as any).__lovAria) (this as any).__lovAria = {};
        return (this as any).__lovAria;
      },
      set(v) {
        (this as any).__lovAria = v || {};
      },
    });
  }
}


// Ensure other Three.js core prototypes can accept data-* deep paths as well
const ensureDataAccessor = (proto: any) => {
  if (!proto) return;
  if (!Object.getOwnPropertyDescriptor(proto, 'data')) {
    Object.defineProperty(proto, 'data', {
      configurable: true,
      get() {
        let d = (this as any).__lovData;
        if (!d || typeof d !== 'object') {
          d = { lov: { path: {} } };
          (this as any).__lovData = d;
        }
        if (!d.lov || typeof d.lov !== 'object') d.lov = { path: {} };
        if (!d.lov.path || typeof d.lov.path !== 'object') d.lov.path = {};
        return d;
      },
      set(v) {
        if (v && typeof v === 'object') {
          const base: any = (this as any).__lovData || {};
          if (!base.lov || typeof base.lov !== 'object') base.lov = {};
          if (!base.lov.path || typeof base.lov.path !== 'object') base.lov.path = {};
          Object.assign(base, v);
          (this as any).__lovData = base;
        } else {
          (this as any).__lovData = { lov: { path: {} }, value: v };
        }
      },
    });
  }
};
ensureDataAccessor((THREE as any).Material?.prototype);
ensureDataAccessor((THREE as any).BufferGeometry?.prototype);
ensureDataAccessor((THREE as any).Texture?.prototype);

// Helpers to ensure injected data-* props never crash R3F
function ensureLovDataOnObject(target: any) {
  try {
    if (!target || typeof target !== 'object') return;
    const anyTarget: any = target as any;
    const d = anyTarget.data;
    if (!d || typeof d !== 'object' || !d.lov || !d.lov.path) {
      anyTarget.data = d && typeof d === 'object'
        ? { ...d, lov: { ...(d.lov || {}), path: (d.lov && d.lov.path) || {} } }
        : { lov: { path: {} } };
    }
  } catch {
    try {
      Object.defineProperty(target, 'data', { value: { lov: { path: {} } }, configurable: true, writable: true });
    } catch {}
  }
}

function ensureLovDataDeep(obj: any) {
  if (!obj) return;
  ensureLovDataOnObject(obj);
  const anyObj: any = obj as any;
  const m = anyObj.material;
  if (Array.isArray(m)) m.forEach(ensureLovDataOnObject);
  else ensureLovDataOnObject(m);
  if (anyObj.geometry) ensureLovDataOnObject(anyObj.geometry);
  if (anyObj.map) ensureLovDataOnObject(anyObj.map);
}

function DataPatch() {
  const { scene } = useThree();
  const count = useRef(0);
  useEffect(() => {
    scene.traverse((o: any) => ensureLovDataDeep(o));
  }, [scene]);
  useFrame(() => {
    if (count.current++ > 90) return;
    scene.traverse((o: any) => ensureLovDataDeep(o));
  });
  return null;
}

// Lane positions (x-axis)
const LANES = [-2, 0, 2];

type ObstacleType = "high" | "low";

type Obstacle = {
  id: number;
  active: boolean;
  lane: number; // 0..2
  z: number;
  type: ObstacleType;
};

function Ground() {
  const segments = Array.from({ length: 12 });
  const refs = useRef<Array<THREE.Mesh | null>>([]);
  const speedRef = useRef(0);

  useFrame((_, dt) => {
    const s = speedRef.current;
    if (!s) return;
    for (let i = 0; i < refs.current.length; i++) {
      const m = refs.current[i];
      if (!m) continue;
      m.position.z += s * dt;
      if (m.position.z > 10) {
        m.position.z -= 240; // loop back
      }
    }
  });

  // external setter via window for speed link
  useEffect(() => {
    // @ts-ignore
    window.__setRunnerGroundSpeed = (v: number) => (speedRef.current = v);
    return () => {
      // @ts-ignore
      delete window.__setRunnerGroundSpeed;
    };
  }, []);

  return (
    <group>
      {segments.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => (refs.current[i] = el)}
          position={[0, -0.51, -i * 20]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[14, 20]} />
          <meshStandardMaterial color={"#2a2a2a"} metalness={0.1} roughness={0.9} />
        </mesh>
      ))}
      {/* Lane markers */}
      {LANES.map((x, idx) => (
        <mesh key={idx} position={[x, -0.5, -5]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.05, 200]} />
          <meshBasicMaterial color="#4b4b4b" />
        </mesh>
      ))}
    </group>
  );
}

function CarPlayer({
  laneIndex,
  y,
  sliding,
  color = "#d9534f",
  textureUrl,
}: {
  laneIndex: number;
  y: number;
  sliding: boolean;
  color?: string;
  textureUrl?: string | null;
}) {
  const x = LANES[laneIndex];
  const bodyRef = useRef<THREE.Group>(null);
  const [tex, setTex] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!textureUrl) {
      setTex(null);
      return;
    }
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      textureUrl,
      (t) => {
        t.wrapS = THREE.RepeatWrapping;
        t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(1, 1);
        setTex(t);
      },
      undefined,
      () => setTex(null)
    );
  }, [textureUrl]);

  useFrame(() => {
    if (bodyRef.current) {
      bodyRef.current.position.x = x;
      bodyRef.current.position.y = y + 0.6;
    }
  });

  return (
    <group ref={bodyRef} position={[x, y + 0.6, 0]} castShadow>
      {/* Car body */}
      <mesh castShadow>
        <boxGeometry args={[1.6, sliding ? 0.6 : 0.9, 3]} />
        <meshStandardMaterial
          color={tex ? undefined : color}
          map={tex || undefined}
          metalness={0.2}
          roughness={0.6}
        />
      </mesh>
      {/* Roof */}
      {!sliding && (
        <mesh position={[0, 0.7, -0.2]} castShadow>
          <boxGeometry args={[1.2, 0.5, 1.6]} />
          <meshStandardMaterial color={color} metalness={0.2} roughness={0.6} />
        </mesh>
      )}
      {/* Wheels */}
      {[-0.8, 0.8].map((sx, i) => (
        <group key={i} position={[sx, -0.5, 1.1]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.35, 0.35, 0.4, 16]} />
            <meshStandardMaterial color="#222" />
          </mesh>
        </group>
      ))}
      {[-0.8, 0.8].map((sx, i) => (
        <group key={`b-${i}`} position={[sx, -0.5, -1.1]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.35, 0.35, 0.4, 16]} />
            <meshStandardMaterial color="#222" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function HumanPlayer({ laneIndex, y, sliding, color = "#5bc0de" }: { laneIndex: number; y: number; sliding: boolean; color?: string }) {
  const x = LANES[laneIndex];
  const rootRef = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const tRef = useRef(0);

  useFrame((_, dt) => {
    if (!rootRef.current) return;
    // Position follow lane & jump height
    rootRef.current.position.x = x;
    rootRef.current.position.y = y + (sliding ? 0.5 : 0.9);

    // Simple run animation
    tRef.current += dt * (sliding ? 2 : 8);
    const swing = Math.sin(tRef.current) * (sliding ? 0.2 : 0.6);
    const swingOpp = Math.sin(tRef.current + Math.PI) * (sliding ? 0.2 : 0.6);

    if (leftArm.current && rightArm.current && leftLeg.current && rightLeg.current) {
      leftArm.current.rotation.z = swing * 0.6;
      rightArm.current.rotation.z = swingOpp * 0.6;
      leftLeg.current.rotation.z = swingOpp * 0.7;
      rightLeg.current.rotation.z = swing * 0.7;

      // Slight forward lean when sliding
      rootRef.current.rotation.x = sliding ? -0.35 : 0;
    }
  });

  return (
    <group ref={rootRef} position={[x, y + 0.9, 0]} castShadow>
      {/* Torso */}
      <mesh castShadow position={[0, 0.6, 0]}>
        <boxGeometry args={[0.7, 1.2, 0.4]} />
        <meshStandardMaterial color={color} metalness={0.15} roughness={0.75} />
      </mesh>
      {/* Head */}
      {!sliding && (
        <mesh castShadow position={[0, 1.4, 0]}>
          <sphereGeometry args={[0.32, 16, 16]} />
          <meshStandardMaterial color="#f5e0c8" />
        </mesh>
      )}
      {/* Arms */}
      <group ref={leftArm} position={[-0.55, 0.9, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.22, 0.9, 0.22]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
      <group ref={rightArm} position={[0.55, 0.9, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.22, 0.9, 0.22]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
      {/* Legs */}
      <group ref={leftLeg} position={[-0.25, 0.1, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.26, 1.0, 0.26]} />
          <meshStandardMaterial color="#34495e" />
        </mesh>
      </group>
      <group ref={rightLeg} position={[0.25, 0.1, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.26, 1.0, 0.26]} />
          <meshStandardMaterial color="#34495e" />
        </mesh>
      </group>
    </group>
  );
}

function SpongeBobPlayer({ laneIndex, y, sliding }: { laneIndex: number; y: number; sliding: boolean }) {
  const x = LANES[laneIndex];
  const rootRef = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const tRef = useRef(0);

  useFrame((_, dt) => {
    if (!rootRef.current) return;
    rootRef.current.position.x = x;
    rootRef.current.position.y = y + (sliding ? 0.6 : 1.0);
    tRef.current += dt * (sliding ? 2 : 8);
    const swing = Math.sin(tRef.current) * (sliding ? 0.15 : 0.55);
    const swingOpp = Math.sin(tRef.current + Math.PI) * (sliding ? 0.15 : 0.55);
    if (leftArm.current && rightArm.current && leftLeg.current && rightLeg.current) {
      leftArm.current.rotation.z = swing * 0.6;
      rightArm.current.rotation.z = swingOpp * 0.6;
      leftLeg.current.rotation.z = swingOpp * 0.7;
      rightLeg.current.rotation.z = swing * 0.7;
    }
    rootRef.current.rotation.x = sliding ? -0.35 : 0;
  });

  return (
    <group ref={rootRef} position={[x, y + 1.0, 0]} castShadow>
      <group position={[0, 0.8, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.9, 1.1, 0.5]} />
          <meshStandardMaterial color={"#f7e25b"} metalness={0.05} roughness={0.8} />
        </mesh>
        {/* Pants */}
        <mesh castShadow position={[0, -0.45, 0]}>
          <boxGeometry args={[0.9, 0.3, 0.5]} />
          <meshStandardMaterial color={"#8b5a2b"} />
        </mesh>
        {/* Shirt front */}
        {!sliding && (
          <mesh castShadow position={[0, -0.2, 0.26]}>
            <boxGeometry args={[0.9, 0.25, 0.05]} />
            <meshStandardMaterial color={"#ffffff"} />
          </mesh>
        )}
        {/* Tie */}
        {!sliding && (
          <mesh castShadow position={[0, -0.15, 0.28]}>
            <boxGeometry args={[0.12, 0.24, 0.04]} />
            <meshStandardMaterial color={"#e74c3c"} />
          </mesh>
        )}
        {/* Eyes */}
        {!sliding && (
          <>
            <mesh castShadow position={[-0.18, 0.1, 0.26]}>
              <sphereGeometry args={[0.09, 16, 16]} />
              <meshStandardMaterial color={"#ffffff"} />
            </mesh>
            <mesh castShadow position={[0.18, 0.1, 0.26]}>
              <sphereGeometry args={[0.09, 16, 16]} />
              <meshStandardMaterial color={"#ffffff"} />
            </mesh>
            <mesh castShadow position={[-0.18, 0.1, 0.31]}>
              <sphereGeometry args={[0.04, 12, 12]} />
              <meshStandardMaterial color={"#000000"} />
            </mesh>
            <mesh castShadow position={[0.18, 0.1, 0.31]}>
              <sphereGeometry args={[0.04, 12, 12]} />
              <meshStandardMaterial color={"#000000"} />
            </mesh>
          </>
        )}
      </group>
      {/* Arms */}
      <group ref={leftArm} position={[-0.6, 0.85, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.18, 0.8, 0.18]} />
          <meshStandardMaterial color={"#f7e25b"} />
        </mesh>
      </group>
      <group ref={rightArm} position={[0.6, 0.85, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.18, 0.8, 0.18]} />
          <meshStandardMaterial color={"#f7e25b"} />
        </mesh>
      </group>
      {/* Legs */}
      <group ref={leftLeg} position={[-0.22, 0.15, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.22, 0.9, 0.22]} />
          <meshStandardMaterial color={"#dcdcdc"} />
        </mesh>
        {/* Shoe */}
        <mesh castShadow position={[0, -0.55, 0.1]}>
          <boxGeometry args={[0.26, 0.18, 0.4]} />
          <meshStandardMaterial color={"#111111"} />
        </mesh>
      </group>
      <group ref={rightLeg} position={[0.22, 0.15, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.22, 0.9, 0.22]} />
          <meshStandardMaterial color={"#dcdcdc"} />
        </mesh>
        {/* Shoe */}
        <mesh castShadow position={[0, -0.55, 0.1]}>
          <boxGeometry args={[0.26, 0.18, 0.4]} />
          <meshStandardMaterial color={"#111111"} />
        </mesh>
      </group>
    </group>
  );
}

function RealRunner({
  laneIndex,
  y,
  sliding,
  running,
}: {
  laneIndex: number;
  y: number;
  sliding: boolean;
  running: boolean;
}) {
  const x = LANES[laneIndex];
  const ref = useRef<THREE.Group>(null);
  const gltf = useGLTF("/models/Soldier.glb") as any;
  const { actions } = useAnimations(gltf.animations, ref);
  const clone = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  useEffect(() => {
    if (!actions) return;
    const run = (actions as any)["Run"] || (actions as any)["Walk"] || Object.values(actions as any)[0];
    const idle = (actions as any)["Idle"] || Object.values(actions as any)[0];
    if (running) {
      idle?.stop?.();
      run?.reset?.();
      run?.fadeIn?.(0.2)?.play?.();
    } else {
      run?.stop?.();
      idle?.reset?.();
      idle?.fadeIn?.(0.2)?.play?.();
    }
  }, [actions, running]);

  useFrame(() => {
    if (ref.current) {
      ref.current.position.set(x, y + (sliding ? 0.4 : 0.9), 0);
      ref.current.rotation.x = sliding ? -0.35 : 0;
      ref.current.scale.set(1, 1, 1);
    }
  });

  return (
    <group ref={ref}>
      <primitive object={clone} castShadow />
    </group>
  );
}
useGLTF.preload("/models/Soldier.glb");

function CarModel({ position, rotation, scale }: { position?: [number, number, number]; rotation?: [number, number, number]; scale?: number | [number, number, number]; }) {
  const gltf = useGLTF("/models/Car.glb") as any;
  const clone = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive object={clone} castShadow />
    </group>
  );
}
useGLTF.preload("/models/Car.glb");

function CarObstacle() {
  return <CarModel scale={0.035} position={[0, 0, 0]} rotation={[0, Math.PI, 0]} />;
}


function ObstacleMesh({ type }: { type: ObstacleType }) {
  // low => slide under barrier, high => jump over car
  if (type === "low") {
    return (
      <group>
        {/* Barrier base */}
        <mesh castShadow position={[0, 0.35, 0]}>
          <boxGeometry args={[1.8, 0.7, 0.6]} />
          <meshStandardMaterial color="#f0ad4e" />
        </mesh>
        {/* Reflective stripe */}
        <mesh castShadow position={[0, 0.75, 0]}>
          <boxGeometry args={[1.8, 0.12, 0.2]} />
          <meshStandardMaterial color="#ffeaa7" />
        </mesh>
      </group>
    );
  }

  // Car obstacle (requires jump)
  return <CarObstacle />
}

function Obstacles({ pool, speed }: { pool: React.MutableRefObject<Obstacle[]>; speed: React.MutableRefObject<number> }) {
  const refs = useRef<Array<THREE.Group | null>>([]);

  useEffect(() => {
    // init positions
    for (let i = 0; i < pool.current.length; i++) {
      const ob = pool.current[i];
      if (!refs.current[i]) continue;
      refs.current[i]!.position.set(LANES[ob.lane], 0, ob.z);
    }
  }, []);

  useFrame((_, dt) => {
    const s = speed.current;
    for (let i = 0; i < pool.current.length; i++) {
      const ob = pool.current[i];
      if (!ob.active) continue;
      const g = refs.current[i];
      if (!g) continue;
      ob.z += s * dt;
      g.position.z = ob.z;
      g.position.x = LANES[ob.lane];
      if (ob.z > 2) {
        ob.active = false;
      }
    }
  });

  return (
    <group>
      {pool.current.map((ob, i) => (
        <group key={ob.id} ref={(el) => (refs.current[i] = el)} position={[LANES[ob.lane], 0, ob.z]}>
          <ObstacleMesh type={ob.type} />
        </group>
      ))}
    </group>
  );
}

const HUD: React.FC<{
  running: boolean;
  score: number;
  onStart: () => void;
}> = ({ running, score, onStart }) => {
  return (
    <div className="absolute inset-0 pointer-events-none select-none">
      <div className="flex justify-between p-3 text-sm">
        <div className="px-3 py-1 rounded-full bg-background/70 border pointer-events-auto">Score: {Math.floor(score)}</div>
      </div>
      {!running && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="p-4 rounded-xl bg-background/90 border shadow-lg text-center pointer-events-auto">
            <h2 className="font-semibold mb-2">Start Game</h2>
            <p className="text-xs text-muted-foreground mb-3">Swipe left/right to switch lanes, up to jump, down to slide</p>
            <Button onClick={onStart}>Start</Button>
          </div>
        </div>
      )}
    </div>
  );
};

const RunnerGame: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);

  // Customization state
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [playerModel, setPlayerModel] = useState<"car" | "runner" | "sponge">("runner");
  const [bodyColor, setBodyColor] = useState<string>("#d9534f");
  const [textureUrl, setTextureUrl] = useState<string | null>(null);
  const [rwKey, setRwKey] = useState<string>("");
  const [prompt, setPrompt] = useState<string>(
    "Seamless car paint texture, racing stripes, PBR, tileable, high detail, 1024x1024"
  );
  const presetColors = ["#d9534f", "#5bc0de", "#5cb85c", "#f0ad4e", "#9b59b6", "#e67e22"];

  // Player state
  const [lane, setLane] = useState(1); // 0..2
  const yRef = useRef(0);
  const vyRef = useRef(0);
  const slidingRef = useRef(false);
  const slideTimerRef = useRef(0);

  // Game state
  const speed = useRef(0); // m/s
  const spawnTimer = useRef(0);
  const pool = useRef<Obstacle[]>(
    Array.from({ length: 24 }).map((_, i) => ({ id: i, active: false, lane: 1, z: -100, type: Math.random() > 0.5 ? "high" : "low" }))
  );

  const resetGame = () => {
    setScore(0);
    setLane(1);
    yRef.current = 0;
    vyRef.current = 0;
    slidingRef.current = false;
    slideTimerRef.current = 0;
    speed.current = 0;
    spawnTimer.current = 0;
    pool.current.forEach((p) => {
      p.active = false;
      p.z = -100;
    });
  };

  useEffect(() => {
    resetGame();
  }, []);

  const jump = () => {
    if (yRef.current <= 0.001 && !slidingRef.current) {
      vyRef.current = 9.5;
    }
  };

  const slide = () => {
    if (!slidingRef.current && yRef.current <= 0.2) {
      slidingRef.current = true;
      slideTimerRef.current = 0.6;
    }
  };

  const moveLane = (dir: -1 | 1) => {
    setLane((l) => Math.min(2, Math.max(0, l + dir)));
  };

  // Keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") moveLane(-1);
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") moveLane(1);
      if (e.key === "ArrowUp" || e.code === "Space") jump();
      if (e.key === "ArrowDown" || e.key.toLowerCase() === "s" || e.key === "Shift") slide();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Touch swipe controls
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let sx = 0,
      sy = 0,
      moved = false;

    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      sx = t.clientX;
      sy = t.clientY;
      moved = false;
    };
    const onMove = (e: TouchEvent) => {
      moved = true;
      e.preventDefault();
    };
    const onEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      const dx = t.clientX - sx;
      const dy = t.clientY - sy;
      const ax = Math.abs(dx);
      const ay = Math.abs(dy);
      const threshold = 24;
      if (!moved || (ax < threshold && ay < threshold)) return;
      if (ax > ay) {
        if (dx > 0) moveLane(1);
        else moveLane(-1);
      } else {
        if (dy < 0) jump();
        else slide();
      }
    };

    el.addEventListener("touchstart", onStart, { passive: false });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);

    return () => {
      el.removeEventListener("touchstart", onStart as any);
      el.removeEventListener("touchmove", onMove as any);
      el.removeEventListener("touchend", onEnd as any);
    };
  }, []);

  // Game loop is mounted inside Canvas via <GameLoop />

  const start = () => {
    resetGame();
    setRunning(true);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = typeof reader.result === "string" ? reader.result : null;
      if (url) setTextureUrl(url);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!rwKey) {
      toast.error("Please enter Runware API key first");
      return;
    }
    try {
      toast.message("Generating skin...");
      const service = new RunwareService(rwKey);
      const img = await service.generateImage({ positivePrompt: prompt });
      setTextureUrl((img as any).imageURL || (img as any)?.data?.[0]?.imageURL || img.imageURL);
      toast.success("Skin generated!");
    } catch (e: any) {
      toast.error(e?.message || "Generation failed");
    }
  };

  return (
    <div ref={containerRef} className={`relative aspect-[9/16] w-full bg-muted ${running ? "touch-none overscroll-none" : ""}`}>
      <Canvas shadows camera={{ position: [0, 3.5, 8], fov: 55 }} onCreated={({ scene }) => { scene.traverse((o: any) => ensureLovDataDeep(o)); }}>
        <Suspense fallback={null}>
          <color attach="background" args={["#101014"]} />
          <DataPatch />
        <hemisphereLight args={[0xffffff, 0x222244, 0.7]} />
        <directionalLight position={[5, 8, 5]} intensity={0.8} castShadow shadow-mapSize={[1024, 1024]} />

          <Ground />
          {playerModel === "car" ? (
            <CarPlayer laneIndex={lane} y={yRef.current} sliding={slidingRef.current} color={bodyColor} textureUrl={textureUrl} />
          ) : playerModel === "sponge" ? (
            <SpongeBobPlayer laneIndex={lane} y={yRef.current} sliding={slidingRef.current} />
          ) : (
            <RealRunner laneIndex={lane} y={yRef.current} sliding={slidingRef.current} running={running} />
          )}
          <Obstacles pool={pool} speed={speed} />
          <GameLoop
            running={running}
            setRunning={setRunning}
            speed={speed}
            spawnTimer={spawnTimer}
            pool={pool}
            setScore={setScore}
            yRef={yRef}
            vyRef={vyRef}
            slidingRef={slidingRef}
            slideTimerRef={slideTimerRef}
            lane={lane}
          />

          {/* Debug controls (can be removed later) */}
          {/* <OrbitControls /> */}
        </Suspense>
      </Canvas>

      {/* Top-right controls */}
      <div className="absolute right-3 top-3 flex gap-2 pointer-events-auto">
        <Button variant="secondary" size="sm" onClick={() => setShowCustomizer((v) => !v)}>
          {showCustomizer ? "Close Customization" : "Customize"}
        </Button>
      </div>

      {showCustomizer && (
        <div className="absolute right-3 top-14 w-72 p-3 rounded-lg bg-background/90 border shadow-lg pointer-events-auto text-sm animate-enter space-y-3">
          <div>
            <div className="font-medium mb-1">Player Model</div>
            <div className="flex gap-2">
              <Button variant={playerModel === "car" ? "default" : "secondary"} size="sm" onClick={() => setPlayerModel("car")}>Car</Button>
              <Button variant={playerModel === "runner" ? "default" : "secondary"} size="sm" onClick={() => setPlayerModel("runner")}>Runner</Button>
              <Button variant={playerModel === "sponge" ? "default" : "secondary"} size="sm" onClick={() => setPlayerModel("sponge")}>SpongeBob</Button>
            </div>
          </div>

          <div>
            <div className="font-medium mb-1">Preset Colors</div>
            <div className="flex flex-wrap gap-2">
              {presetColors.map((c) => (
                <button key={c} aria-label={c} onClick={() => { setBodyColor(c); }} className="w-6 h-6 rounded-full border hover-scale" style={{ background: c }} />
              ))}
              <Button variant="outline" size="sm" onClick={() => setTextureUrl(null)}>Remove Texture</Button>
            </div>
          </div>

          <div>
            <div className="font-medium mb-1">Upload Manual Texture</div>
            <input type="file" accept="image/*" onChange={handleFile} className="block w-full text-xs" />
          </div>

          <div>
            <div className="font-medium mb-1">AI Generation (Runware)</div>
            <input value={rwKey} onChange={(e) => setRwKey(e.target.value)} placeholder="Runware API Key" className="w-full border rounded px-2 py-1 mb-2 bg-background" />
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="w-full border rounded px-2 py-1 mb-2 bg-background" rows={2} placeholder="Describe the desired texture" />
            <Button size="sm" onClick={handleGenerate}>Generate Skin</Button>
          </div>
        </div>
      )}

      <HUD running={running} score={score} onStart={start} />
    </div>
  );
};

function GameLoop(props: {
  running: boolean;
  setRunning: (v: boolean) => void;
  speed: React.MutableRefObject<number>;
  spawnTimer: React.MutableRefObject<number>;
  pool: React.MutableRefObject<Obstacle[]>;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  yRef: React.MutableRefObject<number>;
  vyRef: React.MutableRefObject<number>;
  slidingRef: React.MutableRefObject<boolean>;
  slideTimerRef: React.MutableRefObject<number>;
  lane: number;
}) {
  const { running, setRunning, speed, spawnTimer, pool, setScore, yRef, vyRef, slidingRef, slideTimerRef, lane } = props;

  useFrame((_, dt) => {
    // Update score and difficulty
    if (running) setScore((s) => s + dt * (8 + speed.current));

    // Speed ramp
    if (running) {
      speed.current = Math.min(22, speed.current + dt * 1.5);
      // @ts-ignore
      if (typeof window !== "undefined" && (window as any).__setRunnerGroundSpeed) (window as any).__setRunnerGroundSpeed(speed.current);
    } else {
      speed.current = 0;
      // @ts-ignore
      if (typeof window !== "undefined" && (window as any).__setRunnerGroundSpeed) (window as any).__setRunnerGroundSpeed(0);
      return;
    }

    // Gravity
    vyRef.current -= 26 * dt;
    yRef.current = Math.max(0, yRef.current + vyRef.current * dt);
    if (yRef.current <= 0 && vyRef.current < 0) vyRef.current = 0;

    // Sliding timer
    if (slidingRef.current) {
      slideTimerRef.current -= dt;
      if (slideTimerRef.current <= 0) slidingRef.current = false;
    }

    // Spawn obstacles
    spawnTimer.current -= dt;
    if (spawnTimer.current <= 0) {
      const inactive = pool.current.find((p) => !p.active);
      if (inactive) {
        inactive.active = true;
        inactive.z = -60;
        inactive.lane = Math.floor(Math.random() * 3);
        inactive.type = Math.random() < 0.55 ? "high" : "low";
      }
      // next spawn depends on speed (faster -> shorter interval)
      spawnTimer.current = Math.max(0.55, 1.6 - speed.current * 0.04);
    }

    // Collision check
    for (const ob of pool.current) {
      if (!ob.active) continue;
      // close to player z ~ 0
      if (Math.abs(ob.z) < 1.1 && ob.lane === lane) {
        const needJump = ob.type === "high";
        const needSlide = ob.type === "low";
        const jumped = yRef.current > (needJump ? 1 : 0.2);
        const sliding = slidingRef.current;
        const passed = (needJump && jumped) || (needSlide && sliding);
        if (!passed) {
          setRunning(false);
          break;
        }
      }
    }
  });
  return null;
}

export default RunnerGame;
