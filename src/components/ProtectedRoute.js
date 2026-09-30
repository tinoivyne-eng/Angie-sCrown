import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children, requireAdmin = false, requireStylist = false }) {
  const { user, isAdmin, isStylist, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner fullScreen label="Checking your session…" />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requireStylist && !isStylist && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
