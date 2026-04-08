import { Fragment, useMemo, useRef, useState } from "react";
import { Layer, Rect, Stage, Text, Transformer } from "react-konva";
import type Konva from "konva";
import type { ResourceLayoutEditorItem } from "@/types/resourceManagement";
import { to2DPosition } from "@/utils/resourceLayoutTransform";

interface Canvas2DEditorProps {
  items: ResourceLayoutEditorItem[];
  onChangeItem: (resourceId: string, changes: { x: number; z: number; rotation: number; scale: number }) => void;
}

const GRID_SIZE = 24;
const STAGE_WIDTH = 980;
const STAGE_HEIGHT = 560;

const snap = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE;

export const Canvas2DEditor = ({ items, onChangeItem }: Canvas2DEditorProps) => {
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const shapeRefs = useRef<Record<string, Konva.Rect | null>>({});
  const transformerRef = useRef<Konva.Transformer>(null);

  const verticalLines = useMemo(() => {
    const lines: number[] = [];
    for (let i = 0; i < STAGE_WIDTH / GRID_SIZE; i += 1) {
      lines.push(i * GRID_SIZE);
    }
    return lines;
  }, []);

  const horizontalLines = useMemo(() => {
    const lines: number[] = [];
    for (let i = 0; i < STAGE_HEIGHT / GRID_SIZE; i += 1) {
      lines.push(i * GRID_SIZE);
    }
    return lines;
  }, []);

  return (
    <div className="rounded-xl border border-border bg-white p-2">
      <Stage
        width={STAGE_WIDTH}
        height={STAGE_HEIGHT}
        onMouseDown={(event) => {
          if (event.target === event.target.getStage()) {
            setSelectedResourceId(null);
          }
        }}
      >
        <Layer>
          {verticalLines.map((value) => (
            <Rect key={`v-${value}`} x={value} y={0} width={1} height={STAGE_HEIGHT} fill="#e2e8f0" listening={false} />
          ))}
          {horizontalLines.map((value) => (
            <Rect key={`h-${value}`} x={0} y={value} width={STAGE_WIDTH} height={1} fill="#e2e8f0" listening={false} />
          ))}
        </Layer>

        <Layer>
          {items.map((item) => {
            const pos2D = to2DPosition(item.layout);
            const selected = selectedResourceId === item.resource.id;
            const width = 64 * item.layout.scale;
            const height = 36 * item.layout.scale;
            return (
              <Fragment key={item.resource.id}>
                <Rect
                  ref={(node) => {
                    shapeRefs.current[item.resource.id] = node;
                    if (selected && node && transformerRef.current) {
                      transformerRef.current.nodes([node]);
                    }
                  }}
                  x={pos2D.x}
                  y={pos2D.y}
                  width={width}
                  height={height}
                  rotation={item.layout.rotation}
                  fill={selected ? "#0f766e" : "#2563eb"}
                  cornerRadius={6}
                  draggable
                  onClick={() => setSelectedResourceId(item.resource.id)}
                  onTap={() => setSelectedResourceId(item.resource.id)}
                  onDragEnd={(event) => {
                    onChangeItem(item.resource.id, {
                      x: snap(event.target.x()),
                      z: snap(event.target.y()),
                      rotation: item.layout.rotation,
                      scale: item.layout.scale,
                    });
                  }}
                  onTransformEnd={(event) => {
                    const node = event.target;
                    const nextScale = Math.max(0.4, Number(node.scaleX().toFixed(2)));
                    node.scaleX(1);
                    node.scaleY(1);
                    onChangeItem(item.resource.id, {
                      x: snap(node.x()),
                      z: snap(node.y()),
                      rotation: Number(node.rotation().toFixed(1)),
                      scale: nextScale,
                    });
                  }}
                />
                <Text
                  key={`${item.resource.id}-label`}
                  x={pos2D.x}
                  y={pos2D.y - 18}
                  text={`${item.resource.name} (${item.resource.quantity})`}
                  fontSize={12}
                  fill="#0f172a"
                  listening={false}
                />
              </Fragment>
            );
          })}

          <Transformer
            ref={transformerRef}
            rotateEnabled
            enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
            boundBoxFunc={(_, newBox) => {
              if (newBox.width < 24 || newBox.height < 20) {
                return _;
              }
              return newBox;
            }}
          />
        </Layer>
      </Stage>
    </div>
  );
};
