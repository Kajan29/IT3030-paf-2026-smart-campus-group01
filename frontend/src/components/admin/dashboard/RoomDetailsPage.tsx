import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DoorOpen,
  Edit3,
  Layers,
  Plus,
  Save,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { AdminLoadingState } from "@/components/admin/dashboard/AdminLoadingState";
import facilityService, { type RoomTimetablePayload } from "@/services/facilityService";
import type { Building, Floor, Room } from "@/types/campusManagement";
import type { RoomTimetableEntry } from "@/types/booking";
import { cn } from "@/lib/utils";

interface RoomDetailsPageProps {
  roomId: string | null;
  onBack?: () => void;
}

type EditorState = {
  id?: string;
  roomId: string;
  substituteRoomId: string;
  dayOfWeek: string;
  startTime: string;
  durationHours: number;
  lectureName: string;
  lecturerName: string;
  lecturerEmail: string;
  purpose: string;
  notes: string;
  entryType: string;
  active: boolean;
};

const dayOptions = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const entryTypeOptions = ["LECTURE", "CLASS", "WORKSHOP", "MEETING", "WORK", "OTHER"];
const durationOptions = [1, 2, 3, 4];

const emptyEditorState = (roomId = "", dayOfWeek = "MONDAY"): EditorState => ({
  roomId,
  substituteRoomId: "",
  dayOfWeek,
  startTime: "08:00",
  durationHours: 1,
  lectureName: "",
  lecturerName: "",
  lecturerEmail: "",
  purpose: "",
  notes: "",
  entryType: "LECTURE",
  active: true,
});

const parseClock = (value?: string) => {
  if (!value) return { hour: 8, minute: 0 };
  const [hourPart, minutePart] = value.split(":");
  return { hour: Number(hourPart) || 8, minute: Number(minutePart) || 0 };
};

