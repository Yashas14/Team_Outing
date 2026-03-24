import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import EmployeePage from './pages/EmployeePage';
import AdminPage from './pages/AdminPage';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  const { loadUser, isLoading } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '16px',
            background: '#1A1A2E',
            color: '#fff',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/employee/*"
          element={
            <ProtectedRoute allowedRole="EMPLOYEE">
              <EmployeePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRole="ADMIN">
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
