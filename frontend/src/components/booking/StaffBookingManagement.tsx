import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  RefreshCw,
  Search,
  KeyRound,
  UserCheck,
  CalendarDays,
  MapPin,
  Users,
  Eye,
  AlertTriangle,
} from "lucide-react";
import bookingService from "@/services/bookingService";

type StaffBooking = {
  id: number;
  status: string;
  purpose?: string;
  startTime?: string;
  endTime?: string;
  seatsBooked?: number;
  attended?: boolean;
  attendedAt?: string;
  room?: {
    code?: string;
    name?: string;
    seatingCapacity?: number;
  };
  booker?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
};

type VerifiedBookingDetails = {
  bookingId: number;
  studentName: string;
  studentEmail: string;
  roomName: string;
  roomCode: string;
  startTime: string;
  endTime: string;
  purpose: string;
  seatsBooked: number;
  status: string;
  attended: boolean;
} | null;

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const formatTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const statusClassMap: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  CONFIRMED: "bg-emerald-100 text-emerald-800",
  ATTENDED: "bg-teal-100 text-teal-800",
  COMPLETED: "bg-blue-100 text-blue-800",
  NO_SHOW: "bg-orange-100 text-orange-800",
};

export const StaffBookingManagement = () => {
  const [todayBookings, setTodayBookings] = useState<StaffBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // OTP verification state
  const [otpModalBookingId, setOtpModalBookingId] = useState<number | null>(null);
  const [otpInput, setOtpInput] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifiedDetails, setVerifiedDetails] = useState<VerifiedBookingDetails>(null);
  const [markingAttended, setMarkingAttended] = useState(false);
  const [markingNoShowId, setMarkingNoShowId] = useState<number | null>(null);

  const loadBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await bookingService.getStaffTodayBookings();
      const items = Array.isArray(response) ? response : [];
      setTodayBookings(items as StaffBooking[]);
    } catch (err: any) {
      setError(
        err?.response?.data?.details?.[0] ||
          err?.response?.data?.message ||
          "Failed to load today's bookings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBookings();
  }, []);

  const filteredBookings = todayBookings.filter((booking) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const name = `${booking.booker?.firstName || ""} ${booking.booker?.lastName || ""}`.toLowerCase();
    const room = `${booking.room?.code || ""} ${booking.room?.name || ""}`.toLowerCase();
    return name.includes(term) || room.includes(term);
  });

  const handleVerifyOtp = async () => {
    if (!otpModalBookingId || !otpInput.trim()) return;
    setVerifying(true);
    setError(null);

    try {
      const details = await bookingService.verifyBookingOtp(String(otpModalBookingId), otpInput.trim().toUpperCase());
      setVerifiedDetails(details as VerifiedBookingDetails);
    } catch (err: any) {
      setError(
        err?.response?.data?.details?.[0] ||
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Invalid OTP. Please try again."
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleMarkAttended = async () => {
    if (!verifiedDetails) return;
    setMarkingAttended(true);
    setError(null);

    try {
      await bookingService.markBookingAttended(String(verifiedDetails.bookingId));
      setSuccess(`Booking #${verifiedDetails.bookingId} marked as attended.`);
      setOtpModalBookingId(null);
      setOtpInput("");
      setVerifiedDetails(null);
      await loadBookings();
    } catch (err: any) {
      setError(
        err?.response?.data?.details?.[0] ||
          err?.response?.data?.message ||
          "Failed to mark attendance."
      );
    } finally {
      setMarkingAttended(false);
    }
  };

  const closeOtpModal = () => {
    setOtpModalBookingId(null);
    setOtpInput("");
    setVerifiedDetails(null);
  };

  const handleMarkNoShow = async (bookingId: number) => {
    if (!window.confirm("Are you sure you want to mark this booking as No-Show? This will notify the admin.")) return;
    setMarkingNoShowId(bookingId);
    setError(null);
    setSuccess(null);

    try {
      await bookingService.markBookingNoShow(String(bookingId));
      setSuccess(`Booking #${bookingId} marked as no-show. Admins have been notified.`);
      await loadBookings();
    } catch (err: any) {
      setError(
        err?.response?.data?.details?.[0] ||
          err?.response?.data?.message ||
          "Failed to mark booking as no-show."
      );
    } finally {
      setMarkingNoShowId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            Manage Bookings
          </h2>
          <p className="mt-1 text-gray-600">
            Today's assigned bookings. Verify student OTP and manage attendance.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <div className="relative min-w-[240px]">
            <Search size={16} className="pointer-events-none absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search student or room..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button
            onClick={() => void loadBookings()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>}
      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">{success}</div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Total Today</p>
          <p className="text-2xl font-bold text-slate-800">{todayBookings.length}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Awaiting Check-in</p>
          <p className="text-2xl font-bold text-emerald-700">
            {todayBookings.filter((b) => (b.status === "APPROVED" || b.status === "CONFIRMED") && !b.attended).length}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Attended</p>
          <p className="text-2xl font-bold text-teal-700">
            {todayBookings.filter((b) => b.attended || b.status === "ATTENDED").length}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">No Show</p>
          <p className="text-2xl font-bold text-orange-700">
            {todayBookings.filter((b) => b.status === "NO_SHOW").length}
          </p>
        </div>
      </div>

      {/* Bookings List */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Clock3 size={18} />
            Today's Bookings
          </h3>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading bookings...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            <CalendarDays className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p>No bookings assigned to you for today.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredBookings.map((booking) => {
              const status = booking.status || "APPROVED";
              const statusClass = statusClassMap[status] || "bg-gray-100 text-gray-700";
              const isAttended = booking.attended || status === "ATTENDED";
              const canVerify = (status === "APPROVED" || status === "CONFIRMED") && !isAttended;

              return (
                <div key={booking.id} className="p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <MapPin size={16} className="text-gray-400" />
                        <span className="text-lg font-semibold text-gray-900">
                          {booking.room?.code || "Room"}
                        </span>
                        <span className="text-gray-500">{booking.room?.name || ""}</span>
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass}`}>
                          {status}
                        </span>
                        {isAttended && (
                          <span className="rounded-full px-2 py-1 text-xs font-semibold bg-teal-100 text-teal-800 flex items-center gap-1">
                            <CheckCircle2 size={12} /> Attended
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm text-gray-700">
                        <p>
                          <span className="font-medium">Student:</span>{" "}
                          {booking.booker?.firstName} {booking.booker?.lastName}
                        </p>
                        <p>
                          <span className="font-medium">Email:</span> {booking.booker?.email}
                        </p>
                        <p>
                          <span className="font-medium">Time:</span>{" "}
                          {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                        </p>
                        <p>
                          <span className="font-medium">Seats:</span>{" "}
                          {booking.seatsBooked || 1}
                          {booking.room?.seatingCapacity ? ` / ${booking.room.seatingCapacity}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {canVerify && (
                        <>
                          <button
                            onClick={() => {
                              setOtpModalBookingId(booking.id);
                              setOtpInput("");
                              setVerifiedDetails(null);
                              setError(null);
                            }}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
                          >
                            <KeyRound size={16} />
                            Verify OTP
                          </button>
                          <button
                            onClick={() => void handleMarkNoShow(booking.id)}
                            disabled={markingNoShowId === booking.id}
                            className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60"
                          >
                            <AlertTriangle size={16} />
                            {markingNoShowId === booking.id ? "Marking..." : "No-Show"}
                          </button>
                        </>
                      )}
                      {isAttended && (
                        <span className="inline-flex items-center gap-2 rounded-lg bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700 border border-teal-200">
                          <UserCheck size={16} />
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* OTP Verification Modal */}
      {otpModalBookingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            {!verifiedDetails ? (
              <>
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <KeyRound size={20} className="text-primary" />
                  Enter Student OTP
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Ask the student for their 4-digit check-in OTP code (sent to their email).
                </p>

                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.toUpperCase().slice(0, 4))}
                    maxLength={4}
                    placeholder="Enter OTP"
                    className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-3 text-center text-2xl font-mono font-bold tracking-[0.3em] uppercase focus:border-primary focus:outline-none"
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 mb-4">
                    {error}
                  </div>
                )}

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={closeOtpModal}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => void handleVerifyOtp()}
                    disabled={otpInput.length < 4 || verifying}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
                  >
                    {verifying ? "Verifying..." : "Verify OTP"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Eye size={20} className="text-emerald-600" />
                  Booking Details — OTP Verified
                </h3>

                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 mb-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wide">Student</p>
                      <p className="font-semibold text-gray-900">{verifiedDetails.studentName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wide">Email</p>
                      <p className="font-semibold text-gray-900">{verifiedDetails.studentEmail}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wide">Room</p>
                      <p className="font-semibold text-gray-900">
                        {verifiedDetails.roomCode} — {verifiedDetails.roomName}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wide">Seats Booked</p>
                      <p className="font-semibold text-gray-900">{verifiedDetails.seatsBooked}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wide">Start Time</p>
                      <p className="font-semibold text-gray-900">{formatDateTime(verifiedDetails.startTime)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wide">End Time</p>
                      <p className="font-semibold text-gray-900">{formatDateTime(verifiedDetails.endTime)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500 text-xs uppercase tracking-wide">Purpose</p>
                      <p className="font-semibold text-gray-900">{verifiedDetails.purpose || "-"}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={closeOtpModal}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                  {!verifiedDetails.attended && (
                    <button
                      onClick={() => void handleMarkAttended()}
                      disabled={markingAttended}
                      className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60 flex items-center gap-2"
                    >
                      <CheckCircle2 size={16} />
                      {markingAttended ? "Marking..." : "Mark as Attended"}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
