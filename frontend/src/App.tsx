import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Layouts
import MainLayout from './layouts/MainLayout'

// Pages
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import CoursesPage from './pages/CoursesPage'
import BookingsPage from './pages/BookingsPage'
import LecturesPage from './pages/LecturesPage'
import NotFoundPage from './pages/NotFoundPage'
import AdminDashboard from './pages/AdminDashboard'

// Auth Pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import VerifyOtpPage from './pages/auth/VerifyOtpPage'

// Protected Routes
import AdminProtectedRoute from './components/common/AdminProtectedRoute'

function App(): JSX.Element {
  return (
    <>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Navigate to="/auth/login" replace />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/verify-otp" element={<VerifyOtpPage />} />

        {/* Admin Dashboard Route */}
        <Route
          path="/admin/*"
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          }
        />

        {/* Home Route - Direct access without MainLayout since it has its own Navbar */}
        <Route path="/" element={<HomePage />} />

        {/* Other Main Routes - Direct access since they have their own Navbar */}
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/lectures" element={<LecturesPage />} />

        {/* Catch all route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  )
}

export default App
