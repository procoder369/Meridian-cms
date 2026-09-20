import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import Sidebar from './components/Sidebar'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Cases from './pages/Cases'
import CreateCase from './pages/CreateCase'
import CaseDetail from './pages/CaseDetail'
import CaseLookup from './pages/CaseLookup'
import Documents from './pages/Documents'
import { useAuth } from './context/AuthContext'

function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--parchment-200)]">
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        {typeof children === 'function' ? children(() => setMobileOpen(true)) : children}
      </div>
    </div>
  )
}

function App() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppShell>{(open) => <Dashboard onOpenMobile={open} />}</AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cases"
        element={
          <ProtectedRoute>
            <AppShell>{(open) => <Cases onOpenMobile={open} />}</AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cases/new"
        element={
          <ProtectedRoute>
            <AppShell>{(open) => <CreateCase onOpenMobile={open} />}</AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cases/:caseId"
        element={
          <ProtectedRoute>
            <AppShell>{(open) => <CaseDetail onOpenMobile={open} />}</AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/lookup"
        element={
          <ProtectedRoute>
            <AppShell>{(open) => <CaseLookup onOpenMobile={open} />}</AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/documents"
        element={
          <ProtectedRoute>
            <AppShell>{(open) => <Documents onOpenMobile={open} />}</AppShell>
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  )
}

export default App