const formatClock = (hour: number, minute = 0) => `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

const getWeekStart = (date = new Date()) => {
  const current = new Date(date);
  const day = (current.getDay() + 6) % 7;
  current.setDate(current.getDate() - day);
  current.setHours(0, 0, 0, 0);
  return current;
};

const getDateForWeekDay = (dayOfWeek: string) => {
  const index = dayOptions.indexOf(dayOfWeek);
  const start = getWeekStart();
  if (index < 0) {
    return new Date().toISOString().slice(0, 10);
  }
  start.setDate(start.getDate() + index);
  return start.toISOString().slice(0, 10);
};

const RoomDetailsPage = ({ roomId, onBack }: RoomDetailsPageProps) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [building, setBuilding] = useState<Building | null>(null);
  const [floor, setFloor] = useState<Floor | null>(null);
  const [timetable, setTimetable] = useState<RoomTimetableEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTimetable, setLoadingTimetable] = useState(false);
  const [selectedDay, setSelectedDay] = useState("MONDAY");
  const [showEditor, setShowEditor] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editor, setEditor] = useState<EditorState>(emptyEditorState());

  useEffect(() => {
    if (!roomId) {
      setRoom(null);
      setBuilding(null);
      setFloor(null);
      setTimetable([]);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const snapshot = await facilityService.getFacilitySnapshot();
        const roomData = snapshot.rooms.find((entry) => entry.id === roomId) || null;
        if (!roomData) {
          setRoom(null);
          setBuilding(null);
          setFloor(null);
          setTimetable([]);
          return;
        }

        setRoom(roomData);
        setBuilding(snapshot.buildings.find((entry) => entry.id === roomData.buildingId) || null);
        setFloor(snapshot.floors.find((entry) => entry.id === roomData.floorId) || null);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load room details");
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [roomId]);

  useEffect(() => {
    const loadTimetable = async () => {
      if (!roomId) return;
      setLoadingTimetable(true);
      try {
        const entries = await facilityService.getRoomTimetable(roomId);
        setTimetable(entries);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load timetable");
      } finally {
        setLoadingTimetable(false);
      }
    };

    void loadTimetable();
  }, [roomId]);

  useEffect(() => {
    if (!room || !building) return;
    const weekendClosed = Boolean(room.closedOnWeekends ?? building.closedOnWeekends);
    if (weekendClosed && (selectedDay === "SATURDAY" || selectedDay === "SUNDAY")) {
      setSelectedDay("MONDAY");
    }
  }, [room, building, selectedDay]);

  const weekTabs = useMemo(
    () =>
      dayOptions.map((day) => ({
        day,
        date: getDateForWeekDay(day),
        disabled: Boolean((room?.closedOnWeekends ?? building?.closedOnWeekends) && (day === "SATURDAY" || day === "SUNDAY")),
      })),
    [room?.closedOnWeekends, building?.closedOnWeekends],
  );

  const roomWindow = useMemo(() => {
    const open = parseClock(room?.openingTime || building?.openingTime);
    const close = parseClock(room?.closingTime || building?.closingTime);
    return { open, close };
  }, [room?.openingTime, room?.closingTime, building?.openingTime, building?.closingTime]);

  const selectedDayEntries = useMemo(
    () => timetable.filter((entry) => entry.dayOfWeek === selectedDay),
    [timetable, selectedDay],
  );

  const roomClosedWeekend = Boolean(room?.closedOnWeekends ?? building?.closedOnWeekends);

  const timelineHours = useMemo(() => {
    const hours: number[] = [];
    for (let hour = roomWindow.open.hour; hour < roomWindow.close.hour; hour += 1) {
      hours.push(hour);
    }
    return hours;
  }, [roomWindow]);

  const creatorName = [room?.createdBy?.firstName, room?.createdBy?.lastName].filter(Boolean).join(" ");

  const openNewEntry = (startHour: number) => {
    if (!roomId) return;
    setEditor({
      ...emptyEditorState(roomId, selectedDay),
      roomId,
      dayOfWeek: selectedDay,
      startTime: formatClock(startHour),
    });
    setShowEditor(true);
  };

  const openEditEntry = (entry: RoomTimetableEntry) => {
    setEditor({
      id: entry.id,
      roomId: entry.roomId,
      substituteRoomId: entry.substituteRoomId || "",
      dayOfWeek: entry.dayOfWeek,
      startTime: entry.startTime.slice(0, 5),
      durationHours: Math.max(1, Math.round((new Date(`1970-01-01T${entry.endTime}`).getTime() - new Date(`1970-01-01T${entry.startTime}`).getTime()) / 3_600_000)),
      lectureName: entry.lectureName,
      lecturerName: entry.lecturerName,
      lecturerEmail: entry.lecturerEmail || "",
      purpose: entry.purpose,
      notes: entry.notes || "",
      entryType: entry.entryType,
      active: entry.active,
    });
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
    setEditor(emptyEditorState(roomId || "", selectedDay));
  };

  const refreshTimetable = async () => {
    if (!roomId) return;
    const entries = await facilityService.getRoomTimetable(roomId);
    setTimetable(entries);
  };

  const handleSave = async () => {
    if (!roomId || !room) return;

    const [startHour, startMinute] = editor.startTime.split(":").map(Number);
    const endHour = startHour + editor.durationHours;
    const startClock = formatClock(startHour, startMinute || 0);
    const endClock = formatClock(endHour, startMinute || 0);

    const payload: RoomTimetablePayload = {
      roomId,
      substituteRoomId: editor.substituteRoomId || null,
      dayOfWeek: editor.dayOfWeek,
      startTime: `${startClock}:00`,
      endTime: `${endClock}:00`,
      lectureName: editor.lectureName.trim(),
      lecturerName: editor.lecturerName.trim(),
      lecturerEmail: editor.lecturerEmail.trim() || undefined,
      purpose: editor.purpose.trim(),
      notes: editor.notes.trim() || undefined,
      entryType: editor.entryType,
      active: editor.active,
    };

    if (!payload.lectureName || !payload.lecturerName || !payload.purpose) {
      toast.error("Lecture name, lecturer name, and purpose are required");
      return;
    }

    if (startHour < roomWindow.open.hour || endHour > roomWindow.close.hour) {
      toast.error("Selected time is outside the room operating window");
      return;
    }

    if (roomClosedWeekend && (payload.dayOfWeek === "SATURDAY" || payload.dayOfWeek === "SUNDAY")) {
      toast.error("This room is closed on weekends");
      return;
    }

    setSaving(true);
    try {
      if (editor.id) {
        await facilityService.updateRoomTimetableEntry(editor.id, payload);
        toast.success("Timetable entry updated");
      } else {
        await facilityService.createRoomTimetableEntry(payload);
        toast.success("Timetable entry created");
      }

      closeEditor();
      await refreshTimetable();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save timetable entry");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editor.id) return;
    if (!window.confirm("Delete this timetable entry?")) return;

    setSaving(true);
    try {
      await facilityService.deleteRoomTimetableEntry(editor.id);
      toast.success("Timetable entry deleted");
      closeEditor();
      await refreshTimetable();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete timetable entry");
    } finally {
      setSaving(false);
    }
  };

  if (!roomId) {
    return (
      <div className="glass-card rounded-2xl border border-border p-12 text-center">
        <DoorOpen size={42} className="mx-auto mb-3 text-muted-foreground" />
        <p className="font-semibold text-foreground">No room selected</p>
        <p className="mt-1 text-sm text-muted-foreground">Open a room from Room Availability to view timetable details.</p>
      </div>
    );
  }

  if (loading) {
    return <AdminLoadingState title="Loading Room Timetable" subtitle="Preparing room details and weekly schedule." />;
  }

  if (!room) {
    return (
      <div className="glass-card rounded-2xl border border-border p-12 text-center">
        <p className="font-semibold text-foreground">Room not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <Clock3 className="h-3.5 w-3.5" />
            Room timetable
          </div>
          <h1 className="mt-3 text-2xl font-bold text-foreground">{room.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{room.code} · {building?.name} · {floor?.floorName}</p>
        </div>

        <button
          onClick={onBack}
          className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted/40"
        >
          Back to availability
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Operating window</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{roomWindow.open.hour.toString().padStart(2, "0")}:00 - {roomWindow.close.hour.toString().padStart(2, "0")}:00</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Selected day</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{selectedDay}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Entries</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{selectedDayEntries.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Weekend status</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{roomClosedWeekend ? "Closed on weekends" : "Open on weekends"}</p>
        </div>
      </div>

      {room.imageUrl && (
        <div className="glass-card overflow-hidden rounded-2xl border border-border">
          <div className="h-56 w-full">
            <img src={room.imageUrl} alt={room.name} className="h-full w-full object-cover" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="glass-card rounded-2xl border border-border p-5">
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Building2 size={14} /> {building?.name}</span>
              <span className="flex items-center gap-1.5"><Layers size={14} /> {floor?.floorName}</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={14} /> {room.status}</span>
              <span className="flex items-center gap-1.5"><CalendarClock size={14} /> {room.bookingAvailable ? "Booking enabled" : "Booking disabled"}</span>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">{room.description}</p>
          </div>

          <div className="glass-card rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Weekly timetable</h2>
                <p className="text-sm text-muted-foreground">Monday to Sunday. Weekend tabs are disabled if this room or building is closed.</p>
              </div>
              <button
                onClick={() => openNewEntry(roomWindow.open.hour)}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Add block
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {weekTabs.map((tab) => {
                const isActive = tab.day === selectedDay;
                return (
                  <button
                    key={tab.day}
                    onClick={() => !tab.disabled && setSelectedDay(tab.day)}
                    disabled={tab.disabled}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-left transition",
                      isActive ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-foreground hover:border-primary/40",
                      tab.disabled && "cursor-not-allowed border-dashed bg-muted/40 text-muted-foreground opacity-60",
                    )}
                  >
                    <span className="block text-xs font-semibold uppercase tracking-[0.14em]">{tab.day}</span>
                    <span className="block text-[11px] opacity-80">{tab.disabled ? "Closed" : tab.date}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-muted-foreground">
              {roomClosedWeekend && (selectedDay === "SATURDAY" || selectedDay === "SUNDAY")
                ? "Weekend timetable is disabled for this room."
                : `${selectedDay} schedule for ${room.name}.`}
            </div>

            {loadingTimetable ? (
              <div className="mt-4 rounded-2xl border border-border p-6 text-center text-sm text-muted-foreground">Loading timetable...</div>
            ) : (
              <div className="mt-4 overflow-x-auto rounded-2xl border border-border/60 p-2 sm:p-3">
                <div className="min-w-[640px]">
                  <div
                    className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                    style={{ gridTemplateColumns: `120px repeat(${timelineHours.length}, minmax(0, 1fr))` }}
                  >
                    <div>Time</div>
                    {timelineHours.map((hour) => (
                      <div key={hour} className="text-center">{formatClock(hour)}</div>
                    ))}
                  </div>

                  <div
                    className="mt-3 grid gap-2"
                    style={{ gridTemplateColumns: `120px repeat(${timelineHours.length}, minmax(0, 1fr))` }}
                  >
                    <div className="rounded-2xl border border-border bg-muted/20 p-3 text-sm font-semibold text-foreground">{room.code}</div>

                    {timelineHours.map((hour) => {
                      const slotStart = `${String(hour).padStart(2, "0")}:00`;
                      const slotEnd = `${String(hour + 1).padStart(2, "0")}:00`;
                      const entry = selectedDayEntries.find((candidate) => candidate.startTime < slotEnd && candidate.endTime > slotStart) || null;
                      const isClosed = roomClosedWeekend && (selectedDay === "SATURDAY" || selectedDay === "SUNDAY");
                      const isOutsideWindow = hour < roomWindow.open.hour || hour >= roomWindow.close.hour;

                      return (
                        <button
                          key={hour}
                          onClick={() => (entry ? openEditEntry(entry) : openNewEntry(hour))}
                          disabled={isClosed}
                          className={cn(
                            "group min-h-24 rounded-2xl border p-3 text-left transition-all",
                            entry
                              ? "border-primary/30 bg-primary/5 hover:border-primary/50"
                              : isOutsideWindow
                                ? "border-dashed border-border bg-muted/20 opacity-50"
                                : "border-dashed border-emerald-300 bg-emerald-50/60 hover:border-emerald-500 hover:bg-emerald-50",
                            isClosed && "cursor-not-allowed border-dashed bg-muted/30 opacity-40",
                          )}
                        >
                          {entry ? (
                            <div className="space-y-1.5">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm font-semibold text-foreground">{entry.lectureName}</p>
                                  <p className="text-[11px] text-muted-foreground">{entry.lecturerName}</p>
                                </div>
                                <Edit3 className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                              </div>
                              {entry.substituteRoomName && (
                                <p className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-medium text-amber-700">
                                  Substitute: {entry.substituteRoomName}
                                </p>
                              )}
                              <p className="text-[11px] text-muted-foreground">
                                {entry.startTime.slice(0, 5)} - {entry.endTime.slice(0, 5)}
                              </p>
                            </div>
                          ) : isClosed ? (
                            <div className="text-xs text-muted-foreground">Closed</div>
                          ) : isOutsideWindow ? (
                            <div className="text-xs text-muted-foreground">Closed</div>
                          ) : (
                            <div className="flex h-full flex-col justify-between">
                              <span className="text-sm font-medium text-emerald-700">Open</span>
                              <span className="text-xs text-muted-foreground">{slotStart} - {slotEnd}</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card rounded-2xl border border-border p-5">
            <h2 className="text-lg font-semibold text-foreground">Room snapshot</h2>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p className="flex items-center gap-2"><DoorOpen className="h-4 w-4" /> {room.code} · {room.type}</p>
              <p className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Created by {creatorName || room.createdBy?.email || "system"}</p>
              <p className="flex items-center gap-2"><CalendarClock className="h-4 w-4" /> {room.openingTime || "08:00"} - {room.closingTime || "18:00"}</p>
              <p className="flex items-center gap-2"><Wrench className="h-4 w-4" /> {room.maintenanceStatus}</p>
            </div>
          </div>

          <div className="glass-card rounded-2xl border border-border p-5">
            <h2 className="text-lg font-semibold text-foreground">Maintenance history</h2>
            <div className="mt-4 space-y-2">
              {room.maintenanceHistory.map((entry) => (
                <div key={entry} className="rounded-xl border border-border p-3 text-sm text-foreground flex items-center gap-2">
                  <Wrench size={14} className="text-muted-foreground" />
                  {entry}
                </div>
              ))}
              {room.maintenanceHistory.length === 0 && (
                <p className="text-sm text-muted-foreground">No maintenance records available.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showEditor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 px-3 py-0 sm:items-center sm:px-4 sm:py-6"
          >
            <motion.div
              initial={{ y: 24, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 24, opacity: 0, scale: 0.98 }}
              className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-border bg-card p-5 shadow-2xl sm:rounded-3xl sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Timetable entry</p>
                  <h3 className="mt-1 text-xl font-bold text-foreground">{editor.id ? "Edit schedule block" : "Add schedule block"}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">One block can cover one to four hours. Weekend blocks are disabled when the room is closed.</p>
                </div>
                <button onClick={closeEditor} className="rounded-full border border-border p-2 text-muted-foreground transition hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-foreground">Lecture name</label>
                  <input
                    value={editor.lectureName}
                    onChange={(event) => setEditor((prev) => ({ ...prev, lectureName: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary"
                    placeholder="Lecture, class, or meeting"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Lecturer name</label>
                  <input
                    value={editor.lecturerName}
                    onChange={(event) => setEditor((prev) => ({ ...prev, lecturerName: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary"
                    placeholder="Staff member name"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Lecturer email</label>
                  <input
                    type="email"
                    value={editor.lecturerEmail}
                    onChange={(event) => setEditor((prev) => ({ ...prev, lecturerEmail: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary"
                    placeholder="optional@email.edu"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Purpose</label>
                  <input
                    value={editor.purpose}
                    onChange={(event) => setEditor((prev) => ({ ...prev, purpose: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary"
                    placeholder="Teaching, work session, meeting..."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Day</label>
                  <select
                    value={editor.dayOfWeek}
                    onChange={(event) => setEditor((prev) => ({ ...prev, dayOfWeek: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary"
                  >
                    {dayOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Entry type</label>
                  <select
                    value={editor.entryType}
                    onChange={(event) => setEditor((prev) => ({ ...prev, entryType: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary"
                  >
                    {entryTypeOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Start time</label>
                  <input
                    type="time"
                    step={3600}
                    value={editor.startTime}
                    onChange={(event) => setEditor((prev) => ({ ...prev, startTime: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Duration</label>
                  <select
                    value={editor.durationHours}
                    onChange={(event) => setEditor((prev) => ({ ...prev, durationHours: Number(event.target.value) }))}
                    className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary"
                  >
                    {durationOptions.map((option) => (
                      <option key={option} value={option}>{option} hour{option > 1 ? "s" : ""}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Status</label>
                  <select
                    value={editor.active ? "active" : "inactive"}
                    onChange={(event) => setEditor((prev) => ({ ...prev, active: event.target.value === "active" }))}
                    className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-foreground">Notes</label>
                  <textarea
                    value={editor.notes}
                    onChange={(event) => setEditor((prev) => ({ ...prev, notes: event.target.value }))}
                    rows={4}
                    className="mt-2 w-full rounded-2xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary"
                    placeholder="Add swap instructions, room remarks, or extra context."
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                {editor.id && (
                  <button
                    onClick={handleDelete}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-destructive/30 px-4 py-2.5 text-sm font-semibold text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                )}
                <button
                  onClick={closeEditor}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted/40"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : editor.id ? "Update block" : "Create block"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export { RoomDetailsPage };
