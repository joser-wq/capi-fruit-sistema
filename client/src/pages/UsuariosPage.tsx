import { useState, useEffect, useCallback, FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { ROL_LABELS } from '@/types';

interface User { id: number; nombre: string; email: string; rol: string; activo: boolean; }

interface UserModalProps {
  user: User | null;
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}

function UserModal({ user, onClose, onSaved, onError }: UserModalProps) {
  const [form, setForm] = useState({
    nombre: user?.nombre ?? '',
    email: user?.email ?? '',
    password: '',
    rol: user?.rol ?? 'repartidor',
    activo: user?.activo ?? true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        nombre: form.nombre,
        email: form.email,
        rol: form.rol,
        activo: form.activo,
      };
      if (form.password) payload.password = form.password;

      if (user) {
        await api.patch(`/auth/users/${user.id}`, payload);
      } else {
        if (!form.password) { onError('La contraseña es requerida para nuevos usuarios'); setLoading(false); return; }
        await api.post('/auth/users', payload);
      }
      onSaved();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-container w-full max-w-sm shadow-container">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text-primary">{user ? 'Editar usuario' : 'Nuevo usuario'}</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-md hover:bg-surface-2 text-text-disabled"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="px-5 py-4 flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Nombre *</label>
              <input type="text" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Email *</label>
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Contraseña {user ? '(dejar en blanco para no cambiar)' : '*'}
              </label>
              <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                minLength={user ? 0 : 6} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Rol</label>
                <select value={form.rol} onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                  <option value="admin">Administrador</option>
                  <option value="repartidor">Repartidor</option>
                  <option value="gerencia">Gerencia</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Estado</label>
                <select value={form.activo ? 'true' : 'false'} onChange={(e) => setForm((f) => ({ ...f, activo: e.target.value === 'true' }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </div>
            </div>
          </div>
          <div className="px-5 py-4 border-t border-border bg-surface-2 flex justify-between gap-3">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button type="submit" loading={loading}>{user ? 'Guardar' : 'Crear usuario'}</Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<User[]>('/auth/users');
      setUsers(data);
    } catch { setUsers([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  const rolColors: Record<string, string> = {
    admin: 'bg-primary-light text-primary',
    repartidor: 'bg-accent-light text-accent',
    gerencia: 'bg-blue-50 text-blue-700',
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-base font-semibold text-text-primary flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" /> Usuarios
        </h1>
        <Button size="sm" onClick={() => setModal({ open: true, user: null })}>
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Nuevo usuario
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-text-disabled">Cargando...</p>
      ) : (
        <div className="bg-surface border border-border rounded-card overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-surface-2 border-b border-border">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary">Nombre</th>
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary">Email</th>
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary">Rol</th>
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary">Estado</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-b-0 hover:bg-surface-2">
                  <td className="px-4 py-3 font-medium text-text-primary">{u.nombre}</td>
                  <td className="px-4 py-3 text-text-secondary">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${rolColors[u.rol] ?? 'bg-surface-2 text-text-secondary'}`}>
                      {ROL_LABELS[u.rol] ?? u.rol}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${u.activo ? 'bg-primary-light text-primary' : 'bg-surface-2 text-text-disabled'}`}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => setModal({ open: true, user: u })}
                      className="px-2.5 py-1 text-[10px] border border-border rounded-md hover:bg-surface-2 text-text-secondary">
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal.open && (
        <UserModal
          user={modal.user}
          onClose={() => setModal({ open: false, user: null })}
          onSaved={() => { setModal({ open: false, user: null }); setToast({ msg: 'Usuario guardado', type: 'success' }); void loadUsers(); }}
          onError={(msg) => setToast({ msg, type: 'error' })}
        />
      )}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
