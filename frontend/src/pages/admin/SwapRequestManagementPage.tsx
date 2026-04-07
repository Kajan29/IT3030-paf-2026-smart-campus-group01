import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, X } from 'lucide-react';

interface SwapRequest {
  id: number;
  timetableModuleCode: string;
  timetableModuleName: string;
  timetableRoomCode: string;
  requesterEmail: string;
  requesterName: string;
  lecturerEmail: string;
  lecturerName: string;
  requestedDate: string;
  reason: string;
  status: string;
  suggestedRoomCode?: string;
  approvalReason?: string;
  createdAt: string;
}

interface AlternativeRoom {
  roomCode: string;
  roomName: string;
  capacity: number;
  available: boolean;
}

export const SwapRequestManagementPage: React.FC = () => {
  const [requests, setRequests] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<SwapRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [alternatives, setAlternatives] = useState<AlternativeRoom[]>([]);
  const [userRole, setUserRole] = useState('STUDENT');
  const [filterStatus, setFilterStatus] = useState('PENDING');
  const [approvalReason, setApprovalReason] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedAlternative, setSelectedAlternative] = useState<string | null>(null);

  useEffect(() => {
    loadUserRole();
    loadRequests();
  }, [filterStatus]);

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

  const loadRequests = async () => {
    setLoading(true);
    try {
      let endpoint = `/api/swap-requests/my-requests`;

      if (userRole === 'ADMIN') {
        endpoint = `/api/swap-requests/admin/pending`;
      } else if (userRole === 'ACADEMIC_STAFF' || userRole === 'NON_ACADEMIC_STAFF') {
        endpoint = `/api/swap-requests/pending`;
      }

      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const data = await response.json();
        const filtered = Array.isArray(data)
          ? data.filter(r => filterStatus === 'ALL' || r.status === filterStatus)
          : (data.content || []).filter((r: SwapRequest) => filterStatus === 'ALL' || r.status === filterStatus);
        setRequests(filtered);
      }
    } catch (err: any) {
      setError('Failed to load swap requests: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const viewAlternatives = async (request: SwapRequest) => {
    try {
      const response = await fetch(`/api/swap-requests/${request.id}/alternatives`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAlternatives(Array.isArray(data) ? data : data.alternatives || []);
        setSelectedRequest(request);
        setShowAlternatives(true);
      }
    } catch (err: any) {
      setError('Failed to load alternatives: ' + (err.message || 'Unknown error'));
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      setLoading(true);
      const payload = {
        approvalReason: approvalReason,
        suggestedRoomCode: selectedAlternative || undefined
      };

      const response = await fetch(`/api/swap-requests/${selectedRequest.id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setSuccess('Swap request approved');
        setShowDetails(false);
        setApprovalReason('');
        setSelectedAlternative(null);
        loadRequests();
      }
    } catch (err: any) {
      setError('Failed to approve request: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    try {
      setLoading(true);
      const payload = { rejectionReason: rejectionReason };

      const response = await fetch(`/api/swap-requests/${selectedRequest.id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setSuccess('Swap request rejected');
        setShowDetails(false);
        setRejectionReason('');
        loadRequests();
      }
    } catch (err: any) {
      setError('Failed to reject request: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
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
      case 'APPROVED':
        return <CheckCircle size={18} />;
      case 'REJECTED':
        return <XCircle size={18} />;
      case 'PENDING':
        return <Clock size={18} />;
      default:
        return <AlertCircle size={18} />;
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Staff Override Requests</h1>
        <p className="text-gray-600 mt-1">
          {userRole === 'ADMIN'
            ? 'Manage all staff override requests'
            : 'View and manage your override requests'}
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle size={20} className="text-red-600" />
          <span className="text-red-800">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">
            <X size={18} />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle size={20} className="text-green-600" />
          <span className="text-green-800">{success}</span>
          <button onClick={() => setSuccess(null)} className="ml-auto text-green-600 hover:text-green-800">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Filter */}
      <div className="mb-6 flex gap-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="PENDING">Pending Only</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="ALL">All Requests</option>
        </select>
      </div>

      {/* Cards Grid */}
      <div className="grid gap-4">
        {loading ? (
          <div className="p-8 text-center text-gray-500 bg-white rounded-lg shadow">
            Loading swap requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-white rounded-lg shadow">
            No swap requests found
          </div>
        ) : (
          requests.map(request => (
            <div
              key={request.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer p-6"
              onClick={() => { setSelectedRequest(request); setShowDetails(true); }}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{request.timetableModuleCode}</h3>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      {request.status}
                    </span>
                  </div>
                  <p className="text-gray-600">{request.timetableModuleName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                <div>
                  <p className="text-gray-600">Original Room</p>
                  <p className="font-medium text-gray-900">{request.timetableRoomCode}</p>
                </div>
                <div>
                  <p className="text-gray-600">Requester</p>
                  <p className="font-medium text-gray-900">{request.requesterEmail}</p>
                </div>
                <div>
                  <p className="text-gray-600">Lecturer</p>
                  <p className="font-medium text-gray-900">{request.lecturerEmail}</p>
                </div>
                <div>
                  <p className="text-gray-600">Requested Date</p>
                  <p className="font-medium text-gray-900">{new Date(request.requestedDate).toLocaleDateString()}</p>
                </div>
              </div>

              {request.reason && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800"><strong>Reason:</strong> {request.reason}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Details Modal */}
      {showDetails && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{selectedRequest.timetableModuleCode}</h2>
              <button onClick={() => setShowDetails(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 text-sm">Module Name</p>
                  <p className="font-medium">{selectedRequest.timetableModuleName}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Original Room</p>
                  <p className="font-medium">{selectedRequest.timetableRoomCode}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Requested By</p>
                  <p className="font-medium">{selectedRequest.requesterEmail}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Lecturer</p>
                  <p className="font-medium">{selectedRequest.lecturerEmail}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Requested Date</p>
                  <p className="font-medium">{new Date(selectedRequest.requestedDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Status</p>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                    {getStatusIcon(selectedRequest.status)}
                    {selectedRequest.status}
                  </span>
                </div>
              </div>

              {selectedRequest.reason && (
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm"><strong>Reason:</strong> {selectedRequest.reason}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {selectedRequest.status === 'PENDING' && userRole === 'ADMIN' && (
              <div className="space-y-4 mb-6">
                <button
                  onClick={() => { setShowDetails(false); setShowAlternatives(true); }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  View Alternative Rooms
                </button>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Approval Reason</label>
                  <textarea
                    value={approvalReason}
                    onChange={(e) => setApprovalReason(e.target.value)}
                    placeholder="Optional approval reason..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Reason</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Optional rejection reason..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDetails(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Reject'}
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Approve'}
                  </button>
                </div>
              </div>
            )}

            {selectedRequest.status !== 'PENDING' && (
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDetails(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alternatives Modal */}
      {showAlternatives && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Alternative Rooms</h2>
              <button onClick={() => { setShowAlternatives(false); }} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            {alternatives.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No alternative rooms available
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {alternatives.map((alt, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedAlternative(alt.roomCode)}
                    className={`p-4 border rounded-lg cursor-pointer transition ${
                      selectedAlternative === alt.roomCode
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${!alt.available ? 'opacity-50' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">{alt.roomCode}</p>
                        <p className="text-sm text-gray-600">{alt.roomName}</p>
                        <p className="text-sm text-gray-600 mt-1">Capacity: {alt.capacity}</p>
                      </div>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        alt.available
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {alt.available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setShowAlternatives(false); setShowDetails(true); }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Back
              </button>
              <button
                onClick={() => {
                  setShowAlternatives(false);
                  setShowDetails(true);
                }}
                disabled={!selectedAlternative}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                Approve with {selectedAlternative}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SwapRequestManagementPage;
