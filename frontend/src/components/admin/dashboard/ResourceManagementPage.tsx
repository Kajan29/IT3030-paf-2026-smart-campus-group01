import { useEffect, useMemo, useState } from "react";
import { Building2, DoorOpen, Eye, Layers, Loader2, Pencil, Plus, Save, Search, Snowflake, Trash2 } from "lucide-react";
import type { Building, Floor, Room } from "@/types/campusManagement";
import type { RoomResource } from "@/types/resourceManagement";
import resourceManagementService from "@/services/resourceManagementService";
import { useAuth } from "@/context/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Breadcrumb } from "@/components/common/Breadcrumb";

const KNOWN_RESOURCE_TYPES = [
  "chair",
  "table",
  "ac_unit",
  "whiteboard",
  "projector",
  "power_plug",
  "laptop",
  "screen",
] as const;

const CUSTOM_TYPE_KEY = "__custom__";

type ProductDraft = {
  id: string;
  name: string;
  typeKey: string;
  customType: string;
  quantity: number;
};

type ProductLocationDraft = {
  buildingId: string;
  floorId: string;
  roomId: string;
};

type EditDraft = {
  name: string;
  typeKey: string;
  customType: string;
  quantity: number;
};

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

const getDraftType = (typeKey: string, customType: string) => {
  if (typeKey === CUSTOM_TYPE_KEY) {
    return normalizeType(customType);
  }
  return normalizeType(typeKey);
};

const buildProductDraft = (): ProductDraft => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name: "",
  typeKey: KNOWN_RESOURCE_TYPES[0],
  customType: "",
  quantity: 1,
});

const buildProductLocationDraft = (): ProductLocationDraft => ({
  buildingId: "",
  floorId: "",
  roomId: "",
});

const buildEditDraft = (): EditDraft => ({
  name: "",
  typeKey: KNOWN_RESOURCE_TYPES[0],
  customType: "",
  quantity: 1,
});

