import { useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import type { Building, Floor, Room } from "@/types/campusManagement";
import type { RoomResource } from "@/types/resourceManagement";
import resourceManagementService from "@/services/resourceManagementService";
import { BuildingSelector } from "@/components/admin/dashboard/resource-management/BuildingSelector";
import { FloorSelector } from "@/components/admin/dashboard/resource-management/FloorSelector";
import { RoomSelector } from "@/components/admin/dashboard/resource-management/RoomSelector";
import { useAuth } from "@/context/AuthContext";

const RESOURCE_TYPES = ["chair", "table", "projector", "ac_unit", "light", "power_plug", "window"];

const normalizeType = (value: string) => value.trim().toLowerCase().replace(/\s+/g, "_");
const toLabel = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, (entry) => entry.toUpperCase());

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
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const canManage = isAuthenticated && user?.role === "ADMIN";

  const [loadingHierarchy, setLoadingHierarchy] = useState(false);
  const [loadingResources, setLoadingResources] = useState(false);
  const [creatingResource, setCreatingResource] = useState(false);
  const [updatingResourceId, setUpdatingResourceId] = useState<string | null>(null);
  const [deletingResourceId, setDeletingResourceId] = useState<string | null>(null);

  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [resources, setResources] = useState<RoomResource[]>([]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [newResource, setNewResource] = useState<{ name: string; type: string; quantity: number }>({
    name: "",
    type: RESOURCE_TYPES[0],
    quantity: 1,
  });

  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ name: string; type: string; quantity: number }>({
    name: "",
    type: RESOURCE_TYPES[0],
    quantity: 1,
  });

  useEffect(() => {
    if (authLoading || !canManage) {
      return;
    }

    const loadBuildings = async () => {
      setLoadingHierarchy(true);
      try {
        setErrorMessage(null);
        const list = await resourceManagementService.getBuildings();
        setBuildings(list);
      } catch (error) {
        setErrorMessage(getApiError(error));
      } finally {
        setLoadingHierarchy(false);
      }
    };

    void loadBuildings();
  }, [authLoading, canManage]);

  useEffect(() => {
    if (!canManage) {
      setSelectedBuilding("");
      setSelectedFloor("");
      setSelectedRoom("");
      setBuildings([]);
      setFloors([]);
      setRooms([]);
      setResources([]);
      return;
    }

    if (buildings.length === 0) {
      setSelectedBuilding("");
      setSelectedFloor("");
      setSelectedRoom("");
      setFloors([]);
      setRooms([]);
      setResources([]);
      return;
    }

    const selectedExists = buildings.some((entry) => entry.id === selectedBuilding);
    if (!selectedBuilding || !selectedExists) {
      setSelectedBuilding(buildings[0].id);
    }
  }, [buildings, selectedBuilding, canManage]);

  useEffect(() => {
    if (!canManage) {
      return;
    }

    if (!selectedBuilding) {
      setFloors([]);
      setSelectedFloor("");
      setRooms([]);
      setSelectedRoom("");
      setResources([]);
      return;
    }

    const loadFloors = async () => {
      setLoadingHierarchy(true);
      try {
        setErrorMessage(null);
        const list = await resourceManagementService.getFloors(selectedBuilding);
        setFloors(list);
      } catch (error) {
        setErrorMessage(getApiError(error));
      } finally {
        setLoadingHierarchy(false);
      }
    };

    void loadFloors();
  }, [selectedBuilding, canManage]);

  useEffect(() => {
    if (!canManage) {
      return;
    }

    if (floors.length === 0) {
      setSelectedFloor("");
      setRooms([]);
      setSelectedRoom("");
      setResources([]);
      return;
    }

    const selectedExists = floors.some((entry) => entry.id === selectedFloor);
    if (!selectedFloor || !selectedExists) {
      setSelectedFloor(floors[0].id);
    }
  }, [floors, selectedFloor, canManage]);

  useEffect(() => {
    if (!canManage) {
      return;
    }

    if (!selectedFloor) {
      setRooms([]);
      setSelectedRoom("");
      setResources([]);
      return;
    }

    const loadRooms = async () => {
      setLoadingHierarchy(true);
      try {
        setErrorMessage(null);
        const list = await resourceManagementService.getRooms(selectedFloor);
        setRooms(list);
      } catch (error) {
        setErrorMessage(getApiError(error));
      } finally {
        setLoadingHierarchy(false);
      }
    };

    void loadRooms();
  }, [selectedFloor, canManage]);

  useEffect(() => {
    if (!canManage) {
      return;
    }

    if (rooms.length === 0) {
      setSelectedRoom("");
      setResources([]);
      return;
    }

    const selectedExists = rooms.some((entry) => entry.id === selectedRoom);
    if (!selectedRoom || !selectedExists) {
      setSelectedRoom(rooms[0].id);
    }
  }, [rooms, selectedRoom, canManage]);

  useEffect(() => {
    if (!canManage) {
      return;
    }

    if (!selectedRoom) {
      setResources([]);
      return;
    }

    const loadResources = async () => {
      setLoadingResources(true);
      try {
        setErrorMessage(null);
        const list = await resourceManagementService.getResources(selectedRoom);
        setResources(list);
      } catch (error) {
        setErrorMessage(getApiError(error));
      } finally {
        setLoadingResources(false);
      }
    };

    void loadResources();
  }, [selectedRoom, canManage]);

  const inventoryByType = useMemo(() => {
    const summary = new Map<string, number>();
    RESOURCE_TYPES.forEach((type) => summary.set(type, 0));

    for (const resource of resources) {
      const key = normalizeType(resource.type);
      if (!summary.has(key)) {
        continue;
      }
      summary.set(key, (summary.get(key) || 0) + resource.quantity);
    }

    return Array.from(summary.entries()).map(([key, quantity]) => ({
      key,
      label: toLabel(key),
      quantity,
    }));
  }, [resources]);

  const resetEdit = () => {
    setEditingResourceId(null);
    setEditDraft({
      name: "",
      type: RESOURCE_TYPES[0],
      quantity: 1,
    });
  };

  const startEdit = (resource: RoomResource) => {
    setEditingResourceId(resource.id);
    setEditDraft({
      name: resource.name,
      type: normalizeType(resource.type),
      quantity: resource.quantity,
    });
  };

  const handleCreate = async () => {
    if (!selectedRoom) {
      setErrorMessage("Select a room before creating a resource.");
      return;
    }
    if (!newResource.name.trim()) {
      setErrorMessage("Resource name is required.");
      return;
    }
    if (newResource.quantity < 1) {
      setErrorMessage("Quantity must be at least 1.");
      return;
    }

    try {
      setCreatingResource(true);
      setErrorMessage(null);
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
    } catch (error) {
      setErrorMessage(getApiError(error));
    } finally {
      setCreatingResource(false);
    }
  };

  const handleUpdate = async (resourceId: string) => {
    const currentResource = resources.find((entry) => entry.id === resourceId);
    if (!currentResource) {
      return;
    }
    if (!editDraft.name.trim()) {
      setErrorMessage("Resource name is required.");
      return;
    }
    if (editDraft.quantity < 1) {
      setErrorMessage("Quantity must be at least 1.");
      return;
    }

    try {
      setUpdatingResourceId(resourceId);
      setErrorMessage(null);
      const updated = await resourceManagementService.updateResource(resourceId, {
        name: editDraft.name.trim(),
        type: editDraft.type,
        quantity: editDraft.quantity,
        roomId: currentResource.roomId,
      });

      setResources((current) =>
        current.map((entry) => (entry.id === resourceId ? updated : entry))
      );
      resetEdit();
    } catch (error) {
      setErrorMessage(getApiError(error));
    } finally {
      setUpdatingResourceId(null);
    }
  };

  const handleDelete = async (resourceId: string) => {
    if (!window.confirm("Delete this resource?")) {
      return;
    }

    try {
      setDeletingResourceId(resourceId);
      setErrorMessage(null);
      await resourceManagementService.deleteResource(resourceId);
      setResources((current) => current.filter((entry) => entry.id !== resourceId));
      if (editingResourceId === resourceId) {
        resetEdit();
      }
    } catch (error) {
      setErrorMessage(getApiError(error));
    } finally {
      setDeletingResourceId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-2xl border border-border bg-card">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-xl font-semibold text-foreground">Resource Management</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to manage resources in this panel.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Resource Management</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Select building, floor, and room to edit room resources only.
        </p>
        {errorMessage && (
          <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[280px_1fr]">
        <aside className="space-y-4 rounded-2xl border border-border bg-card p-4">
          <BuildingSelector
            buildings={buildings}
            selectedBuilding={selectedBuilding}
            onChange={setSelectedBuilding}
            disabled={loadingHierarchy}
          />
          <FloorSelector
            floors={floors}
            selectedFloor={selectedFloor}
            onChange={setSelectedFloor}
            disabled={!selectedBuilding || loadingHierarchy}
          />
          <RoomSelector
            rooms={rooms}
            selectedRoom={selectedRoom}
            onChange={setSelectedRoom}
            disabled={!selectedFloor || loadingHierarchy}
          />

          <div className="rounded-xl border border-border bg-background p-3 text-xs text-muted-foreground">
            {loadingHierarchy ? "Loading hierarchy..." : `Selected room resources: ${resources.length}`}
          </div>
        </aside>

        <section className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Resource Summary</h2>
              <span className="text-sm text-muted-foreground">Room: {selectedRoom || "Not selected"}</span>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
              {inventoryByType.map((entry) => (
                <div key={entry.key} className="rounded-lg border border-border bg-background px-3 py-2">
                  <p className="text-xs text-muted-foreground">{entry.label}</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{entry.quantity}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-2 border-b border-border pb-3 md:grid-cols-[1.8fr_1fr_0.8fr_auto]">
              <input
                value={newResource.name}
                onChange={(event) => setNewResource((current) => ({ ...current, name: event.target.value }))}
                placeholder="Resource name"
                className="rounded-lg border border-border px-3 py-2 text-sm"
                disabled={!selectedRoom || creatingResource}
              />
              <select
                value={newResource.type}
                onChange={(event) => setNewResource((current) => ({ ...current, type: normalizeType(event.target.value) }))}
                className="rounded-lg border border-border px-3 py-2 text-sm"
                disabled={!selectedRoom || creatingResource}
              >
                {RESOURCE_TYPES.map((entry) => (
                  <option key={entry} value={entry}>{toLabel(entry)}</option>
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
                disabled={!selectedRoom || creatingResource}
              />
              <button
                onClick={handleCreate}
                disabled={!selectedRoom || creatingResource}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {creatingResource ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Save
              </button>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-2 py-2">Name</th>
                    <th className="px-2 py-2">Type</th>
                    <th className="px-2 py-2">Quantity</th>
                    <th className="px-2 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map((resource) => {
                    const isEditing = editingResourceId === resource.id;
                    const isUpdating = updatingResourceId === resource.id;
                    const isDeleting = deletingResourceId === resource.id;

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
                        <td className="px-2 py-2">
                          {isEditing ? (
                            <select
                              value={editDraft.type}
                              onChange={(event) =>
                                setEditDraft((current) => ({ ...current, type: normalizeType(event.target.value) }))
                              }
                              className="w-full rounded-md border border-border px-2 py-1"
                            >
                              {RESOURCE_TYPES.map((entry) => (
                                <option key={entry} value={entry}>{toLabel(entry)}</option>
                              ))}
                            </select>
                          ) : (
                            <span>{toLabel(normalizeType(resource.type))}</span>
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
                            <span>{resource.quantity}</span>
                          )}
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-2">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => handleUpdate(resource.id)}
                                  disabled={isUpdating}
                                  className="text-emerald-600 hover:text-emerald-700 disabled:opacity-60"
                                  aria-label="Update resource"
                                >
                                  {isUpdating ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                                </button>
                                <button
                                  onClick={resetEdit}
                                  disabled={isUpdating}
                                  className="text-muted-foreground hover:text-foreground disabled:opacity-60"
                                  aria-label="Cancel edit"
                                >
                                  <X size={15} />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => startEdit(resource)}
                                disabled={Boolean(updatingResourceId || deletingResourceId)}
                                className="text-primary hover:text-primary/80 disabled:opacity-60"
                                aria-label="Edit resource"
                              >
                                <Pencil size={15} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(resource.id)}
                              disabled={isUpdating || isDeleting}
                              className="text-muted-foreground hover:text-destructive disabled:opacity-60"
                              aria-label="Delete resource"
                            >
                              {isDeleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {loadingResources && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                  Loading resources...
                </div>
              )}

              {!loadingResources && resources.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">No resources found for the selected room.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};