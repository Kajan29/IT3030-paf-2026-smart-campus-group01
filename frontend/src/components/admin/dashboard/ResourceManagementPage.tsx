import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Box, Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import type { Building, Floor, Room } from "@/types/campusManagement";
import type { ResourceLayout, ResourceLayoutEditorItem, ResourceViewMode, RoomResource } from "@/types/resourceManagement";
import resourceManagementService from "@/services/resourceManagementService";
import { BuildingSelector } from "@/components/admin/dashboard/resource-management/BuildingSelector";
import { FloorSelector } from "@/components/admin/dashboard/resource-management/FloorSelector";
import { RoomSelector } from "@/components/admin/dashboard/resource-management/RoomSelector";
import { ViewToggle } from "@/components/admin/dashboard/resource-management/ViewToggle";
import { ResourceToolbar } from "@/components/admin/dashboard/resource-management/ResourceToolbar";
import { Canvas2DEditor } from "@/components/admin/dashboard/resource-management/Canvas2DEditor";
import { normalize2DTo3D, normalize3DTo2D } from "@/utils/resourceLayoutTransform";

const Canvas3DEditor = lazy(() => import("@/components/admin/dashboard/resource-management/Canvas3DEditor"));
const RESOURCE_TYPES = ["chair", "table", "desk", "projector", "podium", "screen", "speaker"];

const getApiError = (error: unknown) => {
  if (typeof error === "object" && error !== null) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) {
      return response.data.message;
    }
  }
  return "Request failed. Please try again.";
};

