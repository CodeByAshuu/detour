import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Toaster } from 'react-hot-toast';

import Login from './pages/Login';
import LandingPage from './pages/Landing';
import AdminDashboard from './pages/AdminDashboard';
import DispatcherDashboard from './pages/DispatcherDashboard';
import AgentView from './pages/AgentView';
import AppLayout from './components/layout/AppLayout';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" />;
  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Toaster position="top-right" toastOptions={{
            style: { background: '#131B2E', color: '#E7ECF5', border: '1px solid #26314A' }
          }} />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            
            <Route element={<AppLayout />}>
              <Route 
                path="/admin" 
                element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/dispatcher" 
                element={
                  <PrivateRoute allowedRoles={['dispatcher', 'admin']}>
                    <DispatcherDashboard />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/agent" 
                element={
                  <PrivateRoute allowedRoles={['agent']}>
                    <AgentView />
                  </PrivateRoute>
                } 
              />
            </Route>

            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
