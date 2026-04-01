import { useState } from "react";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { BookingRequest, BookingType } from "@/types/booking";
import bookingService from "@/services/bookingService";

interface BookingFormProps {
  roomId: string;
  roomName: string;
  userRole: "STUDENT" | "ACADEMIC_STAFF" | "NON_ACADEMIC_STAFF" | "ADMIN";
  onBookingSubmitted?: (bookingId: string) => void;
}

/**
 * BookingForm Component
 * Form for creating room bookings with validation
 */
export const BookingForm = ({
  roomId,
  roomName,
  userRole,
  onBookingSubmitted,
}: BookingFormProps) => {
  const [formData, setFormData] = useState<Partial<BookingRequest>>({
    roomId,
    bookingType: userRole === "STUDENT" ? "STUDENT" : "STAFF",
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    purpose: "",
    participantsCount: 1,
    seatsBooked: userRole === "STUDENT" ? 1 : undefined,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showConflictWarning, setShowConflictWarning] = useState(false);
  const [requiresOverride, setRequiresOverride] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "number" ? parseInt(value) || undefined : type === "checkbox" ? false : value,
    }));
    setError(null);
  };

  const handleDateChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!formData.purpose || formData.purpose.trim() === "") {
      errors.push("Please specify the purpose of booking");
    }

    if (!formData.startTime || !formData.endTime) {
      errors.push("Start and end times are required");
    }

    if (
      formData.startTime &&
      formData.endTime &&
      new Date(formData.startTime) >= new Date(formData.endTime)
    ) {
      errors.push("End time must be after start time");
    }

    // Duration limits based on role
    if (formData.startTime && formData.endTime) {
      const durationMs =
        new Date(formData.endTime).getTime() - new Date(formData.startTime).getTime();
      const durationHours = durationMs / (1000 * 60 * 60);

      if (userRole === "STUDENT" && durationHours > 2) {
        errors.push("Students can only book up to 2 hours");
      }

      if (
        (userRole === "ACADEMIC_STAFF" || userRole === "NON_ACADEMIC_STAFF") &&
        durationHours > 8
      ) {
        errors.push("Staff can only book up to 8 hours");
      }

      if (durationMs < 30 * 60 * 1000) {
        errors.push("Minimum booking duration is 30 minutes");
      }
    }

    if (userRole === "STUDENT" && formData.seatsBooked !== 1) {
      errors.push("Students can only book 1 seat");
    }

    return errors;
  };

  const checkConflicts = async () => {
    if (!formData.roomId || !formData.startTime || !formData.endTime) return;

    try {
      const report = await bookingService.detectConflicts(
        formData.roomId,
        formData.startTime,
        formData.endTime
      );

      if (report.hasConflicts) {
        setShowConflictWarning(true);
        setRequiresOverride(report.timetableCount > 0);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error checking conflicts:", err);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join("; "));
      return;
    }

    // Check conflicts
    const hasConflicts = await checkConflicts();

    // Proceed with booking if no conflicts or user confirms
    if (!showConflictWarning || requiresOverride === false) {
      setLoading(true);
      try {
        const response = await bookingService.createBooking(
          formData as BookingRequest
        );

        if (response.bookingId) {
          setSuccess(
            requiresOverride
              ? `Booking request submitted and is pending approval due to conflicts.`
              : `Booking confirmed successfully!`
          );
          setFormData({
            roomId,
            bookingType: userRole === "STUDENT" ? "STUDENT" : "STAFF",
            purpose: "",
            participantsCount: 1,
            seatsBooked: userRole === "STUDENT" ? 1 : undefined,
          });
          setShowConflictWarning(false);

          if (onBookingSubmitted) {
            setTimeout(() => {
              onBookingSubmitted(response.bookingId);
            }, 2000);
          }
        } else {
          setError("Booking creation failed");
        }
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to create booking");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Book {roomName}</h3>
        <p className="text-sm text-muted-foreground">
          Room ID: {roomId} • Booking Type:{" "}
          <span className="font-medium">
            {formData.bookingType === "STUDENT" ? "Student" : "Staff"}
          </span>
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700 dark:text-red-400">{error}</div>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-emerald-700 dark:text-emerald-400">{success}</div>
        </div>
      )}

      {showConflictWarning && (
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <div className="text-sm font-medium text-amber-900 dark:text-amber-400 mb-2">
            ⚠️ Conflicts Detected
          </div>
          <p className="text-sm text-amber-800 dark:text-amber-300 mb-3">
            The selected time slot has conflicts. Your booking will require admin approval.
          </p>
          {requiresOverride && (
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Note: This timeslot is occupied by a timetable entry. The lecturer will be notified.
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Purpose */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Purpose of Booking <span className="text-red-500">*</span>
          </label>
          <textarea
            name="purpose"
            value={formData.purpose || ""}
            onChange={handleChange}
            placeholder="e.g., Group study, Meeting, Lecture, etc."
            rows={3}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Start Date & Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={
                formData.startTime
                  ? new Date(formData.startTime)
                      .toISOString()
                      .slice(0, 16)
                  : ""
              }
              onChange={(e) => handleDateChange("startTime", e.target.value + ":00")}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              End Date & Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={
                formData.endTime
                  ? new Date(formData.endTime)
                      .toISOString()
                      .slice(0, 16)
                  : ""
              }
              onChange={(e) => handleDateChange("endTime", e.target.value + ":00")}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Participants Count */}
        <div>
          <label className="block text-sm font-medium mb-2">Number of Participants</label>
          <input
            type="number"
            name="participantsCount"
            value={formData.participantsCount || 1}
            onChange={handleChange}
            min="1"
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Recurring (Staff only) */}
        {userRole !== "STUDENT" && (
          <div>
            <label className="block text-sm font-medium mb-2">Recurring Booking</label>
            <select
              name="recurringPattern"
              value={formData.recurringPattern || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">No (One-time)</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Booking"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setFormData({ roomId, bookingType: userRole === "STUDENT" ? "STUDENT" : "STAFF", purpose: "" })}
          >
            Reset
          </Button>
        </div>
      </form>

      {/* Info Message */}
      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-700 dark:text-blue-400">
          <strong>Info:</strong> Your booking will be confirmed immediately if there are no conflicts. 
          If conflicts exist, admin approval is required.
        </p>
      </div>
    </Card>
  );
};

export default BookingForm;
