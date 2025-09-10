
import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './hooks/useAuth'

// Components
import Layout from './components/Layout'
import LoadingSpinner from './components/LoadingSpinner'

// Pages
import Dashboard from './pages/Dashboard'
import VehicleList from './pages/VehicleList'
import VehicleDetail from './pages/VehicleDetail'
import VehicleInspection from './pages/VehicleInspection'
import VehicleCheckout from './pages/VehicleCheckout'
import VehicleCheckin from './pages/VehicleCheckin'
import DriverProfiles from './pages/DriverProfiles'
import ServiceRecords from './pages/ServiceRecords'
import Reports from './pages/Reports'
import BarcodeScanner from './pages/BarcodeScanner'
import Login from './pages/Login'

function App() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!isAuthenticated) {
    return (
      <>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 5000,
            style: { 
              background: '#363636', 
              color: '#fff',
              fontSize: '14px'
            },
            success: { 
              style: { background: '#10b981' } 
            },
            error: { 
              style: { background: '#ef4444' } 
            }
          }}
        />
        <Login />
      </>
    )
  }

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: { 
            background: '#363636', 
            color: '#fff',
            fontSize: '14px'
          },
          success: { 
            style: { background: '#10b981' } 
          },
          error: { 
            style: { background: '#ef4444' } 
          }
        }}
      />
      
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/vehicles" element={<VehicleList />} />
            <Route path="/vehicles/:id" element={<VehicleDetail />} />
            <Route path="/vehicles/:id/inspect" element={<VehicleInspection />} />
            <Route path="/vehicles/:id/checkout" element={<VehicleCheckout />} />
            <Route path="/vehicles/:id/checkin" element={<VehicleCheckin />} />
            <Route path="/drivers" element={<DriverProfiles />} />
            <Route path="/service" element={<ServiceRecords />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/scanner" element={<BarcodeScanner />} />
          </Routes>
        </Layout>
      </Router>
    </>
  )
}

export default App
