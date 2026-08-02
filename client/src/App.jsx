import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import DispatcherDashboard from './pages/DispatcherDashboard';
import AgentView from './pages/AgentView';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" />; // Or an unauthorized page
  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
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

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
