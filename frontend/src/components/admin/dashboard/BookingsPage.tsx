import React, { useState, useEffect } from 'react';
import {
  CheckCircle, XCircle, Clock, User, Calendar, MapPin, AlertCircle, Plus,
  Trash2, Filter, Search, X, BookOpen, Users, TrendingUp
} from 'lucide-react';

interface Booking {
  id: number;
  roomCode: string;
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
  bookingType: string;
  status: string;
  purpose?: string;
  seatsBooked?: number;
  createdAt: string;
}

interface AvailableSlot {
  time: string;
  available: boolean;
  capacity: number;
}

export const BookingsPage = () => {
  const [userRole, setUserRole] = useState('STUDENT');
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('myBookings');
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Booking form state
  const [formData, setFormData] = useState({
    roomCode: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    purpose: '',
    seatsBooked: 1,
    recurringDays: 0,
  });

  useEffect(() => {
    loadUserRole();
    loadMyBookings();
  }, []);

  const loadUserRole = async () => {
    try {
      const response = await fetch('/api/users/me', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUserRole(data.role);
      }
    } catch (err) {
      console.error('Failed to load user role');
    }
  };

  const loadMyBookings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/bookings/my-bookings', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        let bookings = Array.isArray(data) ? data : data.content || [];

        // Filter by status
        if (filterStatus !== 'ALL') {
          bookings = bookings.filter((b: Booking) => b.status === filterStatus);
        }

        // Filter by search term
        if (searchTerm) {
          bookings = bookings.filter((b: Booking) =>
            b.roomCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.roomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }

        setMyBookings(bookings);
      }
    } catch (err: any) {
      setError('Failed to load bookings: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBooking = async () => {
    if (!formData.roomCode || !formData.date || !formData.startTime || !formData.endTime) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        roomCode: formData.roomCode,
        bookingDate: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        purpose: formData.purpose,
        bookingType: userRole === 'STUDENT' ? 'STUDENT' : 'STAFF',
        seatsBooked: userRole === 'STUDENT' ? 1 : undefined,
        recurringDays: userRole === 'ACADEMIC_STAFF' ? formData.recurringDays : 0,
      };

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setSuccess('Booking created successfully!');
        setShowBookingForm(false);
        setFormData({
          roomCode: '',
          date: new Date().toISOString().split('T')[0],
          startTime: '09:00',
          endTime: '10:00',
          purpose: '',
          seatsBooked: 1,
          recurringDays: 0,
        });
        loadMyBookings();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create booking');
      }
    } catch (err: any) {
      setError('Error creating booking: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      setLoading(true);
      await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setSuccess('Booking cancelled successfully');
      loadMyBookings();
    } catch (err: any) {
      setError('Failed to cancel booking: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircle size={14} />;
      case 'PENDING':
        return <Clock size={14} />;
      case 'REJECTED':
        return <XCircle size={14} />;
      default:
        return <AlertCircle size={14} />;
    }
  };

  const isStudent = userRole === 'STUDENT';
  const isStaff = userRole === 'ACADEMIC_STAFF' || userRole === 'NON_ACADEMIC_STAFF';

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Room Bookings</h1>
          <p className="text-gray-600 mt-1">
            {isStudent ? '👨‍🎓 Student Seat Bookings' : '👩‍🏫 Staff Room Bookings'}
          </p>
        </div>
        <button
          onClick={() => setShowBookingForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={18} />
          New Booking
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle size={20} className="text-red-600" />
          <span className="text-red-800 flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            <X size={18} />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle size={20} className="text-green-600" />
          <span className="text-green-800 flex-1">{success}</span>
          <button onClick={() => setSuccess(null)} className="text-green-600 hover:text-green-800">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Bookings', value: myBookings.length, icon: BookOpen, color: 'text-blue-600' },
          { label: 'Confirmed', value: myBookings.filter(b => b.status === 'CONFIRMED').length, icon: CheckCircle, color: 'text-green-600' },
          { label: 'Pending', value: myBookings.filter(b => b.status === 'PENDING').length, icon: Clock, color: 'text-yellow-600' },
          { label: 'Cancelled', value: myBookings.filter(b => b.status === 'CANCELLED').length, icon: XCircle, color: 'text-gray-600' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-lg transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">{stat.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                </div>
                <Icon size={32} className={`${stat.color} opacity-20`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Tab Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('myBookings')}
            className={`flex-1 px-6 py-3 text-center font-medium transition ${
              activeTab === 'myBookings'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            My Bookings
          </button>
          {isStaff && (
            <button
              onClick={() => setActiveTab('guidelines')}
              className={`flex-1 px-6 py-3 text-center font-medium transition ${
                activeTab === 'guidelines'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Guidelines
            </button>
          )}
          {isStudent && (
            <button
              onClick={() => setActiveTab('guidelines')}
              className={`flex-1 px-6 py-3 text-center font-medium transition ${
                activeTab === 'guidelines'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              How It Works
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'myBookings' && (
            <>
              {/* Search & Filter */}
              <div className="mb-6 flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by room or purpose..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Status</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PENDING">Pending</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              {/* Bookings List */}
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading bookings...</div>
              ) : myBookings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen size={48} className="mx-auto mb-3 opacity-20" />
                  <p>No bookings found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myBookings.map((booking) => (
                    <div key={booking.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{booking.roomCode}</h3>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                              {getStatusIcon(booking.status)}
                              {booking.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{booking.roomName}</p>
                          <div className="flex flex-col sm:flex-row gap-3 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              {new Date(booking.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock size={14} />
                              {booking.startTime} - {booking.endTime}
                            </div>
                            {booking.purpose && (
                              <div className="flex items-center gap-1">
                                <MapPin size={14} />
                                {booking.purpose}
                              </div>
                            )}
                            {isStudent && booking.seatsBooked && (
                              <div className="flex items-center gap-1">
                                <Users size={14} />
                                {booking.seatsBooked} seat
                              </div>
                            )}
                          </div>
                        </div>
                        {booking.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="px-3 py-1 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition text-sm"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'guidelines' && (
            <div className="space-y-6">
              {isStudent ? (
                <>
                  <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                    <h3 className="font-semibold text-blue-900 mb-2">📚 Student Booking Guidelines</h3>
                    <ul className="space-y-2 text-sm text-blue-800">
                      <li>✓ Book 1 seat maximum per booking</li>
                      <li>✓ Max 2 hours per booking session</li>
                      <li>✓ Books up to 30 days in advance</li>
                      <li>✓ Study rooms only (no lecture halls)</li>
                      <li>✓ Bookings auto-confirmed if room available</li>
                      <li>✓ Cancel anytime before booking starts</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">📏 Available Study Rooms</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {['SR-101', 'SR-102', 'SR-103', 'SR-104', 'SR-105', 'SR-106'].map(room => (
                        <div key={room} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="font-medium text-gray-900">{room}</p>
                          <p className="text-xs text-gray-600">4 seats • Hours: 8AM-6PM</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-purple-50 border-l-4 border-purple-600 p-4 rounded">
                    <h3 className="font-semibold text-purple-900 mb-2">👨‍🏫 Staff Booking Guidelines</h3>
                    <ul className="space-y-2 text-sm text-purple-800">
                      <li>✓ Book entire rooms for classes/meetings</li>
                      <li>✓ Max 8 hours per day</li>
                      <li>✓ Books up to 90 days in advance</li>
                      <li>✓ Support recurring bookings (weekly/daily)</li>
                      <li>✓ Override requests for conflicts</li>
                      <li>✓ Requires approval for conflict cases</li>
                      <li>✓ Alternative rooms suggested on conflicts</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">🏛️ Available Room Types</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { name: 'Lecture Halls', count: 12, capacity: '100-200' },
                        { name: 'Labs', count: 8, capacity: '30-50' },
                        { name: 'Meeting Rooms', count: 15, capacity: '5-20' },
                        { name: 'Seminar Halls', count: 6, capacity: '50-100' },
                      ].map(type => (
                        <div key={type.name} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="font-medium text-gray-900">{type.name}</p>
                          <p className="text-xs text-gray-600">{type.count} rooms • Cap: {type.capacity}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">New Booking</h2>
              <button onClick={() => setShowBookingForm(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Code *</label>
                <input
                  type="text"
                  placeholder="e.g., SR-101"
                  value={formData.roomCode}
                  onChange={(e) => setFormData({ ...formData, roomCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
                  {isStudent ? (
                    <select
                      value={parseInt(formData.endTime) - parseInt(formData.startTime)}
                      onChange={(e) => {
                        const hours = parseInt(e.target.value);
                        const endHour = (parseInt(formData.startTime.split(':')[0]) + hours).toString().padStart(2, '0');
                        setFormData({ ...formData, endTime: `${endHour}:00` });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="1">1 hour</option>
                      <option value="2">2 hours (max)</option>
                    </select>
                  ) : (
                    <select
                      value={parseInt(formData.endTime) - parseInt(formData.startTime)}
                      onChange={(e) => {
                        const hours = parseInt(e.target.value);
                        const endHour = (parseInt(formData.startTime.split(':')[0]) + hours).toString().padStart(2, '0');
                        setFormData({ ...formData, endTime: `${endHour}:00` });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(h => (
                        <option key={h} value={h}>{h} hour{h > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                <input
                  type="text"
                  placeholder="e.g., Study, Meeting, Lab"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {isStaff && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recurring Days (Staff)</label>
                  <select
                    value={formData.recurringDays}
                    onChange={(e) => setFormData({ ...formData, recurringDays: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="0">No recurring</option>
                    <option value="7">Weekly (7 days)</option>
                    <option value="30">Monthly (30 days)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowBookingForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBooking}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Book Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
