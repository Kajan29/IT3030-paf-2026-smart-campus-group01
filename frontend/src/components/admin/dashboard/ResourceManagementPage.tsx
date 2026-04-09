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
  buildingId: string;
  floorId: string;
  roomId: string;
  name: string;
  typeKey: string;
  customType: string;
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
  buildingId: "",
  floorId: "",
  roomId: "",
  name: "",
  typeKey: KNOWN_RESOURCE_TYPES[0],
  customType: "",
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

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [roomDialogRoomId, setRoomDialogRoomId] = useState("");

  const [productDraft, setProductDraft] = useState<ProductDraft>(buildProductDraft);
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft>(buildEditDraft);

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
    () => floors.filter((floor) => floor.buildingId === productDraft.buildingId),
    [floors, productDraft.buildingId]
  );

  const roomsForSelectedFloor = useMemo(
    () => rooms.filter((room) => room.floorId === productDraft.floorId),
    [rooms, productDraft.floorId]
  );

  useEffect(() => {
    if (!addDialogOpen) {
      return;
    }

    if (!productDraft.buildingId) {
      const firstBuildingId = buildings[0]?.id || "";
      setProductDraft((current) => ({ ...current, buildingId: firstBuildingId }));
      return;
    }

    const hasBuilding = buildings.some((building) => building.id === productDraft.buildingId);
    if (!hasBuilding) {
      setProductDraft((current) => ({ ...current, buildingId: buildings[0]?.id || "" }));
    }
  }, [addDialogOpen, buildings, productDraft.buildingId]);

  useEffect(() => {
    if (!addDialogOpen) {
      return;
    }

    if (floorsForSelectedBuilding.length === 0) {
      setProductDraft((current) => ({ ...current, floorId: "", roomId: "" }));
      return;
    }

    const hasFloor = floorsForSelectedBuilding.some((floor) => floor.id === productDraft.floorId);
    if (!productDraft.floorId || !hasFloor) {
      setProductDraft((current) => ({ ...current, floorId: floorsForSelectedBuilding[0].id }));
    }
  }, [addDialogOpen, floorsForSelectedBuilding, productDraft.floorId]);

  useEffect(() => {
    if (!addDialogOpen) {
      return;
    }

    if (roomsForSelectedFloor.length === 0) {
      setProductDraft((current) => ({ ...current, roomId: "" }));
      return;
    }

    const hasRoom = roomsForSelectedFloor.some((room) => room.id === productDraft.roomId);
    if (!productDraft.roomId || !hasRoom) {
      setProductDraft((current) => ({ ...current, roomId: roomsForSelectedFloor[0].id }));
    }
  }, [addDialogOpen, roomsForSelectedFloor, productDraft.roomId]);

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
    setProductDraft(buildProductDraft());
    setAddDialogOpen(true);
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
    const normalizedName = productDraft.name.trim();
    const normalizedType = getDraftType(productDraft.typeKey, productDraft.customType);

    if (!productDraft.buildingId || !productDraft.floorId || !productDraft.roomId) {
      setErrorMessage("Select building, floor and room.");
      return;
    }

    if (!normalizedName) {
      setErrorMessage("Product name is required.");
      return;
    }

    if (!normalizedType) {
      setErrorMessage("Product type is required.");
      return;
    }

    try {
      setSavingProduct(true);
      setErrorMessage(null);

      const created = await resourceManagementService.createResource({
        name: normalizedName,
        type: normalizedType,
        quantity: 1,
        roomId: productDraft.roomId,
      });

      setResourcesByRoom((current) => {
        const roomResources = current[productDraft.roomId] || [];
        return {
          ...current,
          [productDraft.roomId]: [...roomResources, created],
        };
      });

      setAddDialogOpen(false);
      setProductDraft(buildProductDraft());
    } catch (error) {
      setErrorMessage(getApiError(error));
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

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Select building, floor and room, then add a new product entry.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Building</label>
              <select
                value={productDraft.buildingId}
                onChange={(event) => setProductDraft((current) => ({ ...current, buildingId: event.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm"
              >
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>{building.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Floor</label>
              <select
                value={productDraft.floorId}
                onChange={(event) => setProductDraft((current) => ({ ...current, floorId: event.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm"
              >
                {floorsForSelectedBuilding.map((floor) => (
                  <option key={floor.id} value={floor.id}>{floor.floorName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Room</label>
              <select
                value={productDraft.roomId}
                onChange={(event) => setProductDraft((current) => ({ ...current, roomId: event.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm"
              >
                {roomsForSelectedFloor.map((room) => (
                  <option key={room.id} value={room.id}>{room.name} ({room.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Product Name</label>
              <input
                value={productDraft.name}
                onChange={(event) => setProductDraft((current) => ({ ...current, name: event.target.value }))}
                placeholder="Example: Teacher Laptop"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Product Type</label>
              <select
                value={productDraft.typeKey}
                onChange={(event) => setProductDraft((current) => ({ ...current, typeKey: event.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm"
              >
                {knownTypeOptions.map((type) => (
                  <option key={type} value={type}>{toLabel(type)}</option>
                ))}
                <option value={CUSTOM_TYPE_KEY}>Custom Type</option>
              </select>
            </div>

            {productDraft.typeKey === CUSTOM_TYPE_KEY && (
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Custom Type</label>
                <input
                  value={productDraft.customType}
                  onChange={(event) => setProductDraft((current) => ({ ...current, customType: event.target.value }))}
                  placeholder="Example: Microphone"
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <button
              onClick={() => setAddDialogOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-border text-sm hover:bg-muted transition-colors"
              disabled={savingProduct}
            >
              Cancel
            </button>
            <button
              onClick={handleAddProduct}
              disabled={savingProduct}
              className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 inline-flex items-center gap-2"
            >
              {savingProduct ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Add Product
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
