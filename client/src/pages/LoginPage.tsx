import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const { login, splash, clearSplash } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (splash) {
      const t = setTimeout(clearSplash, 2000);
      return () => clearTimeout(t);
    }
  }, [splash, clearSplash]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.rol === 'gerencia') navigate('/reportes', { replace: true });
      else navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-2 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🍊</div>
          <h1 className="text-2xl font-bold text-primary">Capi Fruit</h1>
          <p className="text-sm text-text-secondary mt-1">Sistema interno de pedidos</p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-container shadow-card p-6">
          <h2 className="text-base font-semibold text-text-primary mb-5">Iniciar sesión</h2>

          {error && (
            <div className="mb-4 px-3 py-2 bg-saturado-light border border-red-200 rounded-md">
              <p className="text-xs text-saturado">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="usuario@capifruit.com"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" loading={loading} className="w-full mt-1">
              Ingresar
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-text-disabled mt-6">
          © 2026 Capi Fruit
        </p>
      </div>
    </div>
  );
}
