import { useRef, useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutGrid, ShoppingBag, BarChart2, Settings, Users, type LucideIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const ROL_LABELS: Record<string, string> = {
  admin: 'Administrador',
  repartidor: 'Repartidor',
  gerencia: 'Gerencia',
};

interface NavItem { to: string; label: string; icon: LucideIcon; exact?: boolean; }
interface NavSection { label: string; items: NavItem[]; }

function getNavSections(rol: string | undefined): NavSection[] {
  if (rol === 'repartidor') {
    return [{ label: 'MIS ENTREGAS', items: [
      { to: '/', label: 'Mis entregas hoy', icon: LayoutGrid, exact: true },
    ]}];
  }
  if (rol === 'gerencia') {
    return [{ label: 'INDICADORES', items: [
      { to: '/reportes', label: 'Reportes', icon: BarChart2 },
    ]}];
  }
  // admin
  return [
    { label: 'OPERACIONES', items: [
      { to: '/', label: 'Tablero de rutas', icon: LayoutGrid, exact: true },
      { to: '/pedidos', label: 'Pedidos', icon: ShoppingBag },
    ]},
    { label: 'INDICADORES', items: [
      { to: '/reportes', label: 'Reportes', icon: BarChart2 },
    ]},
  ];
}

const CONFIG_ITEM: NavItem = { to: '/configuracion', label: 'Configuración', icon: Settings };
const USERS_ITEM: NavItem = { to: '/usuarios', label: 'Usuarios', icon: Users };

export default function Layout() {
  const { user, logout } = useAuth();
  const sections = getNavSections(user?.rol);
  const showConfig = user?.rol === 'admin';
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  function handleLogout() { logout(); navigate('/login', { replace: true }); }

  function navLink(item: NavItem) {
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.exact ?? false}
        onClick={() => setSidebarOpen(false)}
        className={({ isActive }) => [
          'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors duration-150',
          isActive
            ? 'bg-primary-light text-primary font-medium border-l-2 border-primary pl-[10px]'
            : 'text-text-secondary hover:bg-primary-light hover:text-primary border-l-2 border-transparent pl-[10px]',
        ].join(' ')}
      >
        {({ isActive }) => (
          <>
            <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary' : 'text-text-disabled'}`} />
            {item.label}
          </>
        )}
      </NavLink>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-surface-2 overflow-hidden">
      {/* Header */}
      <header className="no-print h-12 flex-shrink-0 z-30 bg-surface border-b border-border flex items-center px-4 gap-3">
        <button
          type="button"
          className="md:hidden w-7 h-7 flex items-center justify-center rounded-md text-text-secondary hover:bg-surface-2"
          onClick={() => setSidebarOpen((v) => !v)}
        >
          ☰
        </button>

        {/* Logo compacto en header */}
        <div className="flex items-center gap-2">
          <span className="text-primary font-bold text-sm hidden md:block">🍊 Capi Fruit</span>
        </div>

        <div className="ml-auto relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-2 border border-border text-xs text-text-secondary hover:border-border-strong"
          >
            <span className="truncate max-w-[120px]">{user?.nombre ?? '—'}</span>
            <svg className={`w-3 h-3 transition-transform duration-150 ${menuOpen ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 bg-surface border border-border rounded-card shadow-container z-50">
              <div className="px-3 py-2.5 border-b border-border">
                <p className="text-xs font-medium text-text-primary truncate">{user?.nombre}</p>
                <p className="text-[11px] text-text-disabled mt-0.5">{user?.rol ? (ROL_LABELS[user.rol] ?? user.rol) : ''}</p>
              </div>
              <div className="p-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-xs text-saturado hover:bg-saturado-light rounded-md"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {sidebarOpen && (
          <div
            className="no-print fixed inset-0 z-20 bg-black/20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={[
          'no-print fixed top-12 left-0 z-20 w-56 h-[calc(100vh-3rem)] bg-surface border-r border-border flex flex-col transition-transform duration-200 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        ].join(' ')}>
          {/* Logo */}
          <div className="px-4 py-5 border-b border-border flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <span className="text-3xl">🍊</span>
              <div>
                <p className="text-primary font-bold text-base leading-tight">Capi Fruit</p>
                <p className="text-[10px] text-text-disabled">Sistema de Pedidos</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-2 pt-2 pb-2 flex flex-col overflow-y-auto">
            {sections.map((section) => (
              <div key={section.label}>
                <p className="mt-5 mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-text-disabled select-none">
                  {section.label}
                </p>
                <div className="flex flex-col gap-0.5">
                  {section.items.map((item) => navLink(item))}
                </div>
              </div>
            ))}

            {showConfig && (
              <div className="mt-auto pt-3 border-t border-border flex flex-col gap-0.5">
                {navLink(USERS_ITEM)}
                {navLink(CONFIG_ITEM)}
              </div>
            )}
          </nav>

          <div className="px-4 py-3 border-t border-border">
            <p className="text-[11px] text-text-disabled">v1.0.0</p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-h-0 md:ml-56 overflow-auto">
          <Outlet />
        </main>
      </div>

      <footer className="no-print flex-shrink-0 border-t border-border bg-surface py-2 md:pl-56">
        <p className="text-xs text-text-disabled text-center">© 2026 Capi Fruit. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