export const ResourceManagementPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  const [resources, setResources] = useState<RoomResource[]>([]);
  const [layoutData, setLayoutData] = useState<ResourceLayout[]>([]);

  const [viewMode, setViewMode] = useState<ResourceViewMode>("2D");
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ name: string; type: string; quantity: number }>({
    name: "",
    type: "chair",
    quantity: 1,
  });
  const [newResource, setNewResource] = useState<{ name: string; type: string; quantity: number }>({
    name: "",
    type: "chair",
    quantity: 1,
  });

  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const loadBuildings = async () => {
      setLoading(true);
      try {
        const list = await resourceManagementService.getBuildings();
        setBuildings(list);
      } catch (error) {
        window.alert(getApiError(error));
      } finally {
        setLoading(false);
      }
    };

    void loadBuildings();
  }, []);

  useEffect(() => {
    if (buildings.length === 0) {
      return;
    }
    const selectedExists = buildings.some((entry) => entry.id === selectedBuilding);
    if (!selectedBuilding || !selectedExists) {
      setSelectedBuilding(buildings[0].id);
    }
  }, [buildings, selectedBuilding]);

  useEffect(() => {
    if (!selectedBuilding) {
      setFloors([]);
      setSelectedFloor("");
      setRooms([]);
      setSelectedRoom("");
      return;
    }

    const loadFloors = async () => {
      setLoading(true);
      try {
        const list = await resourceManagementService.getFloors(selectedBuilding);
        setFloors(list);
      } catch (error) {
        window.alert(getApiError(error));
      } finally {
        setLoading(false);
      }
    };

    void loadFloors();
  }, [selectedBuilding]);

  useEffect(() => {
    if (floors.length === 0) {
      return;
    }
    const selectedExists = floors.some((entry) => entry.id === selectedFloor);
    if (!selectedFloor || !selectedExists) {
      setSelectedFloor(floors[0].id);
    }
  }, [floors, selectedFloor]);

  useEffect(() => {
    if (!selectedFloor) {
      setRooms([]);
      setSelectedRoom("");
      return;
    }

    const loadRooms = async () => {
      setLoading(true);
      try {
        const list = await resourceManagementService.getRooms(selectedFloor);
        setRooms(list);
      } catch (error) {
        window.alert(getApiError(error));
      } finally {
        setLoading(false);
      }
    };

    void loadRooms();
  }, [selectedFloor]);

  useEffect(() => {
    if (rooms.length === 0) {
      return;
    }
    const selectedExists = rooms.some((entry) => entry.id === selectedRoom);
    if (!selectedRoom || !selectedExists) {
      setSelectedRoom(rooms[0].id);
    }
  }, [rooms, selectedRoom]);

  useEffect(() => {
    if (!selectedRoom) {
      setResources([]);
      setLayoutData([]);
      return;
    }

    const loadRoomData = async () => {
      setLoading(true);
      try {
        const [resourceList, layouts] = await Promise.all([
          resourceManagementService.getResources(selectedRoom),
          resourceManagementService.getLayout(selectedRoom),
        ]);
        setResources(resourceList);
        setLayoutData(layouts);
      } catch (error) {
        window.alert(getApiError(error));
      } finally {
        setLoading(false);
      }
    };

    void loadRoomData();
  }, [selectedRoom]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const editorItems = useMemo<ResourceLayoutEditorItem[]>(() => {
    return resources.map((resource) => {
      const layout = layoutData.find((entry) => entry.resourceId === resource.id) ?? {
        id: `tmp-${resource.id}`,
        resourceId: resource.id,
        roomId: selectedRoom,
        x: 0,
        y: 0,
        z: 0,
        rotation: 0,
        scale: 1,
      };

      return {
        resource,
        layout,
      };
    });
  }, [resources, layoutData, selectedRoom]);

  const queueSave = (nextLayouts: ResourceLayout[]) => {
    if (!selectedRoom || nextLayouts.length === 0) {
      return;
    }

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(async () => {
      try {
        setSaving(true);
        const saved = await resourceManagementService.saveLayout({ roomId: selectedRoom, layouts: nextLayouts });
        setLayoutData(saved);
      } catch (error) {
        window.alert(getApiError(error));
      } finally {
        setSaving(false);
      }
    }, 500);
  };

  const updateLayoutItem = (
    resourceId: string,
    changes: { x: number; z: number; rotation: number; scale: number } | { x: number; y: number; z: number; rotation: number; scale: number }
  ) => {
    setLayoutData((current) => {
      const next = current.map((item) => {
        if (item.resourceId !== resourceId) {
          return item;
        }

        const base = { ...item, ...changes } as ResourceLayout;
        return viewMode === "2D" ? normalize2DTo3D(base) : normalize3DTo2D(base);
      });

      queueSave(next);
      return next;
    });
  };

  const handleAddResource = async (resourceType: string) => {
    if (!selectedRoom) {
      window.alert("Select a room before adding resources.");
      return;
    }

    try {
      const name = `${resourceType[0].toUpperCase()}${resourceType.slice(1)} ${resources.length + 1}`;
      const created = await resourceManagementService.createResource({
        name,
        type: resourceType,
        quantity: 1,
        roomId: selectedRoom,
      });
      setResources((current) => [...current, created]);

      const refreshedLayouts = await resourceManagementService.getLayout(selectedRoom);
      setLayoutData(refreshedLayouts);
    } catch (error) {
      window.alert(getApiError(error));
    }
  };

  const handleCreateResourceFromForm = async () => {
    if (!selectedRoom) {
      window.alert("Select a room before adding resources.");
      return;
    }

    if (!newResource.name.trim()) {
      window.alert("Resource name is required.");
      return;
    }

    if (newResource.quantity < 1) {
      window.alert("Quantity must be at least 1.");
      return;
    }

    try {
      const created = await resourceManagementService.createResource({
        name: newResource.name.trim(),
        type: newResource.type,
        quantity: newResource.quantity,
        roomId: selectedRoom,
      });
      setResources((current) => [...current, created]);
      setNewResource({
        name: "",
        type: newResource.type,
        quantity: 1,
      });
      const refreshedLayouts = await resourceManagementService.getLayout(selectedRoom);
      setLayoutData(refreshedLayouts);
    } catch (error) {
      window.alert(getApiError(error));
    }
  };

  const startEditResource = (resource: RoomResource) => {
    setEditingResourceId(resource.id);
    setEditDraft({
      name: resource.name,
      type: resource.type,
      quantity: resource.quantity,
    });
  };

  const cancelEditResource = () => {
    setEditingResourceId(null);
  };

  const saveEditResource = async (resourceId: string) => {
    const currentResource = resources.find((entry) => entry.id === resourceId);
    if (!currentResource) {
      return;
    }

    if (!editDraft.name.trim()) {
      window.alert("Resource name is required.");
      return;
    }

    if (editDraft.quantity < 1) {
      window.alert("Quantity must be at least 1.");
      return;
    }

    try {
      const updated = await resourceManagementService.updateResource(resourceId, {
        name: editDraft.name.trim(),
        type: editDraft.type,
        quantity: editDraft.quantity,
        roomId: currentResource.roomId,
      });

      setResources((current) =>
        current.map((entry) => (entry.id === resourceId ? updated : entry))
      );
      setEditingResourceId(null);
    } catch (error) {
      window.alert(getApiError(error));
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!window.confirm("Delete this resource?")) {
      return;
    }

    try {
      await resourceManagementService.deleteResource(resourceId);
      setResources((current) => current.filter((entry) => entry.id !== resourceId));
      setLayoutData((current) => current.filter((entry) => entry.resourceId !== resourceId));
    } catch (error) {
      window.alert(getApiError(error));
    }
  };

  const handleModeChange = (mode: ResourceViewMode) => {
    setViewMode(mode);
    setLayoutData((current) => current.map((layout) => (mode === "3D" ? normalize2DTo3D(layout) : normalize3DTo2D(layout))));
  };

  const getLayoutForResource = (resourceId: string) =>
    layoutData.find((entry) => entry.resourceId === resourceId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Resource Management</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage room resources and edit spatial layouts in synchronized 2D and 3D modes.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[280px_1fr]">
        <aside className="space-y-4 rounded-2xl border border-border bg-card p-4">
          <BuildingSelector buildings={buildings} selectedBuilding={selectedBuilding} onChange={setSelectedBuilding} disabled={loading} />
          <FloorSelector floors={floors} selectedFloor={selectedFloor} onChange={setSelectedFloor} disabled={!selectedBuilding || loading} />
          <RoomSelector rooms={rooms} selectedRoom={selectedRoom} onChange={setSelectedRoom} disabled={!selectedFloor || loading} />

          <div className="rounded-xl border border-border bg-background p-3 text-xs text-muted-foreground">
            Selected room resources: {resources.length}
          </div>
        </aside>

        <section className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Resource Summary</h2>
              <span className="text-sm text-muted-foreground">Fast room-level load</span>
            </div>

            <div className="grid grid-cols-1 gap-2 border-b border-border pb-3 md:grid-cols-[1.8fr_1fr_0.8fr_auto]">
              <input
                value={newResource.name}
                onChange={(event) => setNewResource((current) => ({ ...current, name: event.target.value }))}
                placeholder="Resource name"
                className="rounded-lg border border-border px-3 py-2 text-sm"
                disabled={!selectedRoom}
              />
              <select
                value={newResource.type}
                onChange={(event) => setNewResource((current) => ({ ...current, type: event.target.value }))}
                className="rounded-lg border border-border px-3 py-2 text-sm capitalize"
                disabled={!selectedRoom}
              >
                {RESOURCE_TYPES.map((entry) => (
                  <option key={entry} value={entry} className="capitalize">
                    {entry}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={newResource.quantity}
                onChange={(event) =>
                  setNewResource((current) => ({
                    ...current,
                    quantity: Math.max(1, Number(event.target.value) || 1),
                  }))
                }
                className="rounded-lg border border-border px-3 py-2 text-sm"
                disabled={!selectedRoom}
              />
              <button
                onClick={handleCreateResourceFromForm}
                disabled={!selectedRoom}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                <Plus size={14} />
                Add
              </button>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-2 py-2">Name</th>
                    <th className="px-2 py-2">Type</th>
                    <th className="px-2 py-2">Quantity</th>
                    <th className="px-2 py-2">Layout</th>
                    <th className="px-2 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map((resource) => {
                    const layout = getLayoutForResource(resource.id);
                    const isEditing = editingResourceId === resource.id;

                    return (
                      <tr key={resource.id} className="border-b border-border/70 align-middle">
                        <td className="px-2 py-2">
                          {isEditing ? (
                            <input
                              value={editDraft.name}
                              onChange={(event) => setEditDraft((current) => ({ ...current, name: event.target.value }))}
                              className="w-full rounded-md border border-border px-2 py-1"
                            />
                          ) : (
                            <span className="font-medium text-foreground">{resource.name}</span>
                          )}
                        </td>
                        <td className="px-2 py-2 capitalize">
                          {isEditing ? (
                            <select
                              value={editDraft.type}
                              onChange={(event) => setEditDraft((current) => ({ ...current, type: event.target.value }))}
                              className="w-full rounded-md border border-border px-2 py-1"
                            >
                              {RESOURCE_TYPES.map((entry) => (
                                <option key={entry} value={entry} className="capitalize">
                                  {entry}
                                </option>
                              ))}
                            </select>
                          ) : (
                            resource.type
                          )}
                        </td>
                        <td className="px-2 py-2">
                          {isEditing ? (
                            <input
                              type="number"
                              min={1}
                              value={editDraft.quantity}
                              onChange={(event) =>
                                setEditDraft((current) => ({
                                  ...current,
                                  quantity: Math.max(1, Number(event.target.value) || 1),
                                }))
                              }
                              className="w-24 rounded-md border border-border px-2 py-1"
                            />
                          ) : (
                            resource.quantity
                          )}
                        </td>
                        <td className="px-2 py-2 text-xs text-muted-foreground">
                          {layout
                            ? `x:${layout.x.toFixed(0)} y:${layout.y.toFixed(0)} z:${layout.z.toFixed(0)} r:${layout.rotation.toFixed(0)} s:${layout.scale.toFixed(2)}`
                            : "No layout"}
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-2">
                            {isEditing ? (
                              <>
                                <button onClick={() => saveEditResource(resource.id)} className="text-emerald-600 hover:text-emerald-700">
                                  <Save size={15} />
                                </button>
                                <button onClick={cancelEditResource} className="text-muted-foreground hover:text-foreground">
                                  <X size={15} />
                                </button>
                              </>
                            ) : (
                              <button onClick={() => startEditResource(resource)} className="text-primary hover:text-primary/80">
                                <Pencil size={15} />
                              </button>
                            )}
                            <button onClick={() => handleDeleteResource(resource.id)} className="text-muted-foreground hover:text-destructive">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {resources.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No resources found for the selected room.</p>}
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <ViewToggle value={viewMode} onChange={handleModeChange} />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Box size={16} />}
              {saving ? "Saving layout..." : "Layout auto-save enabled"}
            </div>
          </div>

          <ResourceToolbar onAdd={handleAddResource} disabled={!selectedRoom || loading} />

          {loading ? (
            <div className="flex h-[560px] items-center justify-center rounded-2xl border border-border bg-card">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : viewMode === "2D" ? (
            <Canvas2DEditor
              items={editorItems}
              onChangeItem={(resourceId, change) => updateLayoutItem(resourceId, change)}
            />
          ) : (
            <Suspense
              fallback={
                <div className="flex h-[560px] items-center justify-center rounded-2xl border border-border bg-card">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              }
            >
              <Canvas3DEditor
                items={editorItems}
              />
            </Suspense>
          )}
        </section>
      </div>
    </div>
  );
};
