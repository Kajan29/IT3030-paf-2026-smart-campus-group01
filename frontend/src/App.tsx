import { Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Pages
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import BookRoomPage from './pages/BookingsPage'
import ResourcesPage from './pages/CoursesPage'
import GalleryPage from './pages/GalleryPage'
import RoomFinderPage from './pages/RoomFinderPage'
import NotFoundPage from './pages/NotFoundPage'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'

// Auth Pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import VerifyOtpPage from './pages/auth/VerifyOtpPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminPage from './pages/admin/AdminPage'
import AdminProtectedRoute from './components/admin/AdminProtectedRoute'
import ProtectedRoute from './components/common/ProtectedRoute'
import GuestOnlyRoute from './components/common/GuestOnlyRoute'
import StudentProtectedRoute from './components/common/StudentProtectedRoute'

function App(): JSX.Element {
  return (
    <>
      <Routes>
        {/* Home Route */}
        <Route path="/" element={<HomePage />} />

        {/* Main Routes */}
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route
          path="/book-room"
          element={
            <StudentProtectedRoute>
              <BookRoomPage />
            </StudentProtectedRoute>
          }
        />
        <Route path="/find-room" element={<RoomFinderPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/gallery" element={<GalleryPage />} />

        {/* Auth Routes */}
        <Route
          path="/auth/login"
          element={
            <GuestOnlyRoute>
              <LoginPage />
            </GuestOnlyRoute>
          }
        />
        <Route
          path="/auth/register"
          element={
            <GuestOnlyRoute>
              <RegisterPage />
            </GuestOnlyRoute>
          }
        />
        <Route
          path="/auth/verify-otp"
          element={
            <GuestOnlyRoute>
              <VerifyOtpPage />
            </GuestOnlyRoute>
          }
        />
        <Route
          path="/auth/forgot-password"
          element={
            <GuestOnlyRoute>
              <ForgotPasswordPage />
            </GuestOnlyRoute>
          }
        />

        {/* Protected User Routes */}
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } 
        />

        {/* Admin Routes */}
        <Route 
          path="/admin" 
          element={
            <AdminProtectedRoute>
              <AdminPage />
            </AdminProtectedRoute>
          } 
        />
        <Route 
          path="/admin/dashboard" 
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          } 
        />

        {/* Catch all route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  )
}

export default App

