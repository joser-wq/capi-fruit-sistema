import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import LoginPage from '@/pages/LoginPage';
import BoardPage from '@/pages/BoardPage';
import PedidosPage from '@/pages/PedidosPage';
import ReportesPage from '@/pages/ReportesPage';
import ConfigPage from '@/pages/ConfigPage';
import UsuariosPage from '@/pages/UsuariosPage';

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-surface-2 flex items-center justify-center">
      <p className="text-sm text-text-secondary">Cargando...</p>
    </div>
  );
}

function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function RedirectIfAuth() {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Outlet />;
  if (user?.rol === 'gerencia') return <Navigate to="/reportes" replace />;
  return <Navigate to="/" replace />;
}

function RequireRole({ roles }: { roles: string[] }) {
  const { user } = useAuth();
  if (!user) return null;
  if (roles.includes(user.rol)) return <Outlet />;
  // Fallback según rol
  if (user.rol === 'gerencia') return <Navigate to="/reportes" replace />;
  return <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<RedirectIfAuth />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          {/* Admin + Repartidor: tablero */}
          <Route element={<RequireRole roles={['admin', 'repartidor']} />}>
            <Route path="/" element={<BoardPage />} />
          </Route>

          {/* Solo Admin: pedidos, usuarios, config */}
          <Route element={<RequireRole roles={['admin']} />}>
            <Route path="/pedidos" element={<PedidosPage />} />
            <Route path="/usuarios" element={<UsuariosPage />} />
            <Route path="/configuracion" element={<ConfigPage />} />
          </Route>

          {/* Admin + Gerencia: reportes */}
          <Route element={<RequireRole roles={['admin', 'gerencia']} />}>
            <Route path="/reportes" element={<ReportesPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
