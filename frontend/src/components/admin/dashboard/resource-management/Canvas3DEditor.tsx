import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { ResourceLayoutEditorItem } from "@/types/resourceManagement";

interface Canvas3DEditorProps {
  items: ResourceLayoutEditorItem[];
}

const ResourceMesh = ({ item }: { item: ResourceLayoutEditorItem }) => {
  return (
    <mesh
      position={[item.layout.x, item.layout.y + 0.4, item.layout.z]}
      rotation={[0, (item.layout.rotation * Math.PI) / 180, 0]}
      scale={[item.layout.scale, item.layout.scale, item.layout.scale]}
    >
      <boxGeometry args={[0.8, 0.8, 0.8]} />
      <meshStandardMaterial color="#2563eb" />
    </mesh>
  );
};

const GridRoom = () => {
  const walls = useMemo(
    () => [
      { position: [0, 1.2, -6], args: [12, 2.4, 0.2] },
      { position: [0, 1.2, 6], args: [12, 2.4, 0.2] },
      { position: [-6, 1.2, 0], args: [0.2, 2.4, 12] },
      { position: [6, 1.2, 0], args: [0.2, 2.4, 12] },
    ],
    []
  );

  return (
    <>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#f1f5f9" />
      </mesh>
      {walls.map((wall, index) => (
        <mesh key={index} position={wall.position as [number, number, number]}>
          <boxGeometry args={wall.args as [number, number, number]} />
          <meshStandardMaterial color="#e2e8f0" />
        </mesh>
      ))}
    </>
  );
};

const Canvas3DEditor = ({ items }: Canvas3DEditorProps) => {
  return (
    <div className="h-[560px] rounded-xl border border-border bg-slate-100">
      <Canvas shadows camera={{ position: [10, 8, 10], fov: 50 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[6, 10, 6]} intensity={1.1} castShadow />
          <GridRoom />
          {items.map((item) => (
            <ResourceMesh key={item.resource.id} item={item} />
          ))}
          <OrbitControls makeDefault enablePan enableRotate enableZoom />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Canvas3DEditor;
