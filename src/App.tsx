import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './views/Login';
import { Dashboard } from './views/Dashboard';
import { Patients } from './views/Patients';
import { PatientDetail } from './views/PatientDetail';
import { Doctors } from './views/Doctors';
import { Injuries } from './views/Injuries';
import { Prescriptions } from './views/Prescriptions';

const RootRedirect = () => {
  const role = localStorage.getItem('app_user_role');
  return <Navigate to={role === 'secretary' ? '/patients' : '/dashboard'} replace />;
};

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const role = localStorage.getItem('app_user_role') || 'admin';
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/patients" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes (mocked) */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><Dashboard /></ProtectedRoute>} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/patients/:id" element={<PatientDetail />} />
          <Route path="/doctors" element={<ProtectedRoute allowedRoles={['admin']}><Doctors /></ProtectedRoute>} />
          <Route path="/injuries" element={<ProtectedRoute allowedRoles={['admin']}><Injuries /></ProtectedRoute>} />
          <Route path="/prescriptions" element={<ProtectedRoute allowedRoles={['admin']}><Prescriptions /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
