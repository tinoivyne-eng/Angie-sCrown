import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';

import { AuthProvider } from './context/AuthContext';
import SiteLayout from './components/SiteLayout';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Services from './pages/Services';
import Stylists from './pages/Stylists';
import Booking from './pages/Booking';
import Appointments from './pages/Appointments';
import Gallery from './pages/Gallery';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import NotFound from './pages/NotFound';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

import AdminDashboard from './pages/admin/Dashboard';
import ManageServices from './pages/admin/ManageServices';
import ManageStylists from './pages/admin/ManageStylists';
import ManageBookings from './pages/admin/ManageBookings';
import ManageUsers from './pages/admin/ManageUsers';
import Revenue from './pages/admin/Revenue';

function withSite(element) {
  return <SiteLayout>{element}</SiteLayout>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <Routes>
            {/* Public / customer, wrapped in the site chrome (navbar + footer) */}
            <Route path="/" element={withSite(<Home />)} />
            <Route path="/services" element={withSite(<Services />)} />
            <Route path="/stylists" element={withSite(<Stylists />)} />
            <Route path="/booking" element={withSite(<Booking />)} />
            <Route path="/gallery" element={withSite(<Gallery />)} />

            <Route
              path="/appointments"
              element={withSite(<ProtectedRoute><Appointments /></ProtectedRoute>)}
            />
            <Route
              path="/profile"
              element={withSite(<ProtectedRoute><Profile /></ProtectedRoute>)}
            />
            <Route
              path="/settings"
              element={withSite(<ProtectedRoute><Settings /></ProtectedRoute>)}
            />
            <Route
              path="/notifications"
              element={withSite(<ProtectedRoute><Notifications /></ProtectedRoute>)}
            />

            {/* Auth */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Admin */}
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/services" element={<ProtectedRoute requireAdmin><ManageServices /></ProtectedRoute>} />
            <Route path="/admin/stylists" element={<ProtectedRoute requireAdmin><ManageStylists /></ProtectedRoute>} />
            <Route path="/admin/bookings" element={<ProtectedRoute requireAdmin><ManageBookings /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute requireAdmin><ManageUsers /></ProtectedRoute>} />
            <Route path="/admin/revenue" element={<ProtectedRoute requireAdmin><Revenue /></ProtectedRoute>} />

            <Route path="*" element={withSite(<NotFound />)} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