export const ResourceManagementPage = () => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const canManage = isAuthenticated && user?.role === "ADMIN";

  const [loadingHierarchy, setLoadingHierarchy] = useState(false);
  const [loadingRoomResources, setLoadingRoomResources] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [updatingResourceId, setUpdatingResourceId] = useState<string | null>(null);
  const [deletingResourceId, setDeletingResourceId] = useState<string | null>(null);

  const [selectedRoom, setSelectedRoom] = useState("");

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [resourcesByRoom, setResourcesByRoom] = useState<Record<string, RoomResource[]>>({});

  const [searchTerm, setSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [roomDialogRoomId, setRoomDialogRoomId] = useState("");

  const [productLocationDraft, setProductLocationDraft] = useState<ProductLocationDraft>(buildProductLocationDraft);
  const [productDrafts, setProductDrafts] = useState<ProductDraft[]>([buildProductDraft()]);
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft>(buildEditDraft);

  const addFlowOpen = locationDialogOpen || addDialogOpen;

  useEffect(() => {
    if (authLoading || !canManage) {
      return;
    }

    const loadAllData = async () => {
      setLoadingHierarchy(true);
      setLoadingRoomResources(true);
      try {
        setErrorMessage(null);

        const buildingList = await resourceManagementService.getBuildings();
        setBuildings(buildingList);

        const floorList = (
          await Promise.all(
            buildingList.map(async (building) => resourceManagementService.getFloors(building.id))
          )
        ).flat();
        setFloors(floorList);

        const roomList = (
          await Promise.all(
            floorList.map(async (floor) => resourceManagementService.getRooms(floor.id))
          )
        ).flat();
        setRooms(roomList);

        const resourceEntries = await Promise.all(
          roomList.map(async (room) => {
            const resources = await resourceManagementService.getResources(room.id);
            return [room.id, resources] as const;
          })
        );

        const mapped = resourceEntries.reduce<Record<string, RoomResource[]>>((acc, [roomId, resources]) => {
          acc[roomId] = resources;
          return acc;
        }, {});

        setResourcesByRoom(mapped);
      } catch (error) {
        setErrorMessage(getApiError(error));
      } finally {
        setLoadingHierarchy(false);
        setLoadingRoomResources(false);
      }
    };

    void loadAllData();
  }, [authLoading, canManage]);

  useEffect(() => {
    if (!canManage) {
      setSelectedRoom("");
      setBuildings([]);
      setFloors([]);
      setRooms([]);
      setResourcesByRoom({});
      return;
    }

    if (rooms.length === 0) {
      setSelectedRoom("");
      return;
    }

    const selectedExists = rooms.some((entry) => entry.id === selectedRoom);
    if (!selectedRoom || !selectedExists) {
      setSelectedRoom(rooms[0].id);
    }
  }, [canManage, rooms, selectedRoom]);

  const buildingNameById = useMemo(() => {
    const map = new Map<string, string>();
    buildings.forEach((building) => map.set(building.id, building.name));
    return map;
  }, [buildings]);

  const floorNameById = useMemo(() => {
    const map = new Map<string, string>();
    floors.forEach((floor) => map.set(floor.id, floor.floorName));
    return map;
  }, [floors]);

  const roomById = useMemo(() => {
    const map = new Map<string, Room>();
    rooms.forEach((room) => map.set(room.id, room));
    return map;
  }, [rooms]);

  const floorsForSelectedBuilding = useMemo(
    () => floors.filter((floor) => floor.buildingId === productLocationDraft.buildingId),
    [floors, productLocationDraft.buildingId]
  );

  const roomsForSelectedFloor = useMemo(
    () => rooms.filter((room) => room.floorId === productLocationDraft.floorId),
    [rooms, productLocationDraft.floorId]
  );

  useEffect(() => {
    if (!addFlowOpen) {
      return;
    }

    if (!productLocationDraft.buildingId) {
      const firstBuildingId = buildings[0]?.id || "";
      setProductLocationDraft((current) => ({ ...current, buildingId: firstBuildingId }));
      return;
    }

    const hasBuilding = buildings.some((building) => building.id === productLocationDraft.buildingId);
    if (!hasBuilding) {
      setProductLocationDraft((current) => ({ ...current, buildingId: buildings[0]?.id || "" }));
    }
  }, [addFlowOpen, buildings, productLocationDraft.buildingId]);

  useEffect(() => {
    if (!addFlowOpen) {
      return;
    }

    if (floorsForSelectedBuilding.length === 0) {
      setProductLocationDraft((current) => ({ ...current, floorId: "", roomId: "" }));
      return;
    }

    const hasFloor = floorsForSelectedBuilding.some((floor) => floor.id === productLocationDraft.floorId);
    if (!productLocationDraft.floorId || !hasFloor) {
      setProductLocationDraft((current) => ({ ...current, floorId: floorsForSelectedBuilding[0].id }));
    }
  }, [addFlowOpen, floorsForSelectedBuilding, productLocationDraft.floorId]);

  useEffect(() => {
    if (!addFlowOpen) {
      return;
    }

    if (roomsForSelectedFloor.length === 0) {
      setProductLocationDraft((current) => ({ ...current, roomId: "" }));
      return;
    }

    const hasRoom = roomsForSelectedFloor.some((room) => room.id === productLocationDraft.roomId);
    if (!productLocationDraft.roomId || !hasRoom) {
      setProductLocationDraft((current) => ({ ...current, roomId: roomsForSelectedFloor[0].id }));
    }
  }, [addFlowOpen, roomsForSelectedFloor, productLocationDraft.roomId]);

  const roomDialogResources = useMemo(
    () => resourcesByRoom[roomDialogRoomId] || [],
    [resourcesByRoom, roomDialogRoomId]
  );

  const knownTypeOptions = useMemo(() => {
    const allKnown = new Set<string>(KNOWN_RESOURCE_TYPES);
    Object.values(resourcesByRoom)
      .flat()
      .forEach((resource) => allKnown.add(normalizeType(resource.type)));

    return Array.from(allKnown).sort((a, b) => a.localeCompare(b));
  }, [resourcesByRoom]);

  const visibleRooms = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return rooms;
    }

    return rooms.filter((room) => {
      const buildingName = buildingNameById.get(room.buildingId) || "";
      const floorName = floorNameById.get(room.floorId) || "";
      const value = `${buildingName} ${floorName} ${room.name} ${room.code}`.toLowerCase();
      return value.includes(term);
    });
  }, [rooms, searchTerm, buildingNameById, floorNameById]);

  const tableRows = useMemo(() => {
    return visibleRooms.map((room) => {
      const resources = resourcesByRoom[room.id] || [];
      const total = resources.reduce((sum, resource) => sum + resource.quantity, 0);

      return {
        room,
        total,
      };
    });
  }, [visibleRooms, resourcesByRoom]);

  const totals = useMemo(() => {
    const allResources = Object.values(resourcesByRoom).flat();
    const totalProducts = allResources.length;
    const totalACUnits = allResources.reduce((sum, resource) => {
      const type = normalizeType(resource.type);
      if (type === "ac_unit" || type === "ac") {
        return sum + resource.quantity;
      }
      return sum;
    }, 0);

    return {
      buildings: buildings.length,
      floors: floors.length,
      rooms: rooms.length,
      products: totalProducts,
      acUnits: totalACUnits,
    };
  }, [buildings.length, floors.length, rooms.length, resourcesByRoom]);

  const openAddDialog = () => {
    setProductLocationDraft(buildProductLocationDraft());
    setProductDrafts([buildProductDraft()]);
    setLocationDialogOpen(true);
  };

  const closeAddFlow = () => {
    if (savingProduct) {
      return;
    }

    setLocationDialogOpen(false);
    setAddDialogOpen(false);
    setProductLocationDraft(buildProductLocationDraft());
    setProductDrafts([buildProductDraft()]);
  };

  const goToProductDialog = () => {
    if (!productLocationDraft.buildingId || !productLocationDraft.floorId || !productLocationDraft.roomId) {
      setErrorMessage("Select building, floor and room.");
      return;
    }

    setErrorMessage(null);
    setLocationDialogOpen(false);
    setAddDialogOpen(true);
  };

  const addProductRow = () => {
    setProductDrafts((current) => [...current, buildProductDraft()]);
  };

  const removeProductRow = (draftId: string) => {
    setProductDrafts((current) => {
      if (current.length <= 1) {
        return current;
      }
      return current.filter((entry) => entry.id !== draftId);
    });
  };

  const updateProductRow = (draftId: string, changes: Partial<Omit<ProductDraft, "id">>) => {
    setProductDrafts((current) =>
      current.map((entry) => (entry.id === draftId ? { ...entry, ...changes } : entry))
    );
  };

  const openRoomDialog = (roomId: string) => {
    setSelectedRoom(roomId);
    setRoomDialogRoomId(roomId);
    setEditingResourceId(null);
    setEditDraft(buildEditDraft());
    setRoomDialogOpen(true);
  };

  const closeRoomDialog = () => {
    if (updatingResourceId || deletingResourceId) {
      return;
    }

    setRoomDialogOpen(false);
    setRoomDialogRoomId("");
    setEditingResourceId(null);
    setEditDraft(buildEditDraft());
  };

  const startResourceEdit = (resource: RoomResource) => {
    const type = normalizeType(resource.type);
    const known = knownTypeOptions.includes(type);

    setEditingResourceId(resource.id);
    setEditDraft({
      name: resource.name,
      typeKey: known ? type : CUSTOM_TYPE_KEY,
      customType: known ? "" : type,
      quantity: resource.quantity,
    });
  };

  const saveResourceEdit = async (resource: RoomResource) => {
    const normalizedName = editDraft.name.trim();
    const normalizedType = getDraftType(editDraft.typeKey, editDraft.customType);

    if (!normalizedName) {
      setErrorMessage("Resource name is required.");
      return;
    }

    if (!normalizedType) {
      setErrorMessage("Resource type is required.");
      return;
    }

    if (editDraft.quantity < 1) {
      setErrorMessage("Quantity must be at least 1.");
      return;
    }

    try {
      setUpdatingResourceId(resource.id);
      setErrorMessage(null);

      const updated = await resourceManagementService.updateResource(resource.id, {
        name: normalizedName,
        type: normalizedType,
        quantity: editDraft.quantity,
        roomId: resource.roomId,
      });

      setResourcesByRoom((current) => {
        const roomResources = current[resource.roomId] || [];
        return {
          ...current,
          [resource.roomId]: roomResources.map((entry) => (entry.id === resource.id ? updated : entry)),
        };
      });

      setEditingResourceId(null);
      setEditDraft(buildEditDraft());
    } catch (error) {
      setErrorMessage(getApiError(error));
    } finally {
      setUpdatingResourceId(null);
    }
  };

  const deleteResourceFromRoom = async (resource: RoomResource) => {
    if (!window.confirm(`Delete ${resource.name}?`)) {
      return;
    }

    try {
      setDeletingResourceId(resource.id);
      setErrorMessage(null);
      await resourceManagementService.deleteResource(resource.id);

      setResourcesByRoom((current) => {
        const roomResources = current[resource.roomId] || [];
        return {
          ...current,
          [resource.roomId]: roomResources.filter((entry) => entry.id !== resource.id),
        };
      });

      if (editingResourceId === resource.id) {
        setEditingResourceId(null);
        setEditDraft(buildEditDraft());
      }
    } catch (error) {
      setErrorMessage(getApiError(error));
    } finally {
      setDeletingResourceId(null);
    }
  };

  const handleAddProduct = async () => {
    if (!productLocationDraft.buildingId || !productLocationDraft.floorId || !productLocationDraft.roomId) {
      setErrorMessage("Select building, floor and room.");
      return;
    }

    if (productDrafts.length === 0) {
      setErrorMessage("Add at least one product.");
      return;
    }

    const roomResources = resourcesByRoom[productLocationDraft.roomId] || [];
    const existingKeys = new Set(
      roomResources.map((resource) => `${resource.name.trim().toLowerCase()}::${normalizeType(resource.type)}`)
    );

    const batchKeys = new Set<string>();
    const payloads = productDrafts.map((draft, index) => {
      const normalizedName = draft.name.trim();
      const normalizedType = getDraftType(draft.typeKey, draft.customType);
      const quantity = Number(draft.quantity);

      if (!normalizedName) {
        throw new Error(`Product name is required on row ${index + 1}.`);
      }

      if (!normalizedType) {
        throw new Error(`Product type is required on row ${index + 1}.`);
      }

      if (!Number.isFinite(quantity) || quantity < 1) {
        throw new Error(`Quantity must be at least 1 on row ${index + 1}.`);
      }

      const compositeKey = `${normalizedName.toLowerCase()}::${normalizedType}`;
      if (existingKeys.has(compositeKey)) {
        throw new Error(
          `${normalizedName} (${toLabel(normalizedType)}) already exists in this room. Edit the existing product instead of adding it again.`
        );
      }

      if (batchKeys.has(compositeKey)) {
        throw new Error(
          `${normalizedName} (${toLabel(normalizedType)}) is duplicated in this popup. Keep only one entry and continue.`
        );
      }

      batchKeys.add(compositeKey);
      return {
        name: normalizedName,
        type: normalizedType,
        quantity,
        roomId: productLocationDraft.roomId,
      };
    });

    try {
      setSavingProduct(true);
      setErrorMessage(null);

      const createdResources: RoomResource[] = [];
      for (const payload of payloads) {
        const created = await resourceManagementService.createResource(payload);
        createdResources.push(created);
      }

      setResourcesByRoom((current) => {
        const roomResourcesById = current[productLocationDraft.roomId] || [];
        return {
          ...current,
          [productLocationDraft.roomId]: [...roomResourcesById, ...createdResources],
        };
      });

      closeAddFlow();
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(getApiError(error));
      }
    } finally {
      setSavingProduct(false);
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

  const dialogRoom = roomById.get(roomDialogRoomId);
  const roomDialogACCount = roomDialogResources.reduce((sum, resource) => {
    const type = normalizeType(resource.type);
    if (type === "ac_unit" || type === "ac") {
      return sum + resource.quantity;
    }
    return sum;
  }, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb items={[{ label: "Resource Management", icon: <Building2 className="h-4 w-4" /> }]} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Resource Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage room products, track AC availability, and edit resources by building and floor.
          </p>
        </div>
        <button
          onClick={openAddDialog}
          className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl"
        >
          <Plus size={20} />
          Add Product
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="glass-card rounded-2xl p-6 border border-border hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Buildings</p>
            <Building2 className="h-5 w-5 text-primary/70" />
          </div>
          <p className="text-3xl font-bold text-foreground">{totals.buildings}</p>
        </div>
        <div className="glass-card rounded-2xl p-6 border border-border hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Floors</p>
            <Layers className="h-5 w-5 text-primary/70" />
          </div>
          <p className="text-3xl font-bold text-foreground">{totals.floors}</p>
        </div>
        <div className="glass-card rounded-2xl p-6 border border-border hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Rooms</p>
            <DoorOpen className="h-5 w-5 text-primary/70" />
          </div>
          <p className="text-3xl font-bold text-foreground">{totals.rooms}</p>
        </div>
        <div className="glass-card rounded-2xl p-6 border border-border hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Products</p>
            <DoorOpen className="h-5 w-5 text-primary/70" />
          </div>
          <p className="text-3xl font-bold text-foreground">{totals.products}</p>
        </div>
        <div className="glass-card rounded-2xl p-6 border border-border hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">AC Units</p>
            <Snowflake className="h-5 w-5 text-primary/70" />
          </div>
          <p className="text-3xl font-bold text-foreground">{totals.acUnits}</p>
        </div>
      </div>

      {errorMessage && (
        <div className="glass-card rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      <div className="glass-card rounded-2xl p-4 border border-border">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3 items-center">
          <h2 className="text-xl font-semibold text-foreground">Room Inventory Table</h2>
          <div className="relative w-full lg:w-[360px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search building / floor / room"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-3">Building</th>
                <th className="px-3 py-3">Floor</th>
                <th className="px-3 py-3">Room</th>
                <th className="px-3 py-3">Total</th>
                <th className="px-3 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map(({ room, total }) => {
                const isSelected = selectedRoom === room.id;

                return (
                  <tr
                    key={room.id}
                    className={isSelected ? "border-b border-border bg-primary/5 transition-colors" : "border-b border-border/70 transition-colors hover:bg-muted/30"}
                  >
                    <td className="px-3 py-3 text-muted-foreground">{buildingNameById.get(room.buildingId) || "-"}</td>
                    <td className="px-3 py-3 text-muted-foreground">{floorNameById.get(room.floorId) || "-"}</td>
                    <td className="px-3 py-3 font-medium text-foreground">{room.name} ({room.code})</td>
                    <td className="px-3 py-3 text-center font-semibold text-foreground">{total}</td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => openRoomDialog(room.id)}
                        className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted transition-colors inline-flex items-center gap-2"
                      >
                        <Eye size={15} />
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!loadingRoomResources && tableRows.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No rooms found in the system.</p>
          )}
          {(loadingHierarchy || loadingRoomResources) && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
              Loading room resources...
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={locationDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeAddFlow();
            return;
          }
          setLocationDialogOpen(true);
        }}
      >
        <DialogContent className="max-w-xl overflow-hidden rounded-3xl border border-primary/20 bg-background p-0 shadow-2xl">
          <div className="bg-gradient-to-r from-primary/12 via-primary/5 to-transparent px-6 py-5">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-foreground">Select Room Location</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Choose building, floor and room before adding products.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-4 px-6 py-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Building</label>
              <select
                value={productLocationDraft.buildingId}
                onChange={(event) => setProductLocationDraft((current) => ({ ...current, buildingId: event.target.value }))}
                className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>{building.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Floor</label>
              <select
                value={productLocationDraft.floorId}
                onChange={(event) => setProductLocationDraft((current) => ({ ...current, floorId: event.target.value }))}
                className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {floorsForSelectedBuilding.map((floor) => (
                  <option key={floor.id} value={floor.id}>{floor.floorName}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Room</label>
              <select
                value={productLocationDraft.roomId}
                onChange={(event) => setProductLocationDraft((current) => ({ ...current, roomId: event.target.value }))}
                className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {roomsForSelectedFloor.map((room) => (
                  <option key={room.id} value={room.id}>{room.name} ({room.code})</option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter className="border-t border-border bg-muted/30 px-6 py-4">
            <button
              onClick={closeAddFlow}
              className="h-10 rounded-xl border border-border px-4 text-sm font-medium hover:bg-muted transition-colors"
              disabled={savingProduct}
            >
              Cancel
            </button>
            <button
              onClick={goToProductDialog}
              disabled={savingProduct}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90 disabled:opacity-60"
            >
              Next
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={addDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeAddFlow();
            return;
          }
          setAddDialogOpen(true);
        }}
      >
        <DialogContent className="max-w-3xl overflow-hidden rounded-3xl border border-primary/20 bg-background p-0 shadow-2xl">
          <div className="bg-gradient-to-r from-primary/12 via-primary/5 to-transparent px-7 py-5">
            <DialogHeader>
              <DialogTitle className="text-3xl font-bold text-foreground">Add Products</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Add one or more product name and type entries for the selected room.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-7 py-5">
            <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
              {`${buildingNameById.get(productLocationDraft.buildingId) || "-"} / ${floorNameById.get(productLocationDraft.floorId) || "-"} / ${roomById.get(productLocationDraft.roomId)?.name || "-"}`}
            </div>
          </div>

          <div className="space-y-4 max-h-[48vh] overflow-auto px-7 pb-5 pr-5">
            {productDrafts.map((draft, index) => (
              <div key={draft.id} className="space-y-4 rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/25 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-base font-semibold text-foreground">Product #{index + 1}</p>
                  <button
                    onClick={() => removeProductRow(draft.id)}
                    disabled={savingProduct || productDrafts.length === 1}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-destructive/40 bg-destructive/5 px-3 text-xs font-medium text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
                  >
                    <Trash2 size={12} />
                    Remove
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Product Name</label>
                  <input
                    value={draft.name}
                    onChange={(event) => updateProductRow(draft.id, { name: event.target.value })}
                    placeholder="Example: Teacher Laptop"
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_160px]">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Product Type</label>
                    <select
                      value={draft.typeKey}
                      onChange={(event) => updateProductRow(draft.id, { typeKey: event.target.value })}
                      className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {knownTypeOptions.map((type) => (
                        <option key={type} value={type}>{toLabel(type)}</option>
                      ))}
                      <option value={CUSTOM_TYPE_KEY}>Custom Type</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      value={draft.quantity}
                      onChange={(event) =>
                        updateProductRow(draft.id, {
                          quantity: Math.max(1, Number(event.target.value) || 1),
                        })
                      }
                      className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                {draft.typeKey === CUSTOM_TYPE_KEY && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Custom Type</label>
                    <input
                      value={draft.customType}
                      onChange={(event) => updateProductRow(draft.id, { customType: event.target.value })}
                      placeholder="Example: Microphone"
                      className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                )}
              </div>
            ))}

            <button
              onClick={addProductRow}
              disabled={savingProduct}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-dashed border-primary/50 bg-primary/5 px-5 text-sm font-medium text-primary transition hover:bg-primary/10 disabled:opacity-60"
            >
              <Plus size={14} />
              Add Another Product
            </button>
          </div>

          <DialogFooter className="border-t border-border bg-muted/30 px-7 py-4">
            <button
              onClick={() => {
                setAddDialogOpen(false);
                setLocationDialogOpen(true);
              }}
              className="h-10 rounded-xl border border-border bg-background px-4 text-sm font-medium hover:bg-muted transition-colors"
              disabled={savingProduct}
            >
              Back
            </button>
            <button
              onClick={closeAddFlow}
              className="h-10 rounded-xl border border-border bg-background px-4 text-sm font-medium hover:bg-muted transition-colors"
              disabled={savingProduct}
            >
              Cancel
            </button>
            <button
              onClick={handleAddProduct}
              disabled={savingProduct}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90 disabled:opacity-60"
            >
              {savingProduct ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Add Products
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={roomDialogOpen} onOpenChange={(open) => (!open ? closeRoomDialog() : setRoomDialogOpen(true))}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Room Details</DialogTitle>
            <DialogDescription>
              {dialogRoom
                ? `${buildingNameById.get(dialogRoom.buildingId) || "-"} / ${floorNameById.get(dialogRoom.floorId) || "-"} / ${dialogRoom.name}`
                : "Selected room resource details"}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            AC Units in this room: <span className="font-semibold text-foreground">{roomDialogACCount}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-2 py-2">Product</th>
                  <th className="px-2 py-2">Type</th>
                  <th className="px-2 py-2">Qty</th>
                  <th className="px-2 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roomDialogResources.map((resource) => {
                  const isEditing = editingResourceId === resource.id;
                  const isUpdating = updatingResourceId === resource.id;
                  const isDeleting = deletingResourceId === resource.id;

                  return (
                    <tr key={resource.id} className="border-b border-border/70">
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
                          <div className="space-y-2">
                            <select
                              value={editDraft.typeKey}
                              onChange={(event) => setEditDraft((current) => ({ ...current, typeKey: event.target.value }))}
                              className="w-full rounded-md border border-border px-2 py-1"
                            >
                              {knownTypeOptions.map((type) => (
                                <option key={type} value={type}>{toLabel(type)}</option>
                              ))}
                              <option value={CUSTOM_TYPE_KEY}>Custom Type</option>
                            </select>
                            {editDraft.typeKey === CUSTOM_TYPE_KEY && (
                              <input
                                value={editDraft.customType}
                                onChange={(event) => setEditDraft((current) => ({ ...current, customType: event.target.value }))}
                                className="w-full rounded-md border border-border px-2 py-1"
                                placeholder="Custom type"
                              />
                            )}
                          </div>
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
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => saveResourceEdit(resource)}
                              disabled={isUpdating || isDeleting}
                              className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-medium text-white disabled:opacity-60"
                            >
                              {isUpdating ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingResourceId(null);
                                setEditDraft(buildEditDraft());
                              }}
                              disabled={isUpdating || isDeleting}
                              className="rounded-md border border-border px-2 py-1 text-xs"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => void deleteResourceFromRoom(resource)}
                              disabled={isUpdating || isDeleting}
                              className="inline-flex items-center gap-1 rounded-md border border-destructive/30 px-2 py-1 text-xs text-destructive disabled:opacity-60"
                            >
                              {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                              Delete
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startResourceEdit(resource)}
                              disabled={isDeleting}
                              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-accent disabled:opacity-60"
                            >
                              <Pencil size={12} />
                              Edit
                            </button>
                            <button
                              onClick={() => void deleteResourceFromRoom(resource)}
                              disabled={isDeleting}
                              className="inline-flex items-center gap-1 rounded-md border border-destructive/30 px-2 py-1 text-xs text-destructive disabled:opacity-60"
                            >
                              {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {roomDialogResources.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">No products found for this room.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
