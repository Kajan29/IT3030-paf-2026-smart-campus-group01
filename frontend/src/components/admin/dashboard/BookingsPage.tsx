import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  RefreshCw,
  Search,
  XCircle,
  Ban,
  ListChecks,
  UserCheck,
  Users,
  Building2,
} from "lucide-react";
import bookingService from "@/services/bookingService";
import { adminUserService, type UserResponse } from "@/services/admin/adminUserService";
import facilityService from "@/services/facilityService";
import type { Room } from "@/types/campusManagement";

type AdminBooking = {
  id: number;
  status: string;
  bookingType?: string;
  purpose?: string;
  startTime?: string;
  endTime?: string;
  seatsBooked?: number;
  attended?: boolean;
  attendedAt?: string;
  checkInOtp?: string;
  createdAt?: string;
  room?: {
    code?: string;
    name?: string;
    seatingCapacity?: number;
  };
  booker?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    username?: string;
  };
  assignedStaff?: {
    id?: number;
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null;
};

type TabType = "pending" | "all";

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const getBookerName = (booking: AdminBooking) => {
  const first = booking.booker?.firstName || "";
  const last = booking.booker?.lastName || "";
  const full = `${first} ${last}`.trim();
  return full || booking.booker?.username || booking.booker?.email || "Unknown user";
};

const statusClassMap: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  CONFIRMED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-800",
  CANCELLED: "bg-slate-200 text-slate-800",
  COMPLETED: "bg-blue-100 text-blue-800",
  ATTENDED: "bg-teal-100 text-teal-800",
  NO_SHOW: "bg-orange-100 text-orange-800",
};

const canCancelByAdmin = (status?: string) => {
  if (!status) return false;
  return ["PENDING", "APPROVED", "CONFIRMED"].includes(status);
};

// Same filters as student booking page — rooms eligible for student bookings
const STUDY_ROOM_TYPE_KEYWORDS = [
  "study", "library", "discussion", "tutorial",
  "research", "common", "seminar", "computer lab",
];

const isStudentEligibleRoom = (room: Room) => {
  const type = (room.type || "").trim().toLowerCase();
  const code = (room.code || "").trim().toLowerCase();
  const isStudyArea =
    STUDY_ROOM_TYPE_KEYWORDS.some((kw) => type.includes(kw)) || code.startsWith("sr-");
  const status = (room.status || "").trim().toLowerCase();
  const statusOk = ["available", "open"].includes(status);
  const maintenanceOk = (room.maintenanceStatus || "").trim().toLowerCase() === "operational";
  const conditionOk = ["excellent", "good"].includes((room.condition || "").trim().toLowerCase());
  return isStudyArea && statusOk && room.bookingAvailable !== false && maintenanceOk && conditionOk;
};

