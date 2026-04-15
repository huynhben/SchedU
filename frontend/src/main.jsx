import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AssignmentsPage from './pages/AssignmentsPage'
import EventsPage from './pages/EventsPage'
import AdminPage from './pages/AdminPage'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          } />
          <Route path="/assignments" element={
            <ProtectedRoute><AssignmentsPage /></ProtectedRoute>
          } />
          <Route path="/events" element={
            <ProtectedRoute><EventsPage /></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute adminOnly={true}><AdminPage /></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
)
