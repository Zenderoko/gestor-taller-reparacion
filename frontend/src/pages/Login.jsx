import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/lib/api';
import { Wrench } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Completa todos los campos');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email || !password || !name) {
      toast.error('Completa todos los campos');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.register({ email, password, name });
      toast.success('Usuario creado. Inicia sesión');
      setMode('login');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Wrench className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-secondary-900">GestorTaller</h1>
          <p className="text-sm text-secondary-500 mt-1">
            {mode === 'login' ? 'Inicia sesión para continuar' : 'Crea el primer usuario'}
          </p>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="card p-6 space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@gestortaller.cl"
              autoFocus
            />
            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
            />
            <Button type="submit" className="w-full" loading={loading}>
              Iniciar sesión
            </Button>
            <p className="text-center text-sm text-secondary-500">
              ¿Sin cuenta?{' '}
              <button type="button" onClick={() => setMode('register')} className="text-primary-600 hover:text-primary-700 font-medium">
                Crear primer usuario
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="card p-6 space-y-4">
            <Input
              label="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              autoFocus
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.cl"
            />
            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
            <Button type="submit" className="w-full" loading={loading}>
              Crear cuenta
            </Button>
            <p className="text-center text-sm text-secondary-500">
              ¿Ya tienes cuenta?{' '}
              <button type="button" onClick={() => setMode('login')} className="text-primary-600 hover:text-primary-700 font-medium">
                Iniciar sesión
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