export const BookingsPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [pendingBookings, setPendingBookings] = useState<AdminBooking[]>([]);
  const [allBookings, setAllBookings] = useState<AdminBooking[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionBookingId, setActionBookingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [nonAcademicStaff, setNonAcademicStaff] = useState<UserResponse[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [assignModalRoom, setAssignModalRoom] = useState<Room | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);

  const loadPendingBookings = async () => {
    setLoadingPending(true);
    try {
      const response = await bookingService.getPendingBookings();
      const items = Array.isArray(response)
        ? response
        : Array.isArray(response?.content)
        ? response.content
        : [];
      setPendingBookings(items as AdminBooking[]);
    } catch (err: any) {
      throw new Error(
        err?.response?.data?.details?.[0] ||
          err?.response?.data?.message ||
          "Failed to load pending bookings."
      );
    } finally {
      setLoadingPending(false);
    }
  };

  const loadAllBookings = async () => {
    setLoadingAll(true);
    try {
      const response = await bookingService.getAllBookings();
      const items = Array.isArray(response)
        ? response
        : Array.isArray(response?.content)
        ? response.content
        : [];
      setAllBookings(items as AdminBooking[]);
    } catch (err: any) {
      throw new Error(
        err?.response?.data?.details?.[0] ||
          err?.response?.data?.message ||
          "Failed to load all bookings."
      );
    } finally {
      setLoadingAll(false);
    }
  };

  const refreshAllData = async () => {
    setError(null);
    try {
      await Promise.all([loadPendingBookings(), loadAllBookings()]);
      // Also load non-academic staff and rooms for assignment
      try {
        const staffResp = await adminUserService.getUsersByRole("NON_ACADEMIC_STAFF");
        const staffList = (staffResp as any)?.data?.data || (staffResp as any)?.data || [];
        setNonAcademicStaff(Array.isArray(staffList) ? staffList : []);
      } catch {
        // Not critical, ignore
      }
      try {
        const roomsList = await facilityService.getRooms();
        setRooms(roomsList.filter(isStudentEligibleRoom));
      } catch {
        // Not critical, ignore
      }
    } catch (err: any) {
      setError(err?.message || "Failed to refresh bookings.");
    }
  };

  useEffect(() => {
    void refreshAllData();
  }, []);

  const matchesSearch = (booking: AdminBooking, term: string) => {
    const normalizedSearch = term.trim().toLowerCase();
    if (!normalizedSearch) return true;

    const roomCode = booking.room?.code || "";
    const roomName = booking.room?.name || "";
    const userName = getBookerName(booking);
    const purpose = booking.purpose || "";
    const status = booking.status || "";

    return [roomCode, roomName, userName, purpose, status]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch);
  };

  const filteredPending = useMemo(
    () => pendingBookings.filter((booking) => matchesSearch(booking, searchTerm)),
    [pendingBookings, searchTerm]
  );

  const filteredAllBookings = useMemo(() => {
    return allBookings.filter((booking) => {
      const statusPass = statusFilter === "ALL" ? true : booking.status === statusFilter;
      return statusPass && matchesSearch(booking, searchTerm);
    });
  }, [allBookings, searchTerm, statusFilter]);

  const handleApprove = async (bookingId: number) => {
    const notes = window.prompt("Optional approval note:", "Approved by admin") || "";
    setActionBookingId(bookingId);
    setError(null);
    setSuccess(null);

    try {
      await bookingService.approveBooking(String(bookingId), notes);
      setSuccess(`Booking #${bookingId} approved and status updated.`);
      await refreshAllData();
      setActiveTab("all");
      setStatusFilter("APPROVED");
    } catch (err: any) {
      setError(
        err?.response?.data?.details?.[0] ||
          err?.response?.data?.message ||
          "Failed to approve booking."
      );
    } finally {
      setActionBookingId(null);
    }
  };

  const handleReject = async (bookingId: number) => {
    const reason = window.prompt("Enter rejection reason:", "Rejected by admin") || "";
    if (!reason.trim()) return;

    setActionBookingId(bookingId);
    setError(null);
    setSuccess(null);

    try {
      await bookingService.rejectBooking(String(bookingId), reason.trim());
      setSuccess(`Booking #${bookingId} rejected and status updated.`);
      await refreshAllData();
      setActiveTab("all");
      setStatusFilter("REJECTED");
    } catch (err: any) {
      setError(
        err?.response?.data?.details?.[0] ||
          err?.response?.data?.message ||
          "Failed to reject booking."
      );
    } finally {
      setActionBookingId(null);
    }
  };

  const handleCancel = async (bookingId: number) => {
    const reason = window.prompt("Cancellation reason:", "Cancelled by admin") || "";
    if (!reason.trim()) return;

    setActionBookingId(bookingId);
    setError(null);
    setSuccess(null);

    try {
      await bookingService.cancelBooking(String(bookingId), reason.trim());
      setSuccess(`Booking #${bookingId} cancelled and status updated.`);
      await refreshAllData();
      setActiveTab("all");
      setStatusFilter("CANCELLED");
    } catch (err: any) {
      setError(
        err?.response?.data?.details?.[0] ||
          err?.response?.data?.message ||
          "Failed to cancel booking."
      );
    } finally {
      setActionBookingId(null);
    }
  };

  const handleAssignStaffToRoom = async () => {
    if (!assignModalRoom) return;
    setActionBookingId(-1);
    setError(null);
    setSuccess(null);

    try {
      await facilityService.assignStaffToRoom(assignModalRoom.id, selectedStaffId);
      setSuccess(
        selectedStaffId
          ? `Staff permanently assigned to room ${assignModalRoom.code}.`
          : `Staff unassigned from room ${assignModalRoom.code}.`
      );
      setAssignModalRoom(null);
      setSelectedStaffId(null);
      await refreshAllData();
    } catch (err: any) {
      setError(
        err?.response?.data?.details?.[0] ||
          err?.response?.data?.message ||
          "Failed to assign staff to room."
      );
    } finally {
      setActionBookingId(null);
    }
  };

  const renderBookingCard = (booking: AdminBooking) => {
    const status = booking.status || "PENDING";
    const statusClass = statusClassMap[status] || "bg-gray-100 text-gray-700";
    const isActioning = actionBookingId === booking.id;

    return (
      <div key={booking.id} className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-semibold text-gray-900">{booking.room?.code || "Room"}</span>
              <span className="text-gray-500">{booking.room?.name || "Unknown room"}</span>
              <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass}`}>{status}</span>
            </div>

            <p className="text-sm text-gray-700">
              <span className="font-medium">Student:</span> {getBookerName(booking)}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Start:</span> {formatDateTime(booking.startTime)}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">End:</span> {formatDateTime(booking.endTime)}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Purpose:</span> {booking.purpose || "-"}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Requested at:</span> {formatDateTime(booking.createdAt)}
            </p>
            {booking.seatsBooked && (
              <p className="text-sm text-gray-700">
                <span className="font-medium">Seats booked:</span> {booking.seatsBooked}
              </p>
            )}
            {booking.assignedStaff && (
              <p className="text-sm text-gray-700">
                <span className="font-medium">Assigned Staff:</span>{" "}
                {booking.assignedStaff.firstName} {booking.assignedStaff.lastName} ({booking.assignedStaff.email})
              </p>
            )}
            {booking.attended && (
              <p className="text-sm text-teal-700">
                <span className="font-medium">Attended:</span> Yes {booking.attendedAt ? `at ${formatDateTime(booking.attendedAt)}` : ""}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {status === "PENDING" && (
              <>
                <button
                  onClick={() => void handleApprove(booking.id)}
                  disabled={isActioning}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  <CheckCircle2 size={16} />
                  {isActioning ? "Saving..." : "Approve"}
                </button>

                <button
                  onClick={() => void handleReject(booking.id)}
                  disabled={isActioning}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                >
                  <XCircle size={16} />
                  {isActioning ? "Saving..." : "Reject"}
                </button>
              </>
            )}

            {/* Assign Staff button for approved bookings */}
            {(status === "APPROVED" || status === "CONFIRMED") && !booking.assignedStaff && (
              <span className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 border border-amber-200">
                <Users size={14} />
                No staff assigned to room
              </span>
            )}

            {canCancelByAdmin(status) && (
              <button
                onClick={() => void handleCancel(booking.id)}
                disabled={isActioning}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              >
                <Ban size={16} />
                {isActioning ? "Saving..." : "Cancel"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const currentList = activeTab === "pending" ? filteredPending : filteredAllBookings;
  const isCurrentLoading = activeTab === "pending" ? loadingPending : loadingAll;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Booking Management</h1>
          <p className="mt-1 text-gray-600">
            Approve bookings, manage status, and track all booking records from one page.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <div className="relative min-w-[280px]">
            <Search size={16} className="pointer-events-none absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search room, student, purpose, status..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button
            onClick={() => void refreshAllData()}
            disabled={loadingPending || loadingAll}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw size={16} className={loadingPending || loadingAll ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>}
      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">All bookings</p>
          <p className="text-2xl font-bold text-slate-800">{allBookings.length}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Pending queue</p>
          <p className="text-2xl font-bold text-amber-700">{pendingBookings.length}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Approved</p>
          <p className="text-2xl font-bold text-emerald-700">
            {allBookings.filter((booking) => booking.status === "APPROVED").length}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Attended</p>
          <p className="text-2xl font-bold text-teal-700">
            {allBookings.filter((booking) => booking.status === "ATTENDED").length}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">No-Shows</p>
          <p className="text-2xl font-bold text-orange-700">
            {allBookings.filter((booking) => booking.status === "NO_SHOW").length}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Rejected</p>
          <p className="text-2xl font-bold text-red-700">
            {allBookings.filter((booking) => booking.status === "REJECTED").length}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("pending")}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                activeTab === "pending"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Clock3 size={15} />
              Pending Queue
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                activeTab === "all"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <ListChecks size={15} />
              All Bookings
            </button>
          </div>

          {activeTab === "all" && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="ATTENDED">ATTENDED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="NO_SHOW">NO_SHOW</option>
            </select>
          )}
        </div>

        {isCurrentLoading ? (
          <div className="p-6 text-center text-gray-500">Loading bookings...</div>
        ) : currentList.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            <Clock3 className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p>{activeTab === "pending" ? "No pending bookings to review." : "No bookings found."}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">{currentList.map((booking) => renderBookingCard(booking))}</div>
        )}
      </div>

      {/* Room Staff Assignment Section */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Building2 size={18} />
            Room Staff Assignment
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Permanently assign non-academic staff to rooms. Assigned staff will automatically manage all bookings for that room.
          </p>
        </div>
        <div className="divide-y divide-gray-100">
          {rooms.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No bookable rooms found.</div>
          ) : (
            rooms.map((room) => (
              <div key={room.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="font-semibold text-gray-900">{room.code}</span>
                  <span className="ml-2 text-gray-500">{room.name}</span>
                  {room.assignedStaffName ? (
                    <span className="ml-3 inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                      <UserCheck size={12} />
                      {room.assignedStaffName}
                    </span>
                  ) : (
                    <span className="ml-3 inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                      No staff assigned
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setAssignModalRoom(room);
                    setSelectedStaffId(
                      room.assignedStaffId ? Number(room.assignedStaffId) : null
                    );
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
                >
                  <Users size={14} />
                  {room.assignedStaffName ? "Change Staff" : "Assign Staff"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Assign Staff to Room Modal */}
      {assignModalRoom !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users size={20} />
              Assign Staff to Room
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Permanently assign a non-academic staff member to manage all bookings for room{" "}
              <strong>{assignModalRoom.code} — {assignModalRoom.name}</strong>.
            </p>

            {nonAcademicStaff.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No non-academic staff found.</p>
            ) : (
              <select
                value={selectedStaffId ?? ""}
                onChange={(e) => setSelectedStaffId(e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mb-4 focus:border-blue-500 focus:outline-none"
              >
                <option value="">-- No Staff (Unassign) --</option>
                {nonAcademicStaff.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.firstName} {staff.lastName} ({staff.email})
                  </option>
                ))}
              </select>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setAssignModalRoom(null);
                  setSelectedStaffId(null);
                }}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleAssignStaffToRoom()}
                disabled={actionBookingId === -1}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {actionBookingId === -1 ? "Saving..." : "Save Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
