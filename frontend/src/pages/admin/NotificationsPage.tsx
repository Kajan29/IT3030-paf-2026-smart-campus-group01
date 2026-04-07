import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertCircle, Mail, Clock, Trash2, X } from 'lucide-react';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  status: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  signalrSent: boolean;
  emailSent: boolean;
  eventDate?: string;
}

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('ALL');
  const [filterRead, setFilterRead] = useState('UNREAD');
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const notificationTypes = [
    'BOOKING_CONFIRMED',
    'BOOKING_REJECTED',
    'BOOKING_CANCELLED',
    'SWAP_REQUEST_CREATED',
    'SWAP_REQUEST_APPROVED',
    'SWAP_REQUEST_REJECTED',
    'REMINDER',
    'SYSTEM_ALERT',
    'OTHER'
  ];

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
    // Refresh every 30 seconds for real-time updates
    const interval = setInterval(() => {
      loadNotifications();
      loadUnreadCount();
    }, 30000);
    return () => clearInterval(interval);
  }, [filterType, filterRead]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      let endpoint = '/api/notifications';

      if (filterRead === 'UNREAD') {
        endpoint = '/api/notifications/unread';
      } else if (filterType !== 'ALL') {
        endpoint = `/api/notifications/type/${filterType}`;
      }

      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const data = await response.json();
        const notifs = Array.isArray(data) ? data : data.content || [];

        // Filter by read status if needed
        let filtered = notifs;
        if (filterRead === 'READ') {
          filtered = notifs.filter((n: Notification) => n.isRead);
        }

        // Sort by date, newest first
        filtered.sort((a: Notification, b: Notification) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        setNotifications(filtered);
      }
    } catch (err: any) {
      setError('Failed to load notifications: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/unread/count', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load unread count');
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setSuccess('Marked as read');
      loadNotifications();
      loadUnreadCount();
    } catch (err: any) {
      setError('Failed to mark as read: ' + (err.message || 'Unknown error'));
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setSuccess('All notifications marked as read');
      loadNotifications();
      loadUnreadCount();
    } catch (err: any) {
      setError('Failed to mark all as read: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDeleteNotification = async (id: number) => {
    if (!window.confirm('Delete this notification?')) return;

    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setSuccess('Notification deleted');
      loadNotifications();
    } catch (err: any) {
      setError('Failed to delete notification: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Delete all notifications?')) return;

    try {
      await fetch('/api/notifications/delete-all', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setSuccess('All notifications deleted');
      loadNotifications();
    } catch (err: any) {
      setError('Failed to delete all notifications: ' + (err.message || 'Unknown error'));
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'BOOKING_CONFIRMED':
        return <CheckCircle size={20} className="text-green-600" />;
      case 'BOOKING_REJECTED':
        return <AlertCircle size={20} className="text-red-600" />;
      case 'SWAP_REQUEST_APPROVED':
        return <CheckCircle size={20} className="text-green-600" />;
      case 'SWAP_REQUEST_REJECTED':
        return <AlertCircle size={20} className="text-red-600" />;
      case 'REMINDER':
        return <Clock size={20} className="text-blue-600" />;
      case 'SYSTEM_ALERT':
        return <AlertCircle size={20} className="text-yellow-600" />;
      default:
        return <Bell size={20} className="text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string): string => {
    switch (type) {
      case 'BOOKING_CONFIRMED':
      case 'SWAP_REQUEST_APPROVED':
        return 'border-l-4 border-green-500 bg-green-50';
      case 'BOOKING_REJECTED':
      case 'SWAP_REQUEST_REJECTED':
        return 'border-l-4 border-red-500 bg-red-50';
      case 'REMINDER':
        return 'border-l-4 border-blue-500 bg-blue-50';
      case 'SYSTEM_ALERT':
        return 'border-l-4 border-yellow-500 bg-yellow-50';
      default:
        return 'border-l-4 border-gray-300 bg-gray-50';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Bell size={32} />
            Notifications
          </h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All notifications read'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Mark All as Read
          </button>
        )}
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

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <select
          value={filterRead}
          onChange={(e) => setFilterRead(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="ALL">All Notifications</option>
          <option value="UNREAD">Unread Only</option>
          <option value="READ">Read Only</option>
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="ALL">All Types</option>
          {notificationTypes.map(type => (
            <option key={type} value={type}>
              {type.replace(/_/g, ' ')}
            </option>
          ))}
        </select>

        {notifications.length > 0 && (
          <button
            onClick={handleDeleteAll}
            className="ml-auto px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
          >
            Delete All
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-gray-500 bg-white rounded-lg shadow">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-white rounded-lg shadow">
            <Bell size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No notifications</p>
          </div>
        ) : (
          notifications.map(notification => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg shadow hover:shadow-md transition cursor-pointer ${getNotificationColor(notification.type)} ${!notification.isRead ? 'ring-2 ring-blue-300' : ''}`}
              onClick={() => {
                setSelectedNotification(notification);
                setShowDetails(true);
              }}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">
                      {notification.title}
                    </h3>
                    {!notification.isRead && (
                      <span className="inline-block px-2 py-1 bg-blue-500 text-white text-xs rounded-full flex-shrink-0">
                        New
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {notification.message}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <Clock size={14} />
                    <span>{formatTime(notification.createdAt)}</span>

                    {notification.signalrSent && (
                      <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                        <Bell size={12} />
                        Sent
                      </span>
                    )}

                    {notification.emailSent && (
                      <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                        <Mail size={12} />
                        Emailed
                      </span>
                    )}
                  </div>

                  {notification.type !== 'OTHER' && (
                    <span className="inline-block text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded">
                      {notification.type.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>

                <div className="flex-shrink-0 flex gap-2">
                  {!notification.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification.id);
                      }}
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded transition"
                      title="Mark as read"
                    >
                      <CheckCircle size={18} />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNotification(notification.id);
                    }}
                    className="p-1 text-red-600 hover:bg-red-100 rounded transition"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Details Modal */}
      {showDetails && selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                {getNotificationIcon(selectedNotification.type)}
                <h2 className="text-xl font-bold text-gray-900">{selectedNotification.title}</h2>
              </div>
              <button onClick={() => setShowDetails(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Message</p>
                <p className="text-gray-800">{selectedNotification.message}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-medium text-gray-900">
                    {selectedNotification.type.replace(/_/g, ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-medium text-gray-900">
                    {selectedNotification.isRead ? 'Read' : 'Unread'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedNotification.createdAt).toLocaleString()}
                  </p>
                </div>
                {selectedNotification.readAt && (
                  <div>
                    <p className="text-sm text-gray-600">Read At</p>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedNotification.readAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-2">Delivery Status:</p>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${selectedNotification.signalrSent ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-gray-700">SignalR</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${selectedNotification.emailSent ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-gray-700">Email</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDetails(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Close
              </button>
              {!selectedNotification.isRead && (
                <button
                  onClick={() => {
                    handleMarkAsRead(selectedNotification.id);
                    setShowDetails(false);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Mark as Read
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
